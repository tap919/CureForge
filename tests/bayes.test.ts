import { describe, it, expect } from 'vitest';
import { calculatePosterior, calculateInformationGain } from '../src/lib/bayes';

describe('Bayesian Updater', () => {
  it('correctly updates posterior probability when data is positive', () => {
    const newConfidence = calculatePosterior(50, true);
    expect(newConfidence).toBe(81);
  });

  it('correctly updates posterior probability when data is negative', () => {
    const newConfidence = calculatePosterior(50, false);
    expect(newConfidence).toBe(16);
  });
  
  it('calculates information gain > 0 when confidence changes', () => {
    const gain = calculateInformationGain(50, 81);
    expect(gain).toBeGreaterThan(0);
  });
  
  it('returns 0 information gain when confidence does not change', () => {
    const gain = calculateInformationGain(50, 50);
    expect(gain).toBeCloseTo(0);
  });
});
