/**
 * CureForge – Agent Registry Store
 * In-memory registry (swap for Redis/PostgreSQL in production)
 */
import { createHash, createHmac } from 'crypto';
import { Script, createContext } from 'vm';
import util from 'util';
import seedrandom from 'seedrandom';
import type {
  AgentManifest,
  ReplayRecord,
  ReplayPoint,
  TrustTier,
  NitroAttestation,
  RiscZeroTask,
} from './types.js';

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------
const agents   = new Map<string, AgentManifest>();
const replays  = new Map<string, ReplayRecord[]>();
const nitro    = new Map<string, NitroAttestation>();
const riscZero = new Map<string, RiscZeroTask[]>();

// ---------------------------------------------------------------------------
// Deterministic ID
// ---------------------------------------------------------------------------
export function deriveAgentId(code: string, spec: string, seed: string): string {
  return createHash('sha256')
    .update(code).update('\x00')
    .update(spec).update('\x00')
    .update(seed)
    .digest('hex')
    .slice(0, 32);
}

// ---------------------------------------------------------------------------
// Package an agent into the registry
// ---------------------------------------------------------------------------
export function packageAgent(opts: {
  name: string;
  description: string;
  code: string;
  spec: string;
  seed?: string;
  trustTier?: TrustTier;
  nitroMeasurement?: string;
  nitroEscrowKey?: string;
  riscZeroReceiptCID?: string;
  riscZeroImageId?: string;
}): AgentManifest {
  const seed = opts.seed ?? 'cureforge-canonical-seed-v1';
  const id   = deriveAgentId(opts.code, opts.spec, seed);

  const manifest: AgentManifest = {
    id,
    name: opts.name,
    description: opts.description,
    trustTier: opts.trustTier ?? 'REPLAY',
    version: '1.0.0',
    createdAt: Date.now(),
    code: opts.code,
    spec: opts.spec,
    seed,
    nitroMeasurement: opts.nitroMeasurement,
    nitroEscrowKey: opts.nitroEscrowKey,
    riscZeroReceiptCID: opts.riscZeroReceiptCID,
    riscZeroImageId: opts.riscZeroImageId,
  };

  agents.set(id, manifest);
  replays.set(id, []);
  return manifest;
}

// ---------------------------------------------------------------------------
// Canonical microVM runner
// Executes `code` in a locked-down vm.Script context with seeded RNG.
// Returns: { outputHash, monteCarloData, trace }
// ---------------------------------------------------------------------------
export async function runCanonicalMicroVM(
  code: string,
  seed: string,
  monteCarloPoints = 1000,
): Promise<{ outputHash: string; monteCarloData: ReplayPoint[]; trace: string[] }> {
  const trace: string[] = [];

  const sandbox = {
    console: {
      log  : (...a: unknown[]) => trace.push(a.map(x => util.format(x)).join(' ')),
      warn : (...a: unknown[]) => trace.push('[warn] ' + a.map(x => util.format(x)).join(' ')),
      error: (...a: unknown[]) => trace.push('[error] ' + a.map(x => util.format(x)).join(' ')),
    },
    seedrandom,
    Math,
    result: null as ReplayPoint[] | null,
  };

  const ctx = createContext(sandbox);

  // 1. Load the agent code
  try {
    new Script(code).runInContext(ctx, { timeout: 2000 });
  } catch (e: unknown) {
    throw new Error('Agent code failed to load: ' + (e as Error).message);
  }

  // 2. Run the deterministic Monte Carlo sweep
  const mcScript = `
    const _rng = seedrandom(${JSON.stringify(seed)});
    const _pts = [];
    for (let i = 0; i < ${monteCarloPoints}; i++) {
      const x = _rng() * 20 - 10;
      const y = _rng() * 20 - 10;
      try {
        const z = targetFunction(x, y);
        _pts.push({ x, y, z });
      } catch (err) {
        _pts.push({ x, y, z: null, error: err.message });
      }
    }
    result = _pts;
  `;

  new Script(mcScript).runInContext(ctx, { timeout: 5000 });
  const monteCarloData = (sandbox.result ?? []) as ReplayPoint[];

  // 3. Compute a byte-stable output hash
  const outputHash = createHash('sha256')
    .update(JSON.stringify(monteCarloData))
    .digest('hex');

  return { outputHash, monteCarloData, trace };
}

// ---------------------------------------------------------------------------
// Challenge-replay an agent and record fidelity
// ---------------------------------------------------------------------------
export async function replayAgent(agentId: string): Promise<ReplayRecord> {
  const agent = agents.get(agentId);
  if (!agent) throw new Error(`Agent ${agentId} not found`);

  const inputHash = createHash('sha256').update(agent.spec).digest('hex');

  const { outputHash, monteCarloData, trace } = await runCanonicalMicroVM(
    agent.code,
    agent.seed,
  );

  // Compare to stored canonical hash (first replay IS the canonical)
  const existingReplays = replays.get(agentId) ?? [];
  const canonical = existingReplays[0];
  const byteIdentical = canonical ? canonical.outputHash === outputHash : true;

  // Fidelity score: 100 if byte-identical, else 0 (extend for partial scoring)
  const score = byteIdentical ? 100 : 0;

  const record: ReplayRecord = {
    agentId,
    runAt: Date.now(),
    seed: agent.seed,
    inputHash,
    outputHash,
    trace,
    byteIdentical,
    score,
    monteCarloData,
  };

  existingReplays.push(record);
  replays.set(agentId, existingReplays);

  return record;
}

// ---------------------------------------------------------------------------
// Rank agents by average replay fidelity score
// ---------------------------------------------------------------------------
export function rankAgents(): Array<{ agent: AgentManifest; avgScore: number; replayCount: number }> {
  return Array.from(agents.values())
    .map(agent => {
      const rs = replays.get(agent.id) ?? [];
      const avg = rs.length
        ? rs.reduce((s, r) => s + r.score, 0) / rs.length
        : null;
      return { agent, avgScore: avg ?? -1, replayCount: rs.length };
    })
    .sort((a, b) => b.avgScore - a.avgScore);
}

// ---------------------------------------------------------------------------
// NITRO: store a simulated attestation
// ---------------------------------------------------------------------------
export function storeNitroAttestation(att: NitroAttestation): void {
  nitro.set(att.agentId, att);
}

export function getNitroAttestation(agentId: string): NitroAttestation | undefined {
  return nitro.get(agentId);
}

// ---------------------------------------------------------------------------
// RISC ZERO: record a task receipt
// ---------------------------------------------------------------------------
export function storeRiscZeroTask(task: RiscZeroTask): void {
  const tasks = riscZero.get(task.agentId) ?? [];
  tasks.push(task);
  riscZero.set(task.agentId, tasks);
}

export function getRiscZeroTasks(agentId: string): RiscZeroTask[] {
  return riscZero.get(agentId) ?? [];
}

// ---------------------------------------------------------------------------
// CRUD helpers
// ---------------------------------------------------------------------------
export const getAllAgents    = () => Array.from(agents.values());
export const getAgent        = (id: string) => agents.get(id);
export const getAllReplays    = (id: string) => replays.get(id) ?? [];
export const deleteAgent     = (id: string) => { agents.delete(id); replays.delete(id); };
