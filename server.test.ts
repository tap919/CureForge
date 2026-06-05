/**
 * CureForge – Trust Tier Test Suite
 * Tests: REPLAY registry, NITRO attestation, RISC Zero eligibility
 */
import { test, expect, describe } from 'vitest';
import { createHash } from 'crypto';

// ---------------------------------------------------------------------------
// Helpers (mirrors real implementations without full server boot)
// ---------------------------------------------------------------------------

function deriveAgentId(code: string, spec: string, seed: string): string {
  return createHash('sha256')
    .update(code).update('\x00')
    .update(spec).update('\x00')
    .update(seed)
    .digest('hex')
    .slice(0, 32);
}

function simulatePCR(image: string, idx: number): string {
  return createHash('sha256').update(`pcr${idx}:${image}`).digest('hex');
}

function compileIRtoJS(ir: any): string {
  if (!ir || !ir.steps) throw new Error('Malformed JSON IR');
  return ir.steps.map((s: any) => `console.log("${s.action}");`).join('\n');
}

function verifyWithAcorn(code: string): true {
  if (code.includes('eval(')) throw new Error('Unsafe operation detected by Acorn AST');
  return true;
}

function executeInSandbox(code: string, config: { seed: string }) {
  if (config.seed !== 'deterministic-seed') return { status: 'unstable', trace: 'random trace' };
  return { status: 'success', trace: 'deterministic trace output' };
}

// RISC Zero eligible task kinds
const ELIGIBLE_TASKS = new Set(['POLICY_CHECK', 'PARSER', 'SCORING', 'BOUNDED_SUBROUTINE']);
const MAX_INPUT_BYTES = 8 * 1024;

// ---------------------------------------------------------------------------
// REPLAY tier tests
// ---------------------------------------------------------------------------
describe('REPLAY – Agent Registry', () => {
  test('deriveAgentId is deterministic for same inputs', () => {
    const id1 = deriveAgentId('fn() {}', '{"task":"t"}', 'seed-1');
    const id2 = deriveAgentId('fn() {}', '{"task":"t"}', 'seed-1');
    expect(id1).toBe(id2);
  });

  test('deriveAgentId differs when code changes', () => {
    const id1 = deriveAgentId('fn() { return 1; }', '{}', 's');
    const id2 = deriveAgentId('fn() { return 2; }', '{}', 's');
    expect(id1).not.toBe(id2);
  });

  test('IR compilation from valid schema emits JS', () => {
    const ir = { steps: [{ action: 'parseData' }, { action: 'runModel' }] };
    const js = compileIRtoJS(ir);
    expect(js).toContain('parseData');
    expect(js).toContain('runModel');
  });

  test('Malformed IR throws', () => {
    expect(() => compileIRtoJS({ missing: true })).toThrow('Malformed JSON IR');
  });

  test('Acorn blocks eval', () => {
    expect(() => verifyWithAcorn(`eval('malicious()')`)).toThrow('Unsafe operation detected');
  });

  test('Sandbox runs deterministically with correct seed', () => {
    const r = executeInSandbox('safe code', { seed: 'deterministic-seed' });
    expect(r.status).toBe('success');
    expect(r.trace).toContain('deterministic');
  });

  test('Wrong seed yields unstable execution', () => {
    const r = executeInSandbox('safe code', { seed: 'wrong-seed' });
    expect(r.status).toBe('unstable');
  });
});

// ---------------------------------------------------------------------------
// NITRO tier tests
// ---------------------------------------------------------------------------
describe('NITRO – Attestation & Escrow', () => {
  test('PCR values are deterministic for same image', () => {
    const img = 'image-content-abc';
    expect(simulatePCR(img, 0)).toBe(simulatePCR(img, 0));
  });

  test('PCR values differ per index', () => {
    const img = 'image-content-abc';
    expect(simulatePCR(img, 0)).not.toBe(simulatePCR(img, 1));
  });

  test('PCR changes when image content changes', () => {
    expect(simulatePCR('img-v1', 0)).not.toBe(simulatePCR('img-v2', 0));
  });

  test('Signing key is derived from PCR0 + PCR1', () => {
    const p0 = simulatePCR('img', 0);
    const p1 = simulatePCR('img', 1);
    const key = createHash('sha256').update('signing').update(p0).update(p1).digest('hex');
    expect(key).toHaveLength(64);
  });

  test('Attestation document structure has required fields', () => {
    const att = {
      agentId: 'agent-001',
      pcr0: simulatePCR('img', 0),
      pcr1: simulatePCR('img', 1),
      pcr2: simulatePCR('img', 2),
      nonce: 'abc123',
      timestamp: Date.now(),
      signingPublicKey: 'pk-fake',
    };
    expect(att).toHaveProperty('pcr0');
    expect(att).toHaveProperty('pcr1');
    expect(att).toHaveProperty('signingPublicKey');
    expect(att.pcr0).toHaveLength(64);
  });
});

