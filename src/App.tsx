/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, SignIn, SignUp, UserButton } from '@clerk/clerk-react';
import { useState, createContext, useContext, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings2, Maximize } from 'lucide-react';
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
      <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-mono text-rose-500 mb-4">CRITICAL SYSTEM ERROR</h2>
        <p className="text-neutral-400 font-mono max-w-lg mb-6">
          Missing Clerk Publishable Key. Authentication layer cannot initialize.
        </p>
        <div className="text-left bg-neutral-900 border border-neutral-800 p-4 rounded-md text-sm font-mono max-w-xl w-full">
          <p className="text-yellow-500 mb-2">{'// ACTION REQUIRED'}</p>
          <p className="text-neutral-400">Add the following to your environment secrets:</p>
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
              <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-6">
                <div className="text-neutral-400 font-mono text-xs max-w-sm text-center px-4">
                  Note: If the sign-in widget fails to load, please open the application in a new tab. Browsers may restrict authentication cookies inside iframes.
                </div>
                <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
              </div>
            } 
          />
          <Route 
            path="/sign-up/*" 
            element={
              <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-6">
                <div className="text-neutral-400 font-mono text-xs max-w-sm text-center px-4">
                  Note: If the sign-in widget fails to load, please open the application in a new tab. Browsers may restrict authentication cookies inside iframes.
                </div>
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
                  <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col items-center justify-center p-6 selection:bg-indigo-500/30">
                    <div className="max-w-3xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                      <div className="inline-flex items-center rounded-full border border-neutral-800 bg-neutral-900/50 px-3 py-1 text-sm text-neutral-300 font-mono">
                        <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
                        System Initialization
                      </div>
                      
                      <h1 className="text-5xl sm:text-7xl font-sans font-medium tracking-tight text-white space-y-3">
                        <span className="block">AEME OS</span>
                        <span className="block text-2xl sm:text-3xl text-neutral-500 font-normal">The Sovereign Strategist</span>
                      </h1>
                      
                      <p className="text-lg text-neutral-400 font-mono max-w-2xl mx-auto leading-relaxed">
                        Autonomous Enterprise Metamorphosis Engine. Turning fragmented ecommerce data into simulated, governed, and executable growth decisions.
                      </p>

                      <div className="pt-8">
                        <a href="/sign-in" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-600/90 h-10 px-6 py-2 shadow-sm font-mono tracking-tight gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                          INITIALIZE SYSTEM (OPEN IN NEW TAB)
                        </a>
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

  return (
    <DensityContext.Provider value={{ density, toggleDensity }}>
      <div className={`min-h-screen bg-neutral-950 text-neutral-50 transition-all duration-500 ease-in-out ${density === 'compact' ? 'p-4 sm:p-6' : 'p-6 sm:p-8 md:p-12'}`}>
        <div className="max-w-[1600px] mx-auto">
          <header className={`flex flex-col sm:flex-row sm:justify-between sm:items-end border-b border-neutral-800/80 gap-6 backdrop-blur-xl sticky top-0 z-50 bg-neutral-950/80 py-4 ${density === 'compact' ? 'mb-6' : 'mb-10 text-[clamp(1rem,2vw,1.5rem)]'}`}>
            <div>
              <h1 className="text-[clamp(1.5rem,3vw,2.5rem)] font-sans font-semibold text-white tracking-tight leading-none mb-2">
                AEME OS
              </h1>
              <p className="text-[clamp(0.75rem,1vw,0.875rem)] font-mono text-neutral-500 uppercase tracking-widest">
                Decision Infrastructure Layer
              </p>
            </div>
            
            <div className="flex items-center gap-4 sm:gap-6">
              <button 
                onClick={toggleDensity}
                className="flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-neutral-400 hover:text-white transition-colors bg-neutral-900/50 hover:bg-neutral-800 px-3 py-1.5 rounded-full border border-neutral-800"
                title="Toggle Dashboard Density"
              >
                <Maximize className="w-3.5 h-3.5" />
                {density === 'compact' ? 'Compact View' : 'Comfort View'}
              </button>
              <div className="pl-4 border-l border-neutral-800">
                 <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 sm:w-10 sm:h-10 border border-neutral-800 shadow-sm" } }} />
              </div>
            </div>
          </header>

          <motion.main 
            variants={containerVariants} 
            initial="hidden" 
            animate="show"
            className="grid grid-cols-1 @container/main xl:grid-cols-12 auto-rows-min gap-[clamp(1rem,2vw,2rem)]"
          >
            {/* Primary Operations Column */}
            <div className="xl:col-span-8 flex flex-col gap-[clamp(1rem,2vw,2rem)]">
              <motion.div variants={itemVariants} className="w-full">
                 <StrategicChat />
              </motion.div>
              
              <div className="grid grid-cols-1 @md/main:grid-cols-2 gap-[clamp(1rem,2vw,2rem)]">
                <motion.div variants={itemVariants} className="w-full flex">
                  <SimulationEngine />
                </motion.div>
                <motion.div variants={itemVariants} className="w-full flex">
                  <GovernanceLayer />
                </motion.div>
              </div>
              
              <div className="grid grid-cols-1 @md/main:grid-cols-2 gap-[clamp(1rem,2vw,2rem)]">
                <motion.div variants={itemVariants} className="w-full flex">
                   <AutonomyControlPlane />
                </motion.div>
                <motion.div variants={itemVariants} className="w-full flex">
                   <AnalyticsEngine />
                </motion.div>
              </div>
            </div>

            {/* Neural/Memory Sub-Column */}
            <div className="xl:col-span-4 flex flex-col gap-[clamp(1rem,2vw,2rem)]">
              <motion.div variants={itemVariants}>
                <MemoryEngine />
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <PPCEngine />
              </motion.div>
              
              <motion.div variants={itemVariants} className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 shadow-2xl rounded-2xl p-[clamp(1.25rem,2vw,2rem)] flex flex-col items-start space-y-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-neutral-950/0 to-neutral-950/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-xl"></div>
                <h2 className="text-[clamp(0.875rem,1.5vw,1.125rem)] font-sans font-medium text-white tracking-tight relative z-10 flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-indigo-400" />
                  System Knowledge Base
                </h2>
                <p className="text-[clamp(0.75rem,1.2vw,0.875rem)] text-neutral-400 font-sans leading-relaxed relative z-10">
                  New to AEME? Master the OS natively. Learn how to inject data flows, execute stochastic simulations, and approve automated execution sequences through our secure terminal.
                </p>
                <a 
                  href="https://github.com/meerhamza00/AEME-OS/blob/main/USER_GUIDE.md" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-4 w-full text-center px-5 py-3 bg-neutral-100 hover:bg-white text-neutral-900 font-medium text-sm font-sans rounded-xl transition-all border border-transparent shadow-lg shadow-white/5 active:scale-95 relative z-10"
                >
                  Read the Expert User Guide
                </a>
              </motion.div>
            </div>
          </motion.main>
        </div>
      </div>
    </DensityContext.Provider>
  );
}

export default function App() {
  return <AuthenticatedApp />;
}
