import React, { useState } from 'react';
import { X, Plus, Key, Sparkles, Compass, Share2, Copy, Check } from 'lucide-react';
import { Room } from '../types';
import { SoundEffects } from '../utils/sound';

interface RoomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  currentRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onCreateRoom: (name: string, desc: string, bg: string) => void;
  onJoinRoom: (code: string) => void;
  messageCounts: Record<string, number>;
}

export const RoomDrawer: React.FC<RoomDrawerProps> = ({
  isOpen,
  onClose,
  rooms,
  currentRoomId,
  onSelectRoom,
  onCreateRoom,
  onJoinRoom,
  messageCounts,
}) => {
  const [mode, setMode] = useState<'list' | 'create' | 'join'>('list');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomBg, setNewRoomBg] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    onCreateRoom(newRoomName.trim(), newRoomDesc.trim(), newRoomBg.trim());
    setNewRoomName('');
    setNewRoomDesc('');
    setNewRoomBg('');
    setMode('list');
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    onJoinRoom(joinCode.trim().toUpperCase());
    setJoinCode('');
    setMode('list');
  };

  const handleCopyCode = (e: React.MouseEvent, room: Room) => {
    e.stopPropagation();
    SoundEffects.playChime();
    navigator.clipboard.writeText(room.inviteCode);
    setCopiedCodeId(room.id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/70 backdrop-blur-sm animate-fadeIn">
      {/* Drawer Container */}
      <div className="w-full max-w-sm h-full bg-genshin-card/95 border-r border-genshin-gold/40 flex flex-col shadow-2xl overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 bg-genshin-dark/90 border-b border-genshin-gold/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-genshin-gold animate-spin-slow" />
            <h2 className="text-base font-serif font-bold text-amber-100 tracking-wide">
              Mis Salas de Rol
            </h2>
          </div>
          <button
            onClick={() => {
              SoundEffects.playChime();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-genshin-panel/80 hover:bg-genshin-border text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {mode === 'create' ? (
            <form onSubmit={handleCreateSubmit} className="space-y-3 bg-genshin-panel/60 p-3.5 rounded-2xl border border-genshin-gold/40">
              <div className="flex items-center justify-between border-b border-genshin-gold/20 pb-2">
                <span className="text-xs font-serif font-bold text-genshin-gold uppercase">
                  Crear Nueva Sala
                </span>
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="text-[11px] text-genshin-gold font-medium block mb-1">
                  Nombre de la Sala
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Salón Privado, Bosque Prohibido..."
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-genshin-dark/80 border border-genshin-border focus:border-genshin-gold focus:outline-none text-slate-200"
                />
              </div>

              <div>
                <label className="text-[11px] text-genshin-gold font-medium block mb-1">
                  Descripción / Ambiente
                </label>
                <textarea
                  rows={2}
                  placeholder="Una velada tranquila con velas encendidas..."
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-genshin-dark/80 border border-genshin-border focus:border-genshin-gold focus:outline-none text-slate-200 resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-genshin-gold font-medium block mb-1">
                  URL de Imagen de Fondo (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newRoomBg}
                  onChange={(e) => setNewRoomBg(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-genshin-dark/80 border border-genshin-border focus:border-genshin-gold focus:outline-none text-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-amber-950 font-serif font-bold text-xs uppercase tracking-wider shadow-genshin-gold hover:brightness-110 active:scale-95 transition-all"
              >
                Crear Sala
              </button>
            </form>
          ) : mode === 'join' ? (
            <form onSubmit={handleJoinSubmit} className="space-y-3 bg-genshin-panel/60 p-3.5 rounded-2xl border border-genshin-gold/40">
              <div className="flex items-center justify-between border-b border-genshin-gold/20 pb-2">
                <span className="text-xs font-serif font-bold text-genshin-gold uppercase">
                  Unirse con Código
                </span>
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="text-[11px] text-genshin-gold font-medium block mb-1">
                  Código de Invitación
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: ROL-824"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full font-mono text-center font-bold text-sm px-3 py-2 rounded-xl bg-genshin-dark/80 border border-genshin-border focus:border-genshin-gold focus:outline-none text-genshin-gold tracking-widest"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-amber-950 font-serif font-bold text-xs uppercase tracking-wider shadow-genshin-gold hover:brightness-110 active:scale-95 transition-all"
              >
                Unirme a la Sala
              </button>
            </form>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    SoundEffects.playChime();
                    setMode('create');
                  }}
                  className="py-2 px-2.5 rounded-xl border border-dashed border-genshin-gold/40 hover:border-genshin-gold bg-genshin-panel/40 hover:bg-genshin-panel/80 text-genshin-gold flex items-center justify-center gap-1.5 text-xs font-serif font-bold tracking-wide transition-all active:scale-95 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Sala</span>
                </button>

                <button
                  onClick={() => {
                    SoundEffects.playChime();
                    setMode('join');
                  }}
                  className="py-2 px-2.5 rounded-xl border border-dashed border-slate-600 hover:border-genshin-gold bg-genshin-panel/40 hover:bg-genshin-panel/80 text-slate-300 hover:text-genshin-gold flex items-center justify-center gap-1.5 text-xs font-serif font-bold tracking-wide transition-all active:scale-95 shadow-sm"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Unirse (Código)</span>
                </button>
              </div>

              {/* Room Cards List */}
              <div className="space-y-2.5 pt-2">
                {rooms.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No tienes salas. Crea una para empezar.
                  </div>
                ) : (
                  rooms.map((room) => {
                    const isActive = room.id === currentRoomId;
                    const count = messageCounts[room.id] || 0;
                    const isCopied = copiedCodeId === room.id;

                    return (
                      <div
                        key={room.id}
                        onClick={() => {
                          SoundEffects.playChime();
                          onSelectRoom(room.id);
                          onClose();
                        }}
                        className={`group relative overflow-hidden rounded-2xl cursor-pointer border transition-all active:scale-[0.98] ${
                          isActive
                            ? 'border-genshin-gold ring-1 ring-genshin-gold shadow-genshin-gold'
                            : 'border-genshin-border/80 hover:border-genshin-gold/50 bg-genshin-panel/40'
                        }`}
                      >
                        {/* Background Thumbnail with dark gradient */}
                        <div
                          className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"
                          style={{ backgroundImage: `url(${room.backgroundUrl})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-genshin-card via-genshin-card/85 to-transparent" />

                        {/* Card Content */}
                        <div className="relative p-3">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-xs font-serif font-bold text-amber-100 group-hover:text-genshin-gold transition-colors flex items-center gap-1.5">
                              {isActive && <Sparkles className="w-3.5 h-3.5 text-genshin-gold shrink-0" />}
                              {room.name}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyCode(e, room)}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-black/50 hover:bg-genshin-gold/30 text-genshin-gold border border-genshin-gold/40 font-mono shrink-0 flex items-center gap-1"
                              title="Copiar código de invitación"
                            >
                              {isCopied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                              <span>{isCopied ? 'Copiado' : room.inviteCode}</span>
                            </button>
                          </div>

                          <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                            {room.description}
                          </p>

                          <div className="mt-2 pt-1.5 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400">
                            <span>{count} mensajes</span>
                            {isActive && (
                              <span className="text-genshin-gold font-bold uppercase tracking-wider">
                                ● Activa
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop click to dismiss */}
      <div className="flex-1" onClick={onClose} />
    </div>
  );
};
