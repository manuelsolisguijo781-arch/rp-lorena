import React, { useState, useRef } from 'react';
import { Send, Image as ImageIcon, Dices, Smile, X } from 'lucide-react';
import { Player, Expression } from '../types';
import { SoundEffects } from '../utils/sound';

interface MessageInputProps {
  player: Player;
  onSendMessage: (content: string, expression: Expression, imageFile?: File) => void;
  onOpenDiceModal: () => void;
}

const EXPRESSIONS: { type: Expression; emoji: string; label: string }[] = [
  { type: 'normal', emoji: '✨', label: 'Normal' },
  { type: 'blush', emoji: '😳', label: 'Sonrojado' },
  { type: 'smirk', emoji: '😏', label: 'Pícaro' },
  { type: 'surprised', emoji: '😮', label: 'Sorprendido' },
  { type: 'teasing', emoji: '😜', label: 'Burlón' },
  { type: 'serious', emoji: '🧐', label: 'Solemne' },
];

export const MessageInput: React.FC<MessageInputProps> = ({
  player,
  onSendMessage,
  onOpenDiceModal,
}) => {
  const [content, setContent] = useState('');
  const [expression, setExpression] = useState<Expression>('normal');
  const [showExpressions, setShowExpressions] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!content.trim() && !selectedImage) return;

    SoundEffects.playSend();
    onSendMessage(content.trim(), expression, selectedImage || undefined);

    // Reset input
    setContent('');
    setSelectedImage(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    setShowExpressions(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      SoundEffects.playChime();
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInsertAsterisks = () => {
    SoundEffects.playChime();
    setContent((prev) => {
      const next = prev ? `${prev} **` : '**';
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const pos = next.length - 1;
          textareaRef.current.setSelectionRange(pos, pos);
        }
      }, 50);
      return next;
    });
  };

  return (
    <div className="relative z-20 bg-genshin-dark/95 backdrop-blur-md border-t border-genshin-gold/30 p-2 sm:p-3 pb-[max(env(safe-area-inset-bottom,0px),10px)] shadow-2xl">
      {/* Expression Picker Popup */}
      {showExpressions && (
        <div className="absolute bottom-full left-3 mb-2 p-2 rounded-2xl bg-genshin-card border border-genshin-gold/50 shadow-2xl flex gap-1.5 animate-fadeIn z-30">
          {EXPRESSIONS.map((expr) => (
            <button
              key={expr.type}
              type="button"
              onClick={() => {
                SoundEffects.playChime();
                setExpression(expr.type);
                setShowExpressions(false);
              }}
              className={`px-2 py-1.5 rounded-xl text-xs flex flex-col items-center gap-0.5 transition-all ${
                expression === expr.type
                  ? 'bg-genshin-gold/20 border border-genshin-gold text-genshin-gold'
                  : 'hover:bg-genshin-panel text-slate-300'
              }`}
            >
              <span className="text-base">{expr.emoji}</span>
              <span className="text-[9px]">{expr.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Image Preview bar (if attached) */}
      {imagePreviewUrl && (
        <div className="mb-2 flex items-center gap-2 p-1.5 rounded-xl bg-genshin-panel/70 border border-slate-700 w-fit">
          <img
            src={imagePreviewUrl}
            alt="Preview"
            className="w-12 h-12 object-cover rounded-lg border border-genshin-gold/40"
          />
          <div className="text-[11px] text-slate-300 max-w-[150px] truncate">
            {selectedImage?.name}
          </div>
          <button
            type="button"
            onClick={handleRemoveImage}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Input Bar */}
      <div className="max-w-3xl mx-auto flex items-end gap-2">
        {/* Current Player Avatar */}
        <div
          className="shrink-0 p-0.5 rounded-2xl bg-genshin-panel border border-genshin-gold/40 shadow-sm"
          title={`Escribiendo como ${player.displayName}`}
        >
          <img
            src={player.avatarUrl}
            alt={player.displayName}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover"
          />
        </div>

        {/* Input box with tools */}
        <div className="flex-1 bg-genshin-panel/80 rounded-2xl border border-genshin-border focus-within:border-genshin-gold/80 transition-all flex flex-col p-1.5 shadow-inner">
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={`Escribe como ${player.displayName}... (*acción* diálogo)`}
            className="w-full bg-transparent px-2.5 py-1 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none resize-none max-h-28"
          />

          {/* Action Tools Inside Input */}
          <div className="flex items-center justify-between pt-1 px-1 border-t border-slate-700/40">
            <div className="flex items-center gap-1">
              {/* Expression selector button */}
              <button
                type="button"
                onClick={() => {
                  SoundEffects.playChime();
                  setShowExpressions((prev) => !prev);
                }}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                  expression !== 'normal'
                    ? 'text-genshin-gold bg-genshin-gold/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Cambiar expresión"
              >
                <Smile className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden xs:inline">
                  {EXPRESSIONS.find((e) => e.type === expression)?.label}
                </span>
              </button>

              {/* Asterisk narrative action shortcut */}
              <button
                type="button"
                onClick={handleInsertAsterisks}
                className="px-1.5 py-0.5 rounded text-[11px] font-serif text-genshin-gold/80 hover:text-genshin-gold hover:bg-genshin-gold/10"
                title="Insertar acción narrativa *...*"
              >
                *acción*
              </button>

              {/* Attach Image button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-genshin-card transition-colors"
                title="Subir foto a la escena"
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              {/* Dice Roller Button */}
              <button
                type="button"
                onClick={() => {
                  SoundEffects.playChime();
                  onOpenDiceModal();
                }}
                className="p-1.5 rounded-lg text-genshin-gold hover:text-amber-300 hover:bg-genshin-card transition-colors"
                title="Lanzar Dados D&D"
              >
                <Dices className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim() && !selectedImage}
          className={`shrink-0 p-2.5 sm:p-3 rounded-2xl flex items-center justify-center font-bold transition-all shadow-md active:scale-95 ${
            content.trim() || selectedImage
              ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-amber-950 shadow-genshin-gold hover:brightness-110'
              : 'bg-genshin-panel/50 text-slate-600 cursor-not-allowed'
          }`}
          title="Enviar mensaje"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};
