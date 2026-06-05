import React, { useState } from 'react';
import { Play, Download, Upload, CheckCircle, FileCode, Check, Activity, Library, Layers, Sparkles, Microscope, Beaker, ShieldCheck, Database, FileSignature, Dna, Hexagon } from 'lucide-react';
import { Visualizer } from './Visualizer';

const DEFAULT_FUZZ_CODE = `// fast-check property QC: Validating assay readout stability
result = fc.check(
  fc.property(fc.float(-10, 10), fc.float(-10, 10), (x, y) => {
    const out = targetFunction(x, y);
    return typeof out === 'number' && !isNaN(out) && isFinite(out);
  }),
  { seed: 1423, numRuns: 200 }
);`;

const DEFAULT_MONTE_CARLO_CODE = `// Simulated High-Throughput Binding Assay
const rng = seedrandom('deterministic-seed-1423');
const points = [];
for (let i = 0; i < 2000; i++) {
  // x = Compound concentration (log)
  const x = rng() * 20 - 10;
  // y = Target structural conformation metric
  const y = rng() * 20 - 10;
  try {
    // z = Binding affinity (delta G)
    const z = targetFunction(x, y);
    points.push({ x, y, z });
  } catch (err) {
    points.push({ x, y, z: null, error: err.message });
  }
}
result = points;`;

const TARGETS = [
  { id: 'ENSG00000130203', symbol: 'APOE', area: 'Neurodegeneration', disease: "Alzheimer's", score: 0.96, safety: 'Medium', tractability: 'Low', infoGain: 0.95 },
  { id: 'ENSG00000157764', symbol: 'BRAF', area: 'Oncology', disease: 'Melanoma', score: 0.95, safety: 'Low', tractability: 'High', infoGain: 0.8 },
  { id: 'ENSG00000146648', symbol: 'EGFR', area: 'Oncology', disease: 'Lung Cancer', score: 0.92, safety: 'Medium', tractability: 'High', infoGain: 0.75 },
  { id: 'ENSG00000232810', symbol: 'TNF', area: 'Immunology', disease: 'Rheumatoid Arthritis', score: 0.89, safety: 'Low', tractability: 'High', infoGain: 0.6 },
  { id: 'ENSG00000204498', symbol: 'LRRK2', area: 'Neurodegeneration', disease: "Parkinson's", score: 0.82, safety: 'Medium', tractability: 'Medium', infoGain: 0.9 },
];

