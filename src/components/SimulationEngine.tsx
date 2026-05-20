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
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm text-neutral-200">
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-mono text-neutral-300 flex items-center gap-2">
            <Network className="w-4 h-4 text-purple-500" />
            Simulation Engine
          </h2>
          <p className="text-xs font-sans text-neutral-500 mt-1 max-w-xl">
             Simulate risk-adjusted outcomes before committing real ad-spend. Our stochastic Monte Carlo models test multiple "what-if" scenarios based on your exact ROAS curves.
          </p>
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={runSimulation} className="flex gap-2 mb-6">
          <input 
            type="text" 
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="e.g. 'What if I increase the budget of SP - Core Products by 20%?'"
            className="flex-1 bg-neutral-950 border border-neutral-800 text-sm p-3 rounded-lg focus:ring-1 focus:ring-purple-500 outline-none text-neutral-200 font-sans"
          />
          <button 
            type="submit"
            disabled={simulating || !scenario}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-6 py-2 rounded-lg text-xs font-mono transition-colors text-white flex items-center gap-2 shadow-md"
          >
            {simulating ? <Zap className="w-4 h-4 animate-pulse" /> : <Target className="w-4 h-4" />}
            {simulating ? 'Simulating...' : 'Run Scenario'}
          </button>
        </form>

        {error && (
          <div className="p-3 mb-4 bg-neutral-950 border border-neutral-800 text-xs font-mono text-rose-400 rounded break-words">
            {'> Error:'} {error}
          </div>
        )}

        {!result && !simulating && !error && (
          <div className="text-center py-8 text-neutral-500 text-sm font-mono border border-dashed border-neutral-800 rounded bg-neutral-950/50">
            Awaiting variable inputs. Run Monte Carlo simulation scenarios based on current ad data.
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg flex flex-col items-center text-center justify-center">
                  <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1">Predicted ROAS</span>
                  <span className="text-2xl font-sans font-medium text-emerald-400">{result.predicted_roas.toFixed(2)}x</span>
                </div>
                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg flex flex-col items-center text-center justify-center">
                  <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1">Proj. Sales</span>
                  <span className="text-2xl font-sans font-medium text-indigo-400">${result.predicted_sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg flex flex-col items-center text-center justify-center">
                  <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1">Risk Level</span>
                  <span className={`px-3 py-1 rounded text-xs font-mono uppercase mt-1 border ${
                    result.risk_level === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                    result.risk_level === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {result.risk_level}
                  </span>
                </div>
                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg flex flex-col items-center text-center justify-center relative overflow-hidden">
                  <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1">Confidence</span>
                  <span className="text-2xl font-sans font-medium text-white">{result.confidence_score}%</span>
                   <div 
                      className="absolute bottom-0 left-0 h-1 bg-purple-500" 
                      style={{ width: `${result.confidence_score}%` }} 
                   />
                </div>
             </div>

             <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-lg space-y-4">
                 <h4 className="text-xs font-mono text-purple-400 flex items-center gap-2 border-b border-neutral-800 pb-2">
                   <AlertTriangle className="w-4 h-4" /> Probabilistic Outcomes & Insights
                 </h4>
                 <ul className="space-y-3">
                    {result.insights.map((insight, i) => (
                      <li key={i} className="text-sm font-sans text-neutral-300 pl-3 border-l-2 border-purple-500/30 py-1 leading-relaxed">
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
