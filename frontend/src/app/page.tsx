'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Shield, 
  Layers, 
  Users, 
  Globe,
  Rocket,
  CheckCircle2,
  Clock,
  Layout,
  Cpu,
  Database,
  Cloud,
  Code2
} from 'lucide-react';

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'yearly'>('monthly');

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center relative overflow-x-hidden font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Premium Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#312e81,transparent_60%)] opacity-30" />
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] animate-pulse [animation-delay:2s]" />
        
        {/* Abstract Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between backdrop-blur-md bg-slate-950/20 border-b border-white/5">
         <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/40 group-hover:rotate-12 transition-transform duration-500">
               <Rocket className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black text-white tracking-tighter uppercase">WattBoard</span>
         </div>
         <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('features')} className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-[0.2em] transition-all hover:translate-y-[-1px]">Features</button>
            <button onClick={() => scrollToSection('preview')} className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-[0.2em] transition-all hover:translate-y-[-1px]">Solutions</button>
            <button onClick={() => scrollToSection('pricing')} className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-[0.2em] transition-all hover:translate-y-[-1px]">Pricing</button>
            <button onClick={() => window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'})} className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-[0.2em] transition-all hover:translate-y-[-1px]">Ecosystem</button>
         </div>
         <div className="flex items-center gap-4">
            <Link href="/login" className="text-[10px] font-black text-white hover:text-indigo-400 uppercase tracking-widest transition-colors hidden sm:block">Sign In</Link>
            <Link href="/signup">
               <button className="px-6 py-2.5 bg-white text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95 shadow-lg shadow-white/10">
                  Launch App
               </button>
            </Link>
         </div>
      </nav>

      <main className="relative z-10 flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto pt-32 pb-20">
        {/* Badge */}
        <div className="mb-10 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full inline-flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-1000">
           <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
           <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Next-Gen Agile Intelligence</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-8 animate-in slide-in-from-bottom-8 fade-in duration-1000">
          Orchestrate Your <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-[length:200%_auto] animate-gradient-x">Engineering Vision.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mb-12 animate-in slide-in-from-bottom-10 fade-in duration-1000 delay-200 leading-relaxed">
          WattBoard is the ultimate mission control for high-performance teams. 
          Manage sprints, track real-time velocity, and ship at the speed of thought.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-6 animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-500">
          <Link href="/signup">
            <button className="group relative flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-500 hover:shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all active:scale-95 overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
               <span>Start Free Trial</span>
               <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <Link href="/login">
            <button className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
              Login to Account
            </button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-700 scroll-mt-32">
           <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] hover:bg-white/[0.05] transition-all group text-left backdrop-blur-3xl cursor-pointer hover:border-indigo-500/30">
              <div className="h-14 w-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-500">
                 <Zap className="h-7 w-7 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-4 tracking-tighter uppercase">Hyper-Velocity</h3>
              <p className="text-sm text-slate-500 font-bold leading-relaxed mb-6">Built for speed. Instant updates, real-time sync, and Zero Latency™ data processing for your tickets.</p>
              <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View Engine Specs</span>
                <ArrowRight size={12} />
              </div>
           </div>

           <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] hover:bg-white/[0.05] transition-all group text-left backdrop-blur-3xl cursor-pointer hover:border-purple-500/30">
              <div className="h-14 w-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-500">
                 <Shield className="h-7 w-7 text-purple-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-4 tracking-tighter uppercase">Hardened Core</h3>
              <p className="text-sm text-slate-500 font-bold leading-relaxed mb-6">Enterprise-grade security with quantum-safe encryption protocols for your mission critical engineering IP.</p>
              <div className="flex items-center gap-2 text-purple-400 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Security Audit</span>
                <ArrowRight size={12} />
              </div>
           </div>

           <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] hover:bg-white/[0.05] transition-all group text-left backdrop-blur-3xl cursor-pointer hover:border-emerald-500/30">
              <div className="h-14 w-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-500">
                 <Layers className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-4 tracking-tighter uppercase">Universal Sync</h3>
              <p className="text-sm text-slate-500 font-bold leading-relaxed mb-6">Connect teams across the globe with unified dashboards, automated reporting and multi-tenant intelligence.</p>
              <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Global Nodes</span>
                <ArrowRight size={12} />
              </div>
           </div>
        </div>

        {/* Technical Stats Bar */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 w-full animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-1000">
           {[
             { label: 'Uptime', value: '99.99%', icon: Globe },
             { label: 'Latency', value: '14ms', icon: Zap },
             { label: 'Security', value: 'AES-256', icon: Shield },
             { label: 'Deployments', value: '1M+', icon: Rocket },
           ].map((stat, i) => (
             <div key={i} className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center group hover:bg-white/[0.05] transition-all cursor-default">
                <stat.icon className="h-6 w-6 text-slate-600 mb-4 group-hover:text-indigo-400 transition-colors" />
                <span className="text-3xl font-black text-white tracking-tighter mb-1">{stat.value}</span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</span>
             </div>
           ))}
        </div>
      </main>

      {/* Hero Visual Section */}
      <div id="preview" className="relative w-full max-w-6xl px-6 mb-32 animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-1000 scroll-mt-32">
         <div className="relative rounded-[3.5rem] p-1.5 bg-gradient-to-br from-white/20 via-white/5 to-transparent shadow-2xl overflow-hidden group/preview">
            <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover/preview:opacity-100 transition-opacity duration-1000" />
            <div className="bg-[#020617] rounded-[3.4rem] overflow-hidden border border-white/10 relative">
               
               {/* Browser Top Bar */}
               <div className="h-14 border-b border-white/5 bg-white/[0.02] flex items-center px-8 gap-3">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-500/30" />
                    <div className="h-3 w-3 rounded-full bg-amber-500/30" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500/30" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="h-6 w-64 bg-white/5 rounded-xl border border-white/5 flex items-center px-3 gap-2">
                       <Shield size={10} className="text-slate-500" />
                       <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Secure session: wattboard.engineering</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/5" />
                    <div className="h-8 w-8 rounded-lg bg-indigo-600 shadow-lg shadow-indigo-600/20" />
                  </div>
               </div>

               {/* Mockup Dashboard Content */}
               <div className="p-12 grid grid-cols-4 gap-8">
                  <div className="col-span-3 space-y-8 text-left">
                     <div className="flex items-center justify-between">
                        <div>
                           <h4 className="text-xl font-black text-white tracking-tight mb-1 uppercase">Active Sprint 14</h4>
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ending in 4 days • 84% Complete</p>
                        </div>
                        <div className="flex -space-x-2">
                           {[1,2,3,4].map(i => (
                             <div key={i} className="h-10 w-10 rounded-xl bg-slate-800 border-2 border-[#020617] flex items-center justify-center text-[10px] font-black text-white">RA</div>
                           ))}
                           <div className="h-10 w-10 rounded-xl bg-indigo-600 border-2 border-[#020617] flex items-center justify-center text-[10px] font-black text-white">+2</div>
                        </div>
                     </div>

                     <div className="grid grid-cols-3 gap-6">
                        {/* Column 1: Backlog */}
                        <div className="space-y-4">
                           <div className="flex items-center justify-between px-2">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Backlog</span>
                              <span className="text-[10px] font-black text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">12</span>
                           </div>
                           <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl space-y-3 hover:border-white/10 transition-colors">
                              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">ENS-102</div>
                              <p className="text-[11px] font-bold text-white/80">Refactor Auth Middleware</p>
                              <div className="flex justify-between items-center pt-2">
                                 <div className="h-5 w-5 rounded-lg bg-slate-800 flex items-center justify-center text-[8px] text-white">RA</div>
                                 <Clock size={12} className="text-slate-600" />
                              </div>
                           </div>
                           <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl space-y-3 opacity-50">
                              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ENS-104</div>
                              <p className="text-[11px] font-bold text-white/80">API Cache Layer</p>
                           </div>
                        </div>

                        {/* Column 2: In Flight */}
                        <div className="space-y-4">
                           <div className="flex items-center justify-between px-2">
                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">In Flight</span>
                              <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">04</span>
                           </div>
                           <div className="p-5 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl space-y-4 shadow-2xl shadow-indigo-500/10 transform rotate-1 scale-105">
                              <div className="flex justify-between">
                                 <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">ENS-126</span>
                                 <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                              </div>
                              <p className="text-[11px] font-black text-white">Implement Neural Search Engine</p>
                              <div className="flex items-center justify-between pt-2">
                                 <div className="px-2 py-1 bg-indigo-500/20 rounded-md text-[8px] font-black text-indigo-300 uppercase tracking-widest">Critical</div>
                                 <div className="flex -space-x-1">
                                    <div className="h-6 w-6 bg-slate-800 rounded-lg border border-[#020617]" />
                                    <div className="h-6 w-6 bg-indigo-600 rounded-lg border border-[#020617]" />
                                 </div>
                              </div>
                           </div>
                           <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl space-y-3">
                              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">ENS-128</div>
                              <p className="text-[11px] font-bold text-white/80">UI Component Library</p>
                           </div>
                        </div>

                        {/* Column 3: Done */}
                        <div className="space-y-4">
                           <div className="flex items-center justify-between px-2">
                              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Completed</span>
                              <span className="text-[10px] font-black text-emerald-500/40 bg-emerald-500/5 px-2 py-0.5 rounded-full">24</span>
                           </div>
                           <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl space-y-3 opacity-40">
                              <div className="flex items-center justify-between">
                                 <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">ENS-094</div>
                                 <CheckCircle2 size={12} className="text-emerald-500" />
                              </div>
                              <p className="text-[11px] font-bold text-white/80 line-through decoration-emerald-500/50">Landing Page Revamp</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Sidebar Mockup */}
                  <div className="col-span-1 space-y-6 border-l border-white/5 pl-8 text-left">
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Real-Time Metrics</h5>
                      <div className="space-y-6">
                         {[1,2].map(i => (
                           <div key={i} className="flex items-start gap-3">
                              <div className="h-10 w-10 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center shrink-0">
                                 <Layout className="h-5 w-5 text-indigo-400 opacity-40" />
                              </div>
                              <div className="flex-1 space-y-1 pt-1">
                                 <div className="h-1.5 w-full bg-white/10 rounded-full" />
                                 <div className="h-1 w-2/3 bg-white/5 rounded-full" />
                              </div>
                           </div>
                         ))}
                      </div>
                      
                      <div className="mt-12 p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-[2.5rem] relative overflow-hidden group/v">
                         <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Zap size={48} className="text-indigo-400" />
                         </div>
                         <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Team Velocity</span>
                               <span className="text-[10px] font-black text-white">42 pts</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                               <div className="h-full w-4/5 bg-gradient-to-r from-indigo-600 to-indigo-400 animate-[shimmer_2s_infinite]" />
                            </div>
                         </div>
                      </div>
                  </div>
               </div>
            </div>
            
            {/* AI Badge Overlay */}
            <div className="absolute -top-12 -right-12 group/ai cursor-help">
               <div className="absolute inset-0 bg-indigo-600/40 blur-3xl opacity-0 group-hover/ai:opacity-100 transition-opacity duration-500" />
               <div className="relative h-44 w-44 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center shadow-2xl group-hover/ai:scale-105 transition-all duration-500 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-[shimmer_2s_infinite]" />
                  <Sparkles className="h-12 w-12 text-indigo-400 mb-3 animate-pulse" />
                  <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Neural Engine</span>
                  <div className="mt-3 flex gap-1">
                     <div className="h-1 w-1 rounded-full bg-indigo-400 animate-bounce" />
                     <div className="h-1 w-1 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                     <div className="h-1 w-1 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
               </div>
            </div>

            {/* Active Users Badge Overlay */}
            <div className="absolute -bottom-10 -left-10 group/users">
               <div className="h-28 w-72 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] flex items-center px-8 gap-5 shadow-2xl hover:bg-white/10 transition-colors duration-500">
                  <div className="h-14 w-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center group-hover/users:rotate-12 transition-transform">
                     <Users className="h-8 w-8 text-emerald-400" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Global Active Ops</p>
                     <p className="text-2xl font-black text-white tracking-tighter">14,209+</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="relative w-full max-w-7xl px-6 py-32 animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-1000 scroll-mt-20">
         <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6 uppercase">Scale Your Output</h2>
            <p className="text-slate-400 font-medium max-w-xl mx-auto mb-10">Choose the protocol that fits your engineering velocity. No hidden latency, just pure performance.</p>
            
            {/* Monthly/Yearly Toggle */}
            <div className="flex items-center justify-center gap-4">
               <span className={`text-xs font-black uppercase tracking-widest transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
               <div 
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                  className="h-8 w-16 bg-white/5 border border-white/10 rounded-full p-1 cursor-pointer group relative"
               >
                  <div className={`h-6 w-6 bg-indigo-600 rounded-full shadow-lg shadow-indigo-600/40 transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-0'}`} />
               </div>
               <span className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${billingCycle === 'yearly' ? 'text-white' : 'text-slate-500'}`}>
                 Yearly <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] rounded-full">Save 20%</span>
               </span>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] hover:bg-white/[0.04] transition-all group flex flex-col">
               <div className="mb-8">
                  <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Starter</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">For Single Engineers</p>
               </div>
               <div className="mb-10 flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white tracking-tighter">
                    ${billingCycle === 'monthly' ? '9' : '7'}
                  </span>
                  <span className="text-xs font-black text-slate-600 uppercase tracking-widest">/mo</span>
               </div>
               <ul className="space-y-4 mb-12 flex-1">
                  {['3 Projects', 'Unlimited Tickets', 'AI Basic Intelligence', 'Community Support'].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-400">
                       <CheckCircle2 size={16} className="text-indigo-500" />
                       <span>{feat}</span>
                    </li>
                  ))}
               </ul>
               <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] hover:bg-white/10 transition-all">Start Solo Session</button>
            </div>

            {/* Pro Plan */}
            <div className="p-10 bg-indigo-600/5 border border-indigo-500/20 rounded-[3rem] hover:bg-indigo-600/10 transition-all group flex flex-col relative overflow-hidden scale-105 shadow-2xl shadow-indigo-600/10">
               <div className="absolute top-0 right-0 p-6">
                  <div className="px-3 py-1 bg-indigo-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full">Most Popular</div>
               </div>
               <div className="mb-8">
                  <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Pro Team</h3>
                  <p className="text-xs font-bold text-indigo-400/60 uppercase tracking-widest">For Rapid Squads</p>
               </div>
               <div className="mb-10 flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white tracking-tighter">
                    ${billingCycle === 'monthly' ? '24' : '19'}
                  </span>
                  <span className="text-xs font-black text-slate-600 uppercase tracking-widest">/mo /user</span>
               </div>
               <ul className="space-y-4 mb-12 flex-1">
                  {['Unlimited Projects', 'Team Intelligence', 'Priority AI Processing', 'Advanced Analytics', 'Support Node 24/7'].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-200">
                       <CheckCircle2 size={16} className="text-indigo-400" />
                       <span>{feat}</span>
                    </li>
                  ))}
               </ul>
               <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20 transition-all">Initialize Pro Squad</button>
            </div>

            {/* Enterprise Plan */}
            <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] hover:bg-white/[0.04] transition-all group flex flex-col">
               <div className="mb-8">
                  <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Enterprise</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">For Large Scale Ops</p>
               </div>
               <div className="mb-10 flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white tracking-tighter">
                    ${billingCycle === 'monthly' ? '99' : '79'}
                  </span>
                  <span className="text-xs font-black text-slate-600 uppercase tracking-widest">/mo base</span>
               </div>
               <ul className="space-y-4 mb-12 flex-1">
                  {['Multi-Org Support', 'Custom AI Models', 'SSO Integration', 'Dedicated Architect', 'White-glove Onboarding'].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-400">
                       <CheckCircle2 size={16} className="text-indigo-500" />
                       <span>{feat}</span>
                    </li>
                  ))}
               </ul>
               <button className="w-full py-4 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-50 transition-all">Contact Intelligence</button>
            </div>
         </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-20 px-8 flex flex-col md:flex-row items-center justify-between gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-700 mt-20">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-xl">
               <Rocket className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-black text-white tracking-tighter uppercase">WattBoard Engineering</span>
         </div>
         <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">© 2026 Proto-Systems Intelligence • All Protocols Reserved.</p>
         <div className="flex items-center gap-8">
            <Globe className="h-5 w-5 text-slate-500 hover:text-white transition-colors cursor-pointer" />
            <Users className="h-5 w-5 text-slate-500 hover:text-white transition-colors cursor-pointer" />
            <Shield className="h-5 w-5 text-slate-500 hover:text-white transition-colors cursor-pointer" />
         </div>
      </footer>
    </div>
  );
}
