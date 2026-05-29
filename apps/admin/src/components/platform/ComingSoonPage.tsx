import React from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ComingSoonPageProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  estimatedDate?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

export function ComingSoonPage({
  icon,
  title,
  description,
  estimatedDate = "Q4 2026",
  gradientFrom = "from-indigo-500",
  gradientTo = "to-violet-600"
}: ComingSoonPageProps) {
  return (
    <div className="p-6 md:p-10 text-zinc-100 min-h-full flex items-center justify-center">
      <div className="max-w-2xl w-full text-center space-y-8">
        
        <div className="flex justify-center">
          <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center shadow-2xl opacity-90`}>
            <div className="text-white drop-shadow-md">
              {icon}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold uppercase tracking-widest mb-2">
            Coming Soon
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">{title}</h1>
          <p className="text-zinc-400 text-lg max-w-lg mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        <div className="max-w-md mx-auto bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-white mb-4">Get notified when it launches</h3>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button className="bg-white text-zinc-950 font-semibold px-5 py-2.5 rounded-xl hover:bg-zinc-200 transition-colors text-sm">
              Notify Me
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-4 text-center">
            Estimated availability: <strong className="text-zinc-300">{estimatedDate}</strong>
          </p>
        </div>

        <div className="pt-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
