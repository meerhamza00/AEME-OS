import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, X, Clock, AlertTriangle } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

interface Workflow {
  id: string;
  title: string;
  description: string;
  action_type: string;
  status: string;
  risk_level: string;
  created_at: string;
}

interface AuditLog {
  id: string;
  workflow_id: string;
  workflow_title: string;
  action: string;
  details: string;
  outcome?: string;
  created_at: string;
}

export function GovernanceLayer() {
  const { user } = useUser();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  
  // Custom mock role state for RBAC
  const [userRole, setUserRole] = useState(() => localStorage.getItem('aeme_user_role') || 'Admin');
  const [minRiskTolerance, setMinRiskTolerance] = useState(() => localStorage.getItem('aeme_risk_tol') || 'Low');

  useEffect(() => {
    localStorage.setItem('aeme_user_role', userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem('aeme_risk_tol', minRiskTolerance);
  }, [minRiskTolerance]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wfRes, logRes] = await Promise.all([
        fetch('/api/governance/pending'),
        fetch('/api/governance/logs')
      ]);
      if (wfRes.ok) setWorkflows((await wfRes.json()).workflows || []);
      if (logRes.ok) setLogs((await logRes.json()).logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInit = async () => {
    setStatusMsg('Initializing DB...');
    try {
      const res = await fetch('/api/governance/init', { method: 'POST' });
      const data = await res.json();
      setStatusMsg(data.message || data.error);
    } catch (e: any) {
      setStatusMsg(e.message);
    }
  };

  const handleWorkflowAction = async (id: string, action: string) => {
    let outcomeStr = '';
    let finalAction = action;

    if (action === 'execute') {
       // Simulate execution api call
       const success = Math.random() > 0.3; // 70% success rate
       if (success) {
          outcomeStr = 'Simulated Execution Success: API Call returned 200 OK. Metric updated.';
       } else {
          finalAction = 'fail';
          outcomeStr = 'Simulated Execution Error: External Platform API Rate Limit Exceeded (429).';
       }
    } else if (action === 'reject') {
       outcomeStr = prompt('Enter reason for rejection (optional):') || 'Rejected by user context override.';
    } else if (action === 'approve') {
       outcomeStr = 'Approved pending manual review or auto-execution queue.';
    }

    try {
      const res = await fetch('/api/governance/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId: id, action: finalAction, userId: user?.id, outcome: outcomeStr })
      });
      if (res.ok) {
        await fetchData(); // Refresh
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Temp fn to just populate some demo workflows
  const seedDemo = async () => {
     await fetch('/api/governance/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           userId: user?.id,
           title: 'Scale "SP - Core Products" by 20%',
           description: 'AI strategy recommends budget increase based on sustained ROAS > 4.0.',
           actionType: 'UPDATE_BUDGET',
           riskLevel: 'Low'
        })
     });
     await fetch('/api/governance/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           userId: user?.id,
           title: 'Pause "SP - Competitor Conquest"',
           description: 'Continuous underperformance detected. ROAS < 1.0 down-trend.',
           actionType: 'PAUSE_CAMPAIGN',
           riskLevel: 'Medium'
        })
     });
     fetchData();
  };

  return (
    <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-xl shadow-sm text-neutral-800 dark:text-neutral-200 h-full flex flex-col transition-all overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

      <div className="p-[clamp(1rem,1.5vw,1.5rem)] border-b border-black/5 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10 relative">
        <div>
          <h2 className="text-[clamp(0.875rem,1.2vw,1rem)] font-mono text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Governance Control
          </h2>
          <p className="text-[clamp(0.7rem,1vw,0.75rem)] font-sans text-neutral-500 dark:text-neutral-500 mt-1 max-w-xl">
             Your safety net. Autonomous operations are held here for human-in-the-loop review. Reject or Approve financial execution actions. An indelible audit log ensures compliance.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={seedDemo}
            className="flex-1 sm:flex-none text-[clamp(0.7rem,1vw,0.75rem)] bg-black/5 dark:bg-white/10 hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-3 py-2 rounded-lg transition-all shadow-sm border border-neutral-300 dark:border-neutral-700 hover:border-neutral-600 active:scale-95"
          >
            Simulate Workflow Alert
          </button>
          <button 
            onClick={handleInit}
            className="flex-1 sm:flex-none text-[clamp(0.7rem,1vw,0.75rem)] bg-black/5 dark:bg-white/10 hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-3 py-2 rounded-lg transition-all shadow-sm border border-neutral-300 dark:border-neutral-700 hover:border-neutral-600 active:scale-95"
          >
            Run DB Migrations
          </button>
        </div>
      </div>

      <div className="p-[clamp(1rem,1.5vw,1.5rem)] space-y-[clamp(1rem,1.5vw,1.5rem)] flex-1 overflow-auto custom-scrollbar z-10 relative">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center bg-white/30 dark:bg-black/30 backdrop-blur-3xl/50 p-3 rounded-lg border border-black/5 dark:border-white/10">
          <div className="flex gap-4 items-center flex-1">
            <label className="text-[clamp(0.65rem,0.8vw,0.7rem)] font-mono text-neutral-500 dark:text-neutral-500 uppercase tracking-widest shrink-0">
              Role:
            </label>
            <select 
              value={userRole} 
              onChange={(e) => setUserRole(e.target.value)}
              className="w-full sm:w-auto bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/10 text-xs p-1.5 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-neutral-800 dark:text-neutral-200 transition-colors hover:border-neutral-300 dark:border-neutral-700"
            >
              <option value="Admin">Admin (All Workflows)</option>
              <option value="Manager">Manager (Medium & Low)</option>
              <option value="Junior">Junior Analyst (Low Only)</option>
            </select>
          </div>
          
          <div className="hidden sm:block w-px h-6 bg-black/5 dark:bg-white/10"></div>
          
          <div className="flex gap-4 items-center flex-1">
            <label className="text-[clamp(0.65rem,0.8vw,0.7rem)] font-mono text-neutral-500 dark:text-neutral-500 uppercase tracking-widest shrink-0">
              Min Risk:
            </label>
            <select 
              value={minRiskTolerance} 
              onChange={(e) => setMinRiskTolerance(e.target.value)}
              className="w-full sm:w-auto bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/10 text-xs p-1.5 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-neutral-800 dark:text-neutral-200 transition-colors hover:border-neutral-300 dark:border-neutral-700"
            >
              <option value="Low">Low (Show All)</option>
              <option value="Medium">Medium (Medium & High)</option>
              <option value="High">High (High Only)</option>
            </select>
          </div>
        </div>

        {statusMsg && (
          <div className="p-3 bg-white/30 dark:bg-black/30 backdrop-blur-3xl border border-black/5 dark:border-white/10 text-xs font-mono text-emerald-300 rounded-lg break-words flex items-start gap-2 shadow-inner">
            <span className="text-emerald-500">{'>'}</span> 
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="space-y-[clamp(1rem,2vw,2rem)]">
           <div className="space-y-4">
             <h3 className="text-[clamp(0.7rem,1vw,0.75rem)] font-mono text-neutral-500 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2 border-b border-black/5 dark:border-white/10 pb-2">
               <Clock className="w-3.5 h-3.5" /> Autonomous Workflows
             </h3>
             {workflows.length === 0 ? (
               <div className="text-xs font-mono text-neutral-500 dark:text-neutral-500 border border-dashed border-black/5 dark:border-white/10 rounded bg-white/30 dark:bg-black/30 backdrop-blur-3xl/50 p-6 flex items-center justify-center min-h-[120px]">
                 No autonomous workflows in queue.
               </div>
             ) : (
               <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 pb-4 container-type-inline-size">
                 {workflows.filter(wf => {
                    // Risk tolerance filter
                    if (minRiskTolerance === 'High' && wf.risk_level !== 'High') return false;
                    if (minRiskTolerance === 'Medium' && wf.risk_level === 'Low') return false;
                    // Role-based visibility
                    if (userRole === 'Manager' && wf.risk_level === 'High') return false;
                    if (userRole === 'Junior' && (wf.risk_level === 'High' || wf.risk_level === 'Medium')) return false;
                    
                    return true;
                 }).map(wf => {
                   const canAct = userRole === 'Admin' || (userRole === 'Manager' && wf.risk_level !== 'High') || (userRole === 'Junior' && wf.risk_level === 'Low');
                   
                   const isCompleted = wf.status === 'approved' || wf.status === 'rejected' || wf.status === 'executed' || wf.status === 'failed';
                   const isPending = wf.status === 'pending';
                   
                   let finalColor = 'bg-black/5 dark:bg-white/10';
                   let finalLabel = 'Decision';
                   let finalTextColor = 'text-neutral-500 dark:text-neutral-500';
                   let line1Color = 'bg-emerald-500/50';
                   let line2Color = 'bg-black/5 dark:bg-white/10';

                   if (wf.status === 'approved') { finalColor = 'bg-emerald-500'; finalLabel = 'Approved'; finalTextColor = 'text-emerald-400'; line2Color = 'bg-emerald-500/50'; }
                   if (wf.status === 'rejected') { finalColor = 'bg-rose-500'; finalLabel = 'Rejected'; finalTextColor = 'text-rose-400'; line2Color = 'bg-rose-500/50'; }
                   if (wf.status === 'executed') { finalColor = 'bg-[#007AFF]'; finalLabel = 'Executed'; finalTextColor = 'text-[#007AFF]'; line2Color = 'bg-[#007AFF]/50'; }
                   if (wf.status === 'failed') { finalColor = 'bg-rose-500'; finalLabel = 'Failed'; finalTextColor = 'text-rose-400'; line2Color = 'bg-rose-500/50'; }

                   return (
                   <div key={wf.id} id={`workflow-${wf.id}`} className="bg-white/30 dark:bg-black/30 backdrop-blur-3xl border border-black/5 dark:border-white/10 p-4 rounded-xl flex flex-col gap-4 shadow-sm hover:border-neutral-300 dark:border-neutral-700 hover:shadow-md transition-all">
                     <div className="flex flex-col @md:flex-row justify-between @md:items-start gap-4">
                       <div className="space-y-1.5 flex-1">
                         <div className="flex items-center gap-2 flex-wrap">
                           <span className={`w-2 h-2 rounded-full ${wf.risk_level === 'High' ? 'bg-rose-500' : wf.risk_level==='Medium'?'bg-yellow-500':'bg-emerald-500'} shadow-sm`}></span>
                           <h4 className="text-sm font-sans font-medium text-black dark:text-white">{wf.title}</h4>
                           <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 bg-white/50 dark:bg-[#1e1e1e]/50 backdrop-blur-3xl ml-1">Risk: {wf.risk_level}</span>
                         </div>
                         <p className="text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400 font-sans">{wf.description}</p>
                       </div>
                       
                       {wf.status === 'pending' && (
                         <div className="flex flex-col @md:items-end gap-2 shrink-0 z-20 relative">
                           {canAct ? (
                             <div className="flex gap-2">
                                <button onClick={() => handleWorkflowAction(wf.id, 'reject')} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 p-2 rounded-lg transition-all active:scale-95" title="Reject">
                                  <X className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleWorkflowAction(wf.id, 'approve')} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 p-2 rounded-lg transition-all active:scale-95" title="Approve">
                                  <Check className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleWorkflowAction(wf.id, 'execute')} className="text-[10px] sm:text-xs font-mono tracking-wide px-3 py-1 bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#007AFF] rounded-lg border border-indigo-500/20 uppercase transition-all active:scale-95 h-full">
                                  Auto-Execute
                                </button>
                             </div>
                           ) : (
                             <span className="text-[10px] font-mono text-rose-400 border border-rose-500/20 bg-rose-500/10 px-2 py-1.5 rounded-lg flex items-center h-full">
                               Insufficient Access Role
                             </span>
                           )}
                         </div>
                       )}
                     </div>
                     
                     {/* Visual Progress Indicator */}
                     <div className="mt-2 pt-4 pb-4 border-t border-black/5 dark:border-white/10 flex items-center w-full px-2 @md:px-8">
                        <div className="flex flex-col items-center relative z-10 box-border">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mb-1 ring-4 ring-neutral-950"></div>
                            <span className="text-[10px] font-mono text-emerald-400 absolute top-5">Proposed</span>
                        </div>
                        <div className={`flex-1 h-[2px] rounded-full mx-[-2px] ${line1Color}`}></div>
                        <div className="flex flex-col items-center relative z-10 box-border">
                            <div className={`w-2.5 h-2.5 rounded-full ${isPending ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'} ring-4 ring-neutral-950 mb-1 flex items-center justify-center`}></div>
                            <span className={`text-[10px] font-mono ${isPending ? 'text-orange-400' : 'text-emerald-400'} absolute top-5`}>Pending</span>
                        </div>
                        <div className={`flex-1 h-[2px] rounded-full mx-[-2px] ${line2Color}`}></div>
                        <div className="flex flex-col items-center relative z-10 w-12 box-border">
                            <div className={`w-2.5 h-2.5 rounded-full ${finalColor} mb-1 ring-4 ring-neutral-950`}></div>
                            <span className={`text-[10px] font-mono ${finalTextColor} absolute top-5 min-w-[60px] text-center`}>{finalLabel}</span>
                        </div>
                     </div>
                   </div>
                 )})}
               </div>
             )}
           </div>

           <div className="space-y-4">
             <h3 className="text-[clamp(0.7rem,1vw,0.75rem)] font-mono text-neutral-500 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2 border-b border-black/5 dark:border-white/10 pb-2">
               <AlertTriangle className="w-3.5 h-3.5" /> Audit Log
             </h3>
             <div className="bg-white/30 dark:bg-black/30 backdrop-blur-3xl border border-black/5 dark:border-white/10 rounded-xl max-h-[300px] overflow-hidden flex flex-col relative w-full">
               {logs.length === 0 ? (
                 <div className="p-6 text-sm font-mono text-neutral-600 text-center flex items-center justify-center min-h-[100px]">No audit history.</div>
               ) : (
                 <div className="overflow-x-auto custom-scrollbar w-full flex-1">
                   <table className="w-full text-left min-w-[600px] border-collapse relative">
                     <thead className="bg-white/50 dark:bg-[#1e1e1e]/50 backdrop-blur-3xl border-b border-black/5 dark:border-white/10 text-[11px] font-mono text-neutral-500 dark:text-neutral-500 uppercase tracking-wider sticky top-0 z-20">
                       <tr>
                         <th className="px-4 py-3 font-medium w-[140px] whitespace-nowrap">Timestamp</th>
                         <th className="px-4 py-3 font-medium w-[120px]">Action</th>
                         <th className="px-4 py-3 font-medium">Target / Outcome</th>
                       </tr>
                     </thead>
                     <tbody className="text-[13px] font-mono text-neutral-700 dark:text-neutral-300">
                       {logs.map((log: any) => (
                         <tr key={log.id} className="border-b border-black/5 dark:border-white/10 last:border-0 hover:bg-neutral-800/30 transition-colors group">
                           <td className="px-4 py-3 text-neutral-500 dark:text-neutral-500 whitespace-nowrap align-top pt-4">{new Date(log.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                           <td className="px-4 py-3 align-top pt-3.5">
                              <span className={`px-2 py-1 rounded-md border text-[10px] tracking-wide inline-block ${
                                log.action.includes('APPROVE') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                log.action.includes('REJECT') ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                                log.action.includes('EXECUTE') ? 'bg-[#007AFF]/10 border-indigo-500/20 text-[#007AFF]' :
                                'bg-black/5 dark:bg-white/10 border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                              }`}>
                                {log.action}
                              </span>
                           </td>
                           <td className="px-4 py-3 align-top">
                             <a href={`#workflow-${log.workflow_id}`} className="font-medium text-[#007AFF] hover:text-indigo-300 transition-colors inline-block mb-1 border-b border-transparent hover:border-indigo-400">
                               {log.workflow_title || 'Unknown Workflow'}
                             </a>
                             {log.outcome && (
                               <div className="text-neutral-600 dark:text-neutral-400 mt-1.5 whitespace-pre-wrap leading-relaxed text-xs p-2 bg-black/5 dark:bg-white/5 backdrop-blur-md rounded border border-black/5 dark:border-white/10 group-hover:border-black/5 dark:border-white/10 transition-colors">{log.outcome}</div>
                             )}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
