import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  User,
  Mail,
  Lock,
  Sparkles,
  X,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, loginUser, user } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState(user?.email || 'sohailkharal607@gmail.com');
  const [name, setName] = useState(user?.name || 'Sohail Kharal');
  const [password, setPassword] = useState('••••••••••••');

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginUser(email, name);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl space-y-6 bg-slate-950/95 text-slate-100 light:bg-white/95 light:text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 light:border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-100 light:text-slate-900">
                {isRegister ? 'Create AuraVoice Account' : 'AuraVoice Studio Sign In'}
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600">
                Unlock 20,000 char processing & cloud synchronization
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Benefits Pill */}
        <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-center gap-2">
          <Zap className="w-4 h-4 shrink-0 text-cyan-400" />
          <span>Includes 20,000 characters per request + 20 Gemini character voices</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1 light:text-slate-700">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sohail Kharal"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none light:text-slate-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1 light:text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none light:text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 light:text-slate-700">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none light:text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:opacity-90 shadow-lg shadow-cyan-500/20 transition-all"
          >
            {isRegister ? 'Register & Upgrade' : 'Sign In to Studio'}
          </button>
        </form>

        {/* Switch Register / Sign In */}
        <div className="pt-2 text-center text-xs text-slate-400">
          <span>{isRegister ? 'Already have an account?' : "Don't have an account yet?"} </span>
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-cyan-400 font-bold hover:underline"
          >
            {isRegister ? 'Sign In' : 'Sign Up Free'}
          </button>
        </div>
      </div>
    </div>
  );
};
