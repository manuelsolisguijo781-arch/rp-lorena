import React, { useState, useEffect } from 'react';
import { X, User, Shirt, Heart, Shield, Sparkles, Save, Check, Lock } from 'lucide-react';
import { Player } from '../types';
import { SoundEffects } from '../utils/sound';

interface CharacterSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlayer: Player | null;
  isOwnProfile: boolean;
  onSaveProfile?: (updated: Player) => Promise<void>;
}

const OUTFIT_PRESETS = [
  'Ropa habitual de viaje',
  'Armadura de cuero desgastada',
  'Túnica ligera de seda',
  'Vestido de noche elegante',
  'Ropa interior / Íntima',
  'Sin ropa / Desnudo/a',
  'Atado/a con cuerdas de seda',
];

const CONDITION_PRESETS = [
  'Normal y relajado/a',
  'Alerta / Vigilante',
  'Sonrojado/a y agitado/a',
  'Excitado/a / Deseoso/a',
  'Sometido/a / Sin resistencia',
  'Hechizado/a por magia prohibida',
  'Cansado/a tras el combate',
];

export const CharacterSheetModal: React.FC<CharacterSheetModalProps> = ({
  isOpen,
  onClose,
  targetPlayer,
  isOwnProfile,
  onSaveProfile,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [outfit, setOutfit] = useState('');
  const [condition, setCondition] = useState('');
  const [weapon, setWeapon] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (targetPlayer) {
      setDisplayName(targetPlayer.displayName || '');
      setBio(targetPlayer.bio || '');
      setOutfit(targetPlayer.outfit || 'Ropa habitual de viaje');
      setCondition(targetPlayer.condition || 'Normal');
      setWeapon(targetPlayer.weapon || 'Sin arma');
      setSaveSuccess(false);
    }
  }, [targetPlayer, isOpen]);

  if (!isOpen || !targetPlayer) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnProfile || !onSaveProfile) return;

    setIsSaving(true);
    SoundEffects.playCriticalSuccess();

    try {
      const updated: Player = {
        ...targetPlayer,
        displayName: displayName.trim() || targetPlayer.username,
        bio: bio.trim(),
        outfit: outfit.trim(),
        condition: condition.trim(),
        weapon: weapon.trim(),
      };
      await onSaveProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-genshin-card/95 border border-genshin-gold/50 rounded-3xl p-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-genshin-gold/30 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src={targetPlayer.avatarUrl}
                alt={targetPlayer.displayName}
                className="w-11 h-11 rounded-2xl object-cover border border-genshin-gold/50 p-0.5 bg-genshin-panel shadow-sm"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-genshin-dark" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-amber-100 flex items-center gap-1.5">
                <span>{targetPlayer.displayName}</span>
                <span className="text-[10px] text-slate-400 font-mono font-normal">
                  (@{targetPlayer.username})
                </span>
              </h2>
              <span className="text-[10px] text-genshin-gold font-serif">
                {isOwnProfile ? 'Tu Ficha de Personaje' : 'Ficha de tu Pareja'}
              </span>
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

        {/* Content Form */}
        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          {/* Current Outfit / Ropa */}
          <div className="p-3 rounded-2xl bg-genshin-panel/70 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-genshin-gold">
              <label className="font-serif font-bold flex items-center gap-1.5">
                <Shirt className="w-4 h-4" />
                <span>Atuendo / Ropa Actual:</span>
              </label>
              <span className="text-[10px] text-slate-400">¿Qué lleva puesto?</span>
            </div>

            {isOwnProfile ? (
              <>
                <input
                  type="text"
                  value={outfit}
                  onChange={(e) => setOutfit(e.target.value)}
                  placeholder="Ej: Vestido de seda abierto, armadura de cuero..."
                  className="w-full text-xs px-3 py-2 rounded-xl bg-genshin-dark border border-slate-700 focus:border-genshin-gold focus:outline-none text-slate-100"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {OUTFIT_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setOutfit(preset)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                        outfit === preset
                          ? 'bg-genshin-gold/20 border-genshin-gold text-amber-200'
                          : 'bg-genshin-panel border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-xs text-amber-100 font-serif bg-genshin-dark/60 p-2.5 rounded-xl border border-slate-800">
                {targetPlayer.outfit || 'Ropa habitual de viaje'}
              </div>
            )}
          </div>

          {/* Current Condition / Estado */}
          <div className="p-3 rounded-2xl bg-genshin-panel/70 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-genshin-gold">
              <label className="font-serif font-bold flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>Estado / Condición Física:</span>
              </label>
              <span className="text-[10px] text-slate-400">Estado en la escena</span>
            </div>

            {isOwnProfile ? (
              <>
                <input
                  type="text"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  placeholder="Ej: Normal, atada, herido leve, excitada..."
                  className="w-full text-xs px-3 py-2 rounded-xl bg-genshin-dark border border-slate-700 focus:border-genshin-gold focus:outline-none text-slate-100"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {CONDITION_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCondition(preset)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                        condition === preset
                          ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                          : 'bg-genshin-panel border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-xs text-rose-200 font-serif bg-genshin-dark/60 p-2.5 rounded-xl border border-slate-800">
                {targetPlayer.condition || 'Normal y relajado/a'}
              </div>
            )}
          </div>

          {/* Weapon / Posesión Especial */}
          <div className="p-3 rounded-2xl bg-genshin-panel/70 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-genshin-gold">
              <label className="font-serif font-bold flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Arma u Objeto Especial:</span>
              </label>
            </div>

            {isOwnProfile ? (
              <input
                type="text"
                value={weapon}
                onChange={(e) => setWeapon(e.target.value)}
                placeholder="Ej: Daga oculta en la liga, talismán sagrado, látigo..."
                className="w-full text-xs px-3 py-2 rounded-xl bg-genshin-dark border border-slate-700 focus:border-genshin-gold focus:outline-none text-slate-100"
              />
            ) : (
              <div className="text-xs text-slate-200 font-serif bg-genshin-dark/60 p-2.5 rounded-xl border border-slate-800">
                {targetPlayer.weapon || 'Sin arma visible'}
              </div>
            )}
          </div>

          {/* Bio / Trasfondo */}
          <div>
            <label className="text-[11px] text-genshin-gold font-medium block mb-1">
              Notas del Personaje / Biografía
            </label>
            {isOwnProfile ? (
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Personalidad, secretos o peculiaridades de tu personaje..."
                className="w-full text-xs p-3 rounded-xl bg-genshin-panel border border-slate-700 focus:border-genshin-gold focus:outline-none text-slate-100 placeholder:text-slate-500 resize-none leading-relaxed"
              />
            ) : (
              <div className="text-xs text-slate-300 bg-genshin-panel/60 p-3 rounded-xl border border-slate-700/60 leading-relaxed italic">
                "{targetPlayer.bio || 'Sin biografía escrita todavía.'}"
              </div>
            )}
          </div>

          {/* Submit button if own profile */}
          {isOwnProfile && (
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-amber-950 font-serif font-bold text-xs uppercase tracking-wider shadow-genshin-gold hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 mt-2"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-950" />
                  <span>¡Ficha Guardada con Éxito!</span>
                </>
              ) : isSaving ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Estado y Atuendo</span>
                </>
              )}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
