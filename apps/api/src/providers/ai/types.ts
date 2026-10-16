import type { GenerateOutreachInput, Channel, Language, Tone, Length } from '@leadpilot/shared';

export interface GeneratePrompt {
  leadBusinessName: string;
  niche?: string | null;
  city?: string | null;
  country?: string | null;
  websiteUrl?: string | null;
  description?: string | null;
  channel: Channel;
  language: Language;
  tone: Tone;
  objective: string;
  length: Length;
  campaignOffer?: string;
  campaignNiche?: string;
}

export interface GeneratedContent {
  subject?: string; // Email only
  content: string;
  provider: string;
  model?: string;
  templateVersion?: string;
}

export interface AIProviderStatus {
  id: string;
  name: string;
  isConfigured: boolean;
  isAvailable: boolean;
  error?: string;
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;
  checkAvailability(): Promise<boolean>;
  generate(prompt: GeneratePrompt): Promise<GeneratedContent>;
  getStatus(): Promise<AIProviderStatus>;
}
