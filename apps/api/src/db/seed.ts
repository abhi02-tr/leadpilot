import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { hashPassword } from '../lib/crypto.js';
import { getDb, closePool } from './client.js';
import {
  users,
  workspaces,
  workspaceMembers,
  campaigns,
  leads,
  leadContacts,
  campaignLeads,
  qualificationResults,
  outreachMessages,
  followUpTasks,
  activities,
} from './schema.js';
import { eq } from 'drizzle-orm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

async function seed() {
  console.log('Seeding LeadPilot database...');
  const db = getDb();

  // 1. Create or find demo user
  const demoEmail = 'demo@leadpilot.com';
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, demoEmail),
  });

  let userId: string;
  if (!existingUser) {
    const passwordHash = await hashPassword('Password123!');
    const [user] = await db
      .insert(users)
      .values({
        email: demoEmail,
        passwordHash,
        name: 'Alex Mercer',
      })
      .returning();
    userId = user.id;
    console.log(`Created demo user: ${demoEmail} (Password: Password123!)`);
  } else {
    userId = existingUser.id;
    console.log(`Using existing user: ${demoEmail}`);
  }

  // 2. Create or find workspace
  const workspaceSlug = 'leadpilot-growth-labs';
  const existingWs = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, workspaceSlug),
  });

  let workspaceId: string;
  if (!existingWs) {
    const [ws] = await db
      .insert(workspaces)
      .values({
        name: 'LeadPilot Growth Labs',
        slug: workspaceSlug,
        ownerUserId: userId,
        timezone: 'America/New_York',
      })
      .returning();
    workspaceId = ws.id;

    await db.insert(workspaceMembers).values({
      workspaceId,
      userId,
      role: 'owner',
    });
    console.log(`Created workspace: ${ws.name}`);
  } else {
    workspaceId = existingWs.id;
    console.log(`Using existing workspace: ${existingWs.name}`);
  }

  // 3. Seed Campaigns
  const existingCampaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.workspaceId, workspaceId),
  });

  let campaign1Id: string;
  let campaign2Id: string;

  if (!existingCampaign) {
    const [c1] = await db
      .insert(campaigns)
      .values({
        workspaceId,
        name: 'SaaS & Digital Agencies 2026',
        niche: 'B2B SaaS / Digital Marketing',
        offer: 'AI-assisted qualification & pipeline acceleration for agencies',
        status: 'active',
        createdBy: userId,
        objective: 'start_conversation',
        language: 'english',
        tone: 'consultative',
        channels: ['email', 'whatsapp'],
      })
      .returning();
    campaign1Id = c1.id;

    const [c2] = await db
      .insert(campaigns)
      .values({
        workspaceId,
        name: 'Boutique Coffee & Roasters',
        niche: 'Hospitality & Specialty Food',
        offer: 'Direct wholesale coffee distribution & cafe POS optimization',
        status: 'draft',
        createdBy: userId,
        objective: 'ask_permission',
        language: 'english',
        tone: 'conversational',
        channels: ['instagram', 'email'],
      })
      .returning();
    campaign2Id = c2.id;
    console.log('Created 2 sample campaigns');
  } else {
    campaign1Id = existingCampaign.id;
    campaign2Id = existingCampaign.id;
  }

  // 4. Seed Leads
  const existingLead = await db.query.leads.findFirst({
    where: eq(leads.workspaceId, workspaceId),
  });

  if (!existingLead) {
    const [l1] = await db
      .insert(leads)
      .values({
        workspaceId,
        businessName: 'Apex Digital Growth',
        normalizedName: 'apex digital growth',
        niche: 'Digital Marketing & SEO',
        city: 'Austin',
        region: 'TX',
        countryCode: 'US',
        websiteUrl: 'https://apexdigitalgrowth.example.com',
        normalizedDomain: 'apexdigitalgrowth.example.com',
        sourceType: 'manual',
        websiteStatus: 'present',
        status: 'qualified',
        qualificationScore: 88,
      })
      .returning();

    await db.insert(leadContacts).values({
      workspaceId,
      leadId: l1.id,
      contactType: 'email',
      value: 's.jenkins@apexdigitalgrowth.example.com',
      verificationStatus: 'verified',
    });

    await db.insert(leadContacts).values({
      workspaceId,
      leadId: l1.id,
      contactType: 'phone',
      value: '+1-512-555-0144',
      verificationStatus: 'verified',
    });

    await db.insert(campaignLeads).values({
      workspaceId,
      campaignId: campaign1Id,
      leadId: l1.id,
      campaignStatus: 'new',
    });

    await db.insert(qualificationResults).values({
      workspaceId,
      leadId: l1.id,
      campaignId: campaign1Id,
      score: 88,
      reasoningSummary: 'Verified active domain, validated primary decision-maker email, exact ICP match for digital agencies.',
      signals: [
        { name: 'Website Present & Active', score: 25, passed: true, reason: 'Active verified URL' },
        { name: 'Primary Contact Identified', score: 25, passed: true, reason: 'Verified leadership contact' },
        { name: 'Niche Fit Match', score: 20, passed: true, reason: 'Matches B2B marketing criteria' },
        { name: 'Location Fit', score: 10, passed: true, reason: 'US metro hub' },
        { name: 'Reputation Indicator', score: 8, passed: true, reason: 'Strong web presence' },
      ],
    });

    const [l2] = await db
      .insert(leads)
      .values({
        workspaceId,
        businessName: 'CloudScale Metrics',
        normalizedName: 'cloudscale metrics',
        niche: 'B2B SaaS',
        city: 'Seattle',
        region: 'WA',
        countryCode: 'US',
        websiteUrl: 'https://cloudscalemetrics.example.com',
        normalizedDomain: 'cloudscalemetrics.example.com',
        sourceType: 'csv',
        websiteStatus: 'present',
        status: 'contacted',
        qualificationScore: 78,
      })
      .returning();

    await db.insert(leadContacts).values({
      workspaceId,
      leadId: l2.id,
      contactType: 'email',
      value: 'm.chen@cloudscalemetrics.example.com',
      verificationStatus: 'verified',
    });

    await db.insert(campaignLeads).values({
      workspaceId,
      campaignId: campaign1Id,
      leadId: l2.id,
      campaignStatus: 'contacted',
    });

    const [l3] = await db
      .insert(leads)
      .values({
        workspaceId,
        businessName: 'Velvet Bean Artisan Roasters',
        normalizedName: 'velvet bean artisan roasters',
        niche: 'Hospitality & Specialty Food',
        city: 'Portland',
        region: 'OR',
        countryCode: 'US',
        websiteUrl: 'https://velvetbeancoffee.example.com',
        normalizedDomain: 'velvetbeancoffee.example.com',
        sourceType: 'manual',
        websiteStatus: 'present',
        status: 'ready_to_contact',
        qualificationScore: 65,
      })
      .returning();

    await db.insert(leadContacts).values({
      workspaceId,
      leadId: l3.id,
      contactType: 'email',
      value: 'elena@velvetbeancoffee.example.com',
      verificationStatus: 'unverified',
    });

    const [l4] = await db
      .insert(leads)
      .values({
        workspaceId,
        businessName: 'Ironclad Logistics',
        normalizedName: 'ironclad logistics',
        niche: 'Freight Forwarding',
        city: 'Chicago',
        region: 'IL',
        countryCode: 'US',
        websiteUrl: 'https://ironcladlogistics.example.com',
        normalizedDomain: 'ironcladlogistics.example.com',
        sourceType: 'manual',
        websiteStatus: 'present',
        status: 'not_qualified',
        qualificationScore: 32,
      })
      .returning();

    // 5. Seed Outreach Messages
    await db.insert(outreachMessages).values({
      workspaceId,
      leadId: l1.id,
      campaignId: campaign1Id,
      channel: 'email',
      subject: 'Elevating Apex Digital Growth with AI-guided pipeline execution',
      content: 'Hi Sarah,\n\nI was impressed by Apex Digital Growth’s client case studies in Austin. Many agency leaders we speak with find qualification and personalized follow-ups consume hours each week.\n\nLeadPilot automates evidence-backed lead qualification and multi-channel outreach drafts so your team focuses strictly on high-intent conversations.\n\nWould you have 10 minutes next Tuesday for a brief intro?\n\nBest regards,\nAlex Mercer',
      status: 'draft',
      provider: 'template',
      createdBy: userId,
    });

    // 6. Seed Follow-up tasks
    const today = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(followUpTasks).values({
      workspaceId,
      leadId: l1.id,
      campaignId: campaign1Id,
      title: 'Review outreach draft and schedule personalized email to Sarah Jenkins',
      dueAt: today,
      status: 'open',
      createdBy: userId,
    });

    await db.insert(followUpTasks).values({
      workspaceId,
      leadId: l2.id,
      campaignId: campaign1Id,
      title: 'Follow up on introductory email sent to Marcus Chen',
      dueAt: tomorrow,
      status: 'open',
      createdBy: userId,
    });

    // 7. Seed Activities
    await db.insert(activities).values({
      workspaceId,
      leadId: l1.id,
      campaignId: campaign1Id,
      activityType: 'lead_created',
      description: 'Lead Apex Digital Growth added via manual entry',
      actorUserId: userId,
    });

    await db.insert(activities).values({
      workspaceId,
      leadId: l1.id,
      campaignId: campaign1Id,
      activityType: 'status_changed',
      description: 'Lead qualified with score 88/100',
      metadata: { score: 88, status: 'qualified' },
      actorUserId: userId,
    });

    console.log('Seeded sample leads, contacts, outreach messages, follow-up tasks, and activities');
  }

  console.log('Seed completed successfully!');
  await closePool();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
