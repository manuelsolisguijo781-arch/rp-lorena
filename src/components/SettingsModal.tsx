import React, { useState } from 'react';
import { X, Download, Shield, Trash2, FileText, LogOut } from 'lucide-react';
import { Room, Message, Player } from '../types';
import { SoundEffects } from '../utils/sound';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoom: Room | null;
  messages: Message[];
  player: Player;
  onClearRoomHistory: (roomId: string) => void;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentRoom,
  messages,
  player,
  onClearRoomHistory,
  onLogout,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const handleExportStory = () => {
    if (!currentRoom) return;
    SoundEffects.playCriticalSuccess();
    const roomMessages = messages.filter((m) => m.roomId === currentRoom.id);

    let textContent = `# Crónica de Rol: ${currentRoom.name}\n`;
    textContent += `Código de Sala: ${currentRoom.inviteCode}\n`;
    textContent += `Fecha de exportación: ${new Date().toLocaleDateString()}\n\n`;
    textContent += `---\n\n`;

    roomMessages.forEach((msg) => {
      const time = new Date(msg.timestamp).toLocaleString();
      textContent += `### [${time}] ${msg.senderName}\n`;

      if (msg.diceRoll) {
        textContent += `> 🎲 **Tirada D&D (${msg.diceRoll.actionName})**: ${msg.diceRoll.total} [${msg.diceRoll.outcome.toUpperCase()}]\n`;
        if (msg.diceRoll.description) {
          textContent += `> *${msg.diceRoll.description}*\n`;
        }
      }

      msg.parsedBlocks.forEach((block) => {
        if (block.type === 'action') {
          textContent += `*${block.text}*\n\n`;
        } else {
          textContent += `"${block.text}"\n\n`;
        }
      });

      if (msg.imageUrl) {
        textContent += `![Imagen de escena](${msg.imageUrl})\n\n`;
      }

      textContent += `\n`;
    });

    const blob = new Blob([textContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cronica-${currentRoom.name.toLowerCase().replace(/\s+/g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-genshin-card border border-genshin-gold/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-genshin-dark border-b border-genshin-gold/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-genshin-gold" />
            <h2 className="text-base font-serif font-bold text-amber-100 tracking-wide">
              Ajustes & Opciones
            </h2>
          </div>
          <button
            onClick={() => {
              SoundEffects.playChime();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-genshin-panel/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Export Story */}
          {currentRoom && (
            <div className="p-3.5 rounded-2xl bg-genshin-panel/60 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-genshin-gold">
                <FileText className="w-4 h-4" />
                <span>Exportar Recuerdos de la Sala</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Descarga todo el historial de <strong>{currentRoom.name}</strong> en formato
                documento para guardarlo para siempre.
              </p>
              <button
                onClick={handleExportStory}
                className="w-full py-2.5 rounded-xl bg-genshin-card hover:bg-genshin-border text-genshin-gold border border-genshin-gold/40 text-xs font-serif font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Crónica (.md)</span>
              </button>
            </div>
          )}

          {/* Clear Room History */}
          {currentRoom && (
            <div className="p-3 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-red-400">
                <Trash2 className="w-4 h-4" />
                <span>Reiniciar Mensajes de {currentRoom.name}</span>
              </div>
              {confirmClear ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-red-300">
                    ¿Seguro? Esta acción vaciará el historial de esta sala.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        SoundEffects.playCriticalFail();
                        onClearRoomHistory(currentRoom.id);
                        setConfirmClear(false);
                        onClose();
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                    >
                      Sí, Borrar
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="flex-1 py-1.5 rounded-lg bg-slate-700 text-slate-200 text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="text-xs text-red-400/80 hover:text-red-300 underline"
                >
                  Limpiar historial de la sala
                </button>
              )}
            </div>
          )}

          {/* Session Logout */}
          <div className="p-3 rounded-2xl bg-genshin-panel/40 border border-slate-700/60 flex items-center justify-between">
            <div>
              <div className="text-xs font-serif font-bold text-slate-200">
                Sesión iniciada como @{player.username}
              </div>
              <div className="text-[11px] text-slate-400">
                {player.displayName}
              </div>
            </div>
            <button
              onClick={() => {
                SoundEffects.playChime();
                onLogout();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-950/70 text-red-300 border border-red-900/50 text-xs font-serif font-bold flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
