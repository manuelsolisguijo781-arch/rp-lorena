import React, { useState, useEffect } from 'react';
import { Menu, Volume2, VolumeX, Dices, Sparkles, Settings as SettingsIcon, Share2, Bell, BookOpen, Images } from 'lucide-react';
import { Room, Player } from '../types';
import { ambientPlayer, SoundEffects } from '../utils/sound';
import { notificationService } from '../utils/notifications';

interface HeaderProps {
  currentRoom: Room | null;
  player: Player;
  onOpenRoomDrawer: () => void;
  onOpenDiceModal: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenInvite: () => void;
  onOpenContext: () => void;
  onOpenNotifications: () => void;
  onOpenGallery: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoom,
  player,
  onOpenRoomDrawer,
  onOpenDiceModal,
  onOpenSettings,
  onOpenProfile,
  onOpenInvite,
  onOpenContext,
  onOpenNotifications,
  onOpenGallery,
}) => {
  const [isAudioPlaying, setIsAudioPlaying] = useState(ambientPlayer.getStatus());
  const [prefs, setPrefs] = useState(notificationService.getPreferences());

  useEffect(() => {
    setPrefs(notificationService.getPreferences());
  }, []);

  const handleToggleAudio = () => {
    SoundEffects.playChime();
    const playing = ambientPlayer.toggle();
    setIsAudioPlaying(playing);
  };

  const handleOpenDice = () => {
    SoundEffects.playChime();
    onOpenDiceModal();
  };

  const handleBellClick = () => {
    SoundEffects.playChime();
    onOpenNotifications();
  };

  const handleContextClick = () => {
    SoundEffects.playChime();
    onOpenContext();
  };

  const handleGalleryClick = () => {
    SoundEffects.playChime();
    onOpenGallery();
  };

  return (
    <header className="relative z-20 flex items-center justify-between px-2.5 sm:px-4 pt-[calc(max(env(safe-area-inset-top,0px),26px)+6px)] sm:pt-3 pb-2.5 bg-genshin-dark/95 backdrop-blur-md border-b border-genshin-gold/30 shadow-lg select-none">
      {/* Left: Room switch button & Room info */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <button
          onClick={() => {
            SoundEffects.playChime();
            onOpenRoomDrawer();
          }}
          className="p-1.5 sm:p-2 rounded-xl bg-genshin-panel/80 hover:bg-genshin-card active:scale-95 text-genshin-gold border border-genshin-gold/30 transition-all flex items-center gap-1.5 shadow-sm shrink-0"
          title="Salas de Rol"
          aria-label="Abrir selector de salas"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden md:inline text-xs font-serif font-bold text-genshin-gold uppercase tracking-wider">
            Salas
          </span>
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <h1 className="text-xs sm:text-sm md:text-base font-bold font-serif text-amber-100 truncate tracking-wide max-w-[100px] sm:max-w-[180px]">
              {currentRoom ? currentRoom.name : 'Crónicas de Rol'}
            </h1>
            {currentRoom && (
              <button
                onClick={() => {
                  SoundEffects.playChime();
                  onOpenInvite();
                }}
                className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded-lg bg-genshin-gold/20 text-genshin-gold border border-genshin-gold/40 hover:bg-genshin-gold/30 active:scale-95 transition-all flex items-center gap-1 shrink-0"
                title="Copiar código de invitación"
              >
                <Share2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>{currentRoom.inviteCode}</span>
              </button>
            )}
          </div>
          {currentRoom && (
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate max-w-[110px] sm:max-w-xs">
              {currentRoom.description}
            </p>
          )}
        </div>
      </div>

      {/* Right: Quick action buttons */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Gallery / Memories Album button */}
        {currentRoom && (
          <button
            onClick={handleGalleryClick}
            className="p-1.5 sm:p-2 rounded-xl bg-genshin-panel/90 hover:bg-genshin-card active:scale-95 border border-genshin-gold/40 text-genshin-gold transition-all shadow-sm"
            title="Álbum de Fotos y Recuerdos"
            aria-label="Álbum de fotos"
          >
            <Images className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-genshin-gold" />
          </button>
        )}

        {/* Context & Lore Map Button */}
        <button
          onClick={handleContextClick}
          className="px-2 py-1.5 rounded-xl bg-genshin-panel/90 hover:bg-genshin-card active:scale-95 border border-genshin-gold/40 text-genshin-gold flex items-center gap-1 transition-all shadow-sm"
          title="Ver Contexto, Cosmología y Mapa"
          aria-label="Contexto y Lore"
        >
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-genshin-gold" />
          <span className="text-[10px] sm:text-xs font-serif font-bold hidden xs:inline">
            Contexto
          </span>
        </button>

        {/* Notifications Bell Button */}
        <button
          onClick={handleBellClick}
          className={`p-1.5 sm:p-2 rounded-xl border transition-all active:scale-95 flex items-center gap-1 ${
            prefs.enabled
              ? 'bg-genshin-panel/80 border-genshin-gold/40 text-genshin-gold'
              : 'bg-slate-800/80 border-slate-700 text-slate-500'
          }`}
          title={
            prefs.enabled
              ? 'Ajustar o silenciar notificaciones'
              : 'Notificaciones silenciadas (Toca para activar)'
          }
          aria-label="Notificaciones"
        >
          <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Profile Pill */}
        <button
          onClick={() => {
            SoundEffects.playChime();
            onOpenProfile();
          }}
          className="flex items-center gap-1 p-1 pr-1.5 sm:pr-2 rounded-xl bg-genshin-panel/90 border border-genshin-gold/50 hover:border-genshin-gold active:scale-95 transition-all shadow-sm"
          title="Ver o editar perfil"
        >
          <img
            src={player.avatarUrl}
            alt={player.displayName}
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg object-cover"
          />
          <span className="text-[10px] sm:text-[11px] font-serif font-bold text-genshin-gold hidden sm:inline max-w-[70px] truncate">
            {player.displayName}
          </span>
        </button>

        {/* Dice roll quick button */}
        {currentRoom && (
          <button
            onClick={handleOpenDice}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-600/40 to-yellow-600/30 hover:from-amber-600/60 hover:to-yellow-600/50 active:scale-95 border border-genshin-gold/60 text-genshin-gold font-serif text-xs font-bold flex items-center gap-1 shadow-genshin-gold transition-all"
            title="Lanzar Dados D&D"
          >
            <Dices className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-genshin-gold animate-pulse" />
            <span className="hidden md:inline">Dado</span>
          </button>
        )}

        {/* Ambient music toggle */}
        <button
          onClick={handleToggleAudio}
          className={`p-1.5 sm:p-2 rounded-xl border transition-all active:scale-95 ${
            isAudioPlaying
              ? 'bg-genshin-gold/20 border-genshin-gold text-genshin-gold shadow-genshin-gold'
              : 'bg-genshin-panel/80 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          title={isAudioPlaying ? 'Silenciar ambiente' : 'Activar ambiente sonoro'}
          aria-label="Alternar música ambiental"
        >
          {isAudioPlaying ? (
            <div className="relative">
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-genshin-gold" />
              <Sparkles className="w-2 h-2 text-genshin-gold absolute -top-1 -right-1 animate-spin" />
            </div>
          ) : (
            <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
        </button>

        {/* Settings button */}
        <button
          onClick={() => {
            SoundEffects.playChime();
            onOpenSettings();
          }}
          className="p-1.5 sm:p-2 rounded-xl bg-genshin-panel/80 hover:bg-genshin-card active:scale-95 border border-slate-700 text-slate-300 hover:text-genshin-gold transition-all"
          title="Ajustes y Exportar Historia"
          aria-label="Ajustes"
        >
          <SettingsIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </header>
  );
};
