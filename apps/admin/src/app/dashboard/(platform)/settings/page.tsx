import React from "react";
import { Settings, Shield, Key, Bell, CreditCard, Trash2 } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";

export default function SettingsPage() {
  return (
    <div className="p-6 md:p-10 text-zinc-100 min-h-full">
      <div className="mx-auto max-w-4xl space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Account Settings</h1>
          <p className="text-zinc-400 mt-2">Manage your personal information, security, and preferences.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Settings Sidebar */}
          <div className="w-full md:w-64 space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800/80 text-white font-medium transition-colors">
              <Settings size={18} className="text-indigo-400" />
              General
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 font-medium transition-colors">
              <Shield size={18} />
              Security
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 font-medium transition-colors">
              <Bell size={18} />
              Notifications
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 font-medium transition-colors">
              <CreditCard size={18} />
              Billing Details
            </button>
          </div>

          {/* Settings Content */}
          <div className="flex-1 space-y-6">
            
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
                <h3 className="text-lg font-semibold text-white">Profile Information</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-700 bg-zinc-800 flex items-center justify-center text-lg">
                    <UserAvatar />
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium text-sm transition-colors border border-zinc-700">
                      Change Avatar
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-400">Full Name</label>
                    <input
                      type="text"
                      placeholder="Your full name"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-400">Email Address</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center gap-2">
                <Key size={18} className="text-zinc-400" />
                <h3 className="text-lg font-semibold text-white">Password</h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-zinc-400 mb-4">You can change your password here. We recommend using a strong password that you do not use for any other accounts.</p>
                <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium text-sm transition-colors border border-zinc-700">
                  Change Password
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-rose-900/30 bg-rose-950/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-rose-900/30 bg-rose-900/10 flex items-center gap-2">
                <Trash2 size={18} className="text-rose-500" />
                <h3 className="text-lg font-semibold text-rose-500">Danger Zone</h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-zinc-400 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                <button className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-500/30 rounded-lg font-medium text-sm transition-colors">
                  Delete Account
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
