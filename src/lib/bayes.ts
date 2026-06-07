export function calculatePosterior(priorPct: number, isSuccess: boolean, pD_H: number = isSuccess ? 0.85 : 0.15, pD_notH: number = isSuccess ? 0.20 : 0.80): number {
  const prior = priorPct / 100;
  
  const pD = (pD_H * prior) + (pD_notH * (1 - prior));
  const posterior = (pD_H * prior) / pD;
  
  return Math.round(posterior * 100);
}

export function calculateInformationGain(priorPct: number, posteriorPct: number): number {
  // Simple KL divergence based approach for boolean outcomes
  const p0 = priorPct / 100;
  const p1 = posteriorPct / 100;
  
  if (p1 === 0 || p1 === 1 || p0 === 0 || p0 === 1) return 0;
  
  return p1 * Math.log2(p1 / p0) + (1 - p1) * Math.log2((1 - p1) / (1 - p0));
}
