import React from 'react';
import { Message, Expression } from '../types';
import { Sparkles, Dices, ShieldAlert, CheckCircle, AlertCircle } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  onImageClick?: (imageUrl: string) => void;
}

const EXPRESSION_LABELS: Record<Expression, { label: string; emoji: string }> = {
  normal: { label: 'Normal', emoji: '✨' },
  blush: { label: 'Sonrojado/a', emoji: '😳' },
  smirk: { label: 'Picarón/a', emoji: '😏' },
  surprised: { label: 'Sorprendido/a', emoji: '😮' },
  teasing: { label: 'Burlón/a', emoji: '😜' },
  serious: { label: 'Solemne', emoji: '🧐' },
};

export const MessageItem: React.FC<MessageItemProps> = ({ message, onImageClick }) => {
  const expr = EXPRESSION_LABELS[message.expression] || EXPRESSION_LABELS.normal;

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="relative group px-2 sm:px-4 py-2 transition-all">
      <div className="max-w-3xl mx-auto flex gap-2.5 sm:gap-3.5 items-start">
        {/* Avatar */}
        <div className="relative shrink-0 pt-1">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden border border-genshin-gold/40 p-0.5 bg-genshin-card shadow-md">
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
            <span className="font-serif font-bold text-xs sm:text-sm text-genshin-gold tracking-wide">
              {message.senderName}
            </span>

            {/* Expression Pill */}
            {message.expression !== 'normal' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-genshin-panel/80 border border-slate-700 text-slate-300 flex items-center gap-1">
                <span>{expr.emoji}</span>
                <span>{expr.label}</span>
              </span>
            )}

            <span className="text-[10px] text-slate-500 font-mono ml-auto">
              {formattedTime}
            </span>
          </div>

          {/* D&D Dice Roll Card (if present) */}
          {message.diceRoll && (
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
                <span className="font-serif font-bold text-genshin-gold flex items-center gap-1.5">
                  <Dices className="w-4 h-4 text-genshin-gold" />
                  {message.diceRoll.actionName}
                </span>
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
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-serif font-bold text-amber-100">
                    {message.diceRoll.total}
                  </span>
                  {message.diceRoll.modifier !== 0 && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      (dado: {message.diceRoll.rollValue}{' '}
                      {message.diceRoll.modifier > 0
                        ? `+ ${message.diceRoll.modifier}`
                        : message.diceRoll.modifier}
                      )
                    </span>
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
          )}

          {/* Parsed Message Blocks: Actions & Dialogue */}
          <div className="space-y-1.5">
            {message.parsedBlocks.map((block, idx) => {
              if (block.type === 'action') {
                return (
                  <div
                    key={idx}
                    className="text-xs sm:text-[13px] text-amber-200/90 italic font-serif pl-3 py-1 border-l-2 border-genshin-gold/50 bg-gradient-to-r from-genshin-gold/10 to-transparent rounded-r-lg leading-relaxed"
                  >
                    *{block.text}*
                  </div>
                );
              } else {
                return (
                  <div
                    key={idx}
                    className="relative bg-genshin-card/90 backdrop-blur-md rounded-2xl rounded-tl-sm p-3 border border-genshin-border/80 text-xs sm:text-sm text-slate-100 leading-relaxed shadow-sm font-sans"
                  >
                    <div className="absolute top-1.5 right-2 w-1.5 h-1.5 rotate-45 bg-genshin-gold/40" />
                    {block.text}
                  </div>
                );
              }
            })}
          </div>

          {/* Attached Image (if any) */}
          {message.imageUrl && (
            <div className="mt-2.5">
              <div
                onClick={() => onImageClick?.(message.imageUrl!)}
                className="inline-block rounded-2xl overflow-hidden border border-genshin-gold/40 shadow-lg cursor-pointer hover:border-genshin-gold transition-all active:scale-[0.98] max-w-xs sm:max-w-sm"
              >
                <img
                  src={message.imageUrl}
                  alt="Foto de la escena"
                  className="w-full h-auto max-h-72 object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
