import { describe, it, expect } from 'vitest';
import { getStatusColor, getPriorityColor, getIconColor } from './colors';

describe('colors utils', () => {
  it('returns non-empty class strings for known statuses', () => {
    expect(getStatusColor('active')).toBeTypeOf('string');
    expect(getStatusColor('active').length).toBeGreaterThan(0);
    expect(getStatusColor('inactive').length).toBeGreaterThan(0);
  });

  it('returns non-empty class strings for priorities', () => {
    expect(getPriorityColor('P1').length).toBeGreaterThan(0);
    expect(getPriorityColor('P2').length).toBeGreaterThan(0);
    expect(getPriorityColor('P3').length).toBeGreaterThan(0);
  });

  it('returns icon color string for status', () => {
    const color = getIconColor('ok');
    expect(typeof color).toBe('string');
    expect(color.length).toBeGreaterThan(0);
  });
});


