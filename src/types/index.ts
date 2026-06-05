export interface Target {
  id: string;
  symbol: string;
  area: string;
  disease: string;
  score: number;
  safety: string;
  tractability: string;
  infoGain: number;
}

export interface Hypothesis {
  target: string;
  mechanism: string;
  modality: string;
  proposed_intervention: string;
  testable_prediction: string;
  confidence: number;
  literature_support: string;
  flaws?: string[];
  contradictory_papers?: string[];
  critic_score?: number;
}

export interface AuditRecord {
  id: string;
  hypothesis_id: string;
  assay_type: string;
  cell_line: string;
  result_value: string;
  units: string;
  pass_fail: string;
  raw_data_digest: string;
  timestamp: string;
  lab_id: string;
  target: string;
  intent: string;
  fuzzPts: number;
  mcPts: number;
  signature: string;
}

export interface DaemonLog {
  id: string;
  timestamp: string;
  type: string;
  message: string;
}

export interface UploadedFile {
  name: string;
  type: string;
  size: string;
  timestamp: string;
  status: string;
}
