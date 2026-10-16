import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '../../db/client.js';
import { qualificationResults, leads, campaigns, leadContacts, activities } from '../../db/schema.js';
import { AppError } from '../../lib/errors.js';

interface QualificationSignal {
  name: string;
  score: number;
  maxScore: number;
  present: boolean;
  evidence?: string;
}

interface QualificationWeights {
  nicheFit: number;
  geographyFit: number;
  verifiedActivity: number;
  onlineStoreNeed: number;
  contactChannel: number;
}

const DEFAULT_WEIGHTS: QualificationWeights = {
  nicheFit: 30,
  geographyFit: 20,
  verifiedActivity: 15,
  onlineStoreNeed: 20,
  contactChannel: 15,
};

export async function qualifyLead(
  workspaceId: string,
  leadId: string,
  campaignId?: string,
  userId?: string,
) {
  const db = getDb();

  const [lead] = await db.select().from(leads)
    .where(and(eq(leads.id, leadId), eq(leads.workspaceId, workspaceId)))
    .limit(1);
  if (!lead) throw AppError.notFound('Lead');

  // Load campaign ICP config for custom weights
  let weights = { ...DEFAULT_WEIGHTS };
  let campaign = null;
  if (campaignId) {
    const [c] = await db.select().from(campaigns)
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, workspaceId)))
      .limit(1);
    if (c) {
      campaign = c;
      const icpWeights = (c.icpConfig as any)?.weights;
      if (icpWeights) {
        weights = { ...weights, ...icpWeights };
      }
    }
  }

  // Load contacts for the lead
  const contacts = await db.select().from(leadContacts)
    .where(and(eq(leadContacts.leadId, leadId), eq(leadContacts.workspaceId, workspaceId)));

  // ─── Evaluate signals ─────────────────────────────────────────────────────

  const signals: QualificationSignal[] = [];

  // 1. Niche fit
  const campaignNiche = campaign?.niche?.toLowerCase() ?? '';
  const leadNiche = lead.niche?.toLowerCase() ?? '';
  const nicheFit = campaignNiche && leadNiche
    ? (leadNiche.includes(campaignNiche) || campaignNiche.includes(leadNiche) || computeSimpleSimilarity(leadNiche, campaignNiche) > 0.5)
    : (leadNiche.length > 0); // If no campaign, any niche is a positive signal

  signals.push({
    name: 'niche_fit',
    score: nicheFit ? weights.nicheFit : 0,
    maxScore: weights.nicheFit,
    present: nicheFit,
    evidence: nicheFit ? `Lead niche "${lead.niche}" matches campaign` : undefined,
  });

  // 2. Geography fit
  const campaignGeo = (campaign?.geography as any) ?? null;
  let geographyFit = false;
  let geoEvidence = '';
  if (campaignGeo) {
    const leadCountry = lead.countryCode?.toLowerCase() ?? '';
    const campaignCountry = (campaignGeo.countryCode ?? '').toLowerCase();
    const leadCity = lead.city?.toLowerCase() ?? '';
    const campaignCity = (campaignGeo.city ?? '').toLowerCase();
    geographyFit = (!campaignCountry || leadCountry === campaignCountry) &&
      (!campaignCity || leadCity.includes(campaignCity));
    geoEvidence = geographyFit ? `Location matches campaign geography` : '';
  } else if (lead.city || lead.countryCode) {
    geographyFit = true; // Has location data, no campaign restriction
    geoEvidence = 'Location data present';
  }

  signals.push({
    name: 'geography_fit',
    score: geographyFit ? weights.geographyFit : 0,
    maxScore: weights.geographyFit,
    present: geographyFit,
    evidence: geoEvidence || undefined,
  });

  // 3. Verified business activity
  const hasWebsite = lead.websiteStatus === 'present' || !!lead.websiteUrl;
  const hasVerifiedContact = contacts.some(c => c.verificationStatus === 'verified');
  const verifiedActivity = hasWebsite || hasVerifiedContact;

  signals.push({
    name: 'verified_activity',
    score: verifiedActivity ? weights.verifiedActivity : 0,
    maxScore: weights.verifiedActivity,
    present: verifiedActivity,
    evidence: verifiedActivity
      ? [hasWebsite && 'has website', hasVerifiedContact && 'has verified contact'].filter(Boolean).join(', ')
      : undefined,
  });

  // 4. Evidence of need for online store
  const hasNoWebsite = lead.websiteStatus === 'absent' || (!lead.websiteUrl && lead.websiteStatus === 'unknown');
  const descriptionSuggestsNeed = lead.description
    ? /shop|store|retail|sell|product|boutique|merchant|vendor/i.test(lead.description)
    : false;
  const onlineStoreNeed = hasNoWebsite || descriptionSuggestsNeed;

  signals.push({
    name: 'online_store_need',
    score: onlineStoreNeed ? weights.onlineStoreNeed : 0,
    maxScore: weights.onlineStoreNeed,
    present: onlineStoreNeed,
    evidence: onlineStoreNeed
      ? [hasNoWebsite && 'no website detected', descriptionSuggestsNeed && 'business description suggests retail/selling'].filter(Boolean).join(', ')
      : undefined,
  });

  // 5. Usable contact channel
  const hasContact = contacts.length > 0;
  signals.push({
    name: 'contact_channel',
    score: hasContact ? weights.contactChannel : 0,
    maxScore: weights.contactChannel,
    present: hasContact,
    evidence: hasContact ? `${contacts.length} contact(s) available` : undefined,
  });

  // ─── Compute score ────────────────────────────────────────────────────────

  const rawScore = signals.reduce((sum, s) => sum + s.score, 0);
  const maxPossible = signals.reduce((sum, s) => sum + s.maxScore, 0);
  const normalizedScore = maxPossible > 0 ? Math.round((rawScore / maxPossible) * 100) : 0;

  const presentSignals = signals.filter(s => s.present).map(s => s.name).join(', ');
  const reasoningSummary = `Score: ${normalizedScore}/100. Signals present: ${presentSignals || 'none'}. ${
    signals.map(s => s.evidence ? `${s.name}: ${s.evidence}` : null).filter(Boolean).join('; ')
  } Note: this score is an estimate based on available data, not a conversion probability.`;

  // ─── Persist result ───────────────────────────────────────────────────────

  const [result] = await db.insert(qualificationResults).values({
    workspaceId,
    leadId,
    campaignId,
    score: normalizedScore,
    signals: signals as any,
    modelVersion: 'deterministic-v1',
    reasoningSummary,
    reviewedBy: userId,
  }).returning();

  // Update lead's qualification score
  await db.update(leads)
    .set({ qualificationScore: normalizedScore, updatedAt: new Date() })
    .where(and(eq(leads.id, leadId), eq(leads.workspaceId, workspaceId)));

  // Log activity
  await db.insert(activities).values({
    workspaceId,
    leadId,
    campaignId,
    activityType: 'lead_updated',
    description: `Qualification score updated to ${normalizedScore}/100`,
    metadata: { score: normalizedScore, signalCount: signals.filter(s => s.present).length },
    actorUserId: userId,
  });

  return result;
}

export async function getLatestQualification(workspaceId: string, leadId: string) {
  const db = getDb();
  const [result] = await db.select().from(qualificationResults)
    .where(and(eq(qualificationResults.leadId, leadId), eq(qualificationResults.workspaceId, workspaceId)))
    .orderBy(desc(qualificationResults.createdAt))
    .limit(1);
  return result ?? null;
}

function computeSimpleSimilarity(a: string, b: string): number {
  const aWords = new Set(a.split(/\s+/));
  const bWords = new Set(b.split(/\s+/));
  let common = 0;
  for (const word of aWords) {
    if (bWords.has(word)) common++;
  }
  return common / Math.max(aWords.size, bWords.size, 1);
}
