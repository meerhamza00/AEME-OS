/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, SignIn, SignUp, UserButton } from '@clerk/clerk-react';
import { useState, createContext, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings2, Maximize, MessageSquare, BarChart3, ShieldCheck, Database, FileText, TrendingUp, Cpu, Zap, Menu, X, Sun, Moon } from 'lucide-react';
import { MemoryEngine } from './components/MemoryEngine';
import { PPCEngine } from './components/PPCEngine';
import { AnalyticsEngine } from './components/AnalyticsEngine';
import { SimulationEngine } from './components/SimulationEngine';
import { StrategicChat } from './components/StrategicChat';
import { GovernanceLayer } from './components/GovernanceLayer';
import { AutonomyControlPlane } from './components/AutonomyControlPlane';

export const DensityContext = createContext<{ density: 'compact' | 'comfortable', toggleDensity: () => void }>({
  density: 'comfortable',
  toggleDensity: () => {}
});

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function AuthenticatedApp() {
  if (!PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen bg-white/30 dark:bg-black/30 backdrop-blur-3xl text-neutral-900 dark:text-neutral-100 dark:text-neutral-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-mono text-rose-500 mb-4">CRITICAL SYSTEM ERROR</h2>
        <p className="text-neutral-600 dark:text-neutral-400 font-mono max-w-lg mb-6">
          Missing Clerk Publishable Key. Authentication layer cannot initialize.
        </p>
        <div className="text-left bg-white/50 dark:bg-[#1e1e1e]/50 backdrop-blur-3xl border border-black/5 dark:border-white/10 p-4 rounded-md text-sm font-mono max-w-xl w-full">
          <p className="text-yellow-500 mb-2">{'// ACTION REQUIRED'}</p>
          <p className="text-neutral-600 dark:text-neutral-400">Add the following to your environment secrets:</p>
          <code className="block mt-2 text-indigo-400 bg-black p-2 rounded">
            VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
          </code>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <BrowserRouter>
        <Routes>
          {/* Public / Auth Routes */}
          <Route 
            path="/sign-in/*" 
            element={
              <div className="min-h-screen bg-white/30 dark:bg-black/30 backdrop-blur-3xl flex flex-col items-center justify-center space-y-6">
                <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
              </div>
            } 
          />
          <Route 
            path="/sign-up/*" 
            element={
              <div className="min-h-screen bg-white/30 dark:bg-black/30 backdrop-blur-3xl flex flex-col items-center justify-center space-y-6">
                <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
              </div>
            } 
          />

          {/* Root redirect depending on auth state */}
          <Route 
            path="/" 
            element={
              <>
                <SignedIn>
                  <Navigate to="/dashboard" replace />
                </SignedIn>
                <SignedOut>
                  <div className="min-h-screen bg-white/30 dark:bg-black/30 backdrop-blur-3xl text-neutral-900 dark:text-neutral-100 dark:text-neutral-50 flex flex-col items-center justify-center p-6 selection:bg-indigo-500/30">
                    <div className="max-w-3xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                      <div className="inline-flex items-center rounded-full border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-md px-3 py-1 text-sm text-neutral-700 dark:text-neutral-300 font-mono">
                        <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
                        System Initialization
                      </div>
                      
                      <h1 className="text-5xl sm:text-7xl font-sans font-medium tracking-tight text-neutral-900 dark:text-white space-y-3">
                        <span className="block">AEME OS</span>
                        <span className="block text-2xl sm:text-3xl text-neutral-500 dark:text-neutral-500 font-normal">The Sovereign Strategist</span>
                      </h1>
                      
                      <p className="text-lg text-neutral-600 dark:text-neutral-400 font-mono max-w-2xl mx-auto leading-relaxed">
                        Autonomous Enterprise Metamorphosis Engine. Turning fragmented ecommerce data into simulated, governed, and executable growth decisions.
                      </p>

                      <div className="pt-8">
                        <Link to="/sign-in" className="inline-flex items-center justify-center rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] disabled:pointer-events-none disabled:opacity-50 bg-[#007AFF] text-white hover:bg-[#005bb5] h-12 px-8 py-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 font-sans tracking-tight gap-2 border border-white/20">
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                          INITIALIZE SYSTEM
                        </Link>
                      </div>
                    </div>
                  </div>
                </SignedOut>
              </>
            } 
          />

          {/* Protected Routes */}
          <Route 
            path="/dashboard/*" 
            element={
              <>
                <SignedIn>
                   <Dashboard />
                </SignedIn>
                <SignedOut>
                  <Navigate to="/sign-in" replace />
                </SignedOut>
              </>
            } 
          />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  );
}