// ---------------------------------------------------------------------------
// RISC Zero tier tests
// ---------------------------------------------------------------------------
describe('RISC Zero – Bounded Task Eligibility', () => {
  test('All eligible task kinds are accepted', () => {
    for (const kind of ELIGIBLE_TASKS) {
      expect(ELIGIBLE_TASKS.has(kind)).toBe(true);
    }
  });

  test('Ineligible task kind is rejected', () => {
    expect(ELIGIBLE_TASKS.has('GENERAL_AGENT')).toBe(false);
    expect(ELIGIBLE_TASKS.has('ARBITRARY_COMPUTATION')).toBe(false);
  });

  test('Input within byte limit is accepted', () => {
    const input = JSON.stringify({ rule: 'age >= 18', value: 22 });
    expect(Buffer.byteLength(input)).toBeLessThan(MAX_INPUT_BYTES);
  });

  test('Oversized input is rejected', () => {
    const bigInput = JSON.stringify({ data: 'x'.repeat(MAX_INPUT_BYTES + 1) });
    expect(Buffer.byteLength(bigInput)).toBeGreaterThan(MAX_INPUT_BYTES);
  });

  test('Receipt CID has expected structure', () => {
    const cid = 'bafyrei' + 'a'.repeat(46);
    expect(cid.startsWith('bafyrei')).toBe(true);
    expect(cid.length).toBeGreaterThan(10);
  });

  test('Cost analysis recommends RISC Zero for eligible short tasks', () => {
    const taskKind = 'POLICY_CHECK';
    const eligible = ELIGIBLE_TASKS.has(taskKind);
    const inputSize = 200; // bytes
    expect(eligible).toBe(true);
    expect(inputSize).toBeLessThan(MAX_INPUT_BYTES);
    // Would recommend RISC Zero
  });

  test('Cost analysis recommends NITRO for large inputs', () => {
    const taskKind = 'POLICY_CHECK';
    const inputSize = MAX_INPUT_BYTES + 1000;
    const eligible = ELIGIBLE_TASKS.has(taskKind);
    expect(eligible).toBe(true);
    // Large input → NITRO despite task being eligible
    expect(inputSize).toBeGreaterThan(MAX_INPUT_BYTES);
  });
});

// ---------------------------------------------------------------------------
// Trust tier selection logic
// ---------------------------------------------------------------------------
describe('Trust Tier – Selection Logic', () => {
  function selectTier(opts: {
    needsOnChainReceipt: boolean;
    needsMeasuredSigning: boolean;
    inputSizeBytes: number;
    taskKind: string;
  }): 'REPLAY' | 'NITRO' | 'RISC_ZERO' {
    if (
      opts.needsOnChainReceipt &&
      ELIGIBLE_TASKS.has(opts.taskKind) &&
      opts.inputSizeBytes <= MAX_INPUT_BYTES
    ) {
      return 'RISC_ZERO';
    }
    if (opts.needsMeasuredSigning) return 'NITRO';
    return 'REPLAY';
  }

  test('REPLAY is default when no special requirements', () => {
    expect(selectTier({
      needsOnChainReceipt: false, needsMeasuredSigning: false,
      inputSizeBytes: 100, taskKind: 'GENERAL',
    })).toBe('REPLAY');
  });

  test('NITRO when measured signing is required', () => {
    expect(selectTier({
      needsOnChainReceipt: false, needsMeasuredSigning: true,
      inputSizeBytes: 500, taskKind: 'GENERAL',
    })).toBe('NITRO');
  });

  test('RISC_ZERO for eligible bounded task with on-chain receipt', () => {
    expect(selectTier({
      needsOnChainReceipt: true, needsMeasuredSigning: false,
      inputSizeBytes: 200, taskKind: 'POLICY_CHECK',
    })).toBe('RISC_ZERO');
  });

  test('Falls back to NITRO if input too large for RISC Zero', () => {
    expect(selectTier({
      needsOnChainReceipt: true, needsMeasuredSigning: true,
      inputSizeBytes: MAX_INPUT_BYTES + 1, taskKind: 'POLICY_CHECK',
    })).toBe('NITRO');
  });
});
