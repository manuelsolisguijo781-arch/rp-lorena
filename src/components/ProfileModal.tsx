import React, { useState, useRef } from 'react';
import { X, User, Heart, Sparkles, Shield, Award, LogOut, Camera, Loader2, Image as ImageIcon } from 'lucide-react';
import { Player } from '../types';
import { dbService } from '../lib/supabase';
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
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const affectionLevel = Math.min(10, Math.floor(messageCount / 10) + 1);
  const affectionProgress = Math.min(100, ((messageCount % 10) / 10) * 100);

  // Handle uploading photo directly from phone gallery / camera
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    SoundEffects.playChime();

    try {
      const publicUrl = await dbService.uploadImage(file);
      if (publicUrl) {
        setAvatarUrl(publicUrl);
        SoundEffects.playCriticalSuccess();
      } else {
        alert('No se pudo subir la foto. Inténtalo de nuevo.');
      }
    } catch (err) {
      console.error(err);
      alert('Error al procesar la foto de la galería.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
            <form id="profileForm" onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Photo Upload Area (Mobile Gallery & Camera) */}
              <div className="flex flex-col items-center justify-center pt-1 pb-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group cursor-pointer w-24 h-24 rounded-3xl overflow-hidden border-2 border-genshin-gold/60 hover:border-genshin-gold p-1 bg-genshin-dark/80 shadow-genshin-gold transition-all active:scale-95"
                  title="Toca para abrir la galería y cambiar foto"
                >
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover rounded-2xl"
                  />

                  {/* Overlay button */}
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                    {isUploading ? (
                      <Loader2 className="w-7 h-7 text-genshin-gold animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-genshin-gold mb-1" />
                        <span className="text-[10px] text-amber-100 font-serif font-bold">
                          Cambiar Foto
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Direct button to trigger gallery */}
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2.5 px-3 py-1.5 rounded-xl bg-genshin-panel hover:bg-genshin-border text-genshin-gold border border-genshin-gold/40 text-[11px] font-serif font-bold inline-flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Subiendo foto...' : 'Abrir Galería del Móvil'}</span>
                </button>
              </div>

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
            disabled={isUploading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-amber-950 font-serif font-bold text-xs uppercase tracking-wider shadow-genshin-gold hover:brightness-110 active:scale-95 transition-all"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
