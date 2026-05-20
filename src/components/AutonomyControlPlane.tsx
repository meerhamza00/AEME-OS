import React, { useState } from 'react';
import { Activity, Settings2, RefreshCcw } from 'lucide-react';

export function AutonomyControlPlane() {
   const [running, setRunning] = useState(false);
   const [lastRun, setLastRun] = useState<string | null>(null);
   const [result, setResult] = useState<any>(null);

   const triggerCycle = async () => {
      setRunning(true);
      setResult(null);
      try {
         const res = await fetch('/api/autonomy/cycle', { method: 'POST' });
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
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm text-neutral-200">
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
        <div>
          <h2 className="text-sm font-mono text-neutral-300 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-orange-500" />
            Autonomous Control Plane
          </h2>
          <p className="text-xs font-sans text-neutral-500 mt-1 max-w-xl">
            The daemon that monitors your systems 24/7. It detects inefficiencies, formulates actions, and queues them in the Governance Layer.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
             Engine Active
          </span>
          <button 
            onClick={triggerCycle}
            disabled={running}
            className="text-xs bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
            Force Cycle
          </button>
        </div>
      </div>

      <div className="p-6">
         <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
             <div className="flex justify-between items-start border-b border-neutral-800 pb-4 mb-4">
               <div>
                  <h3 className="text-sm font-sans font-medium text-white flex items-center gap-2">
                     Optimization Daemon
                  </h3>
                  <p className="text-xs font-mono text-neutral-500 mt-1">
                     Continuously monitors metrics and queues workflows to Governance Layer.
                  </p>
               </div>
               <div className="text-right">
                  <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest block">Last Cycle</span>
                  <span className="text-sm font-mono text-neutral-300">{lastRun || 'Never'}</span>
               </div>
             </div>
             
             {running ? (
               <div className="flex flex-col items-center justify-center py-6 gap-3">
                 <Activity className="w-8 h-8 text-orange-500 animate-pulse" />
                 <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Executing Optimization Cycle...</span>
               </div>
             ) : result ? (
                <div className="space-y-4">
                  {result.error ? (
                    <div className="p-3 bg-neutral-900 border border-rose-500/20 text-xs font-mono text-rose-400 rounded">
                      {result.error}
                    </div>
                  ) : (
                    <div>
                        <span className="text-xs font-mono text-emerald-400">Cycle Complete. Proposed Action sent to Governance.</span>
                        <div className="mt-3 p-3 bg-neutral-900 border border-neutral-800 rounded text-xs font-mono space-y-2">
                           <p><span className="text-neutral-500">Action:</span> {result.recommendation?.title}</p>
                           <p><span className="text-neutral-500">Risk:</span> {result.recommendation?.riskLevel}</p>
                           <p className="text-neutral-400 mt-2 whitespace-pre-wrap">{result.recommendation?.description}</p>
                        </div>
                    </div>
                  )}
                </div>
             ) : (
               <div className="py-6 text-center">
                 <p className="text-sm font-sans text-neutral-500">System is idle. Waiting for next scheduled interval or manual trigger.</p>
               </div>
             )}
         </div>
      </div>
    </div>
   );
}
