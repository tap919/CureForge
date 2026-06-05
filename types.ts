/**
 * CureForge – Replayable Agent Registry
 * Trust tiers: REPLAY → NITRO → RISC_ZERO
 */

export type TrustTier = 'REPLAY' | 'NITRO' | 'RISC_ZERO';

export interface AgentManifest {
  id: string;                 // deterministic hash of (code + spec + seed)
  name: string;
  description: string;
  trustTier: TrustTier;
  version: string;            // semver
  createdAt: number;          // unix ms
  code: string;               // the canonical function source
  spec: string;               // JSON spec used during packaging
  seed: string;               // canonical replay seed
  // NITRO
  nitroMeasurement?: string;  // SHA-256 of the image PCR0
  nitroEscrowKey?: string;    // public key used for escrow
  // RISC ZERO
  riscZeroReceiptCID?: string; // IPFS / store CID for the Groth16 receipt
  riscZeroImageId?: string;
}

export interface ReplayRecord {
  agentId: string;
  runAt: number;
  seed: string;
  inputHash: string;
  outputHash: string;
  trace: string[];
  byteIdentical: boolean;     // output matches canonical run
  score: number;              // 0-100 replay fidelity score
  monteCarloData?: ReplayPoint[];
}

export interface ReplayPoint {
  x: number;
  y: number;
  z: number | null;
  error?: string;
}

export interface NitroAttestation {
  agentId: string;
  pcr0: string;               // enclave image hash
  pcr1: string;               // kernel + bootstrap
  pcr2: string;               // application
  nonce: string;
  timestamp: number;
  escrowTxHash?: string;
  signingPublicKey: string;
}

export interface RiscZeroTask {
  agentId: string;
  taskKind: 'POLICY_CHECK' | 'PARSER' | 'SCORING' | 'BOUNDED_SUBROUTINE';
  inputHash: string;
  receiptCID?: string;
  imageId?: string;
  publicOutputs?: Record<string, unknown>;
  provingCostMs?: number;
  verified: boolean;
}

export type VerificationMode = 'REPLAY' | 'NITRO' | 'RISC_ZERO';
