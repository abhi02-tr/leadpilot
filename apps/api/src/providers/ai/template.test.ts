import { describe, it, expect } from 'vitest';
import { TemplateProvider } from './template.provider.js';

describe('AI Template Provider', () => {
  const provider = new TemplateProvider();

  it('generates a personalized email draft using verified lead facts', async () => {
    const prompt = {
      leadBusinessName: 'Apex Digital Growth',
      niche: 'Digital Marketing & SEO',
      city: 'Austin',
      country: 'US',
      websiteUrl: 'https://apexdigitalgrowth.example.com',
      campaignOffer: 'AI lead qualification and automated pipeline acceleration',
      objective: 'start_conversation',
      channel: 'email' as const,
      language: 'english' as const,
      tone: 'consultative' as const,
      length: 'standard' as const,
    };

    const result = await provider.generate(prompt);
    expect(result.subject).toBeDefined();
    expect(result.subject).toContain('Apex Digital Growth');
    expect(result.content).toBeDefined();
    expect(result.content).toContain('Apex Digital Growth');
    expect(result.provider).toBe('template');
  });

  it('supports WhatsApp outreach in Hinglish', async () => {
    const prompt = {
      leadBusinessName: 'Mumbai Retail Hub',
      niche: 'Retail & POS',
      city: 'Mumbai',
      objective: 'start_conversation',
      channel: 'whatsapp' as const,
      language: 'hinglish' as const,
      tone: 'conversational' as const,
      length: 'short' as const,
    };

    const result = await provider.generate(prompt);
    expect(result.content).toBeDefined();
    expect(result.content).toContain('Mumbai Retail Hub');
    expect(result.provider).toBe('template');
  });

  it('supports Instagram outreach in Gujarati', async () => {
    const prompt = {
      leadBusinessName: 'Surat Diamond Craft',
      niche: 'Jewelry',
      city: 'Surat',
      objective: 'ask_permission',
      channel: 'instagram' as const,
      language: 'gujarati' as const,
      tone: 'friendly' as const,
      length: 'short' as const,
    };

    const result = await provider.generate(prompt);
    expect(result.content).toBeDefined();
    expect(result.content).toContain('Surat Diamond Craft');
    expect(result.provider).toBe('template');
  });
});
