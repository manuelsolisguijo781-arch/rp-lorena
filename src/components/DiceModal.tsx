import React, { useState } from 'react';
import { X, Dices, Sparkles, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DiceType, DiceRoll, RollOutcome } from '../types';
import { SoundEffects } from '../utils/sound';

interface DiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendRoll: (roll: DiceRoll, optionalMessage?: string) => void;
}

const DICE_TYPES: { type: DiceType; max: number; label: string }[] = [
  { type: 'd20', max: 20, label: 'd20 (D&D Clásico)' },
  { type: 'd100', max: 100, label: 'd100 (Porcentual)' },
  { type: 'd12', max: 12, label: 'd12' },
  { type: 'd10', max: 10, label: 'd10' },
  { type: 'd8', max: 8, label: 'd8' },
  { type: 'd6', max: 6, label: 'd6' },
  { type: 'd4', max: 4, label: 'd4' },
];

const ACTION_PRESETS = [
  { name: 'Persuasión / Seducción', desc: 'Cautivar con palabras, miradas o gestos' },
  { name: 'Sigilo / Susurros', desc: 'Acercarse o susurrar sin ser anticipado' },
  { name: 'Percepción / Intuición', desc: 'Leer sus verdaderas emociones o deseos' },
  { name: 'Destreza / Agilidad', desc: 'Movimientos precisos, rápidos y sutiles' },
  { name: 'Fuerza / Pasión', desc: 'Acciones intensas, abrazos firmes o audaces' },
  { name: 'Tirada Libre', desc: 'Cualquier acción del momento' },
];

