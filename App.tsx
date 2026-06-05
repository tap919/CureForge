import React, { useState, useEffect, useCallback } from 'react';
import {
  Play, Download, Upload, CheckCircle, FileCode,
  Activity, Library, Layers, Sparkles, Shield,
  Lock, Zap, RefreshCw, Trash2, ChevronRight,
  Database, Eye, Hash, AlertTriangle, Info,
  Package, Star, GitBranch, Cpu
} from 'lucide-react';
import { Visualizer } from './Visualizer';

// ── Trust tier meta ─────────────────────────────────────────────────────────
const TIER_META = {
  REPLAY: {
    label: 'Replay',
    color: 'emerald',
    icon: RefreshCw,
    tagline: 'Byte-identical reproducibility',
    description:
      'Package agents into a canonical microVM, run challenge replays, and rank ' +
      'by byte-identical performance. The foundation of verifiable agent behavior.',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    glow: 'shadow-emerald-500/20',
    accent: '#10b981',
  },
  NITRO: {
    label: 'Nitro',
    color: 'blue',
    icon: Shield,
    tagline: 'Measured signing & escrow',
    description:
      'AWS Nitro Enclave-backed attestation. Identity of the running image is ' +
      'cryptographically bound to every signature and escrow transaction.',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    glow: 'shadow-blue-500/20',
    accent: '#3b82f6',
  },
  RISC_ZERO: {
    label: 'RISC Zero',
    color: 'violet',
    icon: Cpu,
    tagline: 'ZK receipt verification',
    description:
      'Groth16 receipt generation for narrow, bounded tasks: policy checks, ' +
      'parsers, scoring engines. Use only where on-chain receipt is required.',
    badge: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    glow: 'shadow-violet-500/20',
    accent: '#8b5cf6',
  },
} as const;
type TrustTier = keyof typeof TIER_META;

// ── Default experiment code ──────────────────────────────────────────────────
const DEFAULT_FUZZ = `result = fc.check(
  fc.property(fc.float(-10, 10), fc.float(-10, 10), (x, y) => {
    const out = targetFunction(x, y);
    return typeof out === 'number' && !isNaN(out) && isFinite(out);
  }),
  { seed: 1423, numRuns: 200 }
);`;

const DEFAULT_MC = `const rng = seedrandom('canonical-seed-v1');
const pts = [];
for (let i = 0; i < 2000; i++) {
  const x = rng() * 20 - 10;
  const y = rng() * 20 - 10;
  try {
    pts.push({ x, y, z: targetFunction(x, y) });
  } catch (err) {
    pts.push({ x, y, z: null, error: err.message });
  }
}
result = pts;`;

const DEFAULT_CODE =
  '// Synthesized by CureForge\nfunction targetFunction(x, y) {\n  return Math.sin(x) * Math.cos(y) + (x * 0.1);\n}';

const DEFAULT_SPEC = JSON.stringify({
  task: '2D sinusoidal surface',
  rules: ['x, y in [-10, 10]'],
  properties: ['Output is a finite number'],
}, null, 2);

// ── Types ────────────────────────────────────────────────────────────────────
interface AgentEntry {
  agent: {
    id: string; name: string; description: string;
    trustTier: TrustTier; version: string; createdAt: number;
  };
  avgScore: number;
  replayCount: number;
}

