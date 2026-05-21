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
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm text-neutral-200 flex flex-col h-[600px] transition-all overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

      <div className="p-[clamp(1rem,1.5vw,1.5rem)] border-b border-neutral-800 flex flex-col justify-center z-10 relative bg-neutral-900/50 backdrop-blur-sm">
        <h2 className="text-[clamp(0.875rem,1.2vw,1rem)] font-mono text-neutral-300 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-500" />
          Strategic Chat System
        </h2>
        <p className="text-[clamp(0.7rem,1vw,0.75rem)] font-sans text-neutral-500 mt-1 max-w-xl leading-relaxed">
          Not just a chatbot. The Sovereign Strategist references your entire Memory bank and Live PPC Data to generate high-fidelity tactical recommendations.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-[clamp(1rem,1.5vw,1.5rem)] space-y-[clamp(1rem,1.5vw,1.5rem)] custom-scrollbar z-10 relative">
        {messages.length === 0 && (
          <div className="text-center py-12 flex items-center justify-center min-h-[200px] text-neutral-500 text-[clamp(0.75rem,1.2vw,0.875rem)] font-mono border-2 border-dashed border-neutral-800/80 rounded-xl bg-neutral-950/20">
            AEME Sovereign Strategist online. Awaiting query.
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            {msg.role === 'user' ? (
              <div className="bg-indigo-600 text-white text-[13px] font-sans px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] sm:max-w-[75%] shadow-sm mt-2">
                {msg.content}
              </div>
            ) : (
              <div className="bg-neutral-950 border border-neutral-800 p-[clamp(1rem,1.5vw,1.5rem)] rounded-2xl rounded-tl-sm w-full space-y-4 shadow-sm mt-4 hover:border-neutral-700 transition-colors">
                {msg.strategy ? (
                  <div className="space-y-[clamp(1rem,1.5vw,1.5rem)]">
                    <div className="flex flex-wrap items-center gap-4 bg-neutral-900/50 p-3 rounded-xl border border-neutral-800/50">
                      <div className="flex items-center gap-2 text-[clamp(0.65rem,0.8vw,0.7rem)] font-mono">
                        <ShieldAlert className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="text-neutral-500 uppercase tracking-widest hidden sm:inline">Risk:</span>
                        <span className={`px-2 py-1 rounded-md border tracking-wider ${
                          msg.strategy.risk === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                          msg.strategy.risk === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {msg.strategy.risk}
                        </span>
                      </div>
                      <div className="w-px h-4 bg-neutral-800 hidden sm:block"></div>
                      <div className="flex items-center gap-2 text-[clamp(0.65rem,0.8vw,0.7rem)] font-mono">
                         <Activity className="w-3.5 h-3.5 text-neutral-500" />
                         <span className="text-neutral-500 uppercase tracking-widest hidden sm:inline">Confidence:</span>
                         <span className="text-white bg-neutral-800 px-2 py-1 rounded-md border border-neutral-700">{msg.strategy.confidence}%</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                       <h4 className="text-[clamp(0.65rem,0.8vw,0.7rem)] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                         <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50"></span> Reasoning
                       </h4>
                       <p className="text-[13px] font-sans text-neutral-300 leading-relaxed bg-neutral-900/80 border border-neutral-800 p-4 rounded-xl shadow-inner">
                         {msg.strategy.reasoning}
                       </p>
                    </div>

                    <div className="grid grid-cols-1 @md:grid-cols-2 gap-[clamp(1rem,1.5vw,1.5rem)] container-type-inline-size">
                      <div className="space-y-3">
                        <h4 className="text-[clamp(0.65rem,0.8vw,0.7rem)] font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50"></span> Insights
                        </h4>
                        <ul className="space-y-2">
                          {msg.strategy.insights.map((insight, j) => (
                            <li key={j} className="text-[13px] font-sans text-neutral-400 pl-3 border-l-2 border-indigo-500/30 py-1 leading-relaxed">
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-[clamp(0.65rem,0.8vw,0.7rem)] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span> Execution Actions
                        </h4>
                        <ul className="space-y-2">
                          {msg.strategy.actions.map((action, j) => (
                            <li key={j} className="text-[13px] font-sans text-neutral-300 pl-3 border-l-2 border-emerald-500/50 bg-neutral-900/30 py-2 px-3 rounded-r-lg border-y border-r border-y-transparent border-r-transparent hover:bg-neutral-900 hover:border-neutral-800 transition-colors">
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] font-mono text-rose-400">{msg.content}</p>
                )}
              </div>
            )}
          </div>
        ))}

        {processing && (
          <div className="flex items-start animate-in fade-in duration-300 mt-4">
            <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl rounded-tl-sm space-y-4 w-64 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 animate-pulse tracking-widest uppercase">
                <Cpu className="w-4 h-4" /> Synthesizing...
              </div>
              <div className="space-y-2">
                <div className="h-1.5 bg-neutral-800 rounded-full w-full overflow-hidden relative">
                  <div className="absolute top-0 left-0 h-full bg-cyan-500/30 w-1/2 animate-[pulse_1s_ease-in-out_infinite]"></div>
                </div>
                <div className="h-1.5 bg-neutral-800 rounded-full w-4/5 overflow-hidden relative">
                  <div className="absolute top-0 left-0 h-full bg-cyan-500/20 w-3/4 animate-[pulse_1.5s_ease-in-out_infinite]"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4 border-t border-neutral-800 bg-neutral-900/80 backdrop-blur-md z-10 relative">
        <form onSubmit={handleSubmit} className="flex gap-2 w-full">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Sovereign Strategist..."
            className="flex-1 bg-neutral-950 border border-neutral-800 text-[13px] p-3 rounded-xl focus:ring-1 focus:ring-cyan-500 outline-none text-neutral-200 font-sans transition-colors focus:bg-neutral-900"
            disabled={processing}
          />
          <button 
            type="submit"
            disabled={processing || !input.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 px-5 rounded-xl transition-all flex items-center justify-center active:scale-95 shadow-sm min-w-[50px] shrink-0"
            title="Send query"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}
