import React, { useState, useEffect } from 'react';
import { Play, Download, Upload, CheckCircle, FileCode, Check, Activity, Library, Layers, Sparkles, Microscope, Beaker, ShieldCheck, Database, FileSignature, Dna, Hexagon, AlertTriangle, Scale, LineChart, Cpu, Bot, Brain, MoonStar, Zap, FileText, Target } from 'lucide-react';
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

const DEFAULT_TARGET = { id: 'ENSG00000130203', symbol: 'APOE', area: 'Neurodegeneration', disease: "Alzheimer's", score: 0.96, safety: 'Medium', tractability: 'Low', infoGain: 0.95 };

export default function App() {
  const [targets, setTargets] = useState<any[]>([DEFAULT_TARGET]);
  const [activeNav, setActiveNav] = useState('discovery');
  const [selectedTarget, setSelectedTarget] = useState(DEFAULT_TARGET);

  useEffect(() => {
    fetch('/api/targets')
      .then(r => r.json())
      .then(data => {
        if (data.targets && data.targets.length > 0) {
          setTargets(data.targets);
          setSelectedTarget(data.targets[0]);
        }
      })
      .catch(err => console.error("Failed to load targets", err));
  }, []);

  const [intent, setIntent] = useState('High-throughput binding affinity assay simulation');
  
  const [hypothesis, setHypothesis] = useState<any>(null);
  
  const [logs, setLogs] = useState<string[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [mcData, setMcData] = useState<any[]>([]);
  const [runMonteCarlo, setRunMonteCarlo] = useState(true);
  const [runFuzzing, setRunFuzzing] = useState(true);
  const [fuzzCode, setFuzzCode] = useState(DEFAULT_FUZZ_CODE);
  const [monteCarloCode, setMonteCarloCode] = useState(DEFAULT_MONTE_CARLO_CODE);

  const [auditRecords, setAuditRecords] = useState<any[]>([]);
  const [credibilityTimeline, setCredibilityTimeline] = useState<any[]>([]);

  const [daemonLogs, setDaemonLogs] = useState<any[]>([
    { id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString(), type: 'system', message: 'Kairos Daemon initialized. 15s tick loop active.' }
  ]);
  const [isDreaming, setIsDreaming] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newFile = {
        name: file.name,
        type: file.type || file.name.split('.').pop(),
        size: (file.size / 1024).toFixed(1) + ' KB',
        timestamp: new Date().toISOString(),
        status: 'Processing...'
      };
      
      setUploadedFiles(prev => [newFile, ...prev]);
      
      setTimeout(() => {
        setUploadedFiles(prev => prev.map(f => f.name === newFile.name ? { ...f, status: 'Ingested & Vectorized' } : f));
        setDaemonLogs(prev => [{ id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString(), type: 'system', message: `[Ingestion] Processed file: ${newFile.name}. Knowledge graph updated.` }, ...prev]);
        
        // Boost a target score if it's an upload
        setTargets(prev => {
          const newTargets = [...prev];
          if (newTargets.length > 0) {
            newTargets[0] = { ...newTargets[0], score: Math.min(1.0, newTargets[0].score + 0.02) };
          }
          return newTargets;
        });
      }, 3000);
    }
  };

  // Kairos Daemon Mock Loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDreaming) return;
      const actions = [
        "Checking: any pending PubMed papers on active disease targets? -> None found.",
        "Checking: any hypotheses with no assigned experiments? -> All active hypotheses queued.",
        "Checking: any completed cloud lab results? -> Monitoring webhook.",
        "Checking: any model confidence dropped below threshold? -> Posteriors stable."
      ];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      setDaemonLogs(prev => {
        const newLogs = [{ id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString(), type: 'tick', message: `[Tick] ${randomAction}` }, ...prev];
        return newLogs.slice(0, 50); // Keep last 50
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [isDreaming]);

  const triggerDreamCycle = () => {
    setIsDreaming(true);
    setDaemonLogs(prev => [{ timestamp: new Date().toISOString(), id: Math.random().toString(36).substr(2, 9), type: 'dream', message: '[AutoDream] Nightly consolidation cycle initiated...' }, ...prev]);
    
    // Simulate NREM
    setTimeout(() => {
      setDaemonLogs(prev => [{ timestamp: new Date().toISOString(), id: Math.random().toString(36).substr(2, 9), type: 'dream_nrem', message: '[AutoDream: NREM phase] Consolidating day\'s empirical data into BioLM weights. Posteriors updated.' }, ...prev]);
    }, 3000);

    // Simulate REM
    setTimeout(() => {
      setDaemonLogs(prev => [{ timestamp: new Date().toISOString(), id: Math.random().toString(36).substr(2, 9), type: 'dream_rem', message: '[AutoDream: REM phase] nanoGPT generating novel counterfactual hypotheses via synthetic rollouts...' }, ...prev]);
    }, 6000);

    // Wake up
    setTimeout(() => {
      setDaemonLogs(prev => [{ timestamp: new Date().toISOString(), id: Math.random().toString(36).substr(2, 9), type: 'dream_wake', message: '[AutoDream: Wake] Consolidation complete. Knowledge graph optimized. 3 new hypotheses staged.' }, ...prev]);
      setIsDreaming(false);
    }, 9000);
  };

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
      if (data.success && data.hypothesis) {
        setHypothesis(data.hypothesis);
        setLogs(prev => [...prev, '[Success] Autonomous Hypothesis Synethsis complete.', `[Skeptic AI] Peer review completed with falsifiability score: ${data.hypothesis.critic_score}`]);
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

    const codeToRun = `function targetFunction(x, y) { return Math.sin(x) * Math.cos(y) + (x * 0.1); }`;

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
          code: codeToRun,
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
        
        const hashInput = (hypothesis?.target || '') + intent + JSON.stringify(data.fuzzResult) + currentAttempt;
        const hash = await computeHash(hashInput);
        
        // SYSTEM 5: Results Ingestor
        // Simulate pass/fail based on a random outcome
        const isSuccess = Math.random() > 0.3; // 70% chance of pass for demo
        const resultValue = Math.random() * 10 + 1; // 1 to 11
        
        const ingestionRecord = {
          id: hash.substring(0, 8),
          hypothesis_id: hash.substring(0, 8),
          assay_type: "HTS Binding Assay",
          cell_line: "HEK293T",
          result_value: resultValue.toFixed(2),
          units: "Kd (nM)",
          pass_fail: isSuccess ? "PASS" : "FAIL",
          raw_data_digest: hash,
          timestamp: new Date().toISOString(),
          lab_id: "ECL-77A",
          target: selectedTarget.symbol,
          intent,
          fuzzPts: data.fuzzResult?.numRuns || 0,
          mcPts: data.monteCarloData ? data.monteCarloData.length : 0,
          signature: 'Signed by Acorn AST & Deterministic VM'
        };

        // SYSTEM 6: Bayesian Updater
        const prior = (hypothesis?.confidence || 50) / 100;
        const pD_H = isSuccess ? 0.85 : 0.15; // Prob data given hypothesis true
        const pD_notH = isSuccess ? 0.20 : 0.80; // Prob data given hypothesis false
        const pD = (pD_H * prior) + (pD_notH * (1 - prior));
        const posterior = (pD_H * prior) / pD;
        const newConfidence = Math.round(posterior * 100);

        const scoreDelta = isSuccess ? 0.05 : -0.05;
        const newScore = Math.min(1, Math.max(0, selectedTarget.score + scoreDelta));

        setTargets(prev => prev.map(t => 
          t.id === selectedTarget.id ? { ...t, score: newScore } : t
        ).sort((a, b) => b.score - a.score));

        setCredibilityTimeline(prev => [{
            id: hash.substring(0, 12),
            target: selectedTarget.symbol,
            disease: selectedTarget.disease,
            prior: hypothesis?.confidence || 50,
            posterior: newConfidence,
            outcome: isSuccess ? 'Confirmed' : 'Falsified',
            timestamp: new Date().toISOString()
        }, ...prev]);

        setAuditRecords(prev => [ingestionRecord, ...prev]);
        
        setLogs(prev => [...prev, `[Ingestor] Structured results parsed. Outcome: \${isSuccess ? 'PASS' : 'FAIL'}`, `[Bayes] Updated \${selectedTarget.symbol} confidence: \${hypothesis?.confidence || 50}% -> \${newConfidence}%`]);
        setActiveNav('informatics');
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
        <h2 className="text-2xl font-bold flex items-center gap-2 text-white mb-2 tracking-tight">
          <Brain size={24} className="text-blue-500" /> BioLM Target Engine
        </h2>
        <p className="text-zinc-400">Domain-specific nanoGPT architectures running deterministic synthetic rollouts on PubMed/ChEMBL corpora. Small, fully inspectable, and optimized for high-EIG generation.</p>
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
            {targets.map(t => (
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
          <div className="text-xs font-bold tracking-widest text-zinc-500 uppercase mb-3 flex items-center gap-2">
             <Target size={14} className="text-emerald-500"/>
             BioLM Active Hypothesis
          </div>
          {hypothesis ? (
             <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded border border-zinc-800">
                <Brain size={18} className="text-blue-500 shrink-0" />
                <div className="text-sm min-w-0">
                   <div className="font-bold text-zinc-200 capitalize">{hypothesis.modality} Intervention</div>
                   <div className="text-xs text-zinc-400 truncate mt-0.5">{hypothesis.testable_prediction}</div>
                </div>
             </div>
          ) : (
             <div className="text-xs text-amber-500/80 bg-amber-500/10 p-3 rounded border border-amber-500/20 flex items-center gap-2">
                <AlertTriangle size={14} /> No active hypothesis synthesized. Please generate one in the Target Engine first.
             </div>
          )}
        </div>


        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4">
          <div className="text-xs font-bold tracking-widest text-zinc-500 uppercase mb-3 text-zinc-400">Virtual Assay Configuration</div>
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
            <Brain size={14} /> Generate via BioLM Engine
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex-1 flex flex-col min-h-0 overflow-y-auto">
          {hypothesis ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between uppercase mb-2">
                  <div className="text-xs font-bold tracking-widest text-zinc-500">Intervention Hypothesis</div>
                  <div className="text-[9px] font-bold tracking-widest text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 flex items-center gap-1">
                    <Brain size={10} /> BioLM Synthetic Rollout
                  </div>
                </div>
                <div className="text-sm text-zinc-200 leading-relaxed bg-zinc-950/50 p-3 rounded border border-zinc-800/50">
                  <span className="font-bold text-blue-400 mb-1 block">Modality: {hypothesis.modality}</span>
                  <span className="font-bold block mb-2">{hypothesis.proposed_intervention}</span>
                  {hypothesis.mechanism}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1.5">Testable Prediction</div>
                  <div className="text-xs text-zinc-400 bg-zinc-950 p-2.5 rounded border border-zinc-800/50 h-16 overflow-y-auto">
                    {hypothesis.testable_prediction}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1.5">Confidence / Evidience</div>
                  <div className="text-xs text-zinc-400 bg-zinc-950 p-2.5 rounded border border-zinc-800/50 h-16 overflow-y-auto flex flex-col justify-center items-center text-center">
                    <span className="text-emerald-400 font-bold mb-1">{hypothesis.confidence}% Score</span>
                    <span className="line-clamp-1">{hypothesis.literature_support}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-800/80">
                <div className="text-xs font-bold tracking-widest text-rose-500 uppercase mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} /> Skeptic.ai Peer Review (Score: {hypothesis.critic_score})
                </div>
                
                <div className="space-y-3">
                  <div>
                     <div className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Identified Flaws</div>
                     <ul className="list-disc pl-4 text-xs text-rose-400/80 space-y-1">
                       {hypothesis.flaws?.map((f: string, i: number) => <li key={i}>{f}</li>)}
                     </ul>
                  </div>
                  <div>
                     <div className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Contradictory Literature</div>
                     <ul className="list-disc pl-4 text-xs text-zinc-400 space-y-1">
                       {hypothesis.contradictory_papers?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                     </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
              <div className="text-center">
                <FileCode size={32} className="mx-auto mb-3 opacity-20" />
                No hypothesis generated yet.
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-auto shrink-0 pt-4">
             <button 
                onClick={handleRunVerification}
                disabled={isVerifying || !hypothesis}
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
    <div className="p-6 overflow-y-auto w-full h-full bg-zinc-950 flex flex-col gap-8">
      <div className="max-w-6xl mx-auto w-full">
        <h2 className="text-2xl font-bold flex items-center gap-3 text-white mb-2 tracking-tight">
           <Scale size={24} className="text-purple-500"/>
           Bayesian Evidence Ledger
        </h2>
        <p className="text-zinc-400">Public-facing credibility timeline. Real-time posterior updates per disease target based on ingested experimental artifacts.</p>
        
        {credibilityTimeline.length === 0 ? (
           <div className="mt-6 py-12 text-center border border-dashed border-zinc-800 rounded-lg text-zinc-500 bg-zinc-900/30">
               <LineChart size={48} className="mx-auto mb-4 opacity-50 text-purple-500/50" />
               <p className="text-base text-zinc-400 font-medium">Awaiting experimental priors.</p>
           </div>
        ) : (
           <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
               <table className="w-full text-left text-sm">
                   <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
                     <tr>
                       <th className="px-4 py-3 font-medium">Timestamp</th>
                       <th className="px-4 py-3 font-medium">Target / Disease</th>
                       <th className="px-4 py-3 font-medium">Outcome</th>
                       <th className="px-4 py-3 font-medium text-center">Prior P(H)</th>
                       <th className="px-4 py-3 font-medium text-center">Posterior P(H|D)</th>
                       <th className="px-4 py-3 font-medium text-right">Δ Impact</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                     {credibilityTimeline.map(t => {
                       const delta = Math.round(t.posterior - t.prior);
                       return (
                         <tr key={t.id} className="hover:bg-zinc-800/20 transition-colors">
                           <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{new Date(t.timestamp).toLocaleTimeString()}</td>
                           <td className="px-4 py-3 font-medium text-emerald-400">
                              {t.target} <span className="text-zinc-500 text-xs font-normal ml-1">| {t.disease}</span>
                           </td>
                           <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider inline-flex items-center gap-1 \${
                                t.outcome === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                              }`}>
                                {t.outcome === 'Confirmed' ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
                                {t.outcome}
                              </span>
                           </td>
                           <td className="px-4 py-3 text-center text-zinc-400 font-mono">{t.prior}%</td>
                           <td className="px-4 py-3 font-bold text-center text-white font-mono">{t.posterior}%</td>
                           <td className={`px-4 py-3 font-bold text-right font-mono \${delta >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                             {delta > 0 ? '+' : ''}{delta}%
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
               </table>
           </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto w-full">
         <div className="mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-white mb-2 tracking-tight">
               <Database size={24} className="text-blue-500"/>
               Results Ingestor & Provenance
            </h2>
            <p className="text-zinc-400">Structured scientific data registry with cryptographic hashing (GxP Validated). Parses multidimensional readout formats and enforces transparent auditability via decentralized hash commits.</p>
         </div>
      
         {auditRecords.length === 0 ? (
            <div className="py-24 text-center border border-dashed border-zinc-800 rounded-lg text-zinc-500 bg-zinc-900/30">
               <Database size={48} className="mx-auto mb-4 opacity-50 text-blue-500/50" />
               <p className="text-base text-zinc-400 font-medium">No validations in ledger.</p>
            </div>
         ) : (
            <div className="space-y-4">
              {auditRecords.map((r) => (
                 <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 shadow-lg shadow-black/20">
                    <div className="flex items-start justify-between mb-4 border-b border-zinc-800/80 pb-4">
                       <div>
                          <div className="flex items-center gap-2 mb-1.5">
                             {r.pass_fail === 'PASS' ? <CheckCircle size={16} className="text-emerald-500" /> : <AlertTriangle size={16} className="text-orange-500" />}
                             <span className="font-medium text-zinc-200">
                                {r.pass_fail === 'PASS' ? 'Hypothesis Confirmed by Assay' : 'Hypothesis Contradicted by Assay'}
                             </span>
                          </div>
                          <div className="text-xs text-zinc-400 flex items-center gap-3 bg-zinc-950/50 inline-flex px-2 py-1 rounded">
                             <span className="flex items-center gap-1.5 font-medium text-blue-400"><Microscope size={12}/> {r.assay_type}</span>
                             <span className="text-zinc-700">|</span>
                             <span className="flex items-center gap-1.5 font-medium text-emerald-400"><Dna size={12}/> {r.target}</span>
                             <span className="text-zinc-700">|</span>
                             <span>{new Date(r.timestamp).toLocaleString()}</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5 font-bold">Hypothesis / Lab ID</div>
                          <div className="font-mono text-zinc-400 bg-black px-2.5 py-1 rounded text-xs border border-zinc-800 flex flex-col gap-1">
                             <span>H-{r.hypothesis_id}</span>
                             <span className="text-blue-500 border-t border-zinc-800 pt-1 mt-1">{r.lab_id}</span>
                          </div>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
                       <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Ingested Readout</div>
                          <div className="text-2xl font-medium text-white mb-1">
                             {r.result_value} <span className="text-sm text-zinc-500">{r.units}</span>
                          </div>
                          <div className="text-xs text-zinc-400 line-clamp-1">Cell Line: <span className="text-zinc-300">{r.cell_line}</span></div>
                       </div>
                       <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Telemetry Context</div>
                          <div className="text-xs text-zinc-300 mb-1.5 flex items-center justify-between">
                            <span>Fuzz Test:</span>
                            <span className="font-mono text-emerald-400 bg-zinc-950 px-1.5 rounded">{r.fuzzPts} pts</span>
                          </div>
                          <div className="text-xs text-zinc-300 flex items-center justify-between">
                            <span>MC Scope:</span>
                            <span className="font-mono text-emerald-400 bg-zinc-950 px-1.5 rounded">{r.mcPts} pts</span>
                          </div>
                       </div>
                       <div className="col-span-2 flex flex-col justify-between">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Immutable Provenance Receipt</div>
                            <div className="bg-emerald-950/20 p-2.5 rounded border border-emerald-900/30 mb-2">
                               <p className="text-[11px] text-emerald-400/80 leading-relaxed italic">
                                  "On {new Date(r.timestamp).toLocaleDateString()} at {new Date(r.timestamp).toLocaleTimeString()}, with data payload H-{r.hypothesis_id}, this analytical pipeline produced result {r.result_value} {r.units}. Here is the cryptographic proof generated via deterministic execution:"
                               </p>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-zinc-300 text-xs font-mono break-all bg-black p-2.5 rounded border border-zinc-800">
                               <FileSignature size={14} className="shrink-0 text-emerald-500" />
                               <span><span className="text-emerald-500">{r.raw_data_digest?.substring(0, 16)}</span><span className="text-zinc-600">{r.raw_data_digest?.substring(16)}</span></span>
                            </div>
                            <div className="text-[10px] text-emerald-500 mt-2 tracking-wide uppercase flex items-center gap-1.5 font-bold">
                              <ShieldCheck size={12} />
                              {r.signature}
                            </div>
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

  const renderUpload = () => (
    <div className="p-6 overflow-y-auto w-full h-full bg-zinc-950 flex flex-col gap-8">
      <div className="max-w-6xl mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3 text-white mb-2 tracking-tight">
             <Upload size={24} className="text-teal-500"/>
             Multimodal Data Ingestion
          </h2>
          <p className="text-zinc-400">Upload primary literature, laboratory images for structural OCR, and AlphaFold PDB / AlphaMissense variant files. Automatically parsed into the BioLM Knowledge Graph.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
           <div className="border border-dashed border-zinc-700 bg-zinc-900/50 rounded-lg p-10 flex flex-col justify-center items-center text-center hover:bg-zinc-900/80 transition-colors relative">
               <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
               <Upload size={48} className="text-teal-500/50 mb-4" />
               <h3 className="text-white font-medium mb-1">Drag & drop scientific artifacts</h3>
               <p className="text-sm text-zinc-500 mb-4">Support for PDF, PNG/JPG, PDB, CIF, FASTA, CSV</p>
               <button className="px-4 py-2 bg-zinc-800 text-white rounded text-sm font-medium border border-zinc-700 hover:border-zinc-600 transition-colors pointer-events-none">
                  Select Files
               </button>
           </div>
           
           <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col h-64">
              <div className="text-sm font-medium text-white mb-3 flex items-center gap-2 border-b border-zinc-800 pb-2">
                 <Database size={16} className="text-teal-500" />
                 Ingestion Queue
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                 {uploadedFiles.length === 0 ? (
                    <div className="text-sm text-zinc-600 italic h-full flex items-center justify-center">No files uploaded in this session.</div>
                 ) : (
                    uploadedFiles.map((f, i) => (
                       <div key={i} className="flex items-center justify-between bg-zinc-950 p-2.5 rounded border border-zinc-800/50">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
                                <FileText size={14} />
                             </div>
                             <div className="min-w-0">
                                <div className="text-xs font-medium text-zinc-200 truncate pr-4">{f.name}</div>
                                <div className="text-[10px] text-zinc-500 flex gap-2 mt-0.5">
                                   <span>{f.size}</span>
                                   <span>•</span>
                                   <span className={f.status === 'Processing...' ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}>{f.status}</span>
                                </div>
                             </div>
                          </div>
                          {f.status !== 'Processing...' && <CheckCircle size={14} className="text-emerald-500 shrink-0" />}
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
           <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-4">
              <Layers size={18} className="text-purple-500" />
              Connected Platforms
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-black/40 border border-zinc-800 rounded p-4 text-center">
                 <div className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-2">AlphaFold 3</div>
                 <div className="text-xs text-zinc-400">Direct integration for folded structure PDB ingest.</div>
              </div>
              <div className="bg-black/40 border border-zinc-800 rounded p-4 text-center">
                 <div className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2">PubMed Auto-Ingest</div>
                 <div className="text-xs text-zinc-400">Vectorizing latest literature automatically.</div>
              </div>
              <div className="bg-black/40 border border-zinc-800 rounded p-4 text-center">
                 <div className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2">Sci-OCR</div>
                 <div className="text-xs text-zinc-400">Extracts plots, tables, and mechanistic diagrams.</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderDaemon = () => (
    <div className="p-6 overflow-y-auto w-full h-full bg-zinc-950 flex flex-col gap-8">
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Kairos Engine */}
         <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3 text-white mb-2 tracking-tight">
                 <Bot size={24} className="text-amber-500"/>
                 Kairos Daemon
              </h2>
              <p className="text-zinc-400">Always-on proactive scientific agent. 15-second tick loop.</p>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-[500px]">
               <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-black/40">
                  <div className="flex items-center gap-2">
                     <span className="relative flex h-2 w-2">
                       <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                       <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                     </span>
                     <span className="text-xs uppercase font-bold text-amber-500 tracking-widest font-mono">Daemon Active</span>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">TICK = 15s</span>
               </div>
               <div className="flex-1 p-4 overflow-y-auto space-y-2 font-mono text-[11px] bg-zinc-950 scrollbar-thin">
                  {daemonLogs.filter(l => l.type === 'tick' || l.type === 'system').map((l) => (
                    <div key={l.id} className="border-l-2 border-amber-500/30 pl-2">
                       <div className="text-zinc-500 mb-0.5">{new Date(l.timestamp).toLocaleTimeString()}</div>
                       <div className="text-zinc-300">{l.message}</div>
                    </div>
                  ))}
               </div>
            </div>
         </div>

        {/* AutoDream */}
         <div>
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3 text-white mb-2 tracking-tight">
                   <MoonStar size={24} className="text-blue-500"/>
                   AutoDream
                </h2>
                <p className="text-zinc-400">Nightly scientific memory consolidation.</p>
              </div>
              <button 
                onClick={triggerDreamCycle}
                disabled={isDreaming}
                className="px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 disabled:bg-zinc-800 disabled:text-zinc-600 border border-blue-500/30 rounded text-sm font-bold transition-colors shadow-[0_0_15px_rgba(59,130,246,0.15)] flex items-center gap-2"
              >
                <Zap size={14} /> {isDreaming ? 'Dream Cycle Active...' : 'Trigger Cycle'}
              </button>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-[500px]">
               <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-black/40">
                  <div className="flex items-center gap-2 text-xs uppercase font-bold text-blue-500 tracking-widest font-mono">
                     <MoonStar size={14} /> Consolidation Ledger
                  </div>
               </div>
               <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-[11px] bg-zinc-950 scrollbar-thin">
                  {daemonLogs.filter(l => l.type.startsWith('dream')).map((l) => (
                    <div key={l.id} className={`border-l-2 pl-3 py-1 ${l.type === 'dream_rem' ? 'border-purple-500/50' : l.type === 'dream_nrem' ? 'border-emerald-500/50' : 'border-blue-500/50'}`}>
                       <div className="text-zinc-500 mb-1">{new Date(l.timestamp).toLocaleTimeString()}</div>
                       <div className={`${l.type === 'dream_rem' ? 'text-purple-300' : l.type === 'dream_nrem' ? 'text-emerald-300' : 'text-blue-300 font-bold'}`}>
                         {l.message}
                       </div>
                    </div>
                  ))}
                  {daemonLogs.filter(l => l.type.startsWith('dream')).length === 0 && (
                     <div className="h-full flex flex-col justify-center items-center text-zinc-600 space-y-3 opacity-50">
                        <MoonStar size={32} />
                        <span>Awaiting idle state...</span>
                     </div>
                  )}
               </div>
            </div>
         </div>

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
                onClick={() => setActiveNav('upload')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded text-sm transition-colors ${activeNav === 'upload' ? 'bg-zinc-800/80 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'}`}
              >
                 <Upload size={18} className={activeNav === 'upload' ? 'text-teal-400' : ''} />
                 Data Ingestion
              </button>
              <button 
                onClick={() => setActiveNav('discovery')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded text-sm transition-colors \${activeNav === 'discovery' ? 'bg-zinc-800/80 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'}`}
              >
                 <Brain size={18} className={activeNav === 'discovery' ? 'text-blue-400' : ''} />
                 BioLM Target Engine
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
              <button 
                onClick={() => setActiveNav('daemon')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded text-sm transition-colors ${activeNav === 'daemon' ? 'bg-zinc-800/80 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'}`}
              >
                 <Bot size={18} className={activeNav === 'daemon' ? 'text-amber-400' : ''} />
                 Autonomous Daemon
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
           {activeNav === 'upload' && renderUpload()}
           {activeNav === 'discovery' && renderDiscovery()}
           {activeNav === 'lab' && renderLab()}
           {activeNav === 'informatics' && renderInformatics()}
           {activeNav === 'daemon' && renderDaemon()}
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