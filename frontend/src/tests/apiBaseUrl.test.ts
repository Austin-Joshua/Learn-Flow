import { describe, it, expect } from 'vitest';
import { normalizeApiBaseUrl } from '../services/api';

describe('normalizeApiBaseUrl', () => {
  it('(a) normalises unset or empty values to /api/v1', () => {
    expect(normalizeApiBaseUrl(undefined)).toBe('/api/v1');
    expect(normalizeApiBaseUrl('')).toBe('/api/v1');
    expect(normalizeApiBaseUrl('   ')).toBe('/api/v1');
  });

  it('(b) appends /api/v1 to base http URLs lacking an api suffix', () => {
    expect(normalizeApiBaseUrl('http://localhost:8000')).toBe('http://localhost:8000/api/v1');
    expect(normalizeApiBaseUrl('http://localhost:8000/')).toBe('http://localhost:8000/api/v1');
  });

  it('(c) strips trailing slash from /api/v1 paths', () => {
    expect(normalizeApiBaseUrl('/api/v1/')).toBe('/api/v1');
    expect(normalizeApiBaseUrl('http://localhost:8000/api/v1/')).toBe('http://localhost:8000/api/v1');
  });
});

