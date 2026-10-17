import React, { useState } from 'react';
import { X, Copy, Check, Share2, Sparkles, Key } from 'lucide-react';
import { Room } from '../types';
import { SoundEffects } from '../utils/sound';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, room }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const currentUrl = window.location.origin + window.location.pathname;
  const inviteLink = `${currentUrl}#invite=${room.inviteCode}`;

  const handleCopyCode = () => {
    SoundEffects.playChime();
    navigator.clipboard.writeText(room.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    SoundEffects.playChime();
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-genshin-card border border-genshin-gold/50 rounded-3xl shadow-2xl p-5 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-genshin-gold" />
            <h2 className="text-base font-serif font-bold text-amber-100">
              Invitar a la Sala
            </h2>
          </div>
          <button
            onClick={() => {
              SoundEffects.playChime();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          Comparte este código o enlace con tu pareja para que pueda unirse directamente a <strong>{room.name}</strong> desde su móvil.
        </p>

        {/* Code Box */}
        <div className="p-4 rounded-2xl bg-genshin-panel/80 border border-genshin-gold/40 text-center mb-4">
          <div className="text-[10px] uppercase font-serif tracking-wider text-slate-400 mb-1">
            Código de Invitación
          </div>
          <div className="text-2xl font-mono font-extrabold text-genshin-gold tracking-widest my-1">
            {room.inviteCode}
          </div>
          <button
            onClick={handleCopyCode}
            className="mt-2 px-3 py-1.5 rounded-xl bg-genshin-card hover:bg-genshin-border text-slate-200 border border-slate-700 text-xs font-serif font-bold inline-flex items-center gap-1.5 transition-all active:scale-95"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? '¡Código Copiado!' : 'Copiar Código'}</span>
          </button>
        </div>

        {/* Direct Link Box */}
        <div className="space-y-2">
          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-amber-950 font-serif font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-genshin-gold active:scale-95 transition-all"
          >
            {copiedLink ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            <span>{copiedLink ? '¡Enlace Copiado al Portapapeles!' : 'Copiar Enlace Directo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