export default function App() {
  const [activeNav, setActiveNav] = useState('discovery');
  const [selectedTarget, setSelectedTarget] = useState(TARGETS[0]);

  const [intent, setIntent] = useState('High-throughput binding affinity assay simulation');
  
  const [code, setCode] = useState(
    '// Synthesized Assay Protocol\nfunction targetFunction(x, y) {\n  return Math.sin(x) * Math.cos(y) + (x * 0.1);\n}\n'
  );
  
  const [logs, setLogs] = useState<string[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [mcData, setMcData] = useState<any[]>([]);
  const [runMonteCarlo, setRunMonteCarlo] = useState(true);
  const [runFuzzing, setRunFuzzing] = useState(true);
  const [fuzzCode, setFuzzCode] = useState(DEFAULT_FUZZ_CODE);
  const [monteCarloCode, setMonteCarloCode] = useState(DEFAULT_MONTE_CARLO_CODE);

  const [auditRecords, setAuditRecords] = useState<any[]>([]);

  const computeHash = async (text: string) => {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSynthesize = async () => {
    try {
      setLogs(prev => [...prev, `[Agent] Designing assay protocol for ${selectedTarget.symbol}...`]);
      const res = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent, knowledgeBase: `Target: ${selectedTarget.symbol}, Area: ${selectedTarget.area}`, attempt: currentAttempt })
      });
      const data = await res.json();
      if (data.success && data.code) {
        setCode(data.code);
        setLogs(prev => [...prev, '[Success] Autonomous Protocol Synthesis complete.']);
      } else {
        setLogs(prev => [...prev, '[Error] Synthesis failed: ' + (data.error || 'Unknown')]);
      }
    } catch (err) {
      setLogs(prev => [...prev, '[Error] Synthesis request failed.']);
    }
  };

  const handleRunVerification = async () => {
    setIsVerifying(true);
    setLogs(prev => [...prev, `[System] Submitting protocol to Automated Cloud Lab...`]);

    if (runFuzzing && !fuzzCode.trim()) {
      setLogs(prev => [...prev, '[Error] Fuzzing QC enabled but no code provided.']);
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
          spec: intent,
          knowledgeBase: selectedTarget.symbol,
          attempt: currentAttempt,
          runMonteCarlo,
          runFuzzing,
          fuzzCode: runFuzzing ? fuzzCode : null,
          monteCarloCode: runMonteCarlo ? monteCarloCode : null
        })
      });
      const data = await res.json();

      data.trace?.forEach((t: string) => {
        setLogs(prev => [...prev, `[Lab] \${t}`]);
      });

      if (data.success) {
        if (data.monteCarloData && data.monteCarloData.length > 0) {
          setMcData(data.monteCarloData);
        }
        
        const hashInput = code + intent + JSON.stringify(data.fuzzResult) + currentAttempt;
        const hash = await computeHash(hashInput);
        
        setAuditRecords(prev => [{
          id: hash.substring(0, 8),
          timestamp: new Date().toISOString(),
          target: selectedTarget.symbol,
          intent,
          hash,
          fuzzPts: data.fuzzResult?.numRuns || 0,
          mcPts: data.monteCarloData ? data.monteCarloData.length : 0,
          signature: 'Signed by System Agent (GxP Validated)'
        }, ...prev]);
        
        setLogs(prev => [...prev, `[Success] Execution complete. Data flywheel updated.`]);
        setActiveNav('visualize');
      } else {
        setLogs(prev => [...prev, `[Error] \${data.error}`]);
      }
    } catch (err) {
      setLogs(prev => [...prev, '[Error] Failed to reach cloud lab backend.']);
    } finally {
      setIsVerifying(false);
      setCurrentAttempt(prev => prev + 1);
    }
  };

  const renderDiscovery = () => (
    <div className="p-6 overflow-y-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Target Discovery Engine</h2>
        <p className="text-zinc-400">Mechanistic ranking integrating multi-omic evidence, safety risk, and tractability scores. Adapted from Open Targets methodologies.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Therapeutic Area</th>
              <th className="px-4 py-3 font-medium">Disease</th>
              <th className="px-4 py-3 font-medium">Evidence</th>
              <th className="px-4 py-3 font-medium">Safety Risk</th>
              <th className="px-4 py-3 font-medium">Tractability</th>
              <th className="px-4 py-3 font-medium">Info Gain (Ext.)</th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
            {TARGETS.map(t => (
              <tr key={t.id} className={`hover:bg-zinc-800/20 transition-colors \${selectedTarget.id === t.id ? 'bg-emerald-900/10' : ''}`}>
                <td className="px-4 py-3 font-medium text-emerald-400">
                  <div className="flex items-center gap-2">
                    <Dna size={14} className="text-emerald-500/50" />
                    {t.symbol}
                  </div>
                </td>
                <td className="px-4 py-3">{t.area}</td>
                <td className="px-4 py-3 text-zinc-400">{t.disease}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `\${t.score * 100}%` }} />
                    </div>
                    <span className="text-xs">{t.score.toFixed(2)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider \${
                    t.safety === 'Low' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                    t.safety === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>{t.safety}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider \${
                    t.tractability === 'High' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                    t.tractability === 'Medium' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 
                    'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                  }`}>{t.tractability}</span>
                </td>
                <td className="px-4 py-3 text-emerald-400">+{t.infoGain}</td>
                <td className="px-4 py-3 text-right">
                  <button 
                    onClick={() => { setSelectedTarget(t); setActiveNav('lab'); }}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded transition-colors border border-zinc-700 hover:border-zinc-600"
                  >
                    Select Assay
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLab = () => (
    <div className="flex h-full w-full">
      <div className="w-1/2 p-6 border-r border-zinc-800 flex flex-col overflow-y-auto">
        <h2 className="text-xl font-bold mb-1 tracking-tight flex items-center gap-2">
          <Beaker size={20} className="text-emerald-500"/>
          Automated Cloud Lab
        </h2>
        <p className="text-sm text-zinc-400 mb-6">Autonomous protocol design and wet-lab execution via remote instrumentation.</p>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4">
          <div className="text-xs font-bold tracking-widest text-zinc-500 uppercase mb-3 text-emerald-500">Hypothesis Design</div>
          <div className="flex items-center gap-3 mb-4 p-3 bg-zinc-950 rounded border border-zinc-800/50 text-sm">
            <Dna size={16} className="text-blue-500" />
            <span className="text-zinc-300">Targeting:</span>
            <span className="text-blue-400 font-bold">{selectedTarget.symbol}</span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400">{selectedTarget.disease}</span>
          </div>

          <label className="block text-xs font-medium text-zinc-400 mb-2">Assay Intent</label>
          <input 
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            className="w-full bg-zinc-950 text-emerald-300 p-3 rounded border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 mb-3 text-sm transition-all outline-none box-border"
          />
          <button 
            onClick={handleSynthesize}
            className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles size={14} /> Synthesize Agent Protocol
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex-1 flex flex-col min-h-0">
          <div className="text-xs font-bold tracking-widest text-zinc-500 uppercase mb-3 flex items-center gap-2">
            <FileCode size={14} /> Generated Robotic Protocol (JS)
          </div>
          <textarea
            className="w-full h-48 bg-zinc-950 text-blue-300 p-4 font-mono text-[11px] leading-relaxed border border-zinc-800 rounded outline-none focus:border-blue-500 resize-none scrollbar-thin box-border mb-3"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
          />
          <div className="flex gap-2 mt-auto shrink-0">
             <button 
                onClick={handleRunVerification}
                disabled={isVerifying}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 text-white shadow-lg shadow-blue-500/20"
             >
                <Play size={14} /> {isVerifying ? 'Running Lab Instructions...' : 'Submit to Cloud Lab'}
             </button>
          </div>
        </div>
      </div>
      
      <div className="w-1/2 flex flex-col bg-black">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Live Lab Telemetry</span>
            <div className="flex items-center gap-2">
               <span className="relative flex h-2 w-2 items-center justify-center">
                 {isVerifying ? (
                   <>
                     <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                     <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                   </>
                 ) : (
                   <span className="relative inline-flex h-2 w-2 rounded-full bg-zinc-600"></span>
                 )}
               </span>
               <span className="text-xs text-emerald-500/80 font-mono">Instrumentation Link</span>
            </div>
        </div>
        <div className="flex-1 p-6 overflow-y-auto font-mono text-xs space-y-2 scrollbar-thin">
           {logs.length === 0 && <div className="text-zinc-600 flex flex-col items-center justify-center h-full space-y-3 opacity-50">
             <Activity size={32} />
             <span>Awaiting protocol submission...</span>
           </div>}
           {logs.map((l, i) => (
             <div key={i} className={l.includes('[Error]') ? 'text-rose-400' : l.includes('[Success]') ? 'text-emerald-400' : l.includes('[Agent]') ? 'text-purple-400' : 'text-zinc-300'}>
               {l}
             </div>
           ))}
        </div>
      </div>
    </div>
  );

  const renderInformatics = () => (
    <div className="p-6 overflow-y-auto w-full h-full bg-zinc-950">
      <div className="mb-8 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold flex items-center gap-3 text-white mb-2 tracking-tight">
           <ShieldCheck size={24} className="text-blue-500"/>
           Informatics & Auditing
        </h2>
        <p className="text-zinc-400">Regulated data backbone maintaining GxP/21 CFR Part 11 compliant execution trails. Captures structured lab data, metadata, and cryptographic signatures for asset translation.</p>
      </div>

      <div className="max-w-5xl mx-auto">
         {auditRecords.length === 0 ? (
            <div className="py-24 text-center border border-dashed border-zinc-800 rounded-lg text-zinc-500 bg-zinc-900/30">
               <Database size={48} className="mx-auto mb-4 opacity-50 text-blue-500/50" />
               <p className="text-base text-zinc-400 font-medium">No validated experiments recorded in this session.</p>
               <p className="text-sm mt-2 max-w-md mx-auto leading-relaxed">Run protocols in the Cloud Lab to append cryptographic records to the immutable ledger.</p>
            </div>
         ) : (
            <div className="space-y-4">
              {auditRecords.map((r, i) => (
                 <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 shadow-lg shadow-black/20">
                    <div className="flex items-start justify-between mb-4 border-b border-zinc-800/80 pb-4">
                       <div>
                          <div className="flex items-center gap-2 mb-1.5">
                             <CheckCircle size={16} className="text-emerald-500" />
                             <span className="font-medium text-zinc-200">{r.intent}</span>
                          </div>
                          <div className="text-xs text-zinc-400 flex items-center gap-3 bg-zinc-950/50 inline-flex px-2 py-1 rounded">
                             <span className="flex items-center gap-1.5 font-medium text-emerald-400/80"><Dna size={12}/> {r.target}</span>
                             <span className="text-zinc-700">|</span>
                             <span>{new Date(r.timestamp).toLocaleString()}</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5 font-bold">Experiment ID</div>
                          <div className="font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded text-xs border border-blue-500/20">{r.id}</div>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                       <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Assay Data Metrics</div>
                          <div className="text-xs text-zinc-300 mb-1.5 flex items-center justify-between">
                            <span>Fast-Check Auto-Fuzz:</span>
                            <span className="font-mono text-emerald-400 bg-zinc-950 px-1.5 rounded">{r.fuzzPts} pts</span>
                          </div>
                          <div className="text-xs text-zinc-300 flex items-center justify-between">
                            <span>Monte Carlo Telemetry:</span>
                            <span className="font-mono text-emerald-400 bg-zinc-950 px-1.5 rounded">{r.mcPts} pts</span>
                          </div>
                       </div>
                       <div className="col-span-2">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Compliance Signature</div>
                          <div className="flex items-center gap-2 text-zinc-300 text-xs font-mono break-all bg-zinc-950 p-2.5 rounded border border-zinc-800/80">
                             <FileSignature size={14} className="shrink-0 text-zinc-500" />
                             <span className="text-emerald-500">{r.hash.substring(0, 16)}</span>{r.hash.substring(16)}
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-2 tracking-wide uppercase flex items-center gap-1.5">
                            <ShieldCheck size={12} className="text-emerald-500/70" />
                            {r.signature}
                          </div>
                       </div>
                    </div>
                 </div>
              ))}
            </div>
         )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white font-sans overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-[#09090b] border-b border-zinc-800 shrink-0 z-20">
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <Hexagon size={18} className="text-black" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-base font-bold leading-none tracking-tight text-white mb-1">CureForge</h1>
            <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest leading-none">Closed-Loop Discovery System</div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-zinc-400 font-mono">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            SciNet Connected
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden z-10 w-full">
        {/* Left Core Navigation */}
        <div className="w-64 bg-[#111113] border-r border-zinc-800 flex flex-col shrink-0">
           <div className="p-4 space-y-1">
              <button 
                onClick={() => setActiveNav('discovery')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded text-sm transition-colors \${activeNav === 'discovery' ? 'bg-zinc-800/80 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'}`}
              >
                 <Microscope size={18} className={activeNav === 'discovery' ? 'text-blue-400' : ''} />
                 Target Engine
              </button>
              <button 
                onClick={() => setActiveNav('lab')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded text-sm transition-colors \${activeNav === 'lab' ? 'bg-zinc-800/80 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'}`}
              >
                 <Beaker size={18} className={activeNav === 'lab' ? 'text-emerald-400' : ''} />
                 Automated Cloud Lab
              </button>
              <button 
                onClick={() => setActiveNav('visualize')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded text-sm transition-colors \${activeNav === 'visualize' ? 'bg-zinc-800/80 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'}`}
              >
                 <Layers size={18} className={activeNav === 'visualize' ? 'text-purple-400' : ''} />
                 Data Flywheel
              </button>
              <button 
                onClick={() => setActiveNav('informatics')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded text-sm transition-colors \${activeNav === 'informatics' ? 'bg-zinc-800/80 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'}`}
              >
                 <ShieldCheck size={18} className={activeNav === 'informatics' ? 'text-emerald-500' : ''} />
                 Informatics & Audit
              </button>
           </div>
           
           <div className="mt-auto p-5 border-t border-zinc-800/80 bg-black/20">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3 font-bold flex items-center gap-2">
                 <Activity size={12} className="text-zinc-500" />
                 Active Protocol Context
              </div>
              <div className="bg-[#09090b] border border-zinc-800 rounded-lg p-3 text-xs shadow-inner">
                 <div className="text-blue-400 flex items-center gap-1.5 mb-1.5 font-medium"><Dna size={12}/> {selectedTarget.symbol}</div>
                 <div className="text-zinc-400 line-clamp-2 leading-relaxed">{intent}</div>
              </div>
           </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative bg-[#09090b] w-full min-w-0">
           {activeNav === 'discovery' && renderDiscovery()}
           {activeNav === 'lab' && renderLab()}
           {activeNav === 'informatics' && renderInformatics()}
           {activeNav === 'visualize' && (
              <div className="w-full h-full relative p-2">
                 <div className="absolute top-6 left-6 z-10 pointer-events-none">
                    <h2 className="text-xl font-bold flex items-center gap-2.5 drop-shadow-md text-white mb-1">
                       <Layers size={22} className="text-blue-400"/>
                       Data Flywheel Metrics
                    </h2>
                    <p className="text-sm text-zinc-300 drop-shadow-md">Visualizing Monte Carlo point cloud telemetry from automated assay</p>
                 </div>
                 <Visualizer data={mcData} />
              </div>
           )}
        </div>
      </div>
    </div>
  );
}