import React, { useState } from 'react';
import { Activity, AlertCircle, Lightbulb, Play } from 'lucide-react';

interface AnalysisResult {
  issues: string[];
  opportunities: string[];
  severity: "low" | "medium" | "high";
}

export function AnalyticsEngine() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch('/api/analytics/analyze');
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm text-neutral-200 h-full flex flex-col transition-all overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

      <div className="p-[clamp(1rem,1.5vw,1.5rem)] border-b border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10 relative">
        <div>
          <h2 className="text-[clamp(0.875rem,1.2vw,1rem)] font-mono text-neutral-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-500" />
            Analytics Engine
          </h2>
          <p className="text-[clamp(0.7rem,1vw,0.75rem)] font-sans text-neutral-500 mt-1 max-w-xl">
            Diagnoses your raw PPC metrics to detect hidden inefficiencies (like bleeding campaigns) and surfaces structural opportunities for scale.
          </p>
        </div>
        <button 
          onClick={runAnalysis}
          disabled={analyzing}
          className="w-full sm:w-auto text-[clamp(0.7rem,1vw,0.75rem)] bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 active:scale-95"
        >
          <Play className={`w-3.5 h-3.5 ${analyzing ? 'animate-pulse' : ''}`} />
          {analyzing ? 'Analyzing Data...' : 'Run Diagnostics'}
        </button>
      </div>

      <div className="p-[clamp(1rem,1.5vw,1.5rem)] flex-1 overflow-auto custom-scrollbar z-10 relative">
        {error && (
          <div className="p-3 mb-4 bg-neutral-950 border border-neutral-800 text-xs font-mono text-rose-400 rounded break-words">
            {'> Error:'} {error}
          </div>
        )}

        {!result && !analyzing && !error && (
          <div className="text-center py-8 text-[clamp(0.75rem,1.2vw,0.875rem)] font-mono text-neutral-500 border border-dashed border-neutral-800 rounded-lg bg-neutral-950/50 flex items-center justify-center min-h-[120px]">
            Engine standby. Run diagnostics to analyze PPC data.
          </div>
        )}

        {result && (
          <div className="space-y-[clamp(1rem,1.5vw,1.5rem)]">
             <div className="flex items-center gap-3 bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50">
               <span className="text-[clamp(0.65rem,0.8vw,0.7rem)] font-mono text-neutral-500 uppercase tracking-widest">System Severity:</span>
               <span className={`px-2 py-1 rounded-md text-[10px] font-mono uppercase border ${
                 result.severity === 'high' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                 result.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
               }`}>
                 {result.severity}
               </span>
             </div>

             <div className="grid grid-cols-1 @md:grid-cols-2 gap-[clamp(1rem,1.5vw,1.5rem)] container-type-inline-size">
               <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-4 hover:border-neutral-700 transition-colors shadow-sm">
                 <h4 className="text-[clamp(0.7rem,1vw,0.75rem)] font-mono text-rose-400 flex items-center gap-2 border-b border-neutral-800 pb-2 uppercase tracking-widest">
                   <AlertCircle className="w-3.5 h-3.5" /> Detected Inefficiencies
                 </h4>
                 {result.issues.length > 0 ? (
                    <ul className="space-y-3">
                      {result.issues.map((issue, i) => (
                        <li key={i} className="text-[13px] font-sans text-neutral-300 pl-3 border-l-2 border-rose-500/50 py-1 leading-relaxed">
                          {issue}
                        </li>
                      ))}
                    </ul>
                 ) : (
                   <div className="text-[13px] font-mono text-neutral-500 py-2">No major issues detected.</div>
                 )}
               </div>

               <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-4 hover:border-neutral-700 transition-colors shadow-sm">
                 <h4 className="text-[clamp(0.7rem,1vw,0.75rem)] font-mono text-emerald-400 flex items-center gap-2 border-b border-neutral-800 pb-2 uppercase tracking-widest">
                   <Lightbulb className="w-3.5 h-3.5" /> Opportunities
                 </h4>
                 {result.opportunities.length > 0 ? (
                    <ul className="space-y-3">
                      {result.opportunities.map((opp, i) => (
                        <li key={i} className="text-[13px] font-sans text-neutral-300 pl-3 border-l-2 border-emerald-500/50 py-1 leading-relaxed">
                          {opp}
                        </li>
                      ))}
                    </ul>
                 ) : (
                   <div className="text-[13px] font-mono text-neutral-500 py-2">No apparent opportunities.</div>
                 )}
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
