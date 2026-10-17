import React from 'react';
import { X, Download } from 'lucide-react';
import { SoundEffects } from '../utils/sound';

interface PhotoModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

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
