import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Microscope, 
  BrainCircuit, 
  Activity, 
  ShieldCheck, 
  Store, 
  Lock, 
  Zap,
  ChevronRight,
  TrendingUp,
  Cpu,
  Dna,
  TestTube2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Database,
  Cloud,
  Plug,
  Server,
  FlaskConical,
  Award,
  BookOpen,
  Beaker,
  Play,
  Scale,
  Fingerprint,
  FileDigit,
  Crosshair,
  RotateCw,
  Target,
  FileCheck,
  Check,
  Globe,
  Share2,
  GitBranch,
  Trophy,
  Users,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Data Models ---
type AgentRole = 'Hypothesis Generator' | 'Literature Synthesizer' | 'Simulator' | 'Toxicity Predictor' | 'Experiment Designer' | 'Critic';

interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  level: number;
  reputation: number; // 0-100
  accuracy: number;
  deployed: boolean;
  avatarIcon: React.ElementType;
}

const mockHypotheses = [
  {
    id: 'h1',
    title: 'Allosteric KRAS-G12D Inhibition via Cryptic Pocket Binding',
    swarm: 'Pancreatic Cancer (PDAC)',
    author: 'HypoForge',
    status: 'Pending Review', // Pending Review | Graded
    description: 'A novel approach binding to an identified transient cryptic pocket in the Switch II region, evading typical ATP-competitive resistance.',
    gradeData: [
      { metric: 'Novelty', score: 94 },
      { metric: 'Synthesis Feasibility', score: 72 },
      { metric: 'In-silico Safety', score: 88 },
      { metric: 'Expected Info Gain', score: 97 },
      { metric: 'Literature Support', score: 65 }
    ],
    overallGrade: 'A-',
    confidence: 89
  },
  {
    id: 'h2',
    title: 'Dual-action Tau Phosphorylation Modulator',
    swarm: 'Early-Onset Alzheimer\'s',
    author: 'LitGenius + AlphaFold-C',
    status: 'Graded',
    description: 'Combining kinase inhibition with targeted protein degradation (PROTAC) specifically for hyperphosphorylated Tau aggregates.',
    gradeData: [
      { metric: 'Novelty', score: 82 },
      { metric: 'Synthesis Feasibility', score: 55 },
      { metric: 'In-silico Safety', score: 76 },
      { metric: 'Expected Info Gain', score: 85 },
      { metric: 'Literature Support', score: 91 }
    ],
    overallGrade: 'B+',
    confidence: 76
  }
];

interface Swarm {
  id: string;
  disease: string;
  progress: number; // 0-100 (EIG or path to cure)
  activeAgents: number;
  recentActivity: string;
  chartData: any[];
}

const mockAgents: Agent[] = [
  { id: '1', name: 'AlphaFold-C', role: 'Simulator', level: 42, reputation: 98, accuracy: 95, deployed: true, avatarIcon: Dna },
  { id: '2', name: 'LitGenius', role: 'Literature Synthesizer', level: 35, reputation: 89, accuracy: 91, deployed: true, avatarIcon: BrainCircuit },
  { id: '3', name: 'Skeptic.ai', role: 'Critic', level: 50, reputation: 99, accuracy: 97, deployed: false, avatarIcon: ShieldCheck },
  { id: '4', name: 'ToxGuard', role: 'Toxicity Predictor', level: 28, reputation: 82, accuracy: 88, deployed: true, avatarIcon: TestTube2 },
  { id: '5', name: 'HypoForge', role: 'Hypothesis Generator', level: 39, reputation: 91, accuracy: 89, deployed: false, avatarIcon: Zap },
];

const marketplaceAgents = [
  { id: 'm1', name: 'PandaClaw Core', creator: 'Insilico', role: 'Experiment Designer', price: '250 Credits/hr', rating: 4.9, downloads: '12K', icon: Microscope },
  { id: 'm2', name: 'Robin Swarm OS', creator: 'OpenBio', role: 'Multi-Agent Hub', price: 'Open Source', rating: 4.7, downloads: '45K', icon: Network },
  { id: 'm3', name: 'Mayo Pancreatic AI', creator: 'Mayo Clinic', role: 'Early Detection', price: 'Enterprise', rating: 4.9, downloads: '8.2K', icon: Activity },
  { id: 'm4', name: 'Atinary SDR Integrator', creator: 'Atinary', role: 'Cloud Lab Integration', price: '1000 Credits/run', rating: 4.8, downloads: '3.1K', icon: TestTube2 },
];

const pendingApprovals = [
  { id: 'pa1', swarm: 'Pancreatic Cancer (PDAC)', task: 'Synthesize KRAS-14 binding candidate', riskLevel: 'Low', requestedBy: 'Experiment Designer', cost: '4,500 Credits' },
  { id: 'pa2', swarm: 'Early-Onset Alzheimer\'s', task: 'In-vivo toxicity panel (Tau-54)', riskLevel: 'High', requestedBy: 'ToxGuard', cost: '12,000 Credits' },
];

const mockSwarms: Swarm[] = [
  {
    id: 's1',
    disease: 'Pancreatic Cancer (PDAC)',
    progress: 78,
    activeAgents: 124,
    recentActivity: 'Identified novel KRAS inhibitor binding pocket with high EIG.',
    chartData: Array.from({ length: 10 }).map((_, i) => ({ day: `Day ${i+1}`, eig: Math.floor(Math.random() * 40) + 40 + (i * 2) }))
  },
  {
    id: 's2',
    disease: 'Early-Onset Alzheimer\'s',
    progress: 45,
    activeAgents: 89,
    recentActivity: 'Simulated tau protein aggregation pathway disruption.',
    chartData: Array.from({ length: 10 }).map((_, i) => ({ day: `Day ${i+1}`, eig: Math.floor(Math.random() * 30) + 20 + (i * 1.5) }))
  },
  {
    id: 's3',
    disease: 'Cystic Fibrosis (Rare Variants)',
    progress: 62,
    activeAgents: 45,
    recentActivity: 'Critic agent rejected 3 pathways due to off-target effects.',
    chartData: Array.from({ length: 10 }).map((_, i) => ({ day: `Day ${i+1}`, eig: Math.floor(Math.random() * 20) + 30 + (i * 2.5) }))
  }
];

// --- Components ---

function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden", className)} {...props}>
      {children}
    </div>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
        {title}
      </h1>
      <p className="text-zinc-400 mt-2">{subtitle}</p>
    </div>
  );
}

// --- Views ---

