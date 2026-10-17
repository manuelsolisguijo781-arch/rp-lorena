import React, { useState } from 'react';
import { X, Dices, Sparkles, Swords, Shield, Heart, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DiceType, DiceRoll, RollOutcome, ChallengeData, Player } from '../types';
import { SoundEffects } from '../utils/sound';

interface DiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
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

const STANDARD_ACTION_PRESETS = [
  { name: 'Persuasión / Seducción', desc: 'Cautivar con palabras, miradas o gestos' },
  { name: 'Sigilo / Susurros', desc: 'Acercarse o susurrar sin ser anticipado' },
  { name: 'Percepción / Intuición', desc: 'Leer sus verdaderas emociones o deseos' },
  { name: 'Destreza / Agilidad', desc: 'Movimientos precisos, rápidos y sutiles' },
  { name: 'Fuerza / Pasión', desc: 'Acciones intensas, abrazos firmes o audaces' },
  { name: 'Tirada Libre', desc: 'Cualquier acción del momento' },
];

const CHALLENGE_PRESETS = [
  { name: 'Desafío de Seducción vs Voluntad', desc: 'Intentar quebrar su resistencia con encanto' },
  { name: 'Desafío de Dominio vs Rebeldía', desc: 'Someter o resistir el control del otro' },
  { name: 'Duelo de Miradas / Tensión', desc: 'Quién aparta la mirada primero' },
  { name: 'Desafío de Caricias / Resistencia', desc: 'Aguantar el cosquilleo o la caricia sin ceder' },
];

