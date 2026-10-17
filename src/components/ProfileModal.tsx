import React, { useState } from 'react';
import { X, User, Heart, Sparkles, Shield, Wand2, Award } from 'lucide-react';
import { PlayerProfile } from '../lib/supabase';
import { VisionElement } from '../types';
import { SoundEffects } from '../utils/sound';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: PlayerProfile;
  allProfiles: PlayerProfile[];
  onSelectProfile: (profile: PlayerProfile) => void;
  onSaveProfile: (profile: PlayerProfile) => void;
  messageCount: number;
}

const VISIONS: { name: VisionElement; label: string; color: string }[] = [
  { name: 'Pyro', label: 'Pyro (Fuego)', color: 'text-red-400 border-red-500/50 bg-red-500/20' },
  { name: 'Cryo', label: 'Cryo (Hielo)', color: 'text-cyan-300 border-cyan-400/50 bg-cyan-500/20' },
  { name: 'Electro', label: 'Electro (Rayo)', color: 'text-purple-300 border-purple-400/50 bg-purple-500/20' },
  { name: 'Hydro', label: 'Hydro (Agua)', color: 'text-blue-300 border-blue-400/50 bg-blue-500/20' },
  { name: 'Anemo', label: 'Anemo (Viento)', color: 'text-teal-300 border-teal-400/50 bg-teal-500/20' },
  { name: 'Dendro', label: 'Dendro (Planta)', color: 'text-emerald-300 border-emerald-400/50 bg-emerald-500/20' },
  { name: 'Geo', label: 'Geo (Tierra)', color: 'text-amber-300 border-amber-400/50 bg-amber-500/20' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  allProfiles,
  onSelectProfile,
  onSaveProfile,
  messageCount,
}) => {
  const [formData, setFormData] = useState<PlayerProfile>(activeProfile);
  const [activeTab, setActiveTab] = useState<'profile' | 'stats'>('profile');

  if (!isOpen) return null;

  // Affection / Romance level calculated from message counts
  const affectionLevel = Math.min(10, Math.floor(messageCount / 10) + 1);
  const affectionProgress = Math.min(100, ((messageCount % 10) / 10) * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    SoundEffects.playCriticalSuccess();
    onSaveProfile(formData);
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
              Perfil & Personalización
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

        {/* Profile Switcher Pills */}
        <div className="px-4 pt-3 flex items-center gap-2">
          {allProfiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                SoundEffects.playChime();
                onSelectProfile(p);
                setFormData(p);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-serif font-bold flex items-center justify-center gap-2 border transition-all ${
                activeProfile.id === p.id
                  ? 'bg-genshin-gold/20 border-genshin-gold text-genshin-gold shadow-sm'
                  : 'bg-genshin-panel/50 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <img
                src={p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={p.display_name}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="truncate">{p.display_name || p.username}</span>
            </button>
          ))}
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

        {/* Tabs: Perfil vs Atributos D&D */}
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
            <span>Datos de Personaje</span>
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
                  Nombre en el Rol / Apodo
                </label>
                <input
                  type="text"
                  required
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Tu nombre o apodo"
                  className="w-full px-3 py-2 rounded-xl bg-genshin-panel border border-slate-700 text-slate-100 focus:border-genshin-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-genshin-gold font-medium block mb-1">
                  Título / Descripción breve
                </label>
                <input
                  type="text"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Ej: Dama de las Estrellas de Liyue"
                  className="w-full px-3 py-2 rounded-xl bg-genshin-panel border border-slate-700 text-slate-100 focus:border-genshin-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-genshin-gold font-medium block mb-1">
                  URL de tu Avatar / Foto de Perfil
                </label>
                <input
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-genshin-panel border border-slate-700 text-slate-100 focus:border-genshin-gold focus:outline-none"
                />
              </div>

              {/* Avatar Preview */}
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-genshin-panel/50 border border-slate-700/60">
                <img
                  src={formData.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt="Vista previa"
                  className="w-12 h-12 rounded-xl object-cover border border-genshin-gold/50 shadow-md"
                />
                <div>
                  <div className="font-serif font-bold text-amber-100">{formData.display_name}</div>
                  <div className="text-[11px] text-slate-400">{formData.bio || 'Sin título'}</div>
                </div>
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
                  Estos atributos otorgan bonificadores naturales cuando lanzas dados en el rol:
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
            Guardar Perfil
          </button>
        </div>
      </div>
    </div>
  );
};
