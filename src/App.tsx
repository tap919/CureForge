import React, { useState } from 'react';
import { Play, Download, Upload, CheckCircle, FileCode, Check, Activity, Library, Layers, Sparkles } from 'lucide-react';
import { Visualizer } from './Visualizer';

// Default fuzz code – tests that targetFunction returns a number
const DEFAULT_FUZZ_CODE = `
// fast-check property test
result = fc.check(
  fc.property(fc.float(-10, 10), fc.float(-10, 10), (x, y) => {
    const out = targetFunction(x, y);
    return typeof out === 'number' && !isNaN(out) && isFinite(out);
  }),
  { seed: 1423, numRuns: 200 }
);
`;

// Default Monte Carlo code – generates 2000 points for visualization
const DEFAULT_MONTE_CARLO_CODE = `
const rng = seedrandom('deterministic-seed-1423');
const points = [];
for (let i = 0; i < 2000; i++) {
  const x = rng() * 20 - 10;
  const y = rng() * 20 - 10;
  try {
    const z = targetFunction(x, y);
    points.push({ x, y, z });
  } catch (err) {
    points.push({ x, y, z: null, error: err.message });
  }
}
result = points;
`;

export default function App() {
  const [centerTab, setCenterTab] = useState('visualize');
  const [spec, setSpec] = useState(JSON.stringify({
    task: "2D sinusoidal surface",
    rules: ["x, y in [-10, 10]"],
    properties: ["Output is a finite number"]
  }, null, 2));
  const [code, setCode] = useState(
    '// Function will be synthesized. Default visualization target:\nfunction targetFunction(x, y) {\n  return Math.sin(x) * Math.cos(y) + (x * 0.1);\n}\n'
  );
  const [logs, setLogs] = useState<string[]>([]);
  const [acceptanceHash, setAcceptanceHash] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState('Mathematical surface');
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [mcData, setMcData] = useState<any[]>([]);

  // Experiment configuration
  const [runMonteCarlo, setRunMonteCarlo] = useState(true);
  const [runFuzzing, setRunFuzzing] = useState(true);
  const [fuzzCode, setFuzzCode] = useState(DEFAULT_FUZZ_CODE);
  const [monteCarloCode, setMonteCarloCode] = useState(DEFAULT_MONTE_CARLO_CODE);

  const computeHash = async (text: string) => {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleManualCodeEdit = (newCode: string) => {
    setCode(newCode);
    setAcceptanceHash(''); // Invalidate hash when code changes
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setLogs(prev => [...prev, `[Error] Unsupported file type: ${file.name}. Only .json files are accepted.`]);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        setSpec(JSON.stringify(json, null, 2));
        setLogs(prev => [...prev, `[Success] Loaded spec from ${file.name}`]);
      } catch (err) {
        setLogs(prev => [...prev, `[Error] Failed to parse JSON from ${file.name}. Ensure it is valid JSON.`]);
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const blob = new Blob([code], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deterministic_agent.js';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSynthesize = async () => {
    try {
      // Use intent from spec and knowledgeBase
      let intent = 'Generate a function based on the spec';
      try {
        const parsed = JSON.parse(spec);
        intent = parsed.task || intent;
      } catch {}
      setLogs(prev => [...prev, 'Synthesizing code from intent...']);
      const res = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent, knowledgeBase, attempt: currentAttempt })
      });
      const data = await res.json();
      if (data.success && data.code) {
        setCode(data.code);
        setLogs(prev => [...prev, '[Success] Synthesis complete. Code updated.']);
      } else {
        setLogs(prev => [...prev, '[Error] Synthesis failed: ' + (data.error || 'Unknown error')]);
      }
    } catch (err) {
      setLogs(prev => [...prev, '[Error] Synthesis request failed.']);
    }
  };

  const handleRunVerification = async () => {
    setIsVerifying(true);
    setLogs(prev => [...prev, 'Running formal checks & property fuzzing...']);

    // Validate that experiment code is present if respective flags are on
    if (runFuzzing && !fuzzCode.trim()) {
      setLogs(prev => [...prev, '[Error] Fuzzing enabled but no fuzz code provided.']);
      setIsVerifying(false);
      return;
    }
    if (runMonteCarlo && !monteCarloCode.trim()) {
      setLogs(prev => [...prev, '[Error] Monte Carlo enabled but no simulation code provided.']);
      setIsVerifying(false);
      return;
    }

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          spec,
          knowledgeBase,
          attempt: currentAttempt,
          runMonteCarlo,
          runFuzzing,
          fuzzCode: runFuzzing ? fuzzCode : null,
          monteCarloCode: runMonteCarlo ? monteCarloCode : null
        })
      });
      const data = await res.json();

      data.trace?.forEach((t: string) => {
        setLogs(prev => [...prev, t]);
      });

      if (data.success) {
        if (data.monteCarloData && data.monteCarloData.length > 0) {
          setMcData(data.monteCarloData);
        }
        const hashInput = code + spec + JSON.stringify(data.fuzzResult);
        const hash = await computeHash(hashInput);
        setAcceptanceHash(hash);
        setCenterTab('visualize');
      } else {
        setLogs(prev => [...prev, `[Error] ${data.error}`]);
      }
    } catch (err) {
      setLogs(prev => [...prev, 'Failed to reach verification backend.']);
    } finally {
      setIsVerifying(false);
      setCurrentAttempt(prev => prev + 1);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white font-sans overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Activity size={18} className="text-emerald-500" />
          Deterministic Verification Laboratory
        </h1>
        <div className="flex items-center gap-3">
          <input type="file" accept=".json" onChange={handleUpload} className="hidden" id="file-upload" />
          <label htmlFor="file-upload" className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-sm font-medium rounded cursor-pointer transition-colors">
            <Upload size={14} /> Upload Spec
          </label>
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-sm font-medium rounded transition-colors">
            <Download size={14} /> Export JS
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col p-4 shrink-0">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
            <Library size={12} /> Function Library
          </h2>
          <div className="space-y-2 mb-4">
            <div className="p-3 bg-zinc-800/50 rounded border border-zinc-800 text-sm cursor-pointer hover:bg-zinc-800 transition-colors">
              <div className="font-medium text-emerald-400 mb-1">targetFunction(x, y)</div>
              <div className="text-xs text-zinc-500">Currently defined in sandbox</div>
            </div>
            <button
              onClick={handleSynthesize}
              className="w-full p-3 bg-emerald-600/10 border border-emerald-500/30 rounded text-sm text-emerald-400 hover:bg-emerald-600/20 transition-colors flex items-center gap-2"
            >
              <Sparkles size={14} /> Synthesize from Intent
            </button>
          </div>

          <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
            <Layers size={12} /> Experiment Pipeline
          </h2>
          <div className="space-y-3 mb-4">
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={runFuzzing}
                onChange={e => setRunFuzzing(e.target.checked)}
                className="accent-emerald-500"
              />
              Property-based Fuzzing (fast-check)
            </label>
            {runFuzzing && (
              <textarea
                className="w-full h-24 bg-zinc-800 text-green-300 text-xs font-mono p-2 rounded border border-zinc-700 resize-none focus:border-emerald-500 scrollbar-thin"
                value={fuzzCode}
                onChange={(e) => setFuzzCode(e.target.value)}
                placeholder="Fuzz test code (sets result)..."
              />
            )}
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={runMonteCarlo}
                onChange={e => setRunMonteCarlo(e.target.checked)}
                className="accent-emerald-500"
              />
              Run Monte Carlo Synthesis
            </label>
            {runMonteCarlo && (
              <textarea
                className="w-full h-24 bg-zinc-800 text-green-300 text-xs font-mono p-2 rounded border border-zinc-700 resize-none focus:border-emerald-500 scrollbar-thin"
                value={monteCarloCode}
                onChange={(e) => setMonteCarloCode(e.target.value)}
                placeholder="Monte Carlo simulation code (sets result)..."
              />
            )}
          </div>

          <button
            onClick={handleRunVerification}
            disabled={isVerifying}
            className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 rounded text-sm font-medium transition-colors mt-auto"
          >
            <Play size={14} /> {isVerifying ? 'Running Lab...' : 'Run Experiment'}
          </button>
        </div>

        {/* Center Tabs */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-zinc-800 bg-zinc-950">
          <div className="flex bg-zinc-900 shrink-0">
            {['visualize', 'raw spec', 'code'].map(t => (
              <button
                key={t}
                className={`px-6 py-2.5 capitalize text-sm font-medium border-b-2 transition-colors ${
                  centerTab === t ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
                onClick={() => setCenterTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden relative">
            {centerTab === 'visualize' && (
              <Visualizer data={mcData} />
            )}
            {centerTab === 'raw spec' && (
              <div className="h-full w-full p-4">
                <textarea
                  className="w-full h-full bg-zinc-900 text-blue-300 p-4 font-mono text-sm border border-zinc-800 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none transition-all scrollbar-thin"
                  value={spec}
                  onChange={(e) => setSpec(e.target.value)}
                  placeholder="Enter JSON spec here..."
                />
              </div>
            )}
            {centerTab === 'code' && (
              <div className="h-full w-full p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-2 text-xs text-zinc-500">
                  <FileCode size={14} /> Sandbox Code Editor (Execute via Run Experiment)
                </div>
                <textarea
                  className="w-full flex-1 bg-zinc-900 text-emerald-300 p-4 font-mono text-sm border border-zinc-800 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none transition-all scrollbar-thin"
                  value={code}
                  onChange={(e) => handleManualCodeEdit(e.target.value)}
                  spellCheck={false}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Pane */}
        <div className="w-80 flex flex-col bg-zinc-950 shrink-0">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900 shrink-0">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Experiment Acceptance</h2>
            {acceptanceHash ? (
              <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <div className="text-[10px] uppercase font-bold text-emerald-500/80 mb-1">Fingerprint Hash</div>
                <div className="text-xs font-mono text-emerald-400 break-all select-all">{acceptanceHash}</div>
                <div className="text-[10px] text-emerald-500/60 mt-1 flex justify-between">
                  <span>Verified with Acorn & Fuzzing</span>
                  <span>{mcData.length} pts</span>
                </div>
              </div>
            ) : (
              <div className="mt-3 p-3 bg-zinc-800/50 border border-zinc-800 rounded-lg">
                <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Status</div>
                <div className="text-xs text-zinc-400">Experiment not run</div>
              </div>
            )}
          </div>
          <div className="flex-1 p-4 overflow-y-auto bg-black font-mono text-xs space-y-2 scrollbar-thin">
            <div className="text-zinc-500 flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
              <span>Pipeline Trace Logs</span>
              <span>Run #{currentAttempt}</span>
            </div>
            {logs.length === 0 && <div className="text-zinc-600">Awaiting execution...</div>}
            {logs.map((l, i) => (
              <div
                key={i}
                className={
                  l.includes('[Error]') || l.includes('failed')
                    ? 'text-rose-400'
                    : l.includes('[Success]') || l.includes('passed')
                    ? 'text-emerald-400'
                    : 'text-zinc-300'
                }
              >
                &gt; {l}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900 border-t border-zinc-800 text-[11px] text-zinc-400 font-mono shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> WebGPU Active
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">Node vm sandbox + fast-check fuzzing</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{mcData.length > 0 ? `${mcData.length} pts computed` : 'Ready'}</span>
          <span>Deterministic Pipeline v3.0</span>
        </div>
      </div>
    </div>
  );
}
