import { describe, it, expect } from 'vitest';
import { calculateClientScore, getScoreColor, getScoreLabel } from './scoring';

describe('scoring utils', () => {
  it('calculates score based on history and contact info', () => {
    const client = {
      service_history: [{}, {}, {}],
      email: 'a@b.com',
      phone: '123',
      notes: 'ok',
      status: 'active',
    };
    const score = calculateClientScore(client as any);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('returns color and label for score buckets', () => {
    expect(getScoreColor(85)).toContain('text-green');
    expect(getScoreLabel(85)).toMatch(/Très bon|Excellent|Bon/i);

    expect(getScoreColor(55)).toMatch(/text-yellow|text-amber|text-orange/);
    expect(getScoreLabel(55)).toBeTypeOf('string');

    expect(getScoreColor(20)).toContain('text-red');
  });
});


