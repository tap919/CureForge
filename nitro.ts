/**
 * CureForge – Nitro Mode
 * Simulates AWS Nitro Enclaves attestation for measured signing and escrow.
 *
 * In production, replace with:
 *   - AWS Nitro Enclaves SDK attestation document
 *   - Real KMS escrow / key derivation
 *   - HPKE or ECDH-P384 for secret binding
 */
import { createHash, createHmac, randomBytes } from 'crypto';
import type { NitroAttestation } from '../registry/types.js';
import { storeNitroAttestation, getAgent } from '../registry/store.js';

// Simulate PCR0 from image content (in prod: read from hypervisor)
function simulatePCR(imageContent: string, index: 0 | 1 | 2): string {
  return createHmac('sha256', `pcr${index}-key`)
    .update(imageContent)
    .update(`pcr${index}`)
    .digest('hex');
}

// Simulate a signing key fingerprint derived from the enclave measurement
function deriveSigningPublicKey(pcr0: string, pcr1: string): string {
  return createHash('sha256')
    .update('signing-key-derivation')
    .update(pcr0)
    .update(pcr1)
    .digest('hex');
}

// Simulate escrow transaction hash (in prod: Ethereum/Solana smart contract txid)
function simulateEscrowTx(agentId: string, signingKey: string): string {
  return createHmac('sha256', 'escrow-contract-salt')
    .update(agentId)
    .update(signingKey)
    .update(String(Date.now()))
    .digest('hex');
}

/**
 * Enroll an agent into Nitro mode.
 * - Computes simulated PCR measurements for the running image
 * - Derives a signing key bound to those measurements
 * - Simulates an escrow transaction
 * - Stores the attestation document
 */
export function enrollNitro(agentId: string): NitroAttestation | { error: string } {
  const agent = getAgent(agentId);
  if (!agent) return { error: `Agent ${agentId} not registered` };

  // The "image" for simulation = canonical code + spec hash
  const imageContent = createHash('sha256')
    .update(agent.code)
    .update(agent.spec)
    .digest('hex');

  const pcr0 = simulatePCR(imageContent, 0);
  const pcr1 = simulatePCR(imageContent, 1);
  const pcr2 = simulatePCR(imageContent, 2);
  const nonce = randomBytes(16).toString('hex');
  const signingPublicKey = deriveSigningPublicKey(pcr0, pcr1);
  const escrowTxHash = simulateEscrowTx(agentId, signingPublicKey);

  const attestation: NitroAttestation = {
    agentId,
    pcr0,
    pcr1,
    pcr2,
    nonce,
    timestamp: Date.now(),
    escrowTxHash,
    signingPublicKey,
  };

  storeNitroAttestation(attestation);
  return attestation;
}

/**
 * Sign an arbitrary payload with the enclave's derived key.
 * Returns HMAC-SHA256 (simulating an enclave-attested signature).
 */
export function nitroSign(agentId: string, payload: string): { signature: string; signingKey: string } | { error: string } {
  const agent = getAgent(agentId);
  if (!agent) return { error: `Agent ${agentId} not found` };

  const imageContent = createHash('sha256')
    .update(agent.code)
    .update(agent.spec)
    .digest('hex');

  const pcr0 = simulatePCR(imageContent, 0);
  const pcr1 = simulatePCR(imageContent, 1);
  const signingPublicKey = deriveSigningPublicKey(pcr0, pcr1);

  const signature = createHmac('sha256', signingPublicKey)
    .update(payload)
    .digest('hex');

  return { signature, signingKey: signingPublicKey };
}

/**
 * Verify that a payload was signed by this agent's Nitro enclave.
 */
export function nitroVerify(agentId: string, payload: string, providedSignature: string): boolean {
  const result = nitroSign(agentId, payload);
  if ('error' in result) return false;
  return result.signature === providedSignature;
}

/**
 * Return a human-readable trust summary for display.
 */
export function nitroPolicyReport(agentId: string): Record<string, unknown> {
  const agent = getAgent(agentId);
  if (!agent) return { error: 'Agent not found' };

  const imageContent = createHash('sha256')
    .update(agent.code)
    .update(agent.spec)
    .digest('hex');

  return {
    agentId,
    trustModel: 'NITRO',
    capabilities: [
      'Measured image signing',
      'Escrow / secret-bound workflows',
      'Identity-bound code execution',
      'Attestation document emission',
    ],
    recommendations: [
      'Suitable for: payment flows, credential issuance, policy enforcement',
      'Not suitable for: arbitrary Turing-complete proof verification',
    ],
    pcr0: simulatePCR(imageContent, 0).slice(0, 16) + '…',
    pcr1: simulatePCR(imageContent, 1).slice(0, 16) + '…',
    simulated: true,
  };
}
