import React, { useState } from 'react';
import { X, Download, Wallpaper, Check } from 'lucide-react';
import { SoundEffects } from '../utils/sound';

interface PhotoModalProps {
  imageUrl: string | null;
  onClose: () => void;
  onSetBackground?: (url: string) => void;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({ imageUrl, onClose, onSetBackground }) => {
  const [isApplied, setIsApplied] = useState(false);

  if (!imageUrl) return null;

  const handleApplyBackground = () => {
    SoundEffects.playCriticalSuccess();
    onSetBackground?.(imageUrl);
    setIsApplied(true);
    setTimeout(() => setIsApplied(false), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
      >
        <div className="absolute top-2 right-2 flex gap-2 z-10">
          {onSetBackground && (
            <button
              onClick={handleApplyBackground}
              className={`px-3 py-2 rounded-xl text-xs font-serif font-bold flex items-center gap-1.5 transition-all shadow-lg active:scale-95 ${
                isApplied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-genshin-card/90 text-genshin-gold hover:text-white border border-genshin-gold/50 hover:bg-genshin-panel'
              }`}
              title="Poner esta foto como fondo del chat"
            >
              {isApplied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Fondo Puesto!</span>
                </>
              ) : (
                <>
                  <Wallpaper className="w-4 h-4" />
                  <span>Poner de Fondo</span>
                </>
              )}
            </button>
          )}

          <a
            href={imageUrl}
            download="genshin-rp-foto"
            className="p-2 rounded-xl bg-genshin-card/80 text-genshin-gold hover:text-white border border-genshin-gold/40 transition-colors"
            title="Descargar foto"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={() => {
              SoundEffects.playChime();
              onClose();
            }}
            className="p-2 rounded-xl bg-genshin-card/80 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <img
          src={imageUrl}
          alt="Ampliación"
          className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-genshin-gold/40 shadow-2xl"
        />
      </div>
    </div>
  );
};
