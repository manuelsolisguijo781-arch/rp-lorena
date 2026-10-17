import React, { useState } from 'react';
import { X, Images, Calendar, User, Download, ExternalLink, Sparkles } from 'lucide-react';
import { Message, Room } from '../types';
import { SoundEffects } from '../utils/sound';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  messages: Message[];
  onImageClick?: (url: string) => void;
}

interface GalleryItem {
  id: string;
  url: string;
  senderName: string;
  senderAvatar: string;
  caption?: string;
  timestamp: number;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  isOpen,
  onClose,
  room,
  messages,
  onImageClick,
}) => {
  const [filterSender, setFilterSender] = useState<string>('all');

  if (!isOpen || !room) return null;

  // Extract all images from all messages in this room
  const allGalleryItems: GalleryItem[] = [];
  messages.forEach((msg) => {
    if (msg.roomId !== room.id) return;

    const urls = msg.imageUrls && msg.imageUrls.length > 0
      ? msg.imageUrls
      : msg.imageUrl
      ? [msg.imageUrl]
      : [];

    urls.forEach((url, idx) => {
      allGalleryItems.push({
        id: `${msg.id}-${idx}`,
        url: url,
        senderName: msg.senderName,
        senderAvatar: msg.senderAvatar,
        caption: msg.content.replace(/\*([^*]+)\*/g, '').replace(/\|\|([^|]+)\|\|/g, '').trim() || undefined,
        timestamp: msg.timestamp,
      });
    });
  });

  // Filter if selected
  const senders = Array.from(new Set(allGalleryItems.map((item) => item.senderName)));
  const filteredItems = filterSender === 'all'
    ? allGalleryItems
    : allGalleryItems.filter((item) => item.senderName === filterSender);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl h-[90vh] max-h-[750px] bg-genshin-card/95 border border-genshin-gold/50 rounded-3xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-genshin-dark/95 border-b border-genshin-gold/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-genshin-panel border border-genshin-gold/40 text-genshin-gold">
              <Images className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-serif font-bold text-amber-100 flex items-center gap-2">
                <span>Álbum de Recuerdos</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-genshin-gold/20 text-genshin-gold font-mono">
                  {allGalleryItems.length} {allGalleryItems.length === 1 ? 'foto' : 'fotos'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Todas las fotos y escenas compartidas en <strong>{room.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              SoundEffects.playChime();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-genshin-panel/80 hover:bg-genshin-panel text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        {senders.length > 1 && (
          <div className="px-4 py-2 border-b border-slate-700/60 bg-genshin-panel/40 flex items-center gap-2 shrink-0 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-serif font-bold text-slate-400 uppercase">Filtrar:</span>
            <button
              onClick={() => setFilterSender('all')}
              className={`px-2.5 py-1 rounded-xl text-xs font-serif transition-all ${
                filterSender === 'all'
                  ? 'bg-genshin-gold text-amber-950 font-bold'
                  : 'bg-genshin-panel text-slate-300 hover:text-white'
              }`}
            >
              Todas ({allGalleryItems.length})
            </button>
            {senders.map((s) => (
              <button
                key={s}
                onClick={() => setFilterSender(s)}
                className={`px-2.5 py-1 rounded-xl text-xs font-serif transition-all ${
                  filterSender === s
                    ? 'bg-genshin-gold text-amber-950 font-bold'
                    : 'bg-genshin-panel text-slate-300 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Photos Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <Images className="w-12 h-12 text-slate-600 mb-2" />
              <p className="text-sm font-serif text-slate-300">Aún no hay fotos en esta sala</p>
              <p className="text-xs text-slate-500 mt-1">
                Adjunta fotos en el chat usando el botón 📷 para que se guarden aquí en vuestro álbum.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    SoundEffects.playChime();
                    onImageClick?.(item.url);
                  }}
                  className="group relative rounded-2xl overflow-hidden border border-slate-700/80 hover:border-genshin-gold bg-black/40 cursor-pointer shadow-md transition-all active:scale-95"
                >
                  <div className="aspect-square w-full overflow-hidden">
                    <img
                      src={item.url}
                      alt={item.caption || 'Recuerdo de rol'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  {/* Subtle bottom gradient with author */}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between text-[10px]">
                    <span className="font-serif font-bold text-amber-200 truncate max-w-[90px]">
                      {item.senderName}
                    </span>
                    <span className="font-mono text-slate-400 text-[9px]">
                      {new Date(item.timestamp).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
