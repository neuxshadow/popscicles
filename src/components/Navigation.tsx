"use client";

import Link from "next/link";
import { Twitter, ArrowLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Navigation() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <nav className="border-b border-white/5 h-16 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md z-50">
      <div className="page-container h-full grid grid-cols-3 items-center">
        {/* Left: Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tighter hover:opacity-80 transition-opacity whitespace-nowrap">
            <span>POPSICLES</span>
          </Link>
        </div>

        {/* Center: Links */}
        <div className="hidden md:flex items-center justify-center space-x-8">
          <Link 
            href="/" 
            className={cn("nav-link", isHome ? "text-white" : "text-slate-500")}
          >
            Home
          </Link>
          <Link 
            href="/quests" 
            className={cn("nav-link", pathname === "/quests" ? "text-white" : "text-slate-500")}
          >
            Quests
          </Link>

        </div>

        {/* Right: Social/Back */}
        <div className="flex items-center justify-end">
          {isHome ? (
            <a 
              href="https://x.com/PopsiclesEth" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-[#1a1a1a]"
            >
              <Twitter className="h-4 w-4 fill-current text-slate-500" />
            </a>
          ) : (
            <Link href="/" className="nav-link flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
