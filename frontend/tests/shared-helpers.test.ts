import { describe, expect, it } from 'vitest';

/**
 * Pure parsing helpers replicated from the pages that depend on them.
 * These guarantee the saved-view URL contract (comma-separated ids in ?ids=)
 * behaves identically wherever it is used (Compare workspace, Saved page).
 */

import { parseSavedIds, capabilityListFromShape } from '../src/utils/cityIds';

describe('parseSavedIds (URL contract)', () => {
  it('parses comma-separated ids and trims whitespace', () => {
    expect(parseSavedIds('loc_bengaluru, loc_pune')).toEqual(['loc_bengaluru', 'loc_pune']);
  });

  it('returns empty for null or garbage', () => {
    expect(parseSavedIds(null)).toEqual([]);
    expect(parseSavedIds('')).toEqual([]);
    expect(parseSavedIds(',,')).toEqual([]);
  });

  it('caps at 4 selected cities', () => {
    expect(parseSavedIds('a,b,c,d,e,f')).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('capabilityListFromShape (provider capability union)', () => {
  it('maps legacy string rows and structured rows', () => {
    const input = ['/entity-setup', { capability: 'payroll', source_url: 'https://example.com' }, 42, null];
    const out = capabilityListFromShape(input);
    expect(out).toEqual([
      { capability: '/entity-setup' },
      { capability: 'payroll', source_url: 'https://example.com' },
    ]);
  });

  it('returns empty for non-arrays', () => {
    expect(capabilityListFromShape(undefined)).toEqual([]);
    expect(capabilityListFromShape('oops')).toEqual([]);
  });
});
