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
  workflow_title: string;
  action: string;
  details: string;
  created_at: string;
}

export function GovernanceLayer() {
  const { user } = useUser();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

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
    try {
      const res = await fetch('/api/governance/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId: id, action, userId: user?.id })
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
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm text-neutral-200">
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-mono text-neutral-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Governance Control
          </h2>
          <p className="text-xs font-sans text-neutral-500 mt-1 max-w-xl">
             Your safety net. Autonomous operations are held here for human-in-the-loop review. Reject or Approve financial execution actions. An indelible audit log ensures compliance.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={seedDemo}
            className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 shadow-sm border border-neutral-700"
          >
            Simulate Workflow Alert
          </button>
          <button 
            onClick={handleInit}
            className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 shadow-sm border border-neutral-700"
          >
            Run DB Migrations
          </button>
        </div>
      </div>

      <div className="p-6">
        {statusMsg && (
          <div className="mb-4 p-3 bg-neutral-950 border border-neutral-800 text-xs font-mono text-emerald-300 rounded break-words">
            {'>'} {statusMsg}
          </div>
        )}

        <div className="space-y-8">
           <div className="space-y-4">
             <h3 className="text-xs font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2 border-b border-neutral-800 pb-2">
               <Clock className="w-3 h-3" /> Pending Approvals
             </h3>
             {workflows.length === 0 ? (
               <p className="text-sm font-mono text-neutral-500 border border-dashed border-neutral-800 rounded bg-neutral-950/50 p-4 text-center">
                 No pending autonomous workflows.
               </p>
             ) : (
               <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                 {workflows.map(wf => (
                   <div key={wf.id} className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                     <div className="space-y-1">
                       <div className="flex items-center gap-2">
                         <span className={`w-2 h-2 rounded-full ${wf.risk_level === 'High' ? 'bg-rose-500' : wf.risk_level==='Medium'?'bg-yellow-500':'bg-emerald-500'}`}></span>
                         <h4 className="text-sm font-sans font-medium text-white">{wf.title}</h4>
                       </div>
                       <p className="text-xs text-neutral-500 font-sans">{wf.description}</p>
                     </div>
                     <div className="flex items-center gap-2 shrink-0">
                       <button onClick={() => handleWorkflowAction(wf.id, 'reject')} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 p-2 rounded transition-colors" title="Reject">
                         <X className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleWorkflowAction(wf.id, 'approve')} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 p-2 rounded transition-colors" title="Approve">
                         <Check className="w-4 h-4" />
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>

           <div className="space-y-4">
             <h3 className="text-xs font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2 border-b border-neutral-800 pb-2">
               <AlertTriangle className="w-3 h-3" /> Audit Log
             </h3>
             <div className="bg-neutral-950 border border-neutral-800 rounded-lg max-h-64 overflow-y-auto custom-scrollbar">
               {logs.length === 0 ? (
                 <div className="p-4 text-sm font-mono text-neutral-600 text-center">No audit history.</div>
               ) : (
                 <table className="w-full text-left">
                   <thead className="bg-neutral-900 border-b border-neutral-800 text-xs font-mono text-neutral-500 sticky top-0">
                     <tr>
                       <th className="px-4 py-2 font-medium">Timestamp</th>
                       <th className="px-4 py-2 font-medium">Action</th>
                       <th className="px-4 py-2 font-medium">Target</th>
                     </tr>
                   </thead>
                   <tbody className="text-xs font-mono text-neutral-300">
                     {logs.map(log => (
                       <tr key={log.id} className="border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/20">
                         <td className="px-4 py-2 text-neutral-500">{new Date(log.created_at).toLocaleTimeString()}</td>
                         <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded border ${
                              log.action.includes('APPROVE') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                              log.action.includes('REJECT') ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                              'bg-neutral-800 border-neutral-700 text-neutral-400'
                            }`}>
                              {log.action}
                            </span>
                         </td>
                         <td className="px-4 py-2 truncate max-w-xs">{log.workflow_title || 'Unknown'}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
