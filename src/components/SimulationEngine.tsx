import React, { useState } from 'react';
import { Network, Zap, Target, AlertTriangle } from 'lucide-react';

interface SimulationResult {
  predicted_roas: number;
  predicted_sales: number;
  risk_level: string;
  confidence_score: number;
  insights: string[];
}

export function SimulationEngine() {
  const [scenario, setScenario] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenario) return;
    setSimulating(true);
    setError(null);
    try {
      const res = await fetch('/api/simulation/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm text-neutral-200 h-full flex flex-col transition-all overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

      <div className="p-[clamp(1rem,1.5vw,1.5rem)] border-b border-neutral-800 flex items-center justify-between z-10 relative">
        <div>
          <h2 className="text-[clamp(0.875rem,1.2vw,1rem)] font-mono text-neutral-300 flex items-center gap-2">
            <Network className="w-4 h-4 text-purple-500" />
            Simulation Engine
          </h2>
          <p className="text-[clamp(0.7rem,1vw,0.75rem)] font-sans text-neutral-500 mt-1 max-w-xl">
             Simulate risk-adjusted outcomes before committing real ad-spend. Our stochastic Monte Carlo models test multiple "what-if" scenarios based on your exact ROAS curves.
          </p>
        </div>
      </div>

      <div className="p-[clamp(1rem,1.5vw,1.5rem)] flex-1 overflow-auto custom-scrollbar z-10 relative flex flex-col justify-start">
        <form onSubmit={runSimulation} className="flex flex-col sm:flex-row gap-2 mb-[clamp(1.5rem,2vw,2rem)]">
          <input 
            type="text" 
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="e.g. 'What if I increase the budget by 20%?'"
            className="flex-1 bg-neutral-950 border border-neutral-800 text-[13px] p-3 rounded-lg focus:ring-1 focus:ring-purple-500 outline-none text-neutral-200 font-sans transition-colors focus:bg-neutral-900 w-full"
          />
          <button 
            type="submit"
            disabled={simulating || !scenario}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-6 py-3 rounded-lg text-[clamp(0.7rem,1vw,0.75rem)] font-mono transition-all text-white flex items-center justify-center gap-2 shadow-sm active:scale-95 uppercase tracking-wide shrink-0"
          >
            {simulating ? <Zap className="w-4 h-4 animate-pulse" /> : <Target className="w-4 h-4" />}
            {simulating ? 'Simulating...' : 'Run Scenario'}
          </button>
        </form>

        {error && (
          <div className="p-3 mb-[clamp(1rem,1.5vw,1.5rem)] bg-neutral-950 border border-neutral-800 text-[11px] sm:text-xs font-mono text-rose-400 rounded-lg break-words shadow-inner flex items-start gap-2">
            <span className="text-rose-500">{'>'}</span> 
            <span>{error}</span>
          </div>
        )}

        {!result && !simulating && !error && (
          <div className="text-center py-12 flex-1 flex flex-col items-center justify-center text-[clamp(0.75rem,1.2vw,0.875rem)] font-mono text-neutral-500 border border-dashed border-neutral-800 rounded-xl bg-neutral-950/50 min-h-[150px]">
             Waiting for variable inputs. Run Monte Carlo simulation scenarios based on current ad data.
          </div>
        )}

        {result && (
          <div className="space-y-[clamp(1rem,1.5vw,1.5rem)] animate-in fade-in slide-in-from-bottom-2 container-type-inline-size">
             <div className="grid grid-cols-2 @md:grid-cols-4 gap-[clamp(0.75rem,2vw,1rem)]">
                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl flex flex-col items-center text-center justify-center shadow-sm hover:border-neutral-700 transition-colors">
                  <span className="text-[10px] sm:text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1 title-height">Predicted ROAS</span>
                  <span className="text-[clamp(1.25rem,2vw,1.75rem)] font-sans font-medium text-emerald-400 tracking-tight">{result.predicted_roas.toFixed(2)}x</span>
                </div>
                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl flex flex-col items-center text-center justify-center shadow-sm hover:border-neutral-700 transition-colors">
                  <span className="text-[10px] sm:text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1 title-height">Proj. Sales</span>
                  <span className="text-[clamp(1.25rem,2vw,1.75rem)] font-sans font-medium text-indigo-400 tracking-tight">${result.predicted_sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl flex flex-col items-center text-center justify-center shadow-sm hover:border-neutral-700 transition-colors">
                  <span className="text-[10px] sm:text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1 title-height">Risk Level</span>
                  <span className={`px-3 py-1 rounded-md text-[10px] font-mono uppercase mt-1 border tracking-widest ${
                    result.risk_level === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                    result.risk_level === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {result.risk_level}
                  </span>
                </div>
                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl flex flex-col items-center text-center justify-center relative overflow-hidden shadow-sm hover:border-neutral-700 transition-colors">
                  <span className="text-[10px] sm:text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1 title-height">Confidence</span>
                  <span className="text-[clamp(1.25rem,2vw,1.75rem)] font-sans font-medium text-white tracking-tight">{result.confidence_score}%</span>
                   <div 
                      className="absolute bottom-0 left-0 h-1 bg-purple-500 transition-all duration-1000 ease-in-out" 
                      style={{ width: `${result.confidence_score}%` }} 
                   />
                </div>
             </div>

             <div className="bg-neutral-950 border border-neutral-800 p-[clamp(1rem,1.5vw,1.5rem)] rounded-xl space-y-4 shadow-sm hover:border-neutral-700 transition-colors">
                 <h4 className="text-[clamp(0.7rem,1vw,0.75rem)] font-mono text-purple-400 flex items-center gap-2 border-b border-neutral-800 pb-2 uppercase tracking-widest">
                   <AlertTriangle className="w-3.5 h-3.5" /> Probabilistic Outcomes & Insights
                 </h4>
                 <ul className="space-y-3">
                    {result.insights.map((insight, i) => (
                      <li key={i} className="text-[13px] font-sans text-neutral-300 pl-3 border-l-2 border-purple-500/50 py-1 leading-relaxed">
                        {insight}
                      </li>
                    ))}
                 </ul>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
