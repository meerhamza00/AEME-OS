/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, SignIn, SignUp, UserButton } from '@clerk/clerk-react';
import { MemoryEngine } from './components/MemoryEngine';
import { PPCEngine } from './components/PPCEngine';
import { AnalyticsEngine } from './components/AnalyticsEngine';
import { SimulationEngine } from './components/SimulationEngine';
import { StrategicChat } from './components/StrategicChat';
import { GovernanceLayer } from './components/GovernanceLayer';
import { AutonomyControlPlane } from './components/AutonomyControlPlane';

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
                        <Link to="/sign-in" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-600/90 h-10 px-6 py-2 shadow-sm font-mono tracking-tight gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
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

// Temporary Dashboard Stub (We will move this to a dedicated file next)
function Dashboard() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-8">
      <header className="flex justify-between items-center mb-12 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-2xl font-sans font-medium text-white tracking-tight">AEME OS</h1>
          <p className="text-sm font-mono text-neutral-500">Decision Infrastructure Layer</p>
        </div>
        <div className="flex items-center gap-4">
           <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <StrategicChat />
          <MemoryEngine />
          <PPCEngine />
          <SimulationEngine />
        </div>

        <div className="space-y-6">
          <GovernanceLayer />
          <AutonomyControlPlane />
          <AnalyticsEngine />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return <AuthenticatedApp />;
}
