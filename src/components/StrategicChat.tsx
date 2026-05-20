import React, { useState } from 'react';
import { Terminal, Send, Activity, ShieldAlert, Cpu } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

interface StrategyResult {
  insights: string[];
  reasoning: string;
  actions: string[];
  risk: string;
  confidence: number;
}

interface Message {
  role: 'user' | 'system';
  content: string;
  strategy?: StrategyResult;
}

export function StrategicChat() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setProcessing(true);

    try {
      const res = await fetch('/api/chat/strategic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, userId: user?.id })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'system', content: 'Strategy generated.', strategy: data }]);
      } else {
        setMessages(prev => [...prev, { role: 'system', content: `Error: ${data.error}` }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'system', content: `Execution failed: ${err.message}` }]);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm text-neutral-200 flex flex-col h-[600px]">
      <div className="p-4 border-b border-neutral-800 flex flex-col justify-center">
        <h2 className="text-sm font-mono text-neutral-300 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-500" />
          Strategic Chat System
        </h2>
        <p className="text-xs font-sans text-neutral-500 mt-1 max-w-xl">
          Not just a chatbot. The Sovereign Strategist references your entire Memory bank and Live PPC Data to generate high-fidelity tactical recommendations.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center py-8 text-neutral-500 text-sm font-mono border border-dashed border-neutral-800 rounded bg-neutral-950/50">
            AEME Sovereign Strategist online. Awaiting query.
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {msg.role === 'user' ? (
              <div className="bg-indigo-600 text-white text-sm font-sans px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%]">
                {msg.content}
              </div>
            ) : (
              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl rounded-tl-sm w-full space-y-4">
                {msg.strategy ? (
                  <div className="space-y-4 animate-in fade-in run-in-1">
                    <div className="flex items-center gap-4 border-b border-neutral-800 pb-3">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <ShieldAlert className="w-4 h-4 text-neutral-400" />
                        <span className="text-neutral-500 uppercase">Risk:</span>
                        <span className={`px-2 py-0.5 rounded border ${
                          msg.strategy.risk === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                          msg.strategy.risk === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {msg.strategy.risk}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono">
                         <Activity className="w-4 h-4 text-neutral-400" />
                         <span className="text-neutral-500 uppercase">Confidence:</span>
                         <span className="text-white">{msg.strategy.confidence}%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <h4 className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Reasoning</h4>
                       <p className="text-sm font-sans text-neutral-300 leading-relaxed bg-neutral-900 border border-neutral-800 p-3 rounded">
                         {msg.strategy.reasoning}
                       </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-xs font-mono text-indigo-400 uppercase tracking-widest">Insights</h4>
                        <ul className="space-y-2">
                          {msg.strategy.insights.map((insight, j) => (
                            <li key={j} className="text-sm font-sans text-neutral-400 pl-3 border-l-2 border-indigo-500/30">
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Execution Actions</h4>
                        <ul className="space-y-2">
                          {msg.strategy.actions.map((action, j) => (
                            <li key={j} className="text-sm font-sans text-neutral-300 pl-3 border-l-2 border-emerald-500/30 bg-neutral-900/50 py-1.5 px-2 rounded-r">
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-mono text-rose-400">{msg.content}</p>
                )}
              </div>
            )}
          </div>
        ))}

        {processing && (
          <div className="flex items-start">
            <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl rounded-tl-sm space-y-3 w-64">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 animate-pulse">
                <Cpu className="w-4 h-4" /> Synthesizing Strategy
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-neutral-800 rounded w-full"></div>
                <div className="h-2 bg-neutral-800 rounded w-4/5"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-neutral-800">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. 'How should we reallocate our budget based on the latest metrics?'"
            className="flex-1 bg-neutral-950 border border-neutral-800 text-sm p-3 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none text-neutral-200 font-sans"
            disabled={processing}
          />
          <button 
            type="submit"
            disabled={processing || !input.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}
