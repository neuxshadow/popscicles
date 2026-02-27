"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Twitter, Shield, CheckCircle2, ExternalLink } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { HeroScrollFrames } from "@/components/HeroScrollFrames";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col selection:bg-blue-500/30">
      <Navigation />

      <main className="flex-1 space-y-32 md:space-y-48 relative">
        <section id="hero-scroll-wrapper" className="relative h-[200vh]">
          <div className="sticky top-0 h-screen overflow-hidden flex flex-col items-center justify-center py-20 md:py-32">
            <HeroScrollFrames />
            
            {/* Dark readability overlay between animation and content */}
            <div className="absolute inset-0 bg-[#0a0a0a]/45 pointer-events-none z-[5]" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-transparent to-[#0a0a0a]/80 pointer-events-none z-[5]" />
            
            {/* Hero Content */}
            <div className="page-container relative z-10 text-center">
              {/* subtle icy reflection and frosted shape */}
              <div className="icy-reflection" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none" />
              
              <div className="max-w-4xl mx-auto space-y-16 flex flex-col items-center">

                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-10"
                >
                  <h1 className="display-title">
                    Engineered Access <br />
                    <span className="text-icy-gradient">Absolute Zero</span>
                  </h1>
                  <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium tracking-tight">
                    An intentionally small-batch collective defined by structural purity and manual intake. Every inclusion is verified for systemic alignment.
                  </p>
                </motion.div>

                <div className="flex flex-col sm:flex-row gap-5 pt-8 w-full sm:w-auto">
                  <Link href="/quests" className="btn-primary space-x-2 group w-full sm:w-auto px-10">
                    <span>Enter Quests</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Global faint grid background */}
        <div className="absolute inset-0 bg-grid-icy [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] pointer-events-none" />

        {/* How it Works */}
        <section className="page-container space-y-16">
          <div className="space-y-3">
            <span className="section-label">The Process</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How it works</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Step 
              number="01" 
              title="Quests" 
              description="Complete social tasks on X to prove your community involvement." 
            />
            <Step 
              number="02" 
              title="Verification" 
              description="Submit your X username and wallet address for our team to review." 
            />
            <Step 
              number="03" 
              title="Whitelist" 
              description="Once approved, your wallet is secured." 
            />
          </div>
        </section>


      </main>

      {/* Footer */}
      <footer className="border-t border-[#262626] py-16 mt-32">
        <div className="page-container flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start space-y-4">
            <span className="font-black text-lg tracking-tighter">POPSCICLES</span>
            <div className="text-xs font-bold text-neutral-600 uppercase tracking-widest">
              &copy; 2026 Studio. All rights reserved.
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-[10px] md:text-xs font-black uppercase tracking-[0.15em] text-neutral-500">
            <a href="https://x.com/PopsiclesEth" className="hover:text-white transition-colors flex items-center space-x-2">
              <span>Twitter / X</span> <ExternalLink className="h-3 w-3" />
            </a>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}


function Step({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="product-card p-8 space-y-8 group hover:border-sky-400/20 transition-all hover:bg-sky-400/[0.02]">
      <div className="text-5xl font-black text-slate-900 group-hover:text-sky-400 transition-colors duration-500 tracking-tighter">
        {number}
      </div>
      <div className="space-y-3">
        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed font-medium">
          {description}
        </p>
      </div>
    </div>
  );
}


