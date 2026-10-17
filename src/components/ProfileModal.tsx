import React, { useState } from 'react';
import { X, User, Heart, Sparkles, Shield, Award, LogOut, Check } from 'lucide-react';
import { Player } from '../types';
import { SoundEffects } from '../utils/sound';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  onSaveProfile: (updated: Player) => void;
  onLogout: () => void;
  messageCount: number;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  player,
  onSaveProfile,
  onLogout,
  messageCount,
}) => {
  const [displayName, setDisplayName] = useState(player.displayName);
  const [bio, setBio] = useState(player.bio);
  const [avatarUrl, setAvatarUrl] = useState(player.avatarUrl);
  const [activeTab, setActiveTab] = useState<'profile' | 'stats'>('profile');

  if (!isOpen) return null;

  const affectionLevel = Math.min(10, Math.floor(messageCount / 10) + 1);
  const affectionProgress = Math.min(100, ((messageCount % 10) / 10) * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    SoundEffects.playCriticalSuccess();
    onSaveProfile({
      ...player,
      displayName: displayName.trim() || player.username,
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim() || player.avatarUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-genshin-card border border-genshin-gold/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-genshin-dark border-b border-genshin-gold/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-genshin-gold" />
            <h2 className="text-base font-serif font-bold text-amber-100 tracking-wide">
              Mi Perfil
            </h2>
          </div>
          <button
            onClick={() => {
              SoundEffects.playChime();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-genshin-panel/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level & Vínculo Banner */}
        <div className="mx-4 mt-3 p-3 rounded-2xl bg-gradient-to-r from-amber-950/40 via-genshin-panel to-amber-950/40 border border-genshin-gold/30">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-serif font-bold text-genshin-gold flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-400 fill-rose-400/30" />
              Nivel de Vínculo: {affectionLevel} / 10
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {messageCount} memorias compartidas
            </span>
          </div>
          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${affectionProgress}%` }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/60 mx-4 mt-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 font-serif font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-genshin-gold text-genshin-gold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Datos Personales</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 font-serif font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'stats'
                ? 'border-genshin-gold text-genshin-gold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Atributos D&D</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {activeTab === 'profile' ? (
            <form id="profileForm" onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] text-genshin-gold font-medium block mb-1">
                  Nombre de Usuario (Login)
                </label>
                <div className="px-3 py-2 rounded-xl bg-genshin-dark/60 border border-slate-800 text-slate-400 font-mono text-xs">
                  @{player.username}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-genshin-gold font-medium block mb-1">
                  Nombre para mostrar / Apodo en el rol
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu nombre en el rol"
                  className="w-full px-3 py-2 rounded-xl bg-genshin-panel border border-slate-700 text-slate-100 focus:border-genshin-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-genshin-gold font-medium block mb-1">
                  Título / Descripción breve
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Ej: Hechicera solitaria, Viajero errante..."
                  className="w-full px-3 py-2 rounded-xl bg-genshin-panel border border-slate-700 text-slate-100 focus:border-genshin-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-genshin-gold font-medium block mb-1">
                  URL de tu Avatar / Foto de Perfil
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-genshin-panel border border-slate-700 text-slate-100 focus:border-genshin-gold focus:outline-none"
                />
              </div>

              {/* Avatar Preview */}
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-genshin-panel/50 border border-slate-700/60">
                <img
                  src={avatarUrl}
                  alt="Vista previa"
                  className="w-12 h-12 rounded-xl object-cover border border-genshin-gold/50 shadow-md"
                />
                <div>
                  <div className="font-serif font-bold text-amber-100">{displayName}</div>
                  <div className="text-[11px] text-slate-400">{bio || 'Sin descripción'}</div>
                </div>
              </div>

              {/* Logout button */}
              <div className="pt-2 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={() => {
                    SoundEffects.playChime();
                    onLogout();
                    onClose();
                  }}
                  className="w-full py-2 rounded-xl bg-red-950/30 hover:bg-red-950/60 text-red-400 border border-red-900/40 text-xs font-serif font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-genshin-panel/60 border border-slate-700 text-slate-300 space-y-2">
                <div className="font-serif font-bold text-genshin-gold flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>Modificadores de Tirada Automáticos</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Estos atributos otorgan bonificadores naturales a tus tiradas de dados:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                  <div className="p-2 rounded-xl bg-genshin-dark border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Seducción</span>
                    <span className="text-amber-300 font-bold">+2</span>
                  </div>
                  <div className="p-2 rounded-xl bg-genshin-dark border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Persuasión</span>
                    <span className="text-amber-300 font-bold">+1</span>
                  </div>
                  <div className="p-2 rounded-xl bg-genshin-dark border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Percepción</span>
                    <span className="text-amber-300 font-bold">+2</span>
                  </div>
                  <div className="p-2 rounded-xl bg-genshin-dark border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Pasión / Fuerza</span>
                    <span className="text-amber-300 font-bold">+1</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-genshin-dark border-t border-genshin-gold/30">
          <button
            type="submit"
            form="profileForm"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-amber-950 font-serif font-bold text-xs uppercase tracking-wider shadow-genshin-gold hover:brightness-110 active:scale-95 transition-all"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