export const DiceModal: React.FC<DiceModalProps> = ({ isOpen, onClose, player, onSendRoll }) => {
  const [mode, setMode] = useState<'standard' | 'challenge'>('standard');
  const [selectedDice, setSelectedDice] = useState<DiceType>('d20');
  const [selectedAction, setSelectedAction] = useState('Persuasión / Seducción');
  const [actionDesc, setActionDesc] = useState('');
  const [modifier, setModifier] = useState<number>(0);
  const [isRolling, setIsRolling] = useState(false);

  if (!isOpen) return null;

  const currentDiceConfig = DICE_TYPES.find((d) => d.type === selectedDice) || DICE_TYPES[0];

  const handleRollAndCommit = () => {
    setIsRolling(true);
    SoundEffects.playDiceRattle();

    // Rattle animation duration: commits directly to chat!
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

      let challengeData: ChallengeData | undefined = undefined;
      if (mode === 'challenge') {
        challengeData = {
          challengerId: player.id,
          challengerName: player.displayName,
          challengerRoll: total,
          challengerOutcome: outcome,
          status: 'pending',
        };
      }

      const rollResult: DiceRoll = {
        diceType: selectedDice,
        actionName: mode === 'challenge' ? `⚔️ ${selectedAction}` : selectedAction,
        rollValue: rawValue,
        modifier: modifier,
        total: total,
        outcome: outcome,
        description: actionDesc.trim() || undefined,
        challenge: challengeData,
      };

      if (outcome === 'critical_success') {
        SoundEffects.playCriticalSuccess();
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#e6c888', '#fbe2a7', '#58d3d9', '#e05353'],
        });
      } else if (outcome === 'critical_failure') {
        SoundEffects.playCriticalFail();
      } else {
        SoundEffects.playChime();
      }

      // Auto-send immediately so rolls cannot be repeated in secret
      const optionalMsg = actionDesc.trim()
        ? `*${actionDesc.trim()}*`
        : mode === 'challenge'
        ? `*${player.displayName} desafía a su pareja con ${selectedAction}. ¡Tira para responder!*`
        : `*${player.displayName} realiza una tirada de ${selectedAction}.*`;

      onSendRoll(rollResult, optionalMsg);
      setIsRolling(false);
      onClose();
    }, 650);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-genshin-card/95 border border-genshin-gold/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-genshin-dark border-b border-genshin-gold/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-genshin-gold animate-bounce" />
            <div>
              <h2 className="text-base font-serif font-bold text-amber-100 tracking-wide">
                Mesa de Dados D&D
              </h2>
              <span className="text-[10px] text-amber-300/80 font-mono">
                Tiradas auténticas (se publican al instante)
              </span>
            </div>
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

        {/* Mode Selector Tabs: Normal Roll vs Challenge Roll */}
        <div className="grid grid-cols-2 bg-genshin-panel/70 p-1 border-b border-genshin-gold/20">
          <button
            type="button"
            onClick={() => {
              SoundEffects.playChime();
              setMode('standard');
              setSelectedAction('Persuasión / Seducción');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-serif font-bold flex items-center justify-center gap-1.5 transition-all ${
              mode === 'standard'
                ? 'bg-genshin-gold text-amber-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>Tirada Estándar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              SoundEffects.playChime();
              setMode('challenge');
              setSelectedDice('d20');
              setSelectedAction('Desafío de Seducción vs Voluntad');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-serif font-bold flex items-center justify-center gap-1.5 transition-all ${
              mode === 'challenge'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Swords className="w-4 h-4 text-amber-300" />
            <span>Dado Desafío ⚔️</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {mode === 'challenge' && (
            <div className="p-3 rounded-2xl bg-red-950/30 border border-red-500/40 text-xs text-red-200 leading-relaxed flex items-start gap-2">
              <Swords className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-serif font-bold text-amber-200 block mb-0.5">
                  Duelo de Voluntades (Tirada Opuesta)
                </span>
                Tiras tu dado ahora y en el chat aparecerá un reto directo para tu pareja. Ella/él podrá responder tirando su propio dado para decidir quién gana el duelo.
              </div>
            </div>
          )}

          {/* Action description / intention */}
          <div>
            <label className="text-[11px] font-medium text-genshin-gold block mb-1">
              {mode === 'challenge' ? 'Descripción del Desafío (Opcional)' : '¿Qué intentas hacer? (Opcional)'}
            </label>
            <input
              type="text"
              placeholder={
                mode === 'challenge'
                  ? 'Ej: *se acerca a su cuello susurrando, retándola a no ceder*'
                  : 'Ej: *acercar su rostro buscando robarle un beso*'
              }
              value={actionDesc}
              onChange={(e) => setActionDesc(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl bg-genshin-panel/80 border border-genshin-border focus:border-genshin-gold focus:outline-none text-slate-100 placeholder:text-slate-500"
            />
          </div>

          {/* Action Preset Picker */}
          <div>
            <label className="text-[11px] font-medium text-genshin-gold block mb-1">
              {mode === 'challenge' ? 'Tipo de Duelo / Reto' : 'Tipo de Acción / Intención'}
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(mode === 'challenge' ? CHALLENGE_PRESETS : STANDARD_ACTION_PRESETS).map((preset) => (
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
                disabled={mode === 'challenge'}
                onChange={(e) => {
                  SoundEffects.playChime();
                  setSelectedDice(e.target.value as DiceType);
                }}
                className="w-full text-xs px-3 py-2 rounded-xl bg-genshin-panel/80 border border-genshin-border focus:border-genshin-gold text-slate-100 focus:outline-none disabled:opacity-60"
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
        </div>

        {/* Footer Action - 1 Click Instant Roll and Commit */}
        <div className="p-3 bg-genshin-dark border-t border-genshin-gold/30">
          <button
            type="button"
            disabled={isRolling}
            onClick={handleRollAndCommit}
            className={`w-full py-3 rounded-2xl font-serif font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
              isRolling
                ? 'bg-amber-700/50 text-amber-200 cursor-not-allowed'
                : mode === 'challenge'
                ? 'bg-gradient-to-r from-red-600 via-amber-600 to-yellow-600 text-white shadow-genshin-gold hover:brightness-110 active:scale-95'
                : 'bg-gradient-to-r from-amber-600 to-yellow-600 text-amber-950 shadow-genshin-gold hover:brightness-110 active:scale-95'
            }`}
          >
            <Dices className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
            <span>
              {isRolling
                ? 'Lanzando y publicando...'
                : mode === 'challenge'
                ? '¡Lanzar Desafío a la Sala! ⚔️'
                : '¡Lanzar Dado a la Sala!'}
            </span>
          </button>
          <p className="text-[10px] text-center text-slate-400 mt-1.5">
            🔒 Tirada vinculante: el resultado se enviará directamente al chat sin ensayos previos.
          </p>
        </div>
      </div>
    </div>
  );
};