interface ReplayRecord {
  agentId: string; runAt: number; seed: string;
  inputHash: string; outputHash: string;
  trace: string[]; byteIdentical: boolean; score: number;
  monteCarloData?: any[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────
async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function timeAgo(ms: number) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ── TierBadge ────────────────────────────────────────────────────────────────
function TierBadge({ tier }: { tier: TrustTier }) {
  const m = TIER_META[tier];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${m.badge}`}>
      <Icon size={10} /> {m.label}
    </span>
  );
}

// ── RegistryPanel ────────────────────────────────────────────────────────────
function RegistryPanel({
  agents, selectedId, onSelect, onReplay, onDelete, loading,
}: {
  agents: AgentEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReplay: (id: string) => void;
  onDelete: (id: string) => void;
  loading: string | null;
}) {
  return (
    <div className="flex flex-col gap-1">
      {agents.length === 0 && (
        <div className="text-zinc-600 text-xs px-2 py-4 text-center">
          No agents packaged yet.<br />Package one using the controls below.
        </div>
      )}
      {agents.map(({ agent, avgScore, replayCount }) => (
        <div
          key={agent.id}
          onClick={() => onSelect(agent.id)}
          className={`relative rounded-lg border p-3 cursor-pointer transition-all group ${
            selectedId === agent.id
              ? 'bg-zinc-800 border-zinc-600'
              : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          {/* Score bar */}
          {replayCount > 0 && (
            <div className="absolute inset-x-0 bottom-0 h-0.5 rounded-b-lg overflow-hidden">
              <div
                className="h-full bg-emerald-500/50 transition-all"
                style={{ width: `${avgScore}%` }}
              />
            </div>
          )}

          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="text-sm font-semibold text-white truncate">{agent.name}</span>
            <TierBadge tier={agent.trustTier} />
          </div>

          <div className="flex items-center gap-3 text-[10px] text-zinc-500">
            <span className="font-mono">{agent.id.slice(0, 8)}…</span>
            {replayCount > 0 ? (
              <span className={`font-bold ${avgScore === 100 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                {avgScore.toFixed(0)}% fidelity
              </span>
            ) : (
              <span className="text-zinc-600">not replayed</span>
            )}
            <span className="ml-auto">{timeAgo(agent.createdAt)}</span>
          </div>

          {/* Action row */}
          <div
            className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => onReplay(agent.id)}
              disabled={loading === agent.id}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-[10px] font-medium transition-colors"
            >
              <RefreshCw size={9} className={loading === agent.id ? 'animate-spin' : ''} />
              Replay
            </button>
            <button
              onClick={() => onDelete(agent.id)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 text-[10px] font-medium transition-colors"
            >
              <Trash2 size={9} /> Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── TrustTierCard ─────────────────────────────────────────────────────────────
function TrustTierCard({
  tier, active, onClick,
}: { tier: TrustTier; active: boolean; onClick: () => void }) {
  const m = TIER_META[tier];
  const Icon = m.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-3 transition-all ${
        active
          ? `border-opacity-60 ${m.badge} shadow-lg ${m.glow}`
          : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} style={{ color: m.accent }} />
        <span className="text-xs font-bold" style={{ color: active ? m.accent : '#a1a1aa' }}>
          {m.label}
        </span>
        {active && (
          <span className="ml-auto text-[9px] font-bold uppercase tracking-widest"
            style={{ color: m.accent }}>Active</span>
        )}
      </div>
      <p className="text-[10px] text-zinc-500 leading-relaxed">{m.tagline}</p>
    </button>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  // Panel state
  const [rightTab, setRightTab]     = useState<'verify' | 'registry' | 'nitro' | 'riscZero'>('verify');
  const [centerTab, setCenterTab]   = useState<'visualize' | 'spec' | 'code'>('visualize');
  const [activeTier, setActiveTier] = useState<TrustTier>('REPLAY');

  // Editor state
  const [spec, setSpec]   = useState(DEFAULT_SPEC);
  const [code, setCode]   = useState(DEFAULT_CODE);
  const [logs, setLogs]   = useState<string[]>([]);
  const [hash, setHash]   = useState('');
  const [mcData, setMcData] = useState<any[]>([]);

  // Experiment flags
  const [runFuzz, setRunFuzz] = useState(true);
  const [runMC,   setRunMC]   = useState(true);
  const [fuzzCode, setFuzzCode] = useState(DEFAULT_FUZZ);
  const [mcCode,   setMcCode]   = useState(DEFAULT_MC);

  // Registry state
  const [agents,      setAgents]    = useState<AgentEntry[]>([]);
  const [selectedId,  setSelectedId] = useState<string | null>(null);
  const [replayLoading, setReplayLoading] = useState<string | null>(null);

  // Package form
  const [agentName, setAgentName]  = useState('');
  const [agentDesc, setAgentDesc]  = useState('');
  const [agentTier, setAgentTier]  = useState<TrustTier>('REPLAY');

  // Nitro state
  const [nitroPayload,   setNitroPayload]   = useState('{"data":"hello-cureforge"}');
  const [nitroSignature, setNitroSignature] = useState('');
  const [nitroResult,    setNitroResult]    = useState<Record<string, unknown> | null>(null);

  // RISC Zero state
  const [rzTaskKind,  setRzTaskKind]  = useState('POLICY_CHECK');
  const [rzInput,     setRzInput]     = useState('{"rule":"age >= 18","value":22}');
  const [rzResult,    setRzResult]    = useState<Record<string, unknown> | null>(null);

  // Misc
  const [isVerifying, setIsVerifying] = useState(false);
  const [runCount,    setRunCount]    = useState(1);
  const [isPackaging, setIsPackaging] = useState(false);

  const addLog = useCallback((msg: string) => setLogs(p => [...p, msg]), []);

  // Load registry on mount
  useEffect(() => { fetchAgents(); }, []);

  async function fetchAgents() {
    try {
      const r = await fetch('/api/agents');
      if (r.ok) setAgents(await r.json());
    } catch {}
  }

  // ── Synthesize ──────────────────────────────────────────────────────────
  async function handleSynthesize() {
    let intent = 'Generate a function based on the spec';
    try { intent = JSON.parse(spec).task || intent; } catch {}
    addLog('Synthesizing from intent…');
    const r = await fetch('/api/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent, knowledgeBase: 'Mathematical surface' }),
    });
    const d = await r.json();
    if (d.success) { setCode(d.code); addLog('[OK] Synthesis complete.'); }
    else addLog('[Error] ' + d.error);
  }

  // ── Run Verification ────────────────────────────────────────────────────
  async function handleVerify() {
    setIsVerifying(true);
    addLog('Running verification pipeline…');
    try {
      const r = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code, spec,
          runFuzzing: runFuzz, runMonteCarlo: runMC,
          fuzzCode: runFuzz ? fuzzCode : null,
          monteCarloCode: runMC ? mcCode : null,
        }),
      });
      const d = await r.json();
      d.trace?.forEach((t: string) => addLog(t));
      if (d.success) {
        if (d.monteCarloData?.length) setMcData(d.monteCarloData);
        setHash(await sha256(code + spec + JSON.stringify(d.fuzzResult)));
        setCenterTab('visualize');
      } else {
        addLog('[Error] ' + d.error);
      }
    } catch {
      addLog('[Error] Backend unreachable.');
    } finally {
      setIsVerifying(false);
      setRunCount(p => p + 1);
    }
  }

  // ── Package Agent ───────────────────────────────────────────────────────
  async function handlePackage() {
    if (!agentName.trim()) { addLog('[Error] Agent name required.'); return; }
    setIsPackaging(true);
    addLog(`Packaging agent "${agentName}" as ${agentTier}…`);
    try {
      const r = await fetch('/api/agents/package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentName, description: agentDesc,
          code, spec, trustTier: agentTier,
        }),
      });
      const d = await r.json();
      if (d.manifest) {
        addLog(`[OK] Packaged: ${d.manifest.id.slice(0, 12)}…`);
        addLog(`     Replay score: ${d.canonicalReplay.score}/100`);
        addLog(`     Byte-identical: ${d.canonicalReplay.byteIdentical}`);
        setMcData(d.canonicalReplay.monteCarloData ?? []);
        setCenterTab('visualize');
        await fetchAgents();
        setSelectedId(d.manifest.id);
      } else {
        addLog('[Error] ' + (d.error ?? 'Package failed'));
      }
    } catch {
      addLog('[Error] Package request failed.');
    } finally {
      setIsPackaging(false);
    }
  }

  // ── Challenge Replay ────────────────────────────────────────────────────
  async function handleReplay(id: string) {
    setReplayLoading(id);
    addLog(`Challenge-replaying agent ${id.slice(0, 8)}…`);
    try {
      const r = await fetch(`/api/agents/${id}/replay`, { method: 'POST' });
      const d: ReplayRecord = await r.json();
      addLog(`[${d.byteIdentical ? 'OK' : 'WARN'}] Score: ${d.score}/100  |  Byte-identical: ${d.byteIdentical}`);
      if (d.monteCarloData?.length) { setMcData(d.monteCarloData); setCenterTab('visualize'); }
      await fetchAgents();
    } catch {
      addLog('[Error] Replay failed.');
    } finally {
      setReplayLoading(null);
    }
  }

  // ── Delete Agent ────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    await fetch(`/api/agents/${id}`, { method: 'DELETE' });
    if (selectedId === id) setSelectedId(null);
    await fetchAgents();
    addLog(`Agent ${id.slice(0, 8)}… removed.`);
  }

  // ── Nitro enroll / sign / verify ────────────────────────────────────────
  async function handleNitroEnroll() {
    if (!selectedId) { addLog('[Error] Select an agent first.'); return; }
    const r = await fetch(`/api/nitro/${selectedId}/enroll`, { method: 'POST' });
    const d = await r.json();
    setNitroResult(d);
    addLog(`[Nitro] Enrolled: PCR0=${String(d.pcr0 ?? '').slice(0, 16)}…`);
  }

  async function handleNitroSign() {
    if (!selectedId) { addLog('[Error] Select an agent first.'); return; }
    const r = await fetch(`/api/nitro/${selectedId}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: nitroPayload }),
    });
    const d = await r.json();
    setNitroResult(d);
    if (d.signature) setNitroSignature(d.signature);
    addLog(`[Nitro] Signed. Sig=${String(d.signature ?? '').slice(0, 16)}…`);
  }

  async function handleNitroVerify() {
    if (!selectedId) { addLog('[Error] Select an agent first.'); return; }
    const r = await fetch(`/api/nitro/${selectedId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: nitroPayload, signature: nitroSignature }),
    });
    const d = await r.json();
    setNitroResult(d);
    addLog(`[Nitro] Verify: ${d.verified ? '✓ VALID' : '✗ INVALID'}`);
  }

  // ── RISC Zero prove ─────────────────────────────────────────────────────
  async function handleRzProve() {
    if (!selectedId) { addLog('[Error] Select an agent first.'); return; }
    let input: unknown = rzInput;
    try { input = JSON.parse(rzInput); } catch {}
    const r = await fetch(`/api/risc-zero/${selectedId}/prove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskKind: rzTaskKind, input }),
    });
    const d = await r.json();
    setRzResult(d);
    if (d.verified) addLog(`[RISC Zero] Receipt: ${String(d.receiptCID ?? '').slice(0, 20)}…`);
    else addLog(`[RISC Zero] ${d.error ?? 'Prove failed'}`);
  }

  // ── Upload / Export ──────────────────────────────────────────────────────
  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setSpec(JSON.stringify(JSON.parse(reader.result as string), null, 2));
        addLog(`[OK] Spec loaded from ${file.name}`);
      } catch {
        addLog(`[Error] Could not parse ${file.name}`);
      }
    };
    reader.readAsText(file);
  }

  function handleExport() {
    const blob = new Blob([code], { type: 'application/javascript' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'cureforge_agent.js';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white font-mono overflow-hidden select-none">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-emerald-400" />
            <span className="text-sm font-bold tracking-tight text-white">CureForge</span>
            <span className="text-zinc-600 text-xs">|</span>
            <span className="text-zinc-500 text-xs">Replayable Agent Registry</span>
          </div>
          {/* Trust tier pills */}
          <div className="flex items-center gap-1.5 ml-4">
            {(['REPLAY', 'NITRO', 'RISC_ZERO'] as TrustTier[]).map(t => {
              const m = TIER_META[t];
              const Icon = m.icon;
              return (
                <button
                  key={t}
                  onClick={() => setActiveTier(t)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${
                    activeTier === t ? m.badge : 'border-zinc-800 text-zinc-600 hover:border-zinc-700'
                  }`}
                >
                  <Icon size={9} /> {m.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="file" accept=".json" onChange={handleUpload} className="hidden" id="fu" />
          <label htmlFor="fu" className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded cursor-pointer transition-colors">
            <Upload size={12} /> Upload Spec
          </label>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-xs font-bold rounded transition-colors">
            <Download size={12} /> Export JS
          </button>
        </div>
      </div>

      {/* ── Main 3-column layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ═══ LEFT SIDEBAR ═══════════════════════════════════════════════ */}
        <div className="w-64 bg-zinc-900/80 border-r border-zinc-800 flex flex-col shrink-0">

          {/* Active tier description */}
          <div className="p-4 border-b border-zinc-800">
            {(() => {
              const m = TIER_META[activeTier];
              const Icon = m.icon;
              return (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} style={{ color: m.accent }} />
                    <span className="text-xs font-bold" style={{ color: m.accent }}>{m.label} Mode</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">{m.description}</p>
                </div>
              );
            })()}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* Synthesize */}
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2">
                Code Generation
              </div>
              <button
                onClick={handleSynthesize}
                className="w-full flex items-center gap-2 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
              >
                <Sparkles size={12} className="text-yellow-400" /> Synthesize from Spec
              </button>
            </div>

            {/* Experiment config */}
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2">
                Experiment Pipeline
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] text-zinc-400 cursor-pointer">
                  <input type="checkbox" checked={runFuzz} onChange={e => setRunFuzz(e.target.checked)}
                    className="accent-emerald-500 w-3 h-3" />
                  fast-check fuzzing
                </label>
                <label className="flex items-center gap-2 text-[10px] text-zinc-400 cursor-pointer">
                  <input type="checkbox" checked={runMC} onChange={e => setRunMC(e.target.checked)}
                    className="accent-emerald-500 w-3 h-3" />
                  Monte Carlo sweep
                </label>
              </div>
            </div>

            {/* Package agent */}
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2">
                Package to Registry
              </div>
              <div className="space-y-2">
                <input
                  value={agentName} onChange={e => setAgentName(e.target.value)}
                  placeholder="Agent name…"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-[11px] text-white placeholder:text-zinc-600 focus:border-emerald-500 outline-none"
                />
                <input
                  value={agentDesc} onChange={e => setAgentDesc(e.target.value)}
                  placeholder="Description (optional)…"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-[11px] text-white placeholder:text-zinc-600 focus:border-emerald-500 outline-none"
                />
                <select
                  value={agentTier} onChange={e => setAgentTier(e.target.value as TrustTier)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-[11px] text-white focus:border-emerald-500 outline-none"
                >
                  <option value="REPLAY">REPLAY</option>
                  <option value="NITRO">NITRO</option>
                  <option value="RISC_ZERO">RISC ZERO</option>
                </select>
                <button
                  onClick={handlePackage}
                  disabled={isPackaging}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 rounded text-xs font-bold text-white transition-colors"
                >
                  <Package size={12} /> {isPackaging ? 'Packaging…' : 'Package & Replay'}
                </button>
              </div>
            </div>
          </div>

          {/* Run experiment button */}
          <div className="p-4 border-t border-zinc-800 shrink-0">
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-sm font-bold text-white transition-colors"
            >
              <Play size={14} /> {isVerifying ? 'Running…' : 'Run Experiment'}
            </button>
          </div>
        </div>

        {/* ═══ CENTER PANEL ════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-zinc-800 bg-zinc-950">

          {/* Tabs */}
          <div className="flex bg-zinc-900/60 border-b border-zinc-800 shrink-0">
            {(['visualize', 'spec', 'code'] as const).map(t => (
              <button
                key={t}
                onClick={() => setCenterTab(t)}
                className={`px-5 py-2.5 capitalize text-xs font-bold tracking-wide border-b-2 transition-colors ${
                  centerTab === t
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t === 'visualize' ? '3D Surface' : t === 'spec' ? 'JSON Spec' : 'Agent Code'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            {centerTab === 'visualize' && <Visualizer data={mcData} />}

            {centerTab === 'spec' && (
              <div className="h-full p-4">
                <textarea
                  value={spec} onChange={e => setSpec(e.target.value)}
                  className="w-full h-full bg-transparent text-blue-300 text-xs font-mono p-2 outline-none resize-none"
                  placeholder="JSON spec…"
                />
              </div>
            )}

            {centerTab === 'code' && (
              <div className="h-full flex flex-col p-4">
                <div className="text-[10px] text-zinc-600 mb-2 flex items-center gap-1.5">
                  <FileCode size={11} /> Locked-down vm.Script sandbox • Acorn-verified
                </div>
                <textarea
                  value={code} onChange={e => { setCode(e.target.value); setHash(''); }}
                  className="flex-1 bg-transparent text-emerald-300 text-xs font-mono p-2 outline-none resize-none"
                  spellCheck={false}
                />
              </div>
            )}
          </div>
        </div>

        {/* ═══ RIGHT PANEL ═════════════════════════════════════════════════ */}
        <div className="w-80 flex flex-col bg-zinc-950 shrink-0">

          {/* Right panel tabs */}
          <div className="flex border-b border-zinc-800 bg-zinc-900/60 shrink-0">
            {([
              ['verify', Activity],
              ['registry', Database],
              ['nitro', Shield],
              ['riscZero', Cpu],
            ] as const).map(([t, Icon]) => (
              <button
                key={t}
                onClick={() => setRightTab(t)}
                title={t}
                className={`flex-1 flex items-center justify-center py-2.5 border-b-2 transition-colors ${
                  rightTab === t
                    ? t === 'verify'   ? 'border-emerald-500 text-emerald-400'
                    : t === 'registry' ? 'border-zinc-400 text-zinc-300'
                    : t === 'nitro'    ? 'border-blue-500 text-blue-400'
                    :                    'border-violet-500 text-violet-400'
                    : 'border-transparent text-zinc-600 hover:text-zinc-400'
                }`}
              >
                <Icon size={13} />
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">

            {/* ── Verify pane ── */}
            {rightTab === 'verify' && (
              <div className="flex flex-col h-full">
                {/* Hash card */}
                <div className="p-4 border-b border-zinc-800 shrink-0">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-3">
                    Acceptance Fingerprint
                  </div>
                  {hash ? (
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                      <div className="text-[9px] uppercase font-bold text-emerald-500/70 mb-1">SHA-256</div>
                      <div className="text-[10px] font-mono text-emerald-400 break-all leading-relaxed select-all">{hash}</div>
                      <div className="flex justify-between text-[9px] text-emerald-500/50 mt-2">
                        <span>Acorn + fast-check verified</span>
                        <span>{mcData.length} pts</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-zinc-600">
                      Run an experiment to generate a fingerprint.
                    </div>
                  )}
                </div>

                {/* Experiment code editors */}
                <div className="p-4 space-y-3 border-b border-zinc-800 shrink-0">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1.5">
                      Fuzz Code
                    </div>
                    <textarea
                      value={fuzzCode} onChange={e => setFuzzCode(e.target.value)}
                      className="w-full h-20 bg-zinc-900 border border-zinc-800 text-green-300 text-[10px] font-mono p-2 rounded focus:border-emerald-500 outline-none resize-none"
                    />
                  </div>
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1.5">
                      Monte Carlo Code
                    </div>
                    <textarea
                      value={mcCode} onChange={e => setMcCode(e.target.value)}
                      className="w-full h-20 bg-zinc-900 border border-zinc-800 text-green-300 text-[10px] font-mono p-2 rounded focus:border-emerald-500 outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Trace log */}
                <div className="flex-1 p-4 overflow-y-auto bg-black font-mono text-[10px] space-y-1">
                  <div className="flex justify-between text-zinc-600 border-b border-zinc-900 pb-2 mb-2">
                    <span>Pipeline Trace</span>
                    <span>Run #{runCount}</span>
                  </div>
                  {logs.length === 0
                    ? <div className="text-zinc-700">Awaiting execution…</div>
                    : logs.map((l, i) => (
                      <div key={i} className={
                        l.includes('[Error]') || l.includes('failed') || l.includes('WARN')
                          ? 'text-rose-400'
                          : l.includes('[OK]') || l.includes('completed') || l.includes('✓')
                          ? 'text-emerald-400'
                          : l.includes('[Nitro]') ? 'text-blue-400'
                          : l.includes('[RISC Zero]') ? 'text-violet-400'
                          : 'text-zinc-400'
                      }>{'> '}{l}</div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* ── Registry pane ── */}
            {rightTab === 'registry' && (
              <div className="p-4 space-y-4">
                <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                  Packaged Agents ({agents.length})
                </div>
                <RegistryPanel
                  agents={agents}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onReplay={handleReplay}
                  onDelete={handleDelete}
                  loading={replayLoading}
                />
                {selectedId && (() => {
                  const entry = agents.find(a => a.agent.id === selectedId);
                  if (!entry) return null;
                  return (
                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-2">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2">
                        Selected: {entry.agent.name}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono break-all">
                        ID: {entry.agent.id}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Tier: <TierBadge tier={entry.agent.trustTier} />
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Replays: {entry.replayCount} &nbsp;|&nbsp;
                        Avg: {entry.avgScore < 0 ? 'N/A' : `${entry.avgScore.toFixed(0)}%`}
                      </div>
                    </div>
                  );
                })()}
                {agents.length > 0 && (
                  <button
                    onClick={fetchAgents}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-400 transition-colors"
                  >
                    <RefreshCw size={10} /> Refresh
                  </button>
                )}
              </div>
            )}

            {/* ── Nitro pane ── */}
            {rightTab === 'nitro' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={13} className="text-blue-400" />
                  <span className="text-xs font-bold text-blue-400">Nitro Mode</span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Measured signing, escrow, and secret-bound workflows.<br />
                  <span className="text-zinc-600">Select an agent in the Registry tab first.</span>
                </p>
                {selectedId && (
                  <div className="text-[10px] text-zinc-500 font-mono bg-zinc-900 px-2 py-1 rounded">
                    Agent: {selectedId.slice(0, 16)}…
                  </div>
                )}
                <div className="space-y-2">
                  <button onClick={handleNitroEnroll}
                    className="w-full py-2 bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 rounded text-[11px] text-blue-400 font-bold transition-colors">
                    Enroll Enclave
                  </button>
                  <div>
                    <div className="text-[9px] text-zinc-600 mb-1">Payload to sign</div>
                    <textarea value={nitroPayload} onChange={e => setNitroPayload(e.target.value)}
                      className="w-full h-16 bg-zinc-900 border border-zinc-800 text-blue-300 text-[10px] font-mono p-2 rounded outline-none resize-none focus:border-blue-500" />
                  </div>
                  <button onClick={handleNitroSign}
                    className="w-full py-2 bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 rounded text-[11px] text-blue-400 font-bold transition-colors">
                    Sign Payload
                  </button>
                  <div>
                    <div className="text-[9px] text-zinc-600 mb-1">Signature</div>
                    <input value={nitroSignature} onChange={e => setNitroSignature(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-blue-300 text-[10px] font-mono px-2 py-1.5 rounded outline-none focus:border-blue-500" />
                  </div>
                  <button onClick={handleNitroVerify}
                    className="w-full py-2 bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 rounded text-[11px] text-blue-400 font-bold transition-colors">
                    Verify Signature
                  </button>
                </div>
                {nitroResult && (
                  <pre className="text-[9px] text-blue-300/80 font-mono bg-zinc-900 border border-zinc-800 p-3 rounded overflow-x-auto max-h-48 overflow-y-auto">
                    {JSON.stringify(nitroResult, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {/* ── RISC Zero pane ── */}
            {rightTab === 'riscZero' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Cpu size={13} className="text-violet-400" />
                  <span className="text-xs font-bold text-violet-400">RISC Zero Mode</span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Narrow, high-value tasks only. Receipt verification is worth the proving cost for:
                  policy checks, parsers, scoring engines, and bounded subroutines.
                </p>
                {selectedId && (
                  <div className="text-[10px] text-zinc-500 font-mono bg-zinc-900 px-2 py-1 rounded">
                    Agent: {selectedId.slice(0, 16)}…
                  </div>
                )}
                <div className="space-y-2">
                  <div>
                    <div className="text-[9px] text-zinc-600 mb-1">Task Kind</div>
                    <select value={rzTaskKind} onChange={e => setRzTaskKind(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-violet-300 text-[10px] font-mono px-2 py-1.5 rounded outline-none focus:border-violet-500">
                      <option>POLICY_CHECK</option>
                      <option>PARSER</option>
                      <option>SCORING</option>
                      <option>BOUNDED_SUBROUTINE</option>
                    </select>
                  </div>
                  <div>
                    <div className="text-[9px] text-zinc-600 mb-1">Input (JSON)</div>
                    <textarea value={rzInput} onChange={e => setRzInput(e.target.value)}
                      className="w-full h-16 bg-zinc-900 border border-zinc-800 text-violet-300 text-[10px] font-mono p-2 rounded outline-none resize-none focus:border-violet-500" />
                  </div>
                  <button onClick={handleRzProve}
                    className="w-full py-2 bg-violet-600/20 border border-violet-500/30 hover:bg-violet-600/30 rounded text-[11px] text-violet-400 font-bold transition-colors">
                    Prove Task
                  </button>
                </div>

                {/* Eligibility note */}
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2">
                    When to use RISC Zero
                  </div>
                  {[
                    ['✓', 'Policy check over bounded rule set'],
                    ['✓', 'Deterministic parser / validator'],
                    ['✓', 'Short scoring / ranking function'],
                    ['✗', 'General-purpose agents → use REPLAY'],
                    ['✗', 'Large inputs → use NITRO'],
                  ].map(([icon, label], i) => (
                    <div key={i} className={`text-[10px] ${icon === '✓' ? 'text-violet-400' : 'text-zinc-600'} flex gap-1.5`}>
                      <span>{icon}</span><span>{label}</span>
                    </div>
                  ))}
                </div>

                {rzResult && (
                  <pre className="text-[9px] text-violet-300/80 font-mono bg-zinc-900 border border-zinc-800 p-3 rounded overflow-x-auto max-h-48 overflow-y-auto">
                    {JSON.stringify(rzResult, null, 2)}
                  </pre>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900 border-t border-zinc-800 text-[10px] text-zinc-600 font-mono shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            REPLAY active
          </span>
          <span>|</span>
          <span>{agents.length} agents in registry</span>
          <span>|</span>
          <span>vm.Script sandbox + Acorn AST</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{mcData.length > 0 ? `${mcData.length} Monte Carlo pts` : 'No data'}</span>
          <span>CureForge v4.0</span>
        </div>
      </div>
    </div>
  );
}
