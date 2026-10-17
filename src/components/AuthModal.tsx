import React, { useState } from 'react';
import { Shield, Sparkles, User, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { dbService } from '../lib/supabase';
import { Player } from '../types';
import { SoundEffects } from '../utils/sound';

interface AuthModalProps {
  onLoginSuccess: (player: Player) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signup');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (tab === 'signup') {
        const newPlayer = await dbService.signUp(username, password, displayName);
        SoundEffects.playCriticalSuccess();
        onLoginSuccess(newPlayer);
      } else {
        const player = await dbService.signIn(username, password);
        SoundEffects.playCriticalSuccess();
        onLoginSuccess(player);
      }
    } catch (err: any) {
      SoundEffects.playCriticalFail();
      setErrorMsg(err.message || 'Ocurrió un error. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-genshin-dark/95 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-genshin-card border border-genshin-gold/50 rounded-3xl shadow-2xl p-6 relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-genshin-gold to-transparent" />

        {/* Logo / Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-genshin-panel border border-genshin-gold/40 text-genshin-gold mb-2.5 shadow-genshin-gold">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-xl font-serif font-bold text-amber-100 tracking-wide">
            Crónicas de Rol
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tu espacio privado para historias interactivas y dados D&D
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-genshin-panel/80 rounded-2xl border border-slate-700/80 mb-5 text-xs font-serif font-bold">
          <button
            type="button"
            onClick={() => {
              SoundEffects.playChime();
              setTab('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              tab === 'signup'
                ? 'bg-genshin-gold text-amber-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Crear Perfil
          </button>
          <button
            type="button"
            onClick={() => {
              SoundEffects.playChime();
              setTab('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              tab === 'signin'
                ? 'bg-genshin-gold text-amber-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Iniciar Sesión
          </button>
        </div>

        {/* Error message alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-[11px] text-genshin-gold font-medium block mb-1">
              Nombre de Usuario
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: lorena"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-genshin-panel border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-genshin-gold focus:outline-none"
              />
            </div>
          </div>

          {tab === 'signup' && (
            <div>
              <label className="text-[11px] text-genshin-gold font-medium block mb-1">
                Nombre para mostrar / Apodo (Opcional)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ej: Dama de las Sombras"
                className="w-full px-3 py-2 rounded-xl bg-genshin-panel border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-genshin-gold focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] text-genshin-gold font-medium block mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-genshin-panel border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-genshin-gold focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2.5 mt-2 rounded-xl font-serif font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-genshin-gold active:scale-95 ${
              isLoading
                ? 'bg-amber-700/50 text-amber-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-600 to-yellow-600 text-amber-950 hover:brightness-110'
            }`}
          >
            <span>{isLoading ? 'Comprobando...' : tab === 'signup' ? 'Crear Perfil' : 'Entrar al Rol'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
