import type { AIProvider, GeneratePrompt, GeneratedContent, AIProviderStatus } from './types.js';
import { logger } from '../../lib/logger.js';

export class OllamaProvider implements AIProvider {
  readonly id = 'ollama';
  readonly name = 'Ollama (Local)';

  private get baseUrl(): string {
    return process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
  }

  private get model(): string {
    return process.env.OLLAMA_MODEL ?? 'llama3.2';
  }

  isConfigured(): boolean {
    return !!(process.env.OLLAMA_BASE_URL && process.env.OLLAMA_MODEL);
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: controller.signal });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  }

  async generate(prompt: GeneratePrompt): Promise<GeneratedContent> {
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(prompt);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          system: systemPrompt,
          prompt: userPrompt,
          stream: false,
          options: { temperature: 0.7, num_predict: 512 },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Ollama returned ${res.status}`);
      }

      const data = await res.json() as { response: string };
      const parsed = parseModelOutput(data.response, prompt.channel);

      return { ...parsed, provider: 'ollama', model: this.model };
    } finally {
      clearTimeout(timeout);
    }
  }

  async getStatus(): Promise<AIProviderStatus> {
    const configured = this.isConfigured();
    const available = configured ? await this.checkAvailability() : false;
    return {
      id: this.id, name: this.name, isConfigured: configured, isAvailable: available,
      ...(!available && configured ? { error: 'Ollama server is not reachable' } : {}),
    };
  }
}

function buildSystemPrompt(): string {
  return `You are a professional outreach message writer for LeadPilot. 
Your task is to write concise, genuine, and professional outreach messages for small business owners.
Rules:
- Only use facts provided. Never fabricate reviews, ratings, testimonials, or business details.
- Do not make false claims about the recipient's business.
- Be respectful and professional.
- Keep messages concise and focused.
- For email: output JSON with "subject" and "content" fields.
- For instagram/whatsapp: output JSON with only a "content" field.
- Content must be plain text only, no HTML or markdown.`;
}

function buildUserPrompt(p: GeneratePrompt): string {
  return `Write a ${p.channel} outreach message with these details:
Business name: ${p.leadBusinessName}
${p.niche ? `Business type: ${p.niche}` : ''}
${p.city ? `Location: ${p.city}` : ''}
${p.description ? `About the business: ${p.description}` : ''}
Channel: ${p.channel}
Language: ${p.language}
Tone: ${p.tone}
Objective: ${p.objective}
Length: ${p.length}
${p.campaignOffer ? `Our offer: ${p.campaignOffer}` : ''}

Output only valid JSON matching the required format.`;
}

function parseModelOutput(raw: string, channel: string): { subject?: string; content: string } {
  try {
    // Extract JSON from model output
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as { subject?: string; content?: string };
      if (typeof parsed.content === 'string' && parsed.content.length > 0) {
        return {
          subject: channel === 'email' ? (parsed.subject ?? 'Hello') : undefined,
          content: parsed.content,
        };
      }
    }
  } catch {
    logger.warn('Failed to parse Ollama JSON output, using raw text');
  }
  // Fallback: use raw text as content
  return { content: raw.trim().slice(0, 2000) };
}
