import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateSlug,
  normalizeBusinessName,
  normalizeDomain,
} from './crypto.js';

describe('Crypto & Normalization Utilities', () => {
  it('hashes and verifies passwords securely using argon2', async () => {
    const password = 'SuperSecret123!';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(await verifyPassword(hash, password)).toBe(true);
    expect(await verifyPassword(hash, 'WrongPassword')).toBe(false);
  });

  it('generates URL-friendly slugs', () => {
    expect(generateSlug('LeadPilot Growth Labs')).toBe('leadpilot-growth-labs');
    expect(generateSlug('Apex & Partners, LLC!')).toBe('apex-partners-llc');
  });

  it('normalizes business names for deduplication', () => {
    expect(normalizeBusinessName('Acme Corp, Inc.')).toBe('acme');
    expect(normalizeBusinessName('Global Logistics LLC')).toBe('global logistics');
  });

  it('normalizes domains by stripping protocols, ports, and trailing slashes', () => {
    expect(normalizeDomain('https://www.example.com/')).toBe('example.com');
    expect(normalizeDomain('http://app.leadpilot.io:3000/path')).toBe('app.leadpilot.io');
    expect(normalizeDomain('')).toBeNull();
  });
});