export const DiceModal: React.FC<DiceModalProps> = ({ isOpen, onClose, onSendRoll }) => {
  const [selectedDice, setSelectedDice] = useState<DiceType>('d20');
  const [selectedAction, setSelectedAction] = useState('Persuasión / Seducción');
  const [actionDesc, setActionDesc] = useState('');
  const [modifier, setModifier] = useState<number>(0);
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);

  if (!isOpen) return null;

  const currentDiceConfig = DICE_TYPES.find((d) => d.type === selectedDice) || DICE_TYPES[0];

  const handleRollDice = () => {
    setIsRolling(true);
    SoundEffects.playDiceRattle();

    // Rattle animation duration
    setTimeout(() => {
      const rawValue = Math.floor(Math.random() * currentDiceConfig.max) + 1;
      const total = rawValue + modifier;

      let outcome: RollOutcome = 'mixed';
      if (selectedDice === 'd20') {
        if (rawValue === 20) outcome = 'critical_success';
        else if (rawValue === 1) outcome = 'critical_failure';
        else if (total >= 15) outcome = 'success';
        else if (total >= 10) outcome = 'mixed';
        else outcome = 'failure';
      } else {
        if (rawValue >= currentDiceConfig.max * 0.8) outcome = 'success';
        else if (rawValue <= currentDiceConfig.max * 0.2) outcome = 'failure';
        else outcome = 'mixed';
      }

      const rollResult: DiceRoll = {
        diceType: selectedDice,
        actionName: selectedAction,
        rollValue: rawValue,
        modifier: modifier,
        total: total,
        outcome: outcome,
        description: actionDesc.trim() || undefined,
      };

      setLastRoll(rollResult);
      setIsRolling(false);

      if (outcome === 'critical_success') {
        SoundEffects.playCriticalSuccess();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e6c888', '#fbe2a7', '#58d3d9', '#e05353'],
        });
      } else if (outcome === 'critical_failure') {
        SoundEffects.playCriticalFail();
      } else {
        SoundEffects.playChime();
      }
    }, 700);
  };

  const handleSendToChat = () => {
    if (!lastRoll) return;
    SoundEffects.playSend();
    onSendRoll(lastRoll, actionDesc.trim() ? `*${actionDesc.trim()}*` : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-genshin-card border border-genshin-gold/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-genshin-dark border-b border-genshin-gold/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-genshin-gold animate-bounce" />
            <h2 className="text-base font-serif font-bold text-amber-100 tracking-wide">
              Tirada de Acción (D&D)
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

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Action description / intention */}
          <div>
            <label className="text-[11px] font-medium text-genshin-gold block mb-1">
              ¿Qué intentas hacer? (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: *acercar su rostro buscando robarle un beso*"
              value={actionDesc}
              onChange={(e) => setActionDesc(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl bg-genshin-panel/80 border border-genshin-border focus:border-genshin-gold focus:outline-none text-slate-100 placeholder:text-slate-500"
            />
          </div>

          {/* Action Preset Picker */}
          <div>
            <label className="text-[11px] font-medium text-genshin-gold block mb-1">
              Tipo de Acción / Intención
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {ACTION_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    SoundEffects.playChime();
                    setSelectedAction(preset.name);
                  }}
                  className={`text-left p-2 rounded-xl text-xs transition-all border ${
                    selectedAction === preset.name
                      ? 'bg-genshin-gold/20 border-genshin-gold text-amber-100 shadow-sm'
                      : 'bg-genshin-panel/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <div className="font-semibold truncate">{preset.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Dice Selector & Modifier */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-genshin-gold block mb-1">
                Tipo de Dado
              </label>
              <select
                value={selectedDice}
                onChange={(e) => {
                  SoundEffects.playChime();
                  setSelectedDice(e.target.value as DiceType);
                }}
                className="w-full text-xs px-3 py-2 rounded-xl bg-genshin-panel/80 border border-genshin-border focus:border-genshin-gold text-slate-100 focus:outline-none"
              >
                {DICE_TYPES.map((d) => (
                  <option key={d.type} value={d.type}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-genshin-gold block mb-1">
                Modificador (+ / -)
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setModifier((m) => Math.max(-5, m - 1))}
                  className="w-8 h-8 rounded-lg bg-genshin-panel border border-slate-700 text-slate-200 font-bold active:scale-95"
                >
                  -
                </button>
                <div className="flex-1 text-center font-mono font-bold text-sm text-genshin-gold bg-genshin-panel/60 py-1 rounded-lg border border-slate-700">
                  {modifier >= 0 ? `+${modifier}` : modifier}
                </div>
                <button
                  type="button"
                  onClick={() => setModifier((m) => Math.min(10, m + 1))}
                  className="w-8 h-8 rounded-lg bg-genshin-panel border border-slate-700 text-slate-200 font-bold active:scale-95"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Roll Result Display or Roll Trigger */}
          <div className="pt-2">
            {lastRoll ? (
              <div
                className={`p-4 rounded-2xl border text-center transition-all animate-fadeIn ${
                  lastRoll.outcome === 'critical_success'
                    ? 'bg-amber-950/40 border-genshin-gold shadow-genshin-gold ring-1 ring-genshin-gold'
                    : lastRoll.outcome === 'critical_failure'
                    ? 'bg-red-950/40 border-genshin-crimson shadow-lg ring-1 ring-genshin-crimson'
                    : lastRoll.outcome === 'success'
                    ? 'bg-emerald-950/30 border-emerald-500/50'
                    : lastRoll.outcome === 'failure'
                    ? 'bg-purple-950/30 border-purple-500/40'
                    : 'bg-genshin-panel/80 border-slate-700'
                }`}
              >
                <div className="text-xs uppercase font-serif tracking-wider font-semibold text-genshin-gold mb-1">
                  {lastRoll.actionName}
                </div>

                <div className="flex items-center justify-center gap-3 my-2">
                  <div className="text-3xl sm:text-4xl font-extrabold font-serif text-amber-100 tracking-tight">
                    {lastRoll.total}
                  </div>
                  {lastRoll.modifier !== 0 && (
                    <div className="text-xs text-slate-400 font-mono">
                      ({lastRoll.rollValue} {lastRoll.modifier > 0 ? `+ ${lastRoll.modifier}` : `${lastRoll.modifier}`})
                    </div>
                  )}
                </div>

                {/* Outcome Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-serif uppercase tracking-wider">
                  {lastRoll.outcome === 'critical_success' && (
                    <span className="text-genshin-gold flex items-center gap-1">
                      <Sparkles className="w-4 h-4 animate-spin" /> ¡Éxito Crítico! (Nat 20)
                    </span>
                  )}
                  {lastRoll.outcome === 'critical_failure' && (
                    <span className="text-genshin-crimson flex items-center gap-1">
                      <ShieldAlert className="w-4 h-4" /> ¡Pifia Crítica! (Nat 1)
                    </span>
                  )}
                  {lastRoll.outcome === 'success' && (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> ¡Éxito!
                    </span>
                  )}
                  {lastRoll.outcome === 'mixed' && (
                    <span className="text-amber-300 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> Éxito con Matices
                    </span>
                  )}
                  {lastRoll.outcome === 'failure' && (
                    <span className="text-red-400 flex items-center gap-1">
                      <X className="w-4 h-4" /> Fallo
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-700 rounded-2xl bg-genshin-panel/20">
                <Dices className="w-10 h-10 text-slate-500 mb-2 opacity-50" />
                <p className="text-xs">Pulsa en lanzar para decidir el destino</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-genshin-dark border-t border-genshin-gold/30 flex gap-2">
          <button
            type="button"
            disabled={isRolling}
            onClick={handleRollDice}
            className={`flex-1 py-2.5 rounded-xl font-serif font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              isRolling
                ? 'bg-amber-700/50 text-amber-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-600 to-yellow-600 text-amber-950 shadow-genshin-gold hover:brightness-110 active:scale-95'
            }`}
          >
            <Dices className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
            <span>{isRolling ? 'Rodando...' : lastRoll ? 'Tirar de nuevo' : '¡Lanzar Dado!'}</span>
          </button>

          {lastRoll && (
            <button
              type="button"
              onClick={handleSendToChat}
              className="flex-1 py-2.5 rounded-xl bg-genshin-panel hover:bg-genshin-card text-genshin-gold border border-genshin-gold/50 font-serif font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-sm"
            >
              Publicar en Sala
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
