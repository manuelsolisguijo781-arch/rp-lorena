import React, { useState } from 'react';
import { X, Plus, Sparkles, MapPin, Compass } from 'lucide-react';
import { Room } from '../types';
import { SoundEffects } from '../utils/sound';

interface RoomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  currentRoomId: string;
  onSelectRoom: (roomId: string) => void;
  onCreateRoom: (newRoom: Omit<Room, 'id' | 'createdAt'>) => void;
  messageCounts: Record<string, number>;
}

export const RoomDrawer: React.FC<RoomDrawerProps> = ({
  isOpen,
  onClose,
  rooms,
  currentRoomId,
  onSelectRoom,
  onCreateRoom,
  messageCounts,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomLocation, setNewRoomLocation] = useState('');
  const [newRoomRegion, setNewRoomRegion] = useState<Room['region']>('Mondstadt');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomBg, setNewRoomBg] = useState('');

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    SoundEffects.playCriticalSuccess();
    onCreateRoom({
      name: newRoomName.trim(),
      location: newRoomLocation.trim() || 'Teyvat • Lugar Secreto',
      region: newRoomRegion,
      description: newRoomDesc.trim() || 'Un nuevo rincón para escribir nuestra historia...',
      backgroundUrl:
        newRoomBg.trim() ||
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
      ambientType: 'night',
    });

    // Reset and close creation modal
    setNewRoomName('');
    setNewRoomLocation('');
    setNewRoomDesc('');
    setNewRoomBg('');
    setIsCreating(false);
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
              Salas de Rol
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

        {/* Room List or Creation Form */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {isCreating ? (
            <form onSubmit={handleCreateSubmit} className="space-y-3 bg-genshin-panel/60 p-3.5 rounded-2xl border border-genshin-gold/40">
              <div className="flex items-center justify-between border-b border-genshin-gold/20 pb-2">
                <span className="text-xs font-serif font-bold text-genshin-gold uppercase">
                  Crear Nueva Sala
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="text-[11px] text-genshin-gold/90 font-medium block mb-1">
                  Nombre de la Sala
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Posada Wangshu bajo la Lluvia"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-genshin-dark/80 border border-genshin-border focus:border-genshin-gold focus:outline-none text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-genshin-gold/90 font-medium block mb-1">
                    Región / Mundo
                  </label>
                  <select
                    value={newRoomRegion}
                    onChange={(e) => setNewRoomRegion(e.target.value as Room['region'])}
                    className="w-full text-xs px-2.5 py-2 rounded-xl bg-genshin-dark/80 border border-genshin-border focus:border-genshin-gold focus:outline-none text-slate-200"
                  >
                    <option value="Mondstadt">Mondstadt</option>
                    <option value="Liyue">Liyue</option>
                    <option value="Inazuma">Inazuma</option>
                    <option value="Sumeru">Sumeru</option>
                    <option value="Fontaine">Fontaine</option>
                    <option value="Custom">D&D / Libre</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-genshin-gold/90 font-medium block mb-1">
                    Ubicación Específica
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Balcón Superior"
                    value={newRoomLocation}
                    onChange={(e) => setNewRoomLocation(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-genshin-dark/80 border border-genshin-border focus:border-genshin-gold focus:outline-none text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-genshin-gold/90 font-medium block mb-1">
                  Descripción o Ambientación
                </label>
                <textarea
                  rows={2}
                  placeholder="El sonido del agua cayendo sobre el techo de tejas..."
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-genshin-dark/80 border border-genshin-border focus:border-genshin-gold focus:outline-none text-slate-200 resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-genshin-gold/90 font-medium block mb-1">
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
          ) : (
            <button
              onClick={() => {
                SoundEffects.playChime();
                setIsCreating(true);
              }}
              className="w-full py-2.5 px-3 rounded-2xl border border-dashed border-genshin-gold/40 hover:border-genshin-gold bg-genshin-panel/40 hover:bg-genshin-panel/80 text-genshin-gold flex items-center justify-center gap-2 text-xs font-serif font-bold tracking-wide transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Sala de Rol</span>
            </button>
          )}

          {/* Rooms Cards */}
          <div className="space-y-2.5">
            {rooms.map((room) => {
              const isActive = room.id === currentRoomId;
              const count = messageCounts[room.id] || 0;

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
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-genshin-gold/20 text-genshin-gold border border-genshin-gold/40 font-mono shrink-0">
                        {room.region}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1.5">
                      <MapPin className="w-3 h-3 text-genshin-gold/70 shrink-0" />
                      <span className="truncate">{room.location}</span>
                    </div>

                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                      {room.description}
                    </p>

                    <div className="mt-2 pt-1.5 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{count} mensajes registrados</span>
                      {isActive && (
                        <span className="text-genshin-gold font-bold uppercase tracking-wider">
                          ● Activa
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Backdrop click to dismiss */}
      <div className="flex-1" onClick={onClose} />
    </div>
  );
};
