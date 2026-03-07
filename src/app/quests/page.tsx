"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Twitter, Wallet, Link as LinkIcon, Loader2, CheckCircle2, AlertCircle, ChevronRight, ArrowLeft, Lock } from "lucide-react";
import { cn, isValidEthereumAddress, isValidTwitterUrl, normalizeEthereumAddress } from "@/lib/utils";
import { Navigation } from "@/components/Navigation";
import Link from "next/link";

const formSchema = z.object({
  twitter_username: z.string().min(1, "Twitter username is required").transform(val => val.trim().startsWith('@') ? val.trim() : `@${val.trim()}`),
  wallet_address: z.string()
    .transform(val => normalizeEthereumAddress(val))
    .refine(isValidEthereumAddress, { message: "Invalid Ethereum address format (requires 42 characters starting with 0x)" }),
  tweet_url: z.string().trim().refine(isValidTwitterUrl, { message: "Invalid Tweet URL (must be from x.com or twitter.com)" }),
});

type FormData = z.infer<typeof formSchema>;

import { supabase } from "@/lib/supabase";

export default function QuestsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<string>("guest");

  useEffect(() => {
    const getSession = async () => {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
        }
      }
    };
    getSession();
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Submission failed");
      }

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="product-card p-12 max-w-md w-full text-center space-y-8"
        >
          <div className="mx-auto h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Entry Received</h2>
            <p className="text-neutral-400 font-medium">
              Your application has been logged for manual review. <br />
              <span className="text-xs text-neutral-500 italic mt-2 block">
                Intake is boutique and intentional. We will verify your credentials against our core parameters.
              </span>
            </p>
          </div>
          <Link href="/" className="btn-secondary w-full space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Return Home</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <Navigation />

      <main className="flex-1 py-16 md:py-24 space-y-16">
        <div className="page-container max-w-2xl space-y-4">
          <span className="section-label">Verification</span>
          <h1 className="text-4xl font-bold tracking-tight text-white">Whitelist Quests</h1>
          <p className="text-neutral-400 leading-relaxed font-medium">
            Complete the required engagement tasks below before submitting your information.
          </p>
        </div>

        {/* Quest Items Container */}
        <div className="page-container max-w-2xl grid gap-4">
          <QuestItem 
            number="01" 
            title="Follow on X" 
            description="Keep up with our latest announcements and updates." 
            link="https://x.com/PopsiclesEth"
            storageKey="follow_x"
            userId={userId}
          />
          <QuestItem 
            number="02" 
            title="Interaction" 
            description="Like,Retweet & Tag 2 Friends." 
            link="https://x.com/PopsiclesEth/status/2027786900925223417?s=20" 
            storageKey="interaction"
            userId={userId}
          />
        </div>

        {/* Closed State Message */}
        <div className="page-container max-w-2xl">
          <div className="product-card p-12 text-center space-y-6 bg-[#0d0d0d]/40 backdrop-blur-md border-white/5">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center text-neutral-500 mb-2">
              <Lock className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight uppercase">WL applications are closed</h2>
              <p className="text-neutral-500 font-medium text-sm">
                The intake phase has concluded as we approach the minting event. <br />
                Stay tuned to our official channels for further updates.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import { useEffect } from "react";

function QuestItem({ number, title, description, link, storageKey, userId }: { number: string, title: string, description: string, link: string, storageKey: string, userId: string }) {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'done'>('idle');

  useEffect(() => {
    const key = `quests_done_${userId}_${storageKey}`;
    const saved = localStorage.getItem(key);
    if (saved === 'true') {
      setStatus('done');
    } else {
      setStatus('idle');
    }
  }, [storageKey, userId]);

  const handleAction = () => {
    // WL is closed, actions are disabled
    return;
  };

  const isDone = status === 'done';
  const isVerifying = status === 'verifying';

  return (
    <div className={cn(
      "product-card p-6 flex items-center justify-between group transition-all bg-[#0d0d0d]/40 backdrop-blur-md",
      isDone ? "border-emerald-500/30 bg-emerald-500/[0.02]" : "hover:border-sky-400/20",
      isVerifying && "border-sky-500/20 bg-sky-500/[0.01]"
    )}>
      <div className="flex items-center space-x-6">
        <div className={cn(
          "text-2xl font-black transition-colors duration-500 tracking-tighter",
          isDone ? "text-emerald-500" : "text-slate-900 group-hover:text-sky-400",
          isVerifying && "text-sky-400/50"
        )}>
          {number}
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-white tracking-tight">{title}</h4>
          <p className="text-sm text-slate-500 font-medium">{description}</p>
        </div>
      </div>
      <button 
        onClick={handleAction}
        disabled={isVerifying || isDone}
        className={cn(
          "px-4 py-2 text-[10px] uppercase font-black tracking-widest border transition-all flex items-center space-x-2 min-w-[100px] justify-center",
          isDone 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 cursor-default" 
            : isVerifying
              ? "bg-sky-500/5 border-sky-500/20 text-sky-400/70 cursor-wait"
              : "btn-secondary border-slate-900"
        )}
      >
        {isDone ? (
          <>
            <CheckCircle2 className="h-3 w-3" />
            <span>Done</span>
          </>
        ) : (
          <span>Inactive</span>
        )}
      </button>
    </div>
  );
}