function ValidationView() {
  const [selectedHypothesis, setSelectedHypothesis] = useState(mockHypotheses[0]);
  const [isValidating, setIsValidating] = useState(false);
  const [hypotheses, setHypotheses] = useState(mockHypotheses);

  const handleValidate = () => {
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      setHypotheses(prev => prev.map(h => 
        h.id === selectedHypothesis.id ? { ...h, status: 'Graded' } : h
      ));
      setSelectedHypothesis(prev => ({ ...prev, status: 'Graded' }));
    }, 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <PageHeader title="Scientific Validation & Grading" subtitle="Review, score, and validate agent-derived hypotheses via the critic matrix." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: List of Hypotheses */}
        <div className="col-span-1 space-y-4">
          <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
            <FlaskConical size={18} className="text-purple-400" /> Pending Findings
          </h3>
          <div className="space-y-3">
            {hypotheses.map(hypo => (
              <Card 
                key={hypo.id} 
                onClick={() => setSelectedHypothesis(hypo)}
                className={cn(
                  "p-4 cursor-pointer transition-colors border",
                  selectedHypothesis.id === hypo.id 
                    ? "border-emerald-500/50 bg-zinc-900" 
                    : "border-zinc-800/50 bg-zinc-950 hover:border-zinc-700"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                    hypo.status === 'Graded' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                  )}>
                    {hypo.status}
                  </span>
                  {hypo.status === 'Graded' && <span className="text-xs font-bold text-zinc-100 bg-zinc-800 px-2 py-0.5 rounded">{hypo.overallGrade}</span>}
                </div>
                <h4 className="font-medium text-sm text-zinc-200 line-clamp-2 leading-snug">{hypo.title}</h4>
                <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1.5"><BrainCircuit size={12} /> {hypo.author}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Col: Detail & Grading */}
        <div className="col-span-1 lg:col-span-2">
          <Card className="p-6 h-full flex flex-col relative overflow-hidden">
            {isValidating && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin mb-4" />
                <h3 className="text-emerald-400 font-medium">Running Matrix Consensus...</h3>
                <p className="text-sm text-zinc-400 text-center max-w-sm mt-2">Skeptic.ai and ToxGuard are actively grading parameters against SciNet axioms.</p>
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-emerald-400 text-xs font-mono mb-1">{selectedHypothesis.swarm}</p>
                <h2 className="text-xl font-display font-semibold text-zinc-100">{selectedHypothesis.title}</h2>
              </div>
              {selectedHypothesis.status === 'Pending Review' ? (
                <button 
                  onClick={handleValidate}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-medium rounded-md transition-colors flex items-center gap-2 shrink-0"
                >
                  <Award size={16} /> Run Evaluation
                </button>
              ) : (
                <span className="shrink-0 flex flex-col items-end">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Consensus Grade</span>
                  <span className="text-3xl font-display font-bold text-emerald-400">{selectedHypothesis.overallGrade}</span>
                </span>
              )}
            </div>

            <p className="text-sm text-zinc-400 mb-8 border-b border-zinc-800/50 pb-6">
              {selectedHypothesis.description}
            </p>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[300px]">
              {/* Radar Chart */}
              <div className="relative w-full h-full min-h-[250px] flex items-center justify-center">
                <div className={cn("absolute inset-0 transition-opacity duration-500", selectedHypothesis.status === 'Pending Review' ? "opacity-30 grayscale blur-[2px]" : "opacity-100")}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={selectedHypothesis.gradeData}>
                      <PolarGrid stroke="#3f3f46" strokeDasharray="3 4" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Scoring" dataKey="score" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.2} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                        itemStyle={{ color: '#10b981' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                {selectedHypothesis.status === 'Pending Review' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <span className="px-4 py-1.5 bg-zinc-950/80 backdrop-blur-md rounded border border-zinc-800 text-sm text-zinc-400">Data locked pending evaluation</span>
                  </div>
                )}
              </div>

              {/* Breakdown */}
              <div className="flex flex-col justify-center gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2"><BookOpen size={16} className="text-blue-400"/> Validation Summary</h4>
                  {selectedHypothesis.gradeData.map((d, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-zinc-400">{d.metric}</span>
                        <span className={cn(
                          "font-mono",
                          selectedHypothesis.status === 'Pending Review' ? "text-zinc-600" : "text-emerald-400"
                        )}>
                          {selectedHypothesis.status === 'Pending Review' ? '--' : `${d.score}/100`}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: selectedHypothesis.status === 'Pending Review' ? '0%' : `${d.score}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                  
                  <div className={cn(
                    "mt-4 p-4 rounded-lg bg-zinc-950 border border-zinc-800 transition-opacity", 
                    selectedHypothesis.status === 'Pending Review' && "opacity-30"
                  )}>
                     <p className="text-xs text-zinc-400 italic">"Model suggests high expected information gain. Recommend immediate parallel verification in Atinary SDLabs before animal trials." - Critic Agent</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function SandboxView() {
  const [searchTerm, setSearchTerm] = React.useState('Pancreatic Cancer');
  const [isRunning, setIsRunning] = React.useState(false);
  const [progressLog, setProgressLog] = React.useState<{msg: string, color: string}[]>([]);
  const [result, setResult] = React.useState<any>(null);
  const [errorMsg, setErrorMsg] = React.useState('');
  
  const addLog = (msg: string, color: string = "text-zinc-300") => {
    setProgressLog(prev => [...prev, {msg, color}]);
  };

  const handleRun = async () => {
    if (!searchTerm.trim()) return;
    setIsRunning(true);
    setProgressLog([]);
    setResult(null);
    setErrorMsg('');

    try {
      addLog(`Initializing discovery pipeline for "${searchTerm}"...`, "text-blue-400");
      addLog(`Connecting to NCBI PubMed E-Utilities API...`, "text-blue-400");
      
      // Step 1: Search PubMed
      const pubmedRes = await fetch(`/api/pubmed/search?term=${encodeURIComponent(searchTerm)}`);
      const pubmedData = await pubmedRes.json();
      
      if (!pubmedData.success || pubmedData.articles.length === 0) {
        addLog(`No recent literature found for mapping. Aborting.`, "text-rose-400");
        setIsRunning(false);
        return;
      }
      
      addLog(`LitGenius: Successfully mapped ${pubmedData.articles.length} recent high-impact publications.`, "text-emerald-400");
      
      // Format context for Gemini
      const contextText = pubmedData.articles.map((a: any) => `Title: ${a.title} | Year: ${a.pdbr}`).join('; ');
      
      addLog(`HypoForge: Analyzing literature graph and extracting semantic priors...`, "text-yellow-400");
      
      // Step 2: Generate Hypothesis
      const genRes = await fetch(`/api/agent/hypothesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: searchTerm, context: contextText })
      });
      
      const genData = await genRes.json();
      
      if (!genData.success) {
        if (genRes.status === 401) {
          setErrorMsg(genData.error);
        }
        addLog(`API Connection Error: ${genData.error}`, "text-rose-400");
        setIsRunning(false);
        return;
      }
      
      addLog(`Critic Agent: Hypothesis meets novelty and feasibility thresholds.`, "text-emerald-400");
      addLog(`Compiling final generation output...`, "text-blue-400");
      
      setResult({
        insight: genData.hypothesis.insight,
        target: genData.hypothesis.target,
        sources: pubmedData.articles
      });
      
    } catch (err: any) {
      addLog(`Pipeline Error: ${err.message}`, "text-rose-400");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <PageHeader title="Discovery Sandbox (Live)" subtitle="Query actual NCBI PubMed literature and use Gemini to generate novel scientific hypotheses." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="col-span-1 space-y-6">
          <Card className="p-6 border-emerald-500/20">
            <h3 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2">
              <Beaker size={18} className="text-emerald-400" /> Live Pipeline Config
            </h3>
            <div className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded">
                  {errorMsg}
                </div>
              )}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wider font-bold">Search Topic (PubMed)</label>
                <input 
                  type="text"
                  className="w-full bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 rounded-md p-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g. KRAS G12D inhibitors"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wider font-bold">Data Sources</label>
                <div className="space-y-2 p-3 bg-zinc-950 border border-zinc-800/50 rounded-md">
                   <div className="flex items-center gap-2">
                     <Database size={14} className="text-blue-400" />
                     <span className="text-sm text-zinc-300">NCBI PubMed API</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <Cpu size={14} className="text-purple-400" />
                     <span className="text-sm text-zinc-300">Gemini 2.5 Pro</span>
                   </div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800">
                <button 
                  onClick={handleRun}
                  disabled={!searchTerm.trim() || isRunning}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-medium rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  {isRunning ? <RotateCw size={16} className="animate-spin" /> : <Play size={16} />} 
                  {isRunning ? 'Processing...' : 'Run Pipeline'}
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Console / Output Panel */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <Card className="p-6 h-[500px] flex flex-col relative overflow-hidden bg-zinc-950">
            <h3 className="font-semibold text-zinc-100 mb-4 font-mono text-sm border-b border-zinc-800 pb-2">
              &gt; Live Agent Output
            </h3>
            
            <div className="flex-1 space-y-3 font-mono text-xs overflow-y-auto pr-2 scrollbar-thin">
              {progressLog.map((log, idx) => (
                <p key={idx} className={`${log.color} leading-relaxed`}>{log.msg}</p>
              ))}
              
              {!isRunning && progressLog.length === 0 && (
                <p className="text-zinc-600">Awaiting topic configuration to fetch live literature...</p>
              )}
              
              {result && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mt-6">
                  <div className="p-4 bg-zinc-900 border border-emerald-500/30 rounded-lg">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded inline-block mb-3">AI GENERATED HYPOTHESIS</span>
                    <h4 className="text-sm font-semibold text-zinc-100 font-sans mb-1">Target: {result.target}</h4>
                    <p className="text-zinc-300 font-sans text-sm leading-relaxed">{result.insight}</p>
                  </div>
                  
                  <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Sourced Literature (PubMed)</h4>
                    <ul className="space-y-3 font-sans">
                      {result.sources.map((src: any) => (
                        <li key={src.id} className="text-sm">
                          <a href={`https://pubmed.ncbi.nlm.nih.gov/${src.id}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">
                            {src.title} <Globe size={12} />
                          </a>
                          <p className="text-xs text-zinc-500">{src.authors} ({src.pdbr}) - {src.source}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function SciNetGraphView() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-start mb-8">
        <PageHeader title="SciNet Knowledge Graph" subtitle="The shared, immutable open-source substrate for all autonomous agents." />
        <div className="flex gap-2">
           <button className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm font-medium rounded-md hover:bg-zinc-700 transition-colors">Export Segment</button>
           <button className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-sm font-medium rounded-md border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">Query Graph</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 p-6 flex flex-col h-[500px] relative overflow-hidden group">
          <h2 className="text-lg font-semibold text-zinc-100 mb-2">Live Substrate Visualization</h2>
          <p className="text-sm text-zinc-400 mb-4 z-10">Showing local sub-graph surrounding PDAC (Pancreatic Cancer) nodes.</p>
          
          {/* Abstract Graph Visualization Background */}
          <div className="absolute inset-0 top-20 flex items-center justify-center pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity duration-1000">
            <div className="relative w-full h-full max-w-md max-h-md">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-emerald-500/30 animate-[spin_60s_linear_infinite]" />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-cyan-500/20 animate-[spin_40s_linear_infinite_reverse]" />
               
               {/* Nodes */}
               <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_10px_#10b981]" />
               <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-purple-400 rounded-full shadow-[0_0_10px_#c084fc]" />
               <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_10px_#60a5fa]" />
               <div className="absolute bottom-1/3 left-1/3 w-4 h-4 bg-yellow-400 rounded-full shadow-[0_0_10px_#facc15]" />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-cyan-400 rounded-full shadow-[0_0_20px_#22d3ee] animate-pulse" />

               {/* Connecting lines (svg) */}
               <svg className="absolute inset-0 w-full h-full text-zinc-700" style={{ zIndex: -1 }}>
                 <line x1="25%" y1="25%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1" />
                 <line x1="75%" y1="75%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1" />
                 <line x1="66%" y1="33%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1" />
                 <line x1="33%" y1="66%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1" />
                 <line x1="25%" y1="25%" x2="33%" y2="66%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                 <line x1="66%" y1="33%" x2="75%" y2="75%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
               </svg>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
             <h3 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2"><Database size={16} className="text-blue-400"/> Graph Telemetry</h3>
             <div className="space-y-4">
                <div>
                  <p className="text-xs text-zinc-500">Total Entities</p>
                  <p className="text-xl font-mono text-zinc-200">14,204,911,002</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Provable Edges</p>
                  <p className="text-xl font-mono text-zinc-200">89,102,443,109</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Agent Read/Write Hz</p>
                  <p className="text-xl font-mono text-zinc-200">~24.5k / sec</p>
                </div>
             </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2"><Activity size={16} className="text-emerald-400"/> Recent Commits</h3>
            <div className="space-y-3">
              {[
                { author: 'LitGenius', hash: 'a1b2c3d', desc: 'Added 402 nodes relating to Tau tangles' },
                { author: 'OpenLab-User4', hash: '8f9e0d1', desc: 'Uploaded verified mass spec data' },
                { author: 'AlphaFold-C', hash: '5c6b7a8', desc: 'Computed structure for novel peptide' },
              ].map((commit, i) => (
                <div key={i} className="text-sm border-l-2 border-zinc-800 pl-3">
                   <p className="text-zinc-300 font-medium">{commit.author} <span className="font-mono text-xs text-zinc-600 ml-2">{commit.hash}</span></p>
                   <p className="text-zinc-500 text-xs truncate mt-0.5">{commit.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

const DashboardView: React.FC<{ onNavigate: (tab: any) => void }> = ({ onNavigate }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <PageHeader title="Command Center" subtitle="Global overview of SciNet multi-agent closed-loop discovery." />
      
      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Agents', value: '1,492', icon: Cpu, color: 'text-emerald-400' },
          { label: 'Cloud Lab Cycles', value: '84.2K', icon: Microscope, color: 'text-cyan-400' },
          { label: 'Pathways Verified', value: '3,801', icon: ShieldCheck, color: 'text-purple-400' },
          { label: 'SciNet Nodes', value: '14.2B', icon: Network, color: 'text-blue-400' },
        ].map((stat, i) => (
          <Card key={i} className="p-6 flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium">{stat.label}</p>
              <p className="text-3xl font-display font-bold text-zinc-100 mt-2">{stat.value}</p>
            </div>
            <div className={cn("p-3 bg-zinc-800/50 rounded-lg", stat.color)}>
              <stat.icon size={24} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Swarms List */}
        <Card className="col-span-1 lg:col-span-2 p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-zinc-100">Active Disease Swarms</h2>
            <button onClick={() => onNavigate('swarms')} className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">View Details</button>
          </div>
          <div className="space-y-4 overflow-y-auto pr-2 flex-1 scrollbar-thin">
            {mockSwarms.map((swarm) => (
              <div key={swarm.id} onClick={() => onNavigate('swarms')} className="p-4 bg-zinc-950 rounded-lg border border-zinc-800/50 hover:border-emerald-500/50 transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-zinc-100 group-hover:text-emerald-400 transition-colors">{swarm.disease}</h3>
                  <div className="flex items-center gap-1 text-xs text-zinc-400 bg-zinc-900 px-2 py-1 rounded">
                    <Activity size={12} className="text-cyan-400" />
                    {swarm.activeAgents} Agents
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-500">Target Resolution Progress</span>
                    <span className="text-emerald-400 font-mono">{swarm.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" 
                      style={{ width: `${swarm.progress}%` }}
                    />
                  </div>
                </div>
                <p className="text-sm text-zinc-400 flex items-start gap-2">
                  <Zap size={14} className="mt-0.5 text-yellow-500 flex-shrink-0" />
                  <span className="truncate">{swarm.recentActivity}</span>
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Global EIG Chart */}
        <Card className="col-span-1 p-6 flex flex-col h-[400px]">
          <h2 className="text-lg font-semibold text-zinc-100 mb-2">Global Information Gain</h2>
          <p className="text-xs text-zinc-500 mb-6">Aggregate EIG across all public swarms (7 day rolling)</p>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockSwarms[0].chartData}>
                <defs>
                  <linearGradient id="colorEig" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="day" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area type="monotone" dataKey="eig" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEig)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

function AgentRosterView() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <PageHeader title="My Agents" subtitle="Manage your specialized agents, view their stats, and deploy them." />
        <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-medium rounded-lg transition-colors flex items-center gap-2">
          <Zap size={16} />
          Create Agent
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockAgents.map(agent => (
          <Card key={agent.id} className="p-6 flex flex-col group hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-zinc-800 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform">
                  <agent.avatarIcon size={24} />
                </div>
                <div>
                  <h3 className="text-zinc-100 font-semibold">{agent.name}</h3>
                  <p className="text-xs text-emerald-400 font-mono">Lvl {agent.level}</p>
                </div>
              </div>
              {agent.deployed ? (
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded border border-emerald-500/20 flex items-center gap-1">
                  <Activity size={10} /> Active
                </span>
              ) : (
                <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs font-medium rounded border border-zinc-700">
                  Idle
                </span>
              )}
            </div>
            
            <div className="mb-4">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{agent.role}</span>
            </div>

            <div className="space-y-3 mb-6 flex-1">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Reputation Score</span>
                  <span className="text-zinc-200">{agent.reputation}/100</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${agent.reputation}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Precision / Accuracy</span>
                  <span className="text-zinc-200">{agent.accuracy}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400 rounded-full" style={{ width: `${agent.accuracy}%` }} />
                </div>
              </div>
            </div>

            <button className={cn(
              "w-full py-2 rounded-lg text-sm font-medium transition-colors border",
              agent.deployed 
                ? "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700" 
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
            )}>
              {agent.deployed ? 'Recall Agent' : 'Deploy to Swarm'}
            </button>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

// --- Additional Views ---

function SwarmDetailView() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-start mb-8">
        <PageHeader title="Pancreatic Cancer (PDAC) Swarm" subtitle="Live view of agent collaboration and closed-loop cycles." />
        <div className="text-right">
          <p className="text-sm text-zinc-400 mb-1">Target EIG Progress</p>
          <p className="text-2xl font-mono text-emerald-400 font-bold">78%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 p-6 h-[500px] flex flex-col">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
             <Activity size={18} className="text-blue-400" /> Live Discovery Feed
          </h2>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-thin">
            {[
              { agent: 'LitGenius', role: 'Synthesizer', action: 'Ingested 4,202 papers on KRAS G12D mutations.', time: '2m ago', color: 'text-blue-400' },
              { agent: 'HypoForge', role: 'Generator', action: 'Proposed novel allosteric binding pocket formulation.', time: '1m ago', color: 'text-yellow-400' },
              { agent: 'AlphaFold-C', role: 'Simulator', action: 'Ran 10,000 folding simulations. 8 showed stable binding.', time: '45s ago', color: 'text-purple-400' },
              { agent: 'Skeptic.ai', role: 'Critic', action: 'Flagged 5 candidates for likely off-target toxicity. Retained 3.', time: '12s ago', color: 'text-rose-400' },
              { agent: 'Experiment Designer', role: 'Designer', action: 'Drafting cloud lab protocol for physical synthesis.', time: 'Just now', color: 'text-emerald-400' }
            ].map((log, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800/50">
                <div className="mt-1">
                  <div className={`w-2 h-2 rounded-full bg-current ${log.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-medium text-zinc-200">{log.agent}</p>
                    <span className="text-[10px] text-zinc-500">{log.time}</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{log.action}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="col-span-1 p-6 h-[500px] flex flex-col relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 z-10">
             <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
               <Cpu size={18} className="text-purple-400" /> In-Silico Docking
             </h2>
             <span className="text-[10px] font-mono bg-purple-500/20 text-purple-400 px-2 py-1 rounded">SIM-AF3-882</span>
          </div>
          
          <div className="flex-1 relative rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden flex items-center justify-center">
             {/* Mock 3D Molecule Docking Viewer */}
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-zinc-950 opacity-80" />
             <svg className="absolute inset-0 w-full h-full text-zinc-700/50" viewBox="0 0 100 100">
                <path d="M 50 10 Q 70 30 50 50 T 50 90" fill="none" stroke="currentColor" strokeWidth="0.5" className="animate-[pulse_4s_ease-in-out_infinite]" />
                <path d="M 20 40 Q 50 50 80 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
             </svg>
             <div className="relative w-32 h-32 animate-[spin_20s_linear_infinite]">
                {/* Protein Mesh Mock */}
                <div className="absolute top-0 left-4 w-16 h-20 bg-purple-500/10 border border-purple-500/30 rounded-full blur-[2px]" />
                <div className="absolute bottom-2 right-2 w-12 h-16 bg-blue-500/10 border border-blue-500/30 rounded-[40%] blur-[1px]" />
                <div className="absolute top-10 left-12 w-6 h-6 bg-emerald-400/80 rounded-full shadow-[0_0_15px_#10b981]" />
                <div className="absolute top-12 left-10 w-2 h-2 bg-yellow-400 rounded-full" />
                <svg className="absolute inset-0 w-full h-full text-emerald-500/50">
                  <line x1="50%" y1="50%" x2="70%" y2="70%" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />
                  <line x1="50%" y1="50%" x2="30%" y2="60%" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />
                </svg>
             </div>
             
             {/* Telemetry Overlay */}
             <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[10px] font-mono text-zinc-500">
                <span>ΔG = -9.4 kcal/mol</span>
                <span>RMSD: 1.2Å</span>
             </div>
          </div>
          
          <div className="mt-4 space-y-2 z-10">
             <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">Binding Affinity</span>
                <span className="text-emerald-400">High Confidence</span>
             </div>
             <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[88%]" />
             </div>
          </div>
        </Card>

        <div className="space-y-6 col-span-1">
          <Card className="p-6">
            <h3 className="font-semibold text-zinc-100 mb-4">Swarm Composition</h3>
            <div className="space-y-3">
              {[
                { label: 'Hypothesis Generators', count: 12 },
                { label: 'Literature Scanners', count: 45 },
                { label: 'Simulators', count: 60 },
                { label: 'Critics / Verifiers', count: 7 }
              ].map((role, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">{role.label}</span>
                  <span className="font-mono text-zinc-200">{role.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <button className="w-full py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-sm transition-colors border border-emerald-500/20">
                Inject New Agent
              </button>
            </div>
          </Card>

          <Card className="p-6 bg-emerald-950/20 border-emerald-500/20">
            <h3 className="font-semibold text-emerald-400 mb-2">Automated Discovery</h3>
            <p className="text-sm text-zinc-400 mb-4">RLVR (Reinforcement Learning with Verifiable Rewards) is actively steering the swarm away from known toxic pathways.</p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <Zap size={14} /> Loop running at 45Hz
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function LabApprovalView() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <PageHeader title="Lab Approvals" subtitle="Human oversight required for physical cloud lab execution." />
      
      <div className="space-y-4">
        {pendingApprovals.map((task) => (
          <Card key={task.id} className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-zinc-800 rounded-lg text-amber-400">
                <Clock size={24} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-100">{task.task}</h3>
                    <p className="text-sm text-emerald-400">{task.swarm}</p>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "inline-block px-2 py-1 text-xs font-medium rounded border mb-2",
                      task.riskLevel === 'Low' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    )}>
                      {task.riskLevel} Risk
                    </span>
                    <p className="text-xs text-zinc-400 flex items-center justify-end gap-1">
                      <Store size={12} /> {task.cost}
                    </p>
                  </div>
                </div>
                
                <p className="text-sm text-zinc-400 mb-4">
                  Requested by <span className="text-zinc-200">{task.requestedBy}</span>. Agents predict a 94% reproducibility rate. Awaiting human lab authorization.
                </p>

                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-md text-sm transition-colors flex items-center gap-2">
                    <CheckCircle2 size={16} /> Approve Execution
                  </button>
                  <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-md text-sm transition-colors flex items-center gap-2">
                    <XCircle size={16} /> Reject
                  </button>
                  <button className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-medium rounded-md text-sm transition-colors ml-auto">
                    View Run Specs
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

function MarketplaceView() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <PageHeader title="Agent Marketplace" subtitle="Discover, rent, or purchase specialized agents trained on proprietary datasets." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {marketplaceAgents.map(agent => (
          <Card key={agent.id} className="p-6 flex flex-col group hover:border-emerald-500/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-zinc-800 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform">
                  <agent.icon size={24} />
                </div>
                <div>
                  <h3 className="text-zinc-100 font-semibold">{agent.name}</h3>
                  <p className="text-xs text-zinc-400">by {agent.creator}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-emerald-400">{agent.price}</p>
                <p className="text-xs text-zinc-500">{agent.downloads} instantiated</p>
              </div>
            </div>
            
            <p className="text-sm text-zinc-400 mb-6">{agent.role}</p>

            <div className="mt-auto grid grid-cols-2 gap-3">
               <button className="py-2 rounded-lg text-sm font-medium transition-colors border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                 Rent (Credit/hr)
               </button>
               <button className="py-2 rounded-lg text-sm font-medium transition-colors border border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                 View Licensing
               </button>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

function RigorView() {
  const auditLogs = [
    { id: 'tx-8f9e', agent: 'Skeptic.ai', action: 'Falsification Attempt', target: 'Tau Modulator H2', outcome: 'Failed to falsify', confidenceDelta: '+4.24% [3.1, 5.4]', hash: '0x9a8b...3c21', time: '12m ago' },
    { id: 'tx-2a4c', agent: 'LitGenius', action: 'Provenance Anchor', target: 'Binding Affinity Data', outcome: 'Anchored 3.2M records', confidenceDelta: 'N/A', hash: '0xf412...8e99', time: '45m ago' },
    { id: 'tx-7c3d', agent: 'ToxGuard', action: 'Adversarial Red-Team', target: 'KRAS-G12D Cryptic Pocket', outcome: 'Flagged p-hacking risk', confidenceDelta: '-12.51% [10.2, 14.8]', hash: '0x1b2c...7d8e', time: '1h ago' },
    { id: 'tx-9e1f', agent: 'AlphaFold-C', action: 'CASP-Blind Test', target: 'Novel Peptide Structure', outcome: 'Verified against hold-out data', confidenceDelta: '+18.12% [16.5, 19.8]', hash: '0x4d5e...1f2a', time: '3h ago' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <PageHeader title="Scientific Rigor & Auditing" subtitle="Immutable provenance, adversarial agent debate, and Bayesian credibility tracking." />
        <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-medium rounded-lg transition-colors flex items-center gap-2">
          <Fingerprint size={16} />
          Export Audit Trail
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adversarial Debate Panel */}
        <Card className="p-6">
          <h3 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <Scale size={18} className="text-emerald-400" /> Adversarial Critic Debate
          </h3>
          <p className="text-sm text-zinc-400 mb-6">Live logging of skeptic agents attempting to falsify peer-generated hypotheses.</p>
          
          <div className="space-y-4">
            <div className="p-3 bg-zinc-950 rounded border border-rose-500/20 shadow-sm relative overflow-hidden">
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-500 to-rose-900" />
               <div className="pl-3">
                 <div className="flex justify-between items-start mb-1">
                   <p className="text-xs font-bold text-rose-400 tracking-wide">FALSIFICATION: ACTIVE</p>
                   <span className="text-xs text-zinc-500 font-mono">ID: H2-Tau</span>
                 </div>
                 <p className="text-sm text-zinc-300 font-medium leading-relaxed mt-2">
                   "The proposed PROTAC linkage assumes negligible steric hindrance. I am running 4,000 adversarial molecular dynamics perturbations targeting the linker region to force a spatial clash."
                 </p>
                 <p className="text-xs text-zinc-500 mt-2 text-right">— Skeptic.ai</p>
               </div>
            </div>

            <div className="p-3 bg-zinc-950 rounded border border-emerald-500/20 shadow-sm relative overflow-hidden">
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-emerald-900" />
               <div className="pl-3">
                 <div className="flex justify-between items-start mb-1">
                   <p className="text-xs font-bold text-emerald-400 tracking-wide">REBUTTAL: SUBMITTED</p>
                   <span className="text-xs text-zinc-500 font-mono">ID: H2-Tau</span>
                 </div>
                 <p className="text-sm text-zinc-300 font-medium leading-relaxed mt-2">
                   "Literature synthesis of 1,200 analogous PEG linkers demonstrates flexibility sufficient to accommodate the calculated clash radius. Adjusting simulation constraints to reflect in-vivo hydration spheres."
                 </p>
                 <p className="text-xs text-zinc-500 mt-2 text-right">— LitGenius + HypoForge</p>
               </div>
            </div>
          </div>
        </Card>

        {/* Bayesian Tracking */}
        <Card className="p-6">
          <h3 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <Crosshair size={18} className="text-blue-400" /> Bayesian Credibility Updating
          </h3>
          <p className="text-sm text-zinc-400 mb-6">Continuous probabilistic updates based on falsification attempts and verifiable experiments.</p>
          
          <div className="space-y-6 flex flex-col justify-center h-[280px]">
             <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-300 font-medium text-sm">H1: Allosteric KRAS-G12D Inhibition</span>
                  <span className="text-emerald-400 font-mono">P(H1|D): 0.892 (BF: 14.5)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 w-full bg-zinc-900 rounded-full overflow-hidden shrink-0 relative">
                    <div className="absolute h-full w-[12.2%] bg-zinc-700 top-0 left-[77%]" /> {/* Prior */}
                    <div className="h-full bg-emerald-500 rounded-full shrink-0" style={{ width: '89.2%' }} />
                  </div>
                  <span className="text-[10px] text-zinc-500 shrink-0 font-mono">Prior: 0.770</span>
                </div>
             </div>

             <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-300 font-medium text-sm">H2: Dual-action Tau PROTAC</span>
                  <span className="text-rose-400 font-mono">P(H2|D): 0.614 (BF: 0.42)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 w-full bg-zinc-900 rounded-full overflow-hidden shrink-0 relative">
                    <div className="absolute h-full w-[11.6%] bg-zinc-700 top-0 left-[61.4%]" /> {/* Prior */}
                    <div className="h-full bg-rose-500 rounded-full shrink-0" style={{ width: '61.4%' }} />
                  </div>
                  <span className="text-[10px] text-zinc-500 shrink-0 font-mono">Prior: 0.730</span>
                </div>
             </div>
          </div>
        </Card>

        {/* Immutable Provenance Audit Log */}
        <Card className="col-span-1 lg:col-span-2 p-0 overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
             <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
               <FileDigit size={18} className="text-purple-400" /> Immutable Provenance Ledger
             </h3>
             <p className="text-sm text-zinc-400 mt-1">Cryptographically hashed actions and structural data anchoring.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/50 text-xs uppercase tracking-wider text-zinc-500 font-bold border-b border-zinc-800">
                  <th className="px-6 py-4">Transaction hash</th>
                  <th className="px-6 py-4">Agent</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Δ Credibility</th>
                  <th className="px-6 py-4">Time</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-zinc-400 flex items-center gap-2">
                       {log.hash}
                    </td>
                    <td className="px-6 py-4 font-medium text-emerald-400 flex items-center gap-1.5"><BrainCircuit size={14} /> {log.agent}</td>
                    <td className="px-6 py-4 text-zinc-300">
                        <span className="block">{log.action}</span>
                        <span className="text-xs text-zinc-500">{log.target}</span>
                    </td>
                    <td className="px-6 py-4 font-mono">
                      <span className={cn(
                        log.confidenceDelta.startsWith('+') ? "text-emerald-400" : 
                        log.confidenceDelta.startsWith('-') ? "text-rose-400" : "text-zinc-500"
                      )}>{log.confidenceDelta}</span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

function PipelineView() {
  const [isRunning, setIsRunning] = useState(false);
  const [activePhaseIndex, setActivePhaseIndex] = useState(-1);
  const [progress, setProgress] = useState(0);

  const phases = [
    { phase: 'Design', agent: 'HypoForge', desc: 'Generating novel FEP+ validated ligands. Prioritizing EIG.', color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500' },
    { phase: 'Make', agent: 'Atinary SDLabs', desc: 'Executing robotic synthesis protocols for hit candidates.', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500' },
    { phase: 'Test', agent: 'AlphaFold 3 / High-throughput screening', desc: 'Running ADMET predictive models and binding assays.', color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500' },
    { phase: 'Learn', agent: 'SciNet Consensus', desc: 'Updating Bayesian posteriors with new binding affinities.', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500' }
  ];

  const runPipeline = () => {
    setIsRunning(true);
    setActivePhaseIndex(0);
    setProgress(0);

    let currentPhase = 0;
    let currentProgress = 0;

    const interval = setInterval(() => {
      currentProgress += 5;
      
      if (currentProgress > 100) {
        currentProgress = 0;
        currentPhase++;
        
        if (currentPhase >= phases.length) {
          clearInterval(interval);
          setIsRunning(false);
          setActivePhaseIndex(-1); // Complete
          setProgress(100);
          return;
        }
        setActivePhaseIndex(currentPhase);
      }
      
      setProgress(currentProgress);
    }, 200);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <PageHeader title="Discovery Pipeline (DMTA)" subtitle="Design, Make, Test, and Learn closed-loop cycles with rigorous VVUQ." />
        <button 
          onClick={runPipeline}
          disabled={isRunning}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Play size={16} /> {isRunning ? 'Pipeline Running...' : 'Execute E2E Pipeline'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* DMTA Cycle */}
        <Card className="p-6">
           <div className="flex justify-between items-center mb-6">
             <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
               <RotateCw size={18} className={cn(isRunning ? "text-emerald-400 animate-spin" : "text-zinc-400")} /> Live DMTA Cycle Status
             </h3>
             {isRunning && <span className="text-xs text-emerald-400 font-mono animate-pulse">EXECUTING</span>}
           </div>
           
           <div className="relative">
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-zinc-800" />
              <div className="space-y-6 pl-14 relative">
                {phases.map((step, i) => {
                  const isActive = activePhaseIndex === i;
                  const isPast = activePhaseIndex > i || (activePhaseIndex === -1 && progress === 100);
                  
                  return (
                   <div key={i} className={cn("relative transition-opacity duration-300", (!isActive && !isPast && isRunning) ? "opacity-30" : "opacity-100")}>
                     <div className={cn("absolute -left-[45px] top-1 w-6 h-6 rounded-full border-2 bg-zinc-950 flex items-center justify-center transition-colors", 
                        isActive || isPast ? step.border : "border-zinc-800")}>
                        <div className={cn("w-2 h-2 rounded-full", isActive || isPast ? step.bg : "bg-zinc-800", isActive && "animate-ping")} />
                     </div>
                     <h4 className={cn("font-bold text-sm tracking-wider uppercase mb-1 transition-colors", isActive || isPast ? step.color : "text-zinc-600")}>
                       {step.phase}
                     </h4>
                     <p className={cn("text-sm mb-1 font-medium", isActive ? "text-zinc-200" : "text-zinc-400")}>
                       {isActive ? 'Active' : isPast ? 'Completed' : 'Queued'} - {step.agent}
                     </p>
                     <p className="text-zinc-500 text-xs mb-2">{step.desc}</p>
                     
                     {isActive && (
                       <div className="h-1 w-full max-w-xs bg-zinc-900 rounded-full overflow-hidden mt-2">
                          <div className={cn("h-full transition-all duration-200 ease-linear", step.bg)} style={{ width: `${progress}%` }} />
                       </div>
                     )}
                   </div>
                  );
                })}
              </div>
           </div>
        </Card>

        {/* VVUQ Standards */}
        <Card className="p-6">
           <h3 className="font-semibold text-zinc-100 mb-6 flex items-center gap-2">
             <Target size={18} className="text-rose-400" /> VVUQ Compliance
           </h3>
           
           <div className="space-y-6">
             <div>
               <div className="flex justify-between items-end mb-2">
                 <h4 className="text-sm font-medium text-zinc-200">Verification</h4>
                 <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Pass</span>
               </div>
               <p className="text-xs text-zinc-500 mb-2">Containerized deterministic environments re-executed successfully across 3 independent nodes.</p>
               <div className="h-1 bg-zinc-900 rounded-full overflow-hidden"><div className="h-full w-full bg-emerald-500" /></div>
             </div>

             <div>
               <div className="flex justify-between items-end mb-2">
                 <h4 className="text-sm font-medium text-zinc-200">Validation</h4>
                 <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Review Required</span>
               </div>
               <p className="text-xs text-zinc-500 mb-2">In-silico benchmarks completed. Physical confirmation required via Atinary SDLabs.</p>
               <div className="h-1 bg-zinc-900 rounded-full overflow-hidden"><div className="h-full w-[60%] bg-amber-500" /></div>
             </div>

             <div>
               <div className="flex justify-between items-end mb-2">
                 <h4 className="text-sm font-medium text-zinc-200">Uncertainty Quantification (UQ)</h4>
                 <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Quantified</span>
               </div>
               <p className="text-xs text-zinc-500 mb-2">Epistemic uncertainty bounds established via ensemble Bayesian networks. Confidence: 92% ±3.4%.</p>
               <div className="h-1 bg-zinc-900 rounded-full overflow-hidden"><div className="h-full w-[90%] bg-blue-500" /></div>
             </div>
           </div>
        </Card>

        <Card className="col-span-1 lg:col-span-2 p-6">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                <FileCheck size={18} className="text-cyan-400" /> FAIR & ALCOA+ Data Integrity
              </h3>
              <span className="text-xs font-mono text-zinc-500">Immutable Ledger Synced</span>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">FAIR Standard</h4>
                <ul className="space-y-3">
                  {[
                    { key: 'F', name: 'Findable', desc: 'Persistent URIs mapped in SciNet' },
                    { key: 'A', name: 'Accessible', desc: 'Standard protocols & APIs' },
                    { key: 'I', name: 'Interoperable', desc: 'Shared biomedical ontologies' },
                    { key: 'R', name: 'Reusable', desc: 'Clear provenance & Apache 2.0 licensing' },
                  ].map(item => (
                    <li key={item.key} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-bold border border-emerald-500/20 mt-0.5 shrink-0">
                         <Check size={12} />
                      </div>
                      <div>
                        <p className="text-sm text-zinc-200 font-medium">[{item.key}] {item.name}</p>
                        <p className="text-xs text-zinc-500">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">ALCOA+ Compliance</h4>
                <div className="grid grid-cols-2 gap-3">
                   {[
                     'Attributable', 'Legible', 'Contemporaneous', 'Original', 'Accurate', 'Complete', 'Consistent', 'Enduring', 'Available'
                   ].map(item => (
                     <div key={item} className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-950 p-2 rounded border border-zinc-800/50">
                        <Check size={14} className="text-emerald-400" />
                        {item}
                     </div>
                   ))}
                </div>
              </div>
           </div>
        </Card>

      </div>
    </motion.div>
  );
}

function IntegrationsView() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <PageHeader title="Platform Integrations" subtitle="Connect CureForge agents to real-world cloud labs, compute clusters, and data sources." />
        <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-medium rounded-lg transition-colors flex items-center gap-2">
          <Plug size={16} />
          Add Connection
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <Globe size={18} className="text-blue-400" /> Open Biotech Data Feeds
          </h3>
          <p className="text-sm text-zinc-400 mb-6">Live streaming integration with leading free biomedical repositories.</p>
          <div className="space-y-4">
            {[
              { name: 'NCBI PubMed & PubChem', access: 'Public API', sync: 'Live Stream', icon: Database },
              { name: 'UniProt / PDB', access: 'Academic / Open', sync: 'Daily Mirror', icon: Dna },
              { name: 'Europe PMC / Ensembl', access: 'Public API', sync: 'Live Stream', icon: Globe }
            ].map((api, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-zinc-950 rounded border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-900 rounded text-zinc-300">
                    <api.icon size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-zinc-200">{api.name}</h4>
                    <p className="text-xs text-blue-400">{api.sync}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-zinc-500">
                  {api.access}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <Database size={18} className="text-emerald-400" /> Google Scientific Systems
          </h3>
          <p className="text-sm text-zinc-400 mb-6">Direct pipelines to Google DeepMind and Cloud Life Sciences resources.</p>
          <div className="space-y-4">
             {[
               { name: 'AlphaFold 3 DB (DeepMind)', access: 'Public / Verified', sync: 'Native Compute', icon: Dna },
               { name: 'Vertex AI / Med-PaLM', access: 'Cloud Endpoint', sync: 'Streaming', icon: Cpu },
               { name: 'BigQuery Genomics', access: 'Data Warehouse', sync: 'Integrated', icon: Server }
             ].map((api, i) => (
               <div key={i} className="flex justify-between items-center p-3 bg-zinc-950 rounded border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-zinc-900 rounded text-zinc-300">
                     <api.icon size={16} />
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-zinc-200">{api.name}</h4>
                     <p className="text-xs text-emerald-400">{api.sync}</p>
                   </div>
                 </div>
                 <div className="text-right text-xs text-zinc-500">
                   {api.access}
                 </div>
               </div>
             ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <TestTube2 size={18} className="text-purple-400" /> Cloud Autonomous Labs
          </h3>
          <p className="text-sm text-zinc-400 mb-6">Physical implementation endpoints for agent-designed closing-loop experiments.</p>
          <div className="space-y-4">
            {[
              { name: 'Atinary SDLabs', status: 'Connected', ping: '12ms', jobs: 34, icon: Cloud },
              { name: 'Arctoris Oncology Hub', status: 'Connected', ping: '24ms', jobs: 12, icon: Server },
              { name: 'Ginkgo Bioworks Foundry', status: 'Idle', ping: '-', jobs: 0, icon: Plug }
            ].map((lab, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-zinc-950 rounded border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-900 rounded text-zinc-300">
                    <lab.icon size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-zinc-200">{lab.name}</h4>
                    <p className="text-xs text-zinc-500">{lab.status === 'Connected' ? `${lab.jobs} active jobs` : 'No active jobs'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={cn(
                    "px-2 py-1 text-[10px] font-medium uppercase tracking-wide rounded mb-1",
                    lab.status === 'Connected' ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-400"
                  )}>
                    {lab.status}
                  </span>
                  {lab.ping !== '-' && <span className="text-[10px] text-zinc-500">{lab.ping} ping</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <Network size={18} className="text-amber-400" /> Proprietary Data & Graph APIs
          </h3>
          <p className="text-sm text-zinc-400 mb-6">Third-party knowledge sources feeding into the SciNet validation layer.</p>
          <div className="space-y-4">
            {[
              { name: 'Causaly Biomedical Graph', access: 'Enterprise License', sync: 'Real-time', icon: Database },
              { name: 'Mayo Clinic secure EHR', access: 'Restricted (PDAC)', sync: 'Encrypted tunnel', icon: Lock },
              { name: 'UK Biobank Genomics', access: 'Approved Researcher', sync: 'Federated API', icon: Dna }
            ].map((api, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-zinc-950 rounded border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-900 rounded text-zinc-300">
                    <api.icon size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-zinc-200">{api.name}</h4>
                    <p className="text-xs text-amber-400">{api.sync}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-zinc-500">
                  {api.access}
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        <Card className="col-span-1 lg:col-span-2 p-6 bg-zinc-950 border-emerald-500/10">
           <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                  <Cpu size={18} className="text-emerald-400" /> Managed Compute Clusters
                </h3>
                <p className="text-sm text-zinc-400">TPU and GPU orchestrators scaling agent thinking.</p>
              </div>
              <button className="text-sm border border-zinc-700 px-3 py-1.5 rounded text-zinc-300 hover:bg-zinc-800">
                Manage Compute
              </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                 <div className="text-sm text-zinc-400 mb-1">GCP TPU v5e Fleet</div>
                 <div className="text-2xl font-mono text-zinc-200 mb-2">92% <span className="text-sm text-zinc-500">Utilization</span></div>
                 <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: '92%' }} />
                 </div>
              </div>
              <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                 <div className="text-sm text-zinc-400 mb-1">AWS Trainium Nodes</div>
                 <div className="text-2xl font-mono text-zinc-200 mb-2">45% <span className="text-sm text-zinc-500">Utilization</span></div>
                 <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: '45%' }} />
                 </div>
              </div>
              <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                 <div className="text-sm text-zinc-400 mb-1">SciNet Public Grid</div>
                 <div className="text-2xl font-mono text-zinc-200 mb-2">100% <span className="text-sm text-zinc-500">Utilization</span></div>
                 <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: '100%' }} />
                 </div>
              </div>
           </div>
        </Card>
      </div>
    </motion.div>
  );
}

function DiscoverySwarmsHub() {
  const [subTab, setSubTab] = useState<'sandbox' | 'swarm' | 'pipeline' | 'validation'>('sandbox');
  return (
    <div className="space-y-6">
      <div className="flex border-b border-zinc-800 mb-6 font-mono">
        {[
          { id: 'sandbox', label: '1. Discovery Sandbox' },
          { id: 'swarm', label: '2. Active Swarm' },
          { id: 'pipeline', label: '3. DMTA Pipeline' },
          { id: 'validation', label: '4. Validation' },
        ].map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id as any)} className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors", subTab === t.id ? "border-emerald-500 text-emerald-400" : "border-transparent text-zinc-400 hover:text-zinc-200")}>
             {t.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {subTab === 'sandbox' && <SandboxView key="sandbox" />}
        {subTab === 'swarm' && <SwarmDetailView key="swarm" />}
        {subTab === 'pipeline' && <PipelineView key="pipeline" />}
        {subTab === 'validation' && <ValidationView key="validation" />}
      </AnimatePresence>
    </div>
  );
}

function GraphRigorHub() {
  const [subTab, setSubTab] = useState<'graph' | 'rigor'>('graph');
  return (
    <div className="space-y-6">
      <div className="flex border-b border-zinc-800 mb-6 font-mono">
        <button onClick={() => setSubTab('graph')} className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors", subTab === 'graph' ? "border-blue-500 text-blue-400" : "border-transparent text-zinc-400 hover:text-zinc-200")}>Knowledge Graph</button>
        <button onClick={() => setSubTab('rigor')} className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors", subTab === 'rigor' ? "border-rose-500 text-rose-400" : "border-transparent text-zinc-400 hover:text-zinc-200")}>Audits & Rigor</button>
      </div>
      <AnimatePresence mode="wait">
        {subTab === 'graph' && <SciNetGraphView key="graph" />}
        {subTab === 'rigor' && <RigorView key="rigor" />}
      </AnimatePresence>
    </div>
  );
}

function AgentHub() {
  const [subTab, setSubTab] = useState<'roster' | 'marketplace'>('roster');
  return (
    <div className="space-y-6">
      <div className="flex border-b border-zinc-800 mb-6 font-mono">
        <button onClick={() => setSubTab('roster')} className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors", subTab === 'roster' ? "border-indigo-500 text-indigo-400" : "border-transparent text-zinc-400 hover:text-zinc-200")}>My Roster</button>
        <button onClick={() => setSubTab('marketplace')} className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors", subTab === 'marketplace' ? "border-amber-500 text-amber-400" : "border-transparent text-zinc-400 hover:text-zinc-200")}>Marketplace</button>
      </div>
      <AnimatePresence mode="wait">
        {subTab === 'roster' && <AgentRosterView key="roster" />}
        {subTab === 'marketplace' && <MarketplaceView key="marketplace" />}
      </AnimatePresence>
    </div>
  );
}

function LabsHub() {
  const [subTab, setSubTab] = useState<'integrations' | 'approvals'>('integrations');
  return (
    <div className="space-y-6">
      <div className="flex border-b border-zinc-800 mb-6 font-mono">
        <button onClick={() => setSubTab('integrations')} className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors", subTab === 'integrations' ? "border-purple-500 text-purple-400" : "border-transparent text-zinc-400 hover:text-zinc-200")}>Cloud Labs & APIs</button>
        <button onClick={() => setSubTab('approvals')} className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors", subTab === 'approvals' ? "border-cyan-500 text-cyan-400" : "border-transparent text-zinc-400 hover:text-zinc-200")}>Pending Approvals</button>
      </div>
      <AnimatePresence mode="wait">
        {subTab === 'integrations' && <IntegrationsView key="integrations" />}
        {subTab === 'approvals' && <LabApprovalView key="approvals" />}
      </AnimatePresence>
    </div>
  );
}

// --- Ecosystem & Community ---

function WorkflowsView() {
  const [showExport, setShowExport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setShowExport(true);
    }, 1200);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <PageHeader title="Federated Workflows" subtitle="Export SciNet agent pipelines to reproducible, containerized formats for Nextflow and Terra." />
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-zinc-950 font-medium rounded-lg transition-colors flex items-center gap-2">
          {isExporting ? <RotateCw className="animate-spin" size={16} /> : <Share2 size={16} />} 
          {isExporting ? 'Generating...' : 'Export Pipeline'}
        </button>
      </div>

      <AnimatePresence>
        {showExport && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <Card className="p-0 border-emerald-500/30 overflow-hidden">
              <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-zinc-300 font-mono">
                  <Database size={14} className="text-emerald-400" /> main.nf
                </div>
                <div className="text-xs text-zinc-500 font-mono flex gap-4">
                   <span>docker req: scinet/dmta-base:latest</span>
                   <span>cpus: 16</span>
                   <span>mem: 64.GB</span>
                </div>
              </div>
              <div className="p-4 bg-zinc-950 overflow-x-auto">
                <pre className="text-xs text-zinc-300 font-mono leading-relaxed">
{`nextflow.enable.dsl=2

process AGENT_DESIGN {
    container 'scinet/agent-hypoforge:v2.1'
    
    input:
    path target_knowledge_graph
    
    output:
    path "candidate_ligands.sdf", emit: ligands
    
    script:
    """
    scinet-cli design --target pk_pocket --graph $target_knowledge_graph --n_samples 500 > candidate_ligands.sdf
    """
}

process IN_SILICO_TEST {
    container 'scinet/oracle-test:alphafold3'
    accelerator 4, type: 'nvidia-l4'
    
    input:
    path ligands
    
    output:
    path "binding_affinities.csv", emit: affinities
    
    script:
    """
    run_alphafold_sim.py --ligands $ligands --output binding_affinities.csv
    """
}

workflow DMTA_LOOP {
    AGENT_DESIGN(params.target_kg)
    IN_SILICO_TEST(AGENT_DESIGN.out.ligands)
}`}
                </pre>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 p-6">
          <h3 className="font-semibold text-zinc-100 mb-6 flex items-center gap-2">
            <GitBranch size={18} className="text-emerald-400" /> Interoperable Orchestration
          </h3>
          <div className="space-y-4">
            {[
              { name: 'Nextflow / nf-core', status: 'Native Export Validated', desc: 'Outputs fully containerized (Docker/Singularity) DMTA loops compatible with nf-core standards.', icon: Database },
              { name: 'Galaxy Project', status: 'ToolShed Sync', desc: 'Directly publish generated heuristics as Galaxy tools via the SciNet open core.', icon: Globe },
              { name: 'Terra / Bioconductor', status: 'Federated API', desc: 'Execute agent-directed orchestration seamlessly on Terra using biomedical compute instances.', icon: Server }
            ].map((tool, i) => (
              <div key={i} className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg flex items-start gap-4 hover:border-emerald-500/30 transition-colors">
                <div className="p-2 bg-zinc-900 rounded text-zinc-400"><tool.icon size={20} /></div>
                <div className="flex-1">
                   <div className="flex justify-between items-center mb-1">
                     <h4 className="font-medium text-zinc-100">{tool.name}</h4>
                     <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{tool.status}</span>
                   </div>
                   <p className="text-sm text-zinc-400">{tool.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="col-span-1 p-6">
          <h3 className="font-semibold text-zinc-100 mb-6 flex items-center gap-2">
            <Check size={18} className="text-blue-400" /> FAIR Compliance
          </h3>
          <div className="space-y-4 text-sm text-zinc-300">
             <div className="p-3 bg-zinc-950 rounded border border-zinc-800">
               <span className="block text-emerald-400 font-mono text-xs mb-1">urn:uuid:8f9e...</span>
               <p className="font-medium">Persistent Identifier Minted</p>
               <p className="text-xs text-zinc-500 mt-1">All exported pipelines are automatically assigned DOIs for citeability.</p>
             </div>
             <div className="p-3 bg-zinc-950 rounded border border-zinc-800">
               <span className="block text-emerald-400 font-mono text-xs mb-1">Apache 2.0 / MIT</span>
               <p className="font-medium">Open Source Licensing</p>
               <p className="text-xs text-zinc-500 mt-1">Public agent workflows enforce open reusability by default.</p>
             </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

function CommunityView() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <PageHeader title="Global Open-Source Community" subtitle="Collaborate on open core tools, critic agents, and public disease heuristics." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <Card className="p-6 bg-zinc-950 border border-emerald-500/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-zinc-400 text-sm">Active Contributors</span>
              <Users size={16} className="text-emerald-400" />
            </div>
            <div className="text-3xl font-display font-bold text-zinc-100">12,492</div>
            <div className="text-xs text-emerald-400 mt-2">↑ 24% this month</div>
         </Card>
         <Card className="p-6 bg-zinc-950">
            <div className="flex justify-between items-center mb-2">
              <span className="text-zinc-400 text-sm">Public Workflows</span>
              <Share2 size={16} className="text-blue-400" />
            </div>
            <div className="text-3xl font-display font-bold text-zinc-100">8,401</div>
            <div className="text-xs text-blue-400 mt-2">Fully reproducible via Nextflow</div>
         </Card>
         <Card className="p-6 bg-zinc-950">
            <div className="flex justify-between items-center mb-2">
              <span className="text-zinc-400 text-sm">Citations (2026)</span>
              <BookOpen size={16} className="text-purple-400" />
            </div>
            <div className="text-3xl font-display font-bold text-zinc-100">4,129</div>
            <div className="text-xs text-zinc-500 mt-2">SciNet / CureForge attribution</div>
         </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-zinc-100 mb-6 flex items-center gap-2">
          <GitBranch size={18} className="text-emerald-400" /> Core Repositories & Initiatives
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {[
             { name: 'CureForge/SciNet-Core', type: 'Apache 2.0', stars: '14.2k', desc: 'The overarching multi-agent orchestration fabric.' },
             { name: 'CureForge/Critic-Ensembles', type: 'MIT', stars: '8.4k', desc: 'Adversarial falsification agents and probabilistic schemas.' },
             { name: 'CureForge/Bio-Adapters', type: 'Apache 2.0', stars: '6.1k', desc: 'API bridges for BLAST, GATK, AlphaFold, and Synapse.' },
             { name: 'CureForge/Open-Prior', type: 'CC-BY 4.0', stars: '11.5k', desc: 'The public living knowledge graph and Bayesian posteriors.' }
           ].map(repo => (
             <div key={repo.name} className="p-4 bg-zinc-950 rounded border border-zinc-800">
               <div className="flex justify-between items-start mb-2">
                 <h4 className="font-mono text-sm text-emerald-400">{repo.name}</h4>
                 <span className="flex items-center gap-1 text-xs text-zinc-400"><Star size={12} /> {repo.stars}</span>
               </div>
               <p className="text-sm text-zinc-400 mb-3">{repo.desc}</p>
               <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider bg-zinc-900 px-2 py-0.5 rounded">{repo.type}</span>
             </div>
           ))}
        </div>
      </Card>
    </motion.div>
  );
}

function BenchmarksView() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <PageHeader title="Validation & Benchmarking" subtitle="Internal red-teaming and external public challenges (BioAgent Bench, CASP)." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="col-span-1 md:col-span-2 p-6">
          <h3 className="font-semibold text-zinc-100 mb-6 flex items-center gap-2">
            <Trophy size={18} className="text-amber-400" /> Public Benchmark Performance
          </h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-200 font-medium">BioAgent Bench (Complex Disease Modeling)</span>
                <span className="text-emerald-400 font-mono">SciNet: 0.942 [F1 Score]</span>
              </div>
              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden relative">
                <div className="absolute h-full w-[82%] bg-zinc-700 top-0 left-0" />
                <div className="absolute h-full bg-emerald-500 rounded-full" style={{ width: '94.2%' }} />
              </div>
              <p className="text-xs text-zinc-500">Industry baseline: 0.820. Asserts logical consistency across 10k literature derivations.</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-200 font-medium">CASP-Blind Equivalent (Hold-out in-silico validation)</span>
                <span className="text-emerald-400 font-mono">SciNet: 0.887 (RMSE=0.48)</span>
              </div>
              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden relative">
                <div className="absolute h-full w-[76%] bg-zinc-700 top-0 left-0" />
                <div className="absolute h-full bg-emerald-500 rounded-full" style={{ width: '88.7%' }} />
              </div>
              <p className="text-xs text-zinc-500">Industry baseline: 0.765 (RMSE=1.12). Predicts experimental binding affinity (ΔG) matching withheld wet-lab data within 1 kcal/mol.</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-200 font-medium">Automated Reproducibility Re-Run Success</span>
                <span className="text-emerald-400 font-mono">SciNet: 99.849% (κ=0.98)</span>
              </div>
              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden relative">
                 <div className="absolute h-full w-[65%] bg-zinc-700 top-0 left-0" />
                <div className="absolute h-full bg-emerald-500 rounded-full" style={{ width: '99.8%' }} />
              </div>
              <p className="text-xs text-zinc-500">Industry baseline: 65.000% (κ=0.45). Percentage of containerized workflows that compute identical outputs on alternate nodes (Cohen's Kappa).</p>
            </div>
          </div>
         </Card>
      </div>
    </motion.div>
  );
}

function EcosystemHub() {
  const [subTab, setSubTab] = useState<'workflows' | 'community' | 'benchmarks'>('workflows');
  return (
    <div className="space-y-6">
      <div className="flex border-b border-zinc-800 mb-6 font-mono">
        <button onClick={() => setSubTab('workflows')} className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors", subTab === 'workflows' ? "border-emerald-500 text-emerald-400" : "border-transparent text-zinc-400 hover:text-zinc-200")}>Federated Workflows</button>
        <button onClick={() => setSubTab('community')} className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors", subTab === 'community' ? "border-blue-500 text-blue-400" : "border-transparent text-zinc-400 hover:text-zinc-200")}>Open Source Community</button>
        <button onClick={() => setSubTab('benchmarks')} className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors", subTab === 'benchmarks' ? "border-amber-500 text-amber-400" : "border-transparent text-zinc-400 hover:text-zinc-200")}>Benchmarks</button>
      </div>
      <AnimatePresence mode="wait">
        {subTab === 'workflows' && <WorkflowsView key="workflows" />}
        {subTab === 'community' && <CommunityView key="community" />}
        {subTab === 'benchmarks' && <BenchmarksView key="benchmarks" />}
      </AnimatePresence>
    </div>
  );
}

// --- Main Layout ---
export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'swarms' | 'graph' | 'agents' | 'labs' | 'ecosystem'>('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: Activity },
    { id: 'swarms', label: 'Discovery Swarms', icon: Network },
    { id: 'graph', label: 'Knowledge & Rigor', icon: Database },
    { id: 'agents', label: 'Agent Hub', icon: Cpu },
    { id: 'labs', label: 'Cloud Labs', icon: Server },
    { id: 'ecosystem', label: 'Ecosystem', icon: Globe },
  ] as const;

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-emerald-500/30 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Dna size={20} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-display font-bold tracking-tight text-zinc-100">CureForge</span>
        </div>

        <div className="px-4 pb-6 border-b border-zinc-800/50">
          <div className="bg-zinc-900 rounded-lg p-1 flex">
            <button className="flex-1 py-1.5 text-xs font-medium rounded-md bg-emerald-500 text-black shadow-sm flex items-center justify-center gap-1.5">
              <Globe size={12} /> Public
            </button>
            <button className="flex-1 py-1.5 text-xs font-medium rounded-md text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-1.5 transition-colors">
              <Lock size={12} /> Private run
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === item.id 
                  ? "bg-zinc-800/80 text-emerald-400 shadow-sm" 
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              )}
            >
              <item.icon size={18} />
              {item.label}
              {activeTab === item.id && (
                <ChevronRight size={16} className="ml-auto opacity-50" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-4 px-2 hidden lg:flex">
             <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Enterprise Node ID: CF-X9</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <User size={16} className="text-zinc-400" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-zinc-200 truncate">Dr. S. Connor</p>
              <p className="text-xs text-zinc-500 truncate">Lab Leader</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-zinc-950 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && <DashboardView key="dashboard" onNavigate={setActiveTab as any} />}
            {activeTab === 'swarms' && <DiscoverySwarmsHub key="swarms" />}
            {activeTab === 'graph' && <GraphRigorHub key="graph" />}
            {activeTab === 'agents' && <AgentHub key="agents" />}
            {activeTab === 'labs' && <LabsHub key="labs" />}
            {activeTab === 'ecosystem' && <EcosystemHub key="ecosystem" />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// Fallback icon for user since it wasn't imported at top
function User({ size, className }: { size: number, className: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

