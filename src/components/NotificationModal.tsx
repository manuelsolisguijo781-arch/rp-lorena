import React, { useState, useEffect } from 'react';
import { X, Bell, BellOff, Volume2, VolumeX, Smartphone, EyeOff, ShieldCheck, Sparkles, Send } from 'lucide-react';
import { notificationService, NotificationPreferences } from '../utils/notifications';
import { SoundEffects } from '../utils/sound';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerAvatar?: string;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  playerAvatar,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [prefs, setPrefs] = useState<NotificationPreferences>(notificationService.getPreferences());
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPermission(notificationService.getPermission());
      setPrefs(notificationService.getPreferences());
      setTestSent(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    SoundEffects.playChime();
    const granted = await notificationService.requestPermission();
    setPermission(notificationService.getPermission());
    if (granted) {
      setPrefs(notificationService.getPreferences());
    }
  };

  const handleTogglePref = (key: keyof NotificationPreferences) => {
    SoundEffects.playChime();
    const updated = { ...prefs, [key]: !prefs[key] };
    const saved = notificationService.savePreferences(updated);
    setPrefs(saved);
  };

  const handleSendTestNotification = () => {
    SoundEffects.playCriticalSuccess();
    setTestSent(true);
    notificationService.notify(
      'Pareja de Rol 💬',
      prefs.discreteMode
        ? '💬 Tienes un nuevo mensaje secreto en la historia.'
        : '*Te mira a los ojos con una sonrisa cómplice.* "¿Listo/a para continuar?"',
      playerAvatar
    );
    setTimeout(() => setTestSent(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-genshin-card/95 border border-genshin-gold/50 rounded-3xl p-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-genshin-gold/30 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${prefs.enabled ? 'bg-amber-600/30 text-genshin-gold' : 'bg-slate-800 text-slate-400'}`}>
              {prefs.enabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-amber-100">
                Ajustes de Notificaciones
              </h3>
              <p className="text-[11px] text-slate-400">
                Controla los avisos en tu móvil cuando tu pareja te escriba
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

        {/* Permission status card */}
        <div className="mb-4 p-3 rounded-2xl bg-genshin-panel/70 border border-slate-700/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 ${permission === 'granted' ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="text-xs font-serif font-bold text-slate-200">
                Permiso del Navegador:
              </span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                permission === 'granted'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
              }`}
            >
              {permission === 'granted' ? 'Activado' : 'Sin permiso'}
            </span>
          </div>

          {permission !== 'granted' && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-700/50">
              <p className="text-[11px] text-slate-300 mb-2">
                Para que tu móvil vibre y suene al recibir mensajes, debes conceder permiso.
              </p>
              <button
                onClick={handleRequestPermission}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-amber-950 font-serif font-bold text-xs uppercase tracking-wider shadow-genshin-gold hover:brightness-110 active:scale-95 transition-all"
              >
                Conceder Permiso Ahora
              </button>
            </div>
          )}
        </div>

        {/* Preferences Toggles */}
        <div className="space-y-2.5 mb-5 text-xs">
          {/* Master Toggle */}
          <div className="p-3 rounded-2xl bg-genshin-panel/60 border border-genshin-gold/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-genshin-dark text-genshin-gold">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="font-serif font-bold text-amber-100">
                  Notificaciones de Mensaje
                </div>
                <div className="text-[10px] text-slate-400">
                  {prefs.enabled ? 'Recibiendo avisos en tiempo real' : 'Silenciadas por completo'}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleTogglePref('enabled')}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                prefs.enabled ? 'bg-genshin-gold' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-genshin-dark transition-transform ${
                  prefs.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sound Toggle */}
          <div className={`p-3 rounded-2xl bg-genshin-panel/40 border border-slate-800 flex items-center justify-between transition-opacity ${!prefs.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-genshin-dark text-slate-300">
                {prefs.sound ? <Volume2 className="w-4 h-4 text-genshin-gold" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <div className="font-serif font-bold text-slate-200">
                  Sonido de Aviso
                </div>
                <div className="text-[10px] text-slate-400">
                  Tono sutil al recibir mensaje de tu pareja
                </div>
              </div>
            </div>
            <button
              onClick={() => handleTogglePref('sound')}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                prefs.sound ? 'bg-genshin-gold' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-genshin-dark transition-transform ${
                  prefs.sound ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Vibration Toggle */}
          <div className={`p-3 rounded-2xl bg-genshin-panel/40 border border-slate-800 flex items-center justify-between transition-opacity ${!prefs.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-genshin-dark text-slate-300">
                <Smartphone className="w-4 h-4 text-genshin-gold" />
              </div>
              <div>
                <div className="font-serif font-bold text-slate-200">
                  Vibración en el Móvil
                </div>
                <div className="text-[10px] text-slate-400">
                  Doble pulso táctil al entrar un mensaje nuevo
                </div>
              </div>
            </div>
            <button
              onClick={() => handleTogglePref('vibration')}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                prefs.vibration ? 'bg-genshin-gold' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-genshin-dark transition-transform ${
                  prefs.vibration ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Discrete Privacy Mode Toggle */}
          <div className={`p-3 rounded-2xl bg-genshin-panel/40 border border-slate-800 flex items-center justify-between transition-opacity ${!prefs.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-2.5 pr-2">
              <div className="p-1.5 rounded-lg bg-genshin-dark text-slate-300">
                <EyeOff className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="font-serif font-bold text-slate-200 flex items-center gap-1.5">
                  <span>Modo Discreto / Privacidad</span>
                  <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                    Recomendado
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                  Oculta el texto íntimo en la pantalla de bloqueo y muestra solo: "💬 Mensaje secreto recibido".
                </div>
              </div>
            </div>
            <button
              onClick={() => handleTogglePref('discreteMode')}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                prefs.discreteMode ? 'bg-genshin-gold' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-genshin-dark transition-transform ${
                  prefs.discreteMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Test Notification Button */}
        <div className="pt-2">
          <button
            onClick={handleSendTestNotification}
            disabled={!prefs.enabled || permission !== 'granted'}
            className="w-full py-2.5 rounded-2xl bg-genshin-panel/80 hover:bg-genshin-panel border border-genshin-gold/40 text-genshin-gold font-serif text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none shadow-sm"
          >
            {testSent ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                <span>¡Aviso de prueba enviado! Revisa tu móvil</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Notificación de Prueba</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-center text-slate-500 mt-2">
            💡 En iOS (iPhone), la app debe estar agregada a la pantalla de inicio para avisar en reposo.
          </p>
        </div>
      </div>
    </div>
  );
};
