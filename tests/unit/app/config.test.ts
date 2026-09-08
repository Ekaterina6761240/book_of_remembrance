import { describe, expect, it } from 'vitest';
import { resolveDataSourceMode } from '../../../src/app/config';

describe('resolveDataSourceMode', () => {
  it.each(['mock', 'wordpress'] as const)('accepts the explicit %s mode', (mode) => {
    expect(resolveDataSourceMode(mode, false)).toBe(mode);
  });

  it('defaults to mock only in development', () => {
    expect(resolveDataSourceMode(undefined, true)).toBe('mock');
  });

  it('fails closed when production mode is not explicit', () => {
    expect(() => resolveDataSourceMode(undefined, false)).toThrow(/VITE_DATA_SOURCE/);
  });
});
