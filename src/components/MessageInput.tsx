import React, { useState, useRef } from 'react';
import { Send, Image as ImageIcon, Dices, Smile, X, Plus, EyeOff, Lock, Unlock } from 'lucide-react';
import { Player, Expression } from '../types';
import { SoundEffects } from '../utils/sound';

interface MessageInputProps {
  player: Player;
  onSendMessage: (content: string, expression: Expression, imageFiles?: File[], isSecret?: boolean) => void;
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
  const [isSecret, setIsSecret] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!content.trim() && selectedImages.length === 0) return;

    SoundEffects.playSend();
    onSendMessage(
      content.trim(),
      expression,
      selectedImages.length > 0 ? selectedImages : undefined,
      isSecret
    );

    // Reset input
    setContent('');
    setSelectedImages([]);
    imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setImagePreviewUrls([]);
    setIsSecret(false);
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

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      SoundEffects.playChime();
      const newFilesArray = Array.from(files);
      const combinedFiles = [...selectedImages, ...newFilesArray];
      setSelectedImages(combinedFiles);

      const newUrls = newFilesArray.map((f) => URL.createObjectURL(f));
      setImagePreviewUrls((prev) => [...prev, ...newUrls]);
    }
    // reset input so same file can be re-selected if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    URL.revokeObjectURL(imagePreviewUrls[indexToRemove]);
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setImagePreviewUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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

  const handleInsertSecretPipes = () => {
    SoundEffects.playChime();
    setContent((prev) => {
      const next = prev ? `${prev} ||||` : '||||';
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const pos = next.length - 2;
          textareaRef.current.setSelectionRange(pos, pos);
        }
      }, 50);
      return next;
    });
  };

  const handleToggleSecret = () => {
    SoundEffects.playChime();
    setIsSecret((prev) => !prev);
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

      {/* Multi-Image Preview bar (if attached) */}
      {imagePreviewUrls.length > 0 && (
        <div className="mb-2 p-2 rounded-2xl bg-genshin-panel/80 border border-genshin-gold/40 flex items-center gap-2 overflow-x-auto max-w-3xl mx-auto shadow-md">
          <span className="text-[10px] font-serif font-bold text-genshin-gold whitespace-nowrap pl-1">
            📷 {imagePreviewUrls.length} {imagePreviewUrls.length === 1 ? 'foto' : 'fotos'} adjuntas:
          </span>
          <div className="flex items-center gap-1.5">
            {imagePreviewUrls.map((url, idx) => (
              <div key={idx} className="relative group shrink-0">
                <img
                  src={url}
                  alt={`Preview ${idx + 1}`}
                  className="w-12 h-12 object-cover rounded-xl border border-slate-600 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-sm"
                  title="Eliminar esta foto"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-xl border border-dashed border-genshin-gold/50 hover:border-genshin-gold bg-genshin-dark/50 flex flex-col items-center justify-center text-genshin-gold hover:scale-105 transition-all shrink-0"
              title="Añadir más fotos a este mensaje"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[8px] font-serif">Más</span>
            </button>
          </div>
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
            placeholder={
              selectedImages.length > 0
                ? `Escribe un pie de foto / descripción para tus ${selectedImages.length} fotos...`
                : `Escribe como ${player.displayName}... (*acción* diálogo ||secreto||)`
            }
            className="w-full bg-transparent px-2.5 py-1 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none resize-none max-h-28"
          />

          {/* Action Tools Inside Input */}
          <div className="flex items-center justify-between pt-1 px-1 border-t border-slate-700/40">
            <div className="flex items-center gap-1 flex-wrap">
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

              {/* Secret Spoiler Pipes shortcut ||...|| */}
              <button
                type="button"
                onClick={handleInsertSecretPipes}
                className="px-1.5 py-0.5 rounded text-[11px] font-mono text-purple-300/90 hover:text-purple-200 hover:bg-purple-900/30 border border-purple-500/30"
                title="Insertar texto secreto difuminado ||...||"
              >
                ||secreto||
              </button>

              {/* Secret Message Mode Toggle (blurs whole message / photos) */}
              <button
                type="button"
                onClick={handleToggleSecret}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                  isSecret
                    ? 'bg-purple-900/60 border border-purple-500/60 text-purple-200 shadow-sm'
                    : 'text-slate-400 hover:text-purple-300'
                }`}
                title={isSecret ? 'Mensaje Difuminado Activo' : 'Enviar mensaje/fotos difuminadas'}
              >
                {isSecret ? <Lock className="w-3.5 h-3.5 text-purple-300" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span className="text-[10px] hidden sm:inline">
                  {isSecret ? 'Difuminado' : 'Ocultar'}
                </span>
              </button>

              {/* Attach Multiple Images button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  selectedImages.length > 0
                    ? 'text-genshin-gold bg-genshin-gold/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-genshin-card'
                }`}
                title="Adjuntar fotos (puedes seleccionar varias a la vez)"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                {selectedImages.length > 0 && (
                  <span className="text-[10px] font-bold font-mono">
                    {selectedImages.length}
                  </span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImagesChange}
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
          disabled={!content.trim() && selectedImages.length === 0}
          className={`shrink-0 p-2.5 sm:p-3 rounded-2xl flex items-center justify-center font-bold transition-all shadow-md active:scale-95 ${
            content.trim() || selectedImages.length > 0
              ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-amber-950 shadow-genshin-gold hover:brightness-110'
              : 'bg-genshin-panel/50 text-slate-600 cursor-not-allowed'
          }`}
          title="Enviar mensaje y fotos"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};
