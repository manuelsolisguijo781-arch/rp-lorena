import React, { useState, useEffect } from 'react';
import { Menu, Volume2, VolumeX, Dices, Sparkles, Settings as SettingsIcon, Share2, Bell, BellOff } from 'lucide-react';
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
}

export const Header: React.FC<HeaderProps> = ({
  currentRoom,
  player,
  onOpenRoomDrawer,
  onOpenDiceModal,
  onOpenSettings,
  onOpenProfile,
  onOpenInvite,
}) => {
  const [isAudioPlaying, setIsAudioPlaying] = useState(ambientPlayer.getStatus());
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setNotifPermission(notificationService.getPermission());
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

  const handleToggleNotifications = async () => {
    SoundEffects.playChime();
    if (notifPermission !== 'granted') {
      const granted = await notificationService.requestPermission();
      if (granted) {
        setNotifPermission('granted');
      }
    } else {
      // Send a test ping
      notificationService.notify(
        'Notificaciones Activas 🔔',
        'Todo listo. Tu móvil te avisará cuando tu pareja te escriba.',
        player.avatarUrl
      );
    }
  };

  return (
    <header className="relative z-20 flex items-center justify-between px-3 py-2.5 bg-genshin-dark/95 backdrop-blur-md border-b border-genshin-gold/30 shadow-lg">
      {/* Left: Room switch button */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={() => {
            SoundEffects.playChime();
            onOpenRoomDrawer();
          }}
          className="p-2 rounded-xl bg-genshin-panel/80 hover:bg-genshin-card active:scale-95 text-genshin-gold border border-genshin-gold/30 transition-all flex items-center gap-1.5 shadow-sm"
          title="Salas de Rol"
          aria-label="Abrir selector de salas"
        >
          <Menu className="w-5 h-5" />
          <span className="hidden sm:inline text-xs font-serif font-bold text-genshin-gold uppercase tracking-wider">
            Salas
          </span>
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm sm:text-base font-bold font-serif text-amber-100 truncate tracking-wide">
              {currentRoom ? currentRoom.name : 'Crónicas de Rol'}
            </h1>
            {currentRoom && (
              <button
                onClick={() => {
                  SoundEffects.playChime();
                  onOpenInvite();
                }}
                className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-genshin-gold/20 text-genshin-gold border border-genshin-gold/40 hover:bg-genshin-gold/30 active:scale-95 transition-all flex items-center gap-1 shrink-0"
                title="Copiar código de invitación"
              >
                <Share2 className="w-3 h-3" />
                <span>{currentRoom.inviteCode}</span>
              </button>
            )}
          </div>
          {currentRoom && (
            <p className="text-[11px] text-slate-400 truncate max-w-[150px] sm:max-w-xs">
              {currentRoom.description}
            </p>
          )}
        </div>
      </div>

      {/* Right: Quick action buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Notifications Bell Button */}
        <button
          onClick={handleToggleNotifications}
          className={`p-2 rounded-xl border transition-all active:scale-95 flex items-center gap-1 ${
            notifPermission === 'granted'
              ? 'bg-genshin-panel/80 border-genshin-gold/40 text-genshin-gold'
              : 'bg-amber-600/20 border-amber-500/60 text-amber-300 animate-pulse'
          }`}
          title={
            notifPermission === 'granted'
              ? 'Notificaciones activadas (Toca para probar)'
              : 'Toca para activar avisos en tu móvil'
          }
          aria-label="Notificaciones"
        >
          <Bell className="w-4 h-4" />
          {notifPermission !== 'granted' && (
            <span className="text-[10px] font-serif font-bold hidden xs:inline">
              Avisos
            </span>
          )}
        </button>

        {/* Profile Pill */}
        <button
          onClick={() => {
            SoundEffects.playChime();
            onOpenProfile();
          }}
          className="flex items-center gap-1.5 p-1 pr-2 rounded-xl bg-genshin-panel/90 border border-genshin-gold/50 hover:border-genshin-gold active:scale-95 transition-all shadow-sm"
          title="Ver o editar perfil"
        >
          <img
            src={player.avatarUrl}
            alt={player.displayName}
            className="w-6 h-6 rounded-lg object-cover"
          />
          <span className="text-[11px] font-serif font-bold text-genshin-gold hidden sm:inline max-w-[75px] truncate">
            {player.displayName}
          </span>
        </button>

        {/* Dice roll quick button */}
        {currentRoom && (
          <button
            onClick={handleOpenDice}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600/40 to-yellow-600/30 hover:from-amber-600/60 hover:to-yellow-600/50 active:scale-95 border border-genshin-gold/60 text-genshin-gold font-serif text-xs font-bold flex items-center gap-1.5 shadow-genshin-gold transition-all"
            title="Lanzar Dados D&D"
          >
            <Dices className="w-4 h-4 text-genshin-gold animate-pulse" />
            <span className="hidden sm:inline">Dado</span>
          </button>
        )}

        {/* Ambient music toggle */}
        <button
          onClick={handleToggleAudio}
          className={`p-2 rounded-xl border transition-all active:scale-95 ${
            isAudioPlaying
              ? 'bg-genshin-gold/20 border-genshin-gold text-genshin-gold shadow-genshin-gold'
              : 'bg-genshin-panel/80 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          title={isAudioPlaying ? 'Silenciar ambiente' : 'Activar ambiente sonoro'}
          aria-label="Alternar música ambiental"
        >
          {isAudioPlaying ? (
            <div className="relative">
              <Volume2 className="w-4 h-4 text-genshin-gold" />
              <Sparkles className="w-2.5 h-2.5 text-genshin-gold absolute -top-1.5 -right-1.5 animate-spin" />
            </div>
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>

        {/* Settings button */}
        <button
          onClick={() => {
            SoundEffects.playChime();
            onOpenSettings();
          }}
          className="p-2 rounded-xl bg-genshin-panel/80 hover:bg-genshin-card active:scale-95 border border-slate-700 text-slate-300 hover:text-genshin-gold transition-all"
          title="Ajustes y Exportar Historia"
          aria-label="Ajustes"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
