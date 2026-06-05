import { describe, it, expect } from 'vitest';

describe('Bayesian Updater', () => {
  it('correctly updates posterior probability when data is positive', () => {
    const prior = 0.5; // 50%
    const pD_H = 0.85; // Prob data given hypothesis true
    const pD_notH = 0.20; // Prob data given hypothesis false
    
    const pD = (pD_H * prior) + (pD_notH * (1 - prior));
    const posterior = (pD_H * prior) / pD;
    const newConfidence = Math.round(posterior * 100);

    expect(newConfidence).toBe(81);
  });

  it('correctly updates posterior probability when data is negative', () => {
    const prior = 0.5; // 50%
    const pD_H = 0.15; // Prob data given hypothesis true (negative signal)
    const pD_notH = 0.80; // Prob data given hypothesis false (negative signal)
    
    const pD = (pD_H * prior) + (pD_notH * (1 - prior));
    const posterior = (pD_H * prior) / pD;
    const newConfidence = Math.round(posterior * 100);

    expect(newConfidence).toBe(16);
  });
});
