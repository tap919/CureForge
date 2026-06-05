/**
 * CureForge – RISC Zero Mode
 * Simulates ZK receipt verification for narrow, high-value tasks.
 *
 * Eligible task kinds (where proving cost is justified):
 *   - POLICY_CHECK   : compliance / rule engine evaluation
 *   - PARSER         : deterministic data parsing / validation
 *   - SCORING        : bounded scoring / ranking function
 *   - BOUNDED_SUBROUTINE : short, pure function with small witness
 *
 * In production, replace with the RISC Zero SDK:
 *   https://github.com/risc0/risc0
 */
import { createHash } from 'crypto';
import type { RiscZeroTask } from '../registry/types.js';
import { storeRiscZeroTask, getAgent } from '../registry/store.js';

// Supported guest program image IDs (simulation only)
const GUEST_IMAGES: Record<string, string> = {
  POLICY_CHECK        : 'image:0xdeadbeef001',
  PARSER              : 'image:0xdeadbeef002',
  SCORING             : 'image:0xdeadbeef003',
  BOUNDED_SUBROUTINE  : 'image:0xdeadbeef004',
};

// Max input size before we refuse (proving cost boundary)
const MAX_INPUT_BYTES = 8 * 1024; // 8 KB

// Simulated average proving times per task kind (ms)
const PROVING_MS: Record<string, number> = {
  POLICY_CHECK       : 200,
  PARSER             : 350,
  SCORING            : 180,
  BOUNDED_SUBROUTINE : 400,
};

/**
 * Submit a task for RISC Zero proving (simulated).
 * Returns a receipt CID and verified outputs or an eligibility error.
 */
export function proveTask(opts: {
  agentId: string;
  taskKind: RiscZeroTask['taskKind'];
  input: unknown;
}): RiscZeroTask | { error: string; eligible: false } {
  const agent = getAgent(opts.agentId);
  if (!agent) return { error: `Agent ${opts.agentId} not registered`, eligible: false };

  const inputStr = JSON.stringify(opts.input);
  if (Buffer.byteLength(inputStr) > MAX_INPUT_BYTES) {
    return {
      error: `Input exceeds ${MAX_INPUT_BYTES} byte limit for RISC Zero. Consider NITRO for larger workloads.`,
      eligible: false,
    };
  }

  const imageId = GUEST_IMAGES[opts.taskKind];
  const inputHash = createHash('sha256').update(inputStr).digest('hex');

  // Simulate Groth16 receipt CID (real: stored on IPFS / Bonsai relay)
  const receiptCID =
    'bafyrei' +
    createHash('sha256')
      .update(imageId)
      .update(inputHash)
      .update(opts.agentId)
      .digest('hex')
      .slice(0, 46);

  // Simulate public outputs from the guest
  const publicOutputs: Record<string, unknown> = {
    inputHash,
    taskKind: opts.taskKind,
    outputDigest: createHash('sha256')
      .update(receiptCID)
      .update(inputHash)
      .digest('hex'),
    verified: true,
  };

  const task: RiscZeroTask = {
    agentId: opts.agentId,
    taskKind: opts.taskKind,
    inputHash,
    receiptCID,
    imageId,
    publicOutputs,
    provingCostMs: PROVING_MS[opts.taskKind] ?? 300,
    verified: true,
  };

  storeRiscZeroTask(task);
  return task;
}

/**
 * Verify a previously-issued receipt CID (simulation: hash consistency check).
 */
export function verifyReceipt(receiptCID: string, imageId: string, inputHash: string): boolean {
  // In production: call the Bonsai / RISC Zero relay verification endpoint
  // Here we just check that the CID is structurally consistent
  return (
    typeof receiptCID === 'string' &&
    receiptCID.startsWith('bafyrei') &&
    receiptCID.length > 10 &&
    typeof imageId === 'string' &&
    typeof inputHash === 'string'
  );
}

/**
 * Return eligibility analysis for an agent + task.
 */
export function eligibilityReport(agentId: string, taskKind: string): Record<string, unknown> {
  const agent = getAgent(agentId);
  if (!agent) return { eligible: false, reason: 'Agent not registered' };

  const eligible = Object.keys(GUEST_IMAGES).includes(taskKind);
  return {
    agentId,
    taskKind,
    eligible,
    reason: eligible
      ? 'Task is bounded, pure, and receipt-verifiable.'
      : 'Task is not in the narrow RISC Zero eligible set.',
    imageId: eligible ? GUEST_IMAGES[taskKind] : null,
    estimatedProvingMs: eligible ? PROVING_MS[taskKind] : null,
    guidelines: [
      'RISC Zero is cost-effective only for short, bounded subroutines.',
      'Avoid general-purpose agents – use REPLAY or NITRO instead.',
      'Receipt verification is worth the cost for: policy, parsers, scoring.',
    ],
    simulated: true,
  };
}

/**
 * Cost analysis: is proving worth it vs. NITRO for a given task?
 */
export function costAnalysis(taskKind: string, inputSizeBytes: number): Record<string, unknown> {
  const eligible = Object.keys(GUEST_IMAGES).includes(taskKind);
  const provingMs = eligible ? PROVING_MS[taskKind] : null;
  const nitroCostMs = 50; // Nitro attestation is ~cheap

  return {
    taskKind,
    riscZeroEligible: eligible,
    inputSizeBytes,
    exceedsInputLimit: inputSizeBytes > MAX_INPUT_BYTES,
    estimatedProvingMs: provingMs,
    nitroCostMs,
    recommendation:
      !eligible
        ? 'Use REPLAY or NITRO'
        : inputSizeBytes > MAX_INPUT_BYTES
        ? 'Input too large – use NITRO'
        : provingMs && provingMs < 500
        ? 'RISC Zero justified – short proving time, high-value receipt'
        : 'Consider NITRO unless on-chain receipt is strictly required',
  };
}