function Dashboard() {
  const [density, setDensity] = useState<'compact' | 'comfortable'>(() => {
    return (localStorage.getItem('aeme_density') as 'compact' | 'comfortable') || 'comfortable';
  });
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('aeme_theme') as 'dark' | 'light';
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('aeme_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const toggleDensity = () => {
    const newDensity = density === 'comfortable' ? 'compact' : 'comfortable';
    setDensity(newDensity);
    localStorage.setItem('aeme_density', newDensity);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  const [activeTab, setActiveTab] = useState<'chat' | 'analytics' | 'ppc' | 'governance' | 'autonomy' | 'simulation' | 'memory'>('chat');

  useEffect(() => {
    const handleOpenChat = () => setActiveTab('chat');
    window.addEventListener('OPEN_CHAT_TAB', handleOpenChat);
    return () => window.removeEventListener('OPEN_CHAT_TAB', handleOpenChat);
  }, []);

  const TABS = [
    { id: 'chat', label: 'Command Center', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics Engine', icon: BarChart3 },
    { id: 'ppc', label: 'PPC Intelligence', icon: TrendingUp },
    { id: 'governance', label: 'Governance Control', icon: ShieldCheck },
    { id: 'autonomy', label: 'Autonomous Plane', icon: Cpu },
    { id: 'simulation', label: 'Simulation Engine', icon: Zap },
    { id: 'memory', label: 'Memory Engine', icon: Database },
  ] as const;

  return (
    <DensityContext.Provider value={{ density, toggleDensity }}>
      <div className={`min-h-screen relative overflow-hidden transition-all duration-500 ease-in-out ${density === 'compact' ? 'p-2 sm:p-4' : 'p-4 sm:p-6 md:p-8'}`}>
        {/* macOS Wallpaper Background */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-100 via-purple-50 to-teal-50 dark:from-indigo-950 dark:via-purple-900/20 dark:to-teal-950">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-400/30 dark:bg-purple-600/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-teal-400/30 dark:bg-teal-600/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none"></div>
        </div>

        <div className="max-w-[1600px] mx-auto flex flex-col h-full min-h-[calc(100vh-theme(spacing.16))] relative z-10 macos-glass rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
          <header className={`flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-black/5 dark:border-white/10 gap-6 backdrop-blur-3xl bg-white/40 dark:bg-[#1e1e1e]/40 py-4 px-6 shrink-0`}>
            <div className="flex items-center gap-6">
              {/* macOS Window Controls */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] cursor-pointer hover:bg-[#ff5f56]/80 flex items-center justify-center group overflow-hidden">
                   <X className="w-2 h-2 text-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] cursor-pointer hover:bg-[#ffbd2e]/80"></div>
                <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] cursor-pointer hover:bg-[#27c93f]/80"></div>
              </div>

              <div>
                <h1 className="text-xl font-sans font-semibold text-neutral-900 dark:text-white tracking-tight leading-none mb-1">
                  AEME OS
                </h1>
                <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-500 uppercase tracking-widest">
                  Decision Infrastructure Layer
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 sm:gap-6">
              <button 
                onClick={toggleTheme}
                className="flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 p-2 rounded-full border border-black/5 dark:border-white/10 shadow-sm"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button 
                onClick={toggleDensity}
                className="flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 px-3 py-1.5 rounded-full border border-black/5 dark:border-white/10 shadow-sm"
                title="Toggle Dashboard Density"
              >
                <Maximize className="w-3 h-3" />
                {density === 'compact' ? 'Compact' : 'Comfort'}
              </button>
              <div className="pl-4 border-l border-black/10 dark:border-white/10">
                 <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 rounded-full border border-black/10 dark:border-white/10 shadow-sm" } }} />
              </div>
            </div>
          </header>

          <div className="flex flex-col lg:flex-row flex-1 min-h-0 @container/main">
            {/* Sidebar Navigation */}
            <aside className={`${isSidebarOpen ? 'lg:w-64' : 'lg:w-[72px] items-center'} shrink-0 flex flex-col gap-2 transition-all duration-300 macos-glass-sidebar p-4`}>
               <button 
                 onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                 className="hidden lg:flex items-center justify-center p-2 mb-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg self-start transition-colors"
                 title="Toggle Sidebar"
               >
                 <Menu className="w-4 h-4" />
               </button>
               
               <div className={`flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 custom-scrollbar ${!isSidebarOpen && 'items-center'}`}>
                 {TABS.map(tab => (
                   <button 
                     key={tab.id} 
                     onClick={() => setActiveTab(tab.id)}
                     title={!isSidebarOpen ? tab.label : undefined}
                     className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all font-sans tracking-wide shadow-sm active:scale-95 whitespace-nowrap lg:whitespace-normal shrink-0 ${!isSidebarOpen ? 'justify-center px-0 w-10 h-10' : 'w-full'} ${activeTab === tab.id ? 'bg-indigo-500 dark:bg-indigo-500 text-white shadow-md' : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'}`}
                   >
                      <tab.icon className={`w-4 h-4 shrink-0 ${activeTab === tab.id ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'}`} />
                      {isSidebarOpen && <span className="text-sm font-medium">{tab.label}</span>}
                   </button>
                 ))}
               </div>
               
               {isSidebarOpen && (
                 <div className="hidden lg:flex mt-auto bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/10 shadow-sm rounded-xl p-4 flex-col items-start gap-3 backdrop-blur-md">
                    <h2 className="text-xs font-sans font-medium text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
                       Knowledge Base
                    </h2>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-sans leading-relaxed">
                      Master the OS natively. Learn how to execute stochastic simulations and approve automated execution sequences.
                    </p>
                    <a 
                      href="https://github.com/meerhamza00/AEME-OS/blob/main/USER_GUIDE.md" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full text-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-xs font-sans rounded-lg transition-all active:scale-95 shadow-sm"
                    >
                      Read User Guide
                    </a>
                 </div>
               )}
            </aside>

            {/* Main Isolated Dashboard Content Area */}
            <div className="flex-1 min-w-0 lg:h-[calc(100vh-140px)] lg:min-h-[600px] pb-10 lg:pb-0 overflow-auto relative custom-scrollbar bg-white/20 dark:bg-black/10 backdrop-blur-3xl p-4 sm:p-6 lg:p-8">
              <AnimatePresence mode="wait">
                 <motion.div
                   key={activeTab}
                   initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                   animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                   exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                   transition={{ duration: 0.3, ease: 'easeOut' }}
                   className="h-full w-full mx-auto"
                 >
                   {activeTab === 'chat' && (
                     <div className="w-full h-full xl:w-3/4 max-w-5xl mx-auto">
                       <StrategicChat />
                     </div>
                   )}
                   {activeTab === 'analytics' && (
                     <div className="w-full h-full max-w-5xl mx-auto">
                        <AnalyticsEngine />
                     </div>
                   )}
                   {activeTab === 'ppc' && (
                     <div className="w-full h-full max-w-5xl mx-auto">
                        <PPCEngine />
                     </div>
                   )}
                   {activeTab === 'governance' && (
                     <div className="w-full h-full max-w-5xl mx-auto">
                        <GovernanceLayer />
                     </div>
                   )}
                   {activeTab === 'autonomy' && (
                     <div className="w-full h-full max-w-5xl mx-auto">
                        <AutonomyControlPlane />
                     </div>
                   )}
                   {activeTab === 'simulation' && (
                     <div className="w-full h-full max-w-5xl mx-auto">
                        <SimulationEngine />
                     </div>
                   )}
                   {activeTab === 'memory' && (
                     <div className="w-full h-full max-w-5xl mx-auto">
                        <MemoryEngine />
                     </div>
                   )}
                 </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </DensityContext.Provider>
  );
}

export default function App() {
  return <AuthenticatedApp />;
}
