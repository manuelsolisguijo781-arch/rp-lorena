import React, { useState } from 'react';
import { Message, Expression } from '../types';
import { Sparkles, Dices, ShieldAlert, CheckCircle, AlertCircle, Eye, Lock, Swords, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { SoundEffects } from '../utils/sound';

interface MessageItemProps {
  message: Message;
  currentUserId?: string;
  onImageClick?: (imageUrl: string) => void;
  onRespondChallenge?: (messageId: string) => void;
  onAvatarClick?: (senderId: string) => void;
}

const EXPRESSION_LABELS: Record<Expression, { label: string; emoji: string }> = {
  normal: { label: 'Normal', emoji: '✨' },
  blush: { label: 'Sonrojado/a', emoji: '😳' },
  smirk: { label: 'Picarón/a', emoji: '😏' },
  surprised: { label: 'Sorprendido/a', emoji: '😮' },
  teasing: { label: 'Burlón/a', emoji: '😜' },
  serious: { label: 'Solemne', emoji: '🧐' },
};

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUserId,
  onImageClick,
  onRespondChallenge,
  onAvatarClick,
}) => {
  const [isSecretRevealed, setIsSecretRevealed] = useState(false);
  const [revealedBlockIndices, setRevealedBlockIndices] = useState<Record<number, boolean>>({});

  const expr = EXPRESSION_LABELS[message.expression] || EXPRESSION_LABELS.normal;

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const allImages: string[] = message.imageUrls && message.imageUrls.length > 0
    ? message.imageUrls
    : message.imageUrl
    ? [message.imageUrl]
    : [];

  const handleToggleGlobalSecret = () => {
    SoundEffects.playChime();
    setIsSecretRevealed((prev) => !prev);
  };

  const handleToggleBlockSecret = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    SoundEffects.playChime();
    setRevealedBlockIndices((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <div className="relative group px-2 sm:px-4 py-2 transition-all">
      <div className="max-w-3xl mx-auto flex gap-2.5 sm:gap-3.5 items-start">
        {/* Avatar - Clickable to open Character Sheet */}
        <div className="relative shrink-0 pt-1">
          <div
            onClick={() => onAvatarClick?.(message.senderId)}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden border border-genshin-gold/40 p-0.5 bg-genshin-card shadow-md cursor-pointer hover:border-genshin-gold hover:scale-105 transition-all"
            title={`Ver ficha de personaje de ${message.senderName}`}
          >
            <img
              src={message.senderAvatar}
              alt={message.senderName}
              className="w-full h-full object-cover rounded-xl"
              loading="lazy"
            />
          </div>
        </div>

        {/* Message Content Container */}
        <div className="flex-1 min-w-0">
          {/* Header row: Sender Name, Expression, Timestamp */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              onClick={() => onAvatarClick?.(message.senderId)}
              className="font-serif font-bold text-xs sm:text-sm text-genshin-gold tracking-wide cursor-pointer hover:underline"
            >
              {message.senderName}
            </span>

            {/* Expression Pill */}
            {message.expression !== 'normal' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-genshin-panel/80 border border-slate-700 text-slate-300 flex items-center gap-1">
                <span>{expr.emoji}</span>
                <span>{expr.label}</span>
              </span>
            )}

            {/* Secret Badge Indicator */}
            {message.isSecret && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-950/60 text-purple-300 border border-purple-500/40 font-serif flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                <span>Secreto</span>
              </span>
            )}

            <span className="text-[10px] text-slate-500 font-mono ml-auto">
              {formattedTime}
            </span>
          </div>

          {/* D&D Dice Roll Card (if present) */}
          {message.diceRoll && (
            message.diceRoll.challenge ? (
              /* --- DADO DESAFÍO / DUELO OPUESTO CARD --- */
              <div className="mb-2.5 p-3.5 rounded-2xl border bg-gradient-to-r from-red-950/70 via-amber-950/50 to-yellow-950/40 border-red-500/60 shadow-lg backdrop-blur-md">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-serif font-bold text-amber-200 flex items-center gap-1.5">
                      <Swords className="w-4 h-4 text-red-400 animate-pulse" />
                      {message.diceRoll.actionName}
                    </span>
                    {message.diceRoll.advantage === 'advantage' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 font-serif flex items-center gap-0.5">
                        <ArrowUpCircle className="w-2.5 h-2.5" />
                        Ventaja
                      </span>
                    )}
                    {message.diceRoll.advantage === 'disadvantage' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/50 font-serif flex items-center gap-0.5">
                        <ArrowDownCircle className="w-2.5 h-2.5" />
                        Desventaja
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-900/60 text-red-200 border border-red-500/50">
                    Duelo D&D
                  </span>
                </div>

                {message.diceRoll.description && (
                  <div className="text-[11px] text-slate-300 italic mb-2">
                    {message.diceRoll.description}
                  </div>
                )}

                {message.diceRoll.challenge.status === 'pending' ? (
                  <div className="pt-2 border-t border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">
                        <strong>{message.diceRoll.challenge.challengerName}</strong> sacó:
                      </span>
                      <div className="flex items-baseline gap-2">
                        {message.diceRoll.rolls && message.diceRoll.rolls.length > 1 && (
                          <span className="text-[10px] text-slate-400 font-mono bg-black/40 px-1.5 py-0.5 rounded border border-slate-700">
                            [{message.diceRoll.rollValue}] <span className="line-through text-slate-500">({message.diceRoll.discardedRoll})</span>
                          </span>
                        )}
                        <span className="text-xl font-serif font-bold text-genshin-gold">
                          {message.diceRoll.challenge.challengerRoll}
                        </span>
                      </div>
                    </div>

                    {currentUserId !== message.senderId ? (
                      <button
                        type="button"
                        onClick={() => onRespondChallenge?.(message.id)}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-yellow-600 text-white font-serif font-bold text-xs uppercase tracking-wider shadow-genshin-gold hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 animate-pulse"
                      >
                        <Dices className="w-4 h-4 text-amber-200" />
                        <span>⚔️ Responder al Desafío (Tirar d20)</span>
                      </button>
                    ) : (
                      <div className="text-[11px] text-center text-amber-300/90 italic py-1.5 bg-black/40 rounded-xl border border-slate-800">
                        ⏳ Desafío lanzado • Esperando respuesta de tu pareja...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-700/60 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-center p-2 rounded-xl bg-black/50 border border-slate-800">
                      <div>
                        <div className="text-[10px] text-slate-400 truncate">{message.diceRoll.challenge.challengerName}</div>
                        <div className="text-xl font-serif font-bold text-amber-100">{message.diceRoll.challenge.challengerRoll}</div>
                      </div>
                      <div className="border-l border-slate-700/60">
                        <div className="text-[10px] text-slate-400 truncate">{message.diceRoll.challenge.targetName}</div>
                        <div className="text-xl font-serif font-bold text-amber-100">{message.diceRoll.challenge.targetRoll}</div>
                      </div>
                    </div>

                    <div className="text-center py-1">
                      {message.diceRoll.challenge.isDraw ? (
                        <span className="text-xs font-serif font-bold text-amber-300">
                          🤝 ¡Empate en el Duelo!
                        </span>
                      ) : (
                        <span className="text-xs font-serif font-bold text-genshin-gold flex items-center justify-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-genshin-gold animate-spin" />
                          ¡Victoria de {message.diceRoll.challenge.winnerName}!
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* --- STANDARD DICE ROLL CARD --- */
              <div
                className={`mb-2.5 p-3 rounded-2xl border backdrop-blur-md transition-all ${
                  message.diceRoll.outcome === 'critical_success'
                    ? 'bg-gradient-to-r from-amber-950/60 to-yellow-950/40 border-genshin-gold shadow-genshin-gold'
                    : message.diceRoll.outcome === 'critical_failure'
                    ? 'bg-gradient-to-r from-red-950/60 to-rose-950/40 border-genshin-crimson shadow-md'
                    : 'bg-genshin-card/90 border-slate-700/80'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-serif font-bold text-genshin-gold flex items-center gap-1.5">
                      <Dices className="w-4 h-4 text-genshin-gold" />
                      {message.diceRoll.actionName}
                    </span>
                    {message.diceRoll.advantage === 'advantage' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 font-serif flex items-center gap-0.5">
                        <ArrowUpCircle className="w-2.5 h-2.5" />
                        Ventaja (Mayor)
                      </span>
                    )}
                    {message.diceRoll.advantage === 'disadvantage' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/50 font-serif flex items-center gap-0.5">
                        <ArrowDownCircle className="w-2.5 h-2.5" />
                        Desventaja (Menor)
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-slate-300 border border-slate-700">
                    {message.diceRoll.diceType}
                  </span>
                </div>

                {message.diceRoll.description && (
                  <div className="text-[11px] text-slate-300 italic mb-2">
                    {message.diceRoll.description}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xl sm:text-2xl font-serif font-bold text-amber-100">
                      {message.diceRoll.total}
                    </span>
                    {message.diceRoll.rolls && message.diceRoll.rolls.length > 1 ? (
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-lg border border-slate-700">
                        <span>dados:</span>
                        <span className="font-bold text-genshin-gold">[{message.diceRoll.rollValue}]</span>
                        <span className="line-through text-slate-500">({message.diceRoll.discardedRoll})</span>
                        {message.diceRoll.modifier !== 0 && (
                          <span className="text-slate-300">
                            {message.diceRoll.modifier > 0 ? `+${message.diceRoll.modifier}` : message.diceRoll.modifier}
                          </span>
                        )}
                      </span>
                    ) : (
                      message.diceRoll.modifier !== 0 && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          (dado: {message.diceRoll.rollValue}{' '}
                          {message.diceRoll.modifier > 0
                            ? `+ ${message.diceRoll.modifier}`
                            : message.diceRoll.modifier}
                          )
                        </span>
                      )
                    )}
                  </div>

                  <div className="text-xs font-serif font-bold">
                    {message.diceRoll.outcome === 'critical_success' && (
                      <span className="text-genshin-gold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" /> ¡Éxito Crítico!
                      </span>
                    )}
                    {message.diceRoll.outcome === 'critical_failure' && (
                      <span className="text-genshin-crimson flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> ¡Pifia Crítica!
                      </span>
                    )}
                    {message.diceRoll.outcome === 'success' && (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Éxito
                      </span>
                    )}
                    {message.diceRoll.outcome === 'mixed' && (
                      <span className="text-amber-300 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Matices
                      </span>
                    )}
                    {message.diceRoll.outcome === 'failure' && (
                      <span className="text-red-400">Fallo</span>
                    )}
                  </div>
                </div>
              </div>
            )
          )}

          {/* Combined Card (Photos on top + Text caption underneath) */}
          <div className="relative rounded-2xl overflow-hidden bg-genshin-card/90 backdrop-blur-md border border-genshin-border/80 shadow-md">
            {/* Global Secret Blur Overlay */}
            {message.isSecret && !isSecretRevealed && (
              <div
                onClick={handleToggleGlobalSecret}
                className="absolute inset-0 z-20 backdrop-blur-xl bg-black/60 flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-black/50 transition-all select-none"
              >
                <div className="p-3 rounded-full bg-genshin-panel/80 border border-genshin-gold/50 text-genshin-gold mb-2 shadow-lg animate-pulse">
                  <Eye className="w-6 h-6" />
                </div>
                <span className="text-xs font-serif font-bold text-amber-100 tracking-wide text-center">
                  Mensaje Secreto Difuminado
                </span>
                <span className="text-[10px] text-genshin-gold/90 mt-0.5">
                  Toca para revelar el contenido
                </span>
              </div>
            )}

            {/* Gallery: 1, 2, or 3+ Photos stacked or grid */}
            {allImages.length > 0 && (
              <div
                className={`overflow-hidden ${
                  message.isSecret && !isSecretRevealed ? 'blur-lg scale-105' : ''
                } transition-all duration-300`}
              >
                {allImages.length === 1 ? (
                  /* Single Image */
                  <div
                    onClick={() => onImageClick?.(allImages[0])}
                    className="cursor-pointer max-h-96 w-full overflow-hidden bg-black/40"
                  >
                    <img
                      src={allImages[0]}
                      alt="Foto de escena"
                      className="w-full h-auto max-h-96 object-cover hover:scale-[1.02] transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                ) : allImages.length === 2 ? (
                  /* 2 Images: Side by Side */
                  <div className="grid grid-cols-2 gap-1 bg-black/40 p-1">
                    {allImages.map((img, i) => (
                      <div
                        key={i}
                        onClick={() => onImageClick?.(img)}
                        className="cursor-pointer h-48 sm:h-56 overflow-hidden rounded-lg bg-black/30"
                      >
                        <img
                          src={img}
                          alt={`Foto ${i + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  /* 3+ Images Collage: First image large, subsequent images below */
                  <div className="space-y-1 bg-black/40 p-1">
                    <div
                      onClick={() => onImageClick?.(allImages[0])}
                      className="cursor-pointer h-52 sm:h-64 overflow-hidden rounded-lg bg-black/30"
                    >
                      <img
                        src={allImages[0]}
                        alt="Foto principal"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                      {allImages.slice(1).map((img, i) => (
                        <div
                          key={i}
                          onClick={() => onImageClick?.(img)}
                          className="cursor-pointer h-28 sm:h-36 overflow-hidden rounded-lg bg-black/30"
                        >
                          <img
                            src={img}
                            alt={`Foto secundaria ${i + 2}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Text Caption directly under the photos */}
            {message.parsedBlocks.length > 0 && (
              <div
                className={`p-3 space-y-2 ${
                  message.isSecret && !isSecretRevealed ? 'blur-md select-none' : ''
                } transition-all duration-300`}
              >
                {message.parsedBlocks.map((block, idx) => {
                  if (block.type === 'action') {
                    return (
                      <div
                        key={idx}
                        className="text-xs sm:text-[13px] text-amber-200/90 italic font-serif pl-2.5 py-0.5 border-l-2 border-genshin-gold/50 bg-gradient-to-r from-genshin-gold/10 to-transparent rounded-r-lg leading-relaxed"
                      >
                        *{block.text}*
                      </div>
                    );
                  } else if (block.type === 'secret') {
                    /* Inline Secret block ||secret|| */
                    const isRevealed = revealedBlockIndices[idx];
                    return (
                      <span
                        key={idx}
                        onClick={(e) => handleToggleBlockSecret(idx, e)}
                        className={`inline-block my-0.5 mx-0.5 px-2 py-0.5 rounded-lg text-xs cursor-pointer transition-all ${
                          isRevealed
                            ? 'bg-purple-900/40 text-purple-200 border border-purple-500/50'
                            : 'bg-slate-900/90 text-transparent blur-[4px] hover:blur-[2px] border border-slate-700 select-none'
                        }`}
                        title={isRevealed ? 'Toca para volver a ocultar' : 'Toca para revelar secreto'}
                      >
                        {block.text}
                      </span>
                    );
                  } else if (block.type === 'offtopic') {
                    /* Off-rol / out-of-character: (texto) */
                    return (
                      <div
                        key={idx}
                        className="text-[11px] sm:text-xs text-slate-400 italic font-mono px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 leading-relaxed flex items-start gap-1.5"
                        title="Off-rol / Fuera de personaje"
                      >
                        <span className="text-slate-500 shrink-0 mt-0.5 text-[10px] font-bold tracking-widest">OOC</span>
                        <span>({block.text})</span>
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={idx}
                        className="text-xs sm:text-sm text-slate-100 leading-relaxed font-sans"
                      >
                        {block.text}
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
