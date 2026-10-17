import React, { useState } from 'react';
import { Plus, Key, Sparkles, Compass, AlertCircle } from 'lucide-react';
import { dbService } from '../lib/supabase';
import { Room, Player } from '../types';
import { SoundEffects } from '../utils/sound';

interface EmptyRoomsViewProps {
  player: Player;
  onRoomCreatedOrJoined: (room: Room) => void;
}

export const EmptyRoomsView: React.FC<EmptyRoomsViewProps> = ({
  player,
  onRoomCreatedOrJoined,
}) => {
  const [mode, setMode] = useState<'options' | 'create' | 'join'>('options');
  const [roomName, setRoomName] = useState('');
  const [roomDesc, setRoomDesc] = useState('');
  const [roomBg, setRoomBg] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const newRoom = await dbService.createRoom(
        roomName.trim(),
        roomDesc.trim(),
        roomBg.trim(),
        player.username,
        player.id
      );
      SoundEffects.playCriticalSuccess();
      onRoomCreatedOrJoined(newRoom);
    } catch (err: any) {
      SoundEffects.playCriticalFail();
      setErrorMsg(err.message || 'Error al crear la sala.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const room = await dbService.findRoomByInviteCode(joinCode.trim());
      if (!room) {
        throw new Error('No se encontró ninguna sala con ese código. Comprueba que esté bien escrito.');
      }
      await dbService.joinRoom(room.id, player.id, player.username);
      SoundEffects.playCriticalSuccess();
      onRoomCreatedOrJoined(room);
    } catch (err: any) {
      SoundEffects.playCriticalFail();
      setErrorMsg(err.message || 'Error al buscar la sala.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-genshin-card/90 backdrop-blur-md border border-genshin-gold/40 rounded-3xl p-6 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-genshin-panel border border-genshin-gold/30 text-genshin-gold mb-3 shadow-md">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <h2 className="text-lg font-serif font-bold text-amber-100">
            Bienvenido/a, {player.displayName}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Aún no tienes ninguna sala de rol activa. Puedes crear una nueva para empezar o unirte con el código de tu pareja.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {mode === 'options' && (
          <div className="space-y-3">
            <button
              onClick={() => {
                SoundEffects.playChime();
                setMode('create');
              }}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-600/30 to-yellow-600/20 hover:from-amber-600/40 hover:to-yellow-600/30 border border-genshin-gold/50 text-left transition-all active:scale-[0.98] shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-genshin-gold text-amber-950 group-hover:scale-105 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-serif font-bold text-sm text-genshin-gold">
                    Crear Nueva Sala de Rol
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Inicia un nuevo escenario y genera un código para invitar a tu pareja
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                SoundEffects.playChime();
                setMode('join');
              }}
              className="w-full p-4 rounded-2xl bg-genshin-panel/60 hover:bg-genshin-panel/90 border border-slate-700/80 hover:border-genshin-gold/40 text-left transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-genshin-panel border border-slate-600 text-slate-300 group-hover:text-genshin-gold transition-colors">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-serif font-bold text-sm text-slate-200 group-hover:text-genshin-gold transition-colors">
                    Unirme con Código
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Si tu pareja ya ha creado la sala, introduce su código para entrar
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="font-serif font-bold text-genshin-gold text-xs uppercase">
                Nueva Sala
              </span>
              <button
                type="button"
                onClick={() => setMode('options')}
                className="text-slate-400 hover:text-white"
              >
                Volver
              </button>
            </div>

            <div>
              <label className="text-[11px] text-genshin-gold font-medium block mb-1">
                Nombre de la Sala
              </label>
              <input
                type="text"
                required
                placeholder="Ej: La Taberna Oculta, Cita en la Azotea..."
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-genshin-panel border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-genshin-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-genshin-gold font-medium block mb-1">
                Ambientación / Descripción
              </label>
              <textarea
                rows={2}
                placeholder="El fuego crepita en la chimenea mientras la lluvia golpea los cristales..."
                value={roomDesc}
                onChange={(e) => setRoomDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-genshin-panel border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-genshin-gold focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-genshin-gold font-medium block mb-1">
                URL de Imagen de Fondo (Opcional)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={roomBg}
                onChange={(e) => setRoomBg(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-genshin-panel border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-genshin-gold focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-amber-950 font-serif font-bold text-xs uppercase tracking-wider shadow-genshin-gold hover:brightness-110 active:scale-95 transition-all"
            >
              {isLoading ? 'Creando Sala...' : 'Crear Sala y Obtener Código'}
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoinSubmit} className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="font-serif font-bold text-genshin-gold text-xs uppercase">
                Unirme a una Sala
              </span>
              <button
                type="button"
                onClick={() => setMode('options')}
                className="text-slate-400 hover:text-white"
              >
                Volver
              </button>
            </div>

            <div>
              <label className="text-[11px] text-genshin-gold font-medium block mb-1">
                Código de la Sala
              </label>
              <input
                type="text"
                required
                placeholder="Ej: ROL-824"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full text-center font-mono font-bold text-base px-3 py-2.5 rounded-xl bg-genshin-panel border border-slate-700 text-genshin-gold placeholder:text-slate-500 focus:border-genshin-gold focus:outline-none tracking-widest"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-amber-950 font-serif font-bold text-xs uppercase tracking-wider shadow-genshin-gold hover:brightness-110 active:scale-95 transition-all"
            >
              {isLoading ? 'Buscando Sala...' : 'Entrar a la Sala'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
