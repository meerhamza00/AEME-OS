import React, { useState, useEffect } from 'react';
import { Activity, Settings2, RefreshCcw } from 'lucide-react';

export function AutonomyControlPlane() {
   const [running, setRunning] = useState(false);
   const [lastRun, setLastRun] = useState<string | null>(null);
   const [result, setResult] = useState<any>(null);
   
   // New configuration states
   const [cycleFrequency, setCycleFrequency] = useState(() => localStorage.getItem('aeme_cycle_freq') || 'hourly');
   const [minRiskLevel, setMinRiskLevel] = useState(() => localStorage.getItem('aeme_min_risk') || 'Low');

   useEffect(() => {
     localStorage.setItem('aeme_cycle_freq', cycleFrequency);
     localStorage.setItem('aeme_min_risk', minRiskLevel);
   }, [cycleFrequency, minRiskLevel]);

   const triggerCycle = async () => {
      setRunning(true);
      setResult(null);
      try {
         // In a real app we would pass cycleFrequency and minRiskLevel to configure the backend daemon.
         const res = await fetch('/api/autonomy/cycle', { 
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ cycleFrequency, minRiskLevel })
         });
         const data = await res.json();
         setResult(data);
         setLastRun(new Date().toLocaleTimeString());
      } catch (err: any) {
         setResult({ error: err.message });
      } finally {
         setRunning(false);
      }
   };

   return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm text-neutral-200 h-full flex flex-col transition-all overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
      
      <div className="p-[clamp(1rem,1.5vw,1.5rem)] border-b border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900/50 z-10 relative">
        <div>
          <h2 className="text-[clamp(0.875rem,1.2vw,1rem)] font-mono text-neutral-300 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-orange-500" />
            Autonomous Control Plane
          </h2>
          <p className="text-[clamp(0.7rem,1vw,0.75rem)] font-sans text-neutral-500 mt-1 max-w-xl">
            The daemon that monitors your systems. It detects inefficiencies and queues them in the Governance Layer.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <span className="flex flex-col items-start sm:items-end gap-1">
             <span className="flex items-center gap-1.5 text-[clamp(0.65rem,0.8vw,0.7rem)] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Engine Active
             </span>
          </span>
          <button 
            onClick={triggerCycle}
            disabled={running}
            className="w-full sm:w-auto text-[clamp(0.7rem,1vw,0.75rem)] bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
            Force Cycle
          </button>
        </div>
      </div>

      <div className="p-[clamp(1rem,1.5vw,1.5rem)] space-y-[clamp(1rem,1.5vw,1.5rem)] flex-1 overflow-auto custom-scrollbar z-10 relative">
         {/* Configuration Panel */}
         <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4 container-type-inline-size">
           <div className="bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50">
             <label className="block text-[clamp(0.65rem,0.8vw,0.7rem)] font-mono text-neutral-500 uppercase tracking-widest mb-2">
               Cycle Frequency
             </label>
             <select 
               value={cycleFrequency} 
               onChange={(e) => setCycleFrequency(e.target.value)}
               className="w-full bg-neutral-900 border border-neutral-800 text-xs p-2 rounded-md focus:ring-1 focus:ring-orange-500 outline-none text-neutral-200 transition-colors hover:border-neutral-700"
             >
               <option value="hourly">Hourly</option>
               <option value="daily">Daily</option>
               <option value="weekly">Weekly</option>
             </select>
           </div>
           <div className="bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50">
             <label className="block text-[clamp(0.65rem,0.8vw,0.7rem)] font-mono text-neutral-500 uppercase tracking-widest mb-2">
               Minimum Risk Level
             </label>
             <select 
               value={minRiskLevel} 
               onChange={(e) => setMinRiskLevel(e.target.value)}
               className="w-full bg-neutral-900 border border-neutral-800 text-xs p-2 rounded-md focus:ring-1 focus:ring-orange-500 outline-none text-neutral-200 transition-colors hover:border-neutral-700"
             >
               <option value="Low">Low (Propose All)</option>
               <option value="Medium">Medium (Propose Medium/High)</option>
               <option value="High">High (Propose High Only)</option>
             </select>
           </div>
         </div>

         <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-[clamp(1rem,1.5vw,1.25rem)] shadow-sm hover:border-neutral-700 transition-colors">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-4 mb-4 gap-4">
               <div>
                  <h3 className="text-[clamp(0.75rem,1vw,0.875rem)] font-sans font-medium text-white flex items-center gap-2">
                     Optimization Daemon
                  </h3>
                  <p className="text-[clamp(0.65rem,0.8vw,0.7rem)] font-mono text-neutral-500 mt-1">
                     Continuously monitors metrics and queues workflows to Governance Layer.
                  </p>
               </div>
               <div className="text-left sm:text-right">
                  <span className="text-[clamp(0.6rem,0.7vw,0.65rem)] font-mono text-neutral-500 uppercase tracking-widest block">Last Cycle</span>
                  <span className="text-xs font-mono text-neutral-300">{lastRun || 'Never'}</span>
               </div>
             </div>
             
             {running ? (
               <div className="flex flex-col items-center justify-center py-8 gap-4 min-h-[150px]">
                 <Activity className="w-8 h-8 text-orange-500 animate-pulse" />
                 <span className="text-[clamp(0.65rem,0.8vw,0.7rem)] font-mono text-neutral-400 uppercase tracking-widest text-center">Executing Optimization Cycle...</span>
               </div>
             ) : result ? (
                <div className="space-y-4 min-h-[150px] flex flex-col justify-center">
                  {result.error ? (
                    <div className="p-4 bg-neutral-900 border border-rose-500/20 text-[13px] font-mono text-rose-400 rounded-lg shadow-inner">
                      {result.error}
                    </div>
                  ) : (
                    <div>
                        <span className="text-xs font-mono text-emerald-400 flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 rounded-full bg-emerald-500/50 flex-shrink-0 animate-pulse"></span>
                          Cycle Complete. Proposed Action sent to Governance.
                        </span>
                        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg text-[13px] font-mono space-y-2 shadow-inner">
                           <p><span className="text-neutral-500">Action:</span> <span className="text-neutral-200">{result.recommendation?.title}</span></p>
                           <p><span className="text-neutral-500">Risk:</span> <span className={`${result.recommendation?.riskLevel === 'High' ? 'text-rose-400' : 'text-yellow-400'}`}>{result.recommendation?.riskLevel}</span></p>
                           <p className="text-neutral-400 mt-3 whitespace-pre-wrap leading-relaxed border-t border-neutral-800/50 pt-2">{result.recommendation?.description}</p>
                        </div>
                    </div>
                  )}
                </div>
             ) : (
               <div className="py-12 text-center flex items-center justify-center min-h-[150px]">
                 <p className="text-[clamp(0.75rem,1.2vw,0.875rem)] font-sans text-neutral-500">System is idle. Waiting for next scheduled interval or manual trigger.</p>
               </div>
             )}
         </div>
      </div>
    </div>
   );
}
