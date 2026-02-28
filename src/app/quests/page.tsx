"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Twitter, Wallet, Link as LinkIcon, Loader2, CheckCircle2, AlertCircle, ChevronRight, ArrowLeft } from "lucide-react";
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

export default function QuestsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
          />
          <QuestItem 
            number="02" 
            title="Interaction" 
            description="Like and Retweet our pinned whitelist post." 
            link="https://x.com/PopsiclesEth/status/2027408948979007662" 
          />
        </div>

        {/* Form Container */}
        <div className="page-container max-w-2xl">
          <div className="product-card p-8 md:p-12 space-y-10 bg-[#0d0d0d]/40 backdrop-blur-md">
            <div className="space-y-1">
              <h3 className="text-xl font-bold tracking-tight">Submission Details</h3>
              <p className="text-sm text-slate-500 font-medium">Double-check your handle and address before sending.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 flex items-center space-x-2">
                  <Twitter className="h-3 w-3" />
                  <span>X Username</span>
                </label>
                <input
                  {...register("twitter_username")}
                  placeholder="@username"
                  className={cn("product-input", errors.twitter_username && "border-red-500/50 focus:border-red-500")}
                />
                {errors.twitter_username && (
                  <p className="text-red-500 text-[11px] font-bold">{errors.twitter_username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 flex items-center space-x-2">
                  <Wallet className="h-3 w-3" />
                  <span>Ethereum Wallet</span>
                </label>
                <input
                  {...register("wallet_address")}
                  placeholder="0x..."
                  className={cn("product-input", errors.wallet_address && "border-red-500/50 focus:border-red-500 font-mono")}
                />
                {errors.wallet_address && (
                  <p className="text-red-500 text-[11px] font-bold">{errors.wallet_address.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 flex items-center space-x-2">
                  <LinkIcon className="h-3 w-3" />
                  <span>Proof of Task</span>
                </label>
                <input
                  {...register("tweet_url")}
                  placeholder="https://x.com/..."
                  className={cn("product-input", errors.tweet_url && "border-red-500/50 focus:border-red-500")}
                />
                {errors.tweet_url && (
                  <p className="text-red-500 text-[11px] font-bold">{errors.tweet_url.message}</p>
                )}
              </div>

              {error && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg flex items-start space-x-3 text-red-500 text-xs font-bold uppercase tracking-tight">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-4 text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Submit Application"
                )}
              </button>
            </form>
            
            <p className="text-[10px] text-center text-slate-600 uppercase font-black tracking-widest leading-loose">
              Maximum one submission per individual. <br /> Automated bot detection is active.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function QuestItem({ number, title, description, link }: { number: string, title: string, description: string, link: string }) {
  return (
    <div className="product-card p-6 flex items-center justify-between group hover:border-sky-400/20 transition-all bg-[#0d0d0d]/40 backdrop-blur-md">
      <div className="flex items-center space-x-6">
        <div className="text-2xl font-black text-slate-900 group-hover:text-sky-400 transition-colors duration-500 tracking-tighter">
          {number}
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-white tracking-tight">{title}</h4>
          <p className="text-sm text-slate-500 font-medium">{description}</p>
        </div>
      </div>
      <a 
        href={link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="btn-secondary px-4 py-2 text-[10px] uppercase font-black tracking-widest border border-slate-900"
      >
        Action
      </a>
    </div>
  );
}
