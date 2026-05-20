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
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm text-neutral-200">
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-mono text-neutral-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-500" />
            Analytics Engine
          </h2>
          <p className="text-xs font-sans text-neutral-500 mt-1 max-w-xl">
            Diagnoses your raw PPC metrics to detect hidden inefficiencies (like bleeding campaigns) and surfaces structural opportunities for scale.
          </p>
        </div>
        <button 
          onClick={runAnalysis}
          disabled={analyzing}
          className="text-xs bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 ${analyzing ? 'animate-pulse' : ''}`} />
          {analyzing ? 'Analyzing Data...' : 'Run Diagnostics'}
        </button>
      </div>

      <div className="p-6">
        {error && (
          <div className="p-3 mb-4 bg-neutral-950 border border-neutral-800 text-xs font-mono text-rose-400 rounded break-words">
            {'> Error:'} {error}
          </div>
        )}

        {!result && !analyzing && !error && (
          <div className="text-center py-8 text-neutral-500 text-sm font-mono border border-dashed border-neutral-800 rounded bg-neutral-950/50">
            Engine standby. Run diagnostics to analyze PPC data.
          </div>
        )}

        {result && (
          <div className="space-y-6">
             <div className="flex items-center gap-3">
               <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">System Severity:</span>
               <span className={`px-2 py-0.5 rounded text-xs font-mono uppercase border ${
                 result.severity === 'high' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                 result.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
               }`}>
                 {result.severity}
               </span>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg space-y-3">
                 <h4 className="text-xs font-mono text-rose-400 flex items-center gap-2 border-b border-neutral-800 pb-2">
                   <AlertCircle className="w-4 h-4" /> Detected Inefficiencies
                 </h4>
                 {result.issues.length > 0 ? (
                    <ul className="space-y-2">
                      {result.issues.map((issue, i) => (
                        <li key={i} className="text-sm font-sans text-neutral-300 pl-3 border-l-2 border-rose-500/30 py-1 leading-snug">
                          {issue}
                        </li>
                      ))}
                    </ul>
                 ) : (
                   <p className="text-sm font-mono text-neutral-500">No major issues detected.</p>
                 )}
               </div>

               <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg space-y-3">
                 <h4 className="text-xs font-mono text-emerald-400 flex items-center gap-2 border-b border-neutral-800 pb-2">
                   <Lightbulb className="w-4 h-4" /> Opportunities
                 </h4>
                 {result.opportunities.length > 0 ? (
                    <ul className="space-y-2">
                      {result.opportunities.map((opp, i) => (
                        <li key={i} className="text-sm font-sans text-neutral-300 pl-3 border-l-2 border-emerald-500/30 py-1 leading-snug">
                          {opp}
                        </li>
                      ))}
                    </ul>
                 ) : (
                   <p className="text-sm font-mono text-neutral-500">No apparent opportunities.</p>
                 )}
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
