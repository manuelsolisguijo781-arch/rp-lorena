import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Dices, X, Plus, EyeOff, Lock, Sparkles, Camera } from 'lucide-react';
import { Player, Expression, CharacterProfile } from '../types';
import { SoundEffects } from '../utils/sound';

interface MessageInputProps {
  player: Player;
  onSendMessage: (
    content: string,
    expression: Expression,
    imageFiles?: File[],
    isSecret?: boolean,
    existingUrls?: string[]
  ) => void;
  onOpenDiceModal: () => void;
  onTyping?: (isTyping: boolean) => void;
  onOpenProfile?: () => void;
}

const VOICE_PRESETS = [
  { slash: '/', name: 'Rosa', dot: 'bg-pink-400', text: 'text-pink-300' },
  { slash: '//', name: 'Verde', dot: 'bg-emerald-400', text: 'text-emerald-300' },
  { slash: '///', name: 'Celeste', dot: 'bg-sky-400', text: 'text-sky-300' },
  { slash: '////', name: 'Morado', dot: 'bg-purple-400', text: 'text-purple-300' },
  { slash: '/////', name: 'Ámbar', dot: 'bg-amber-400', text: 'text-amber-300' },
];

export const MessageInput: React.FC<MessageInputProps> = ({
  player,
  onSendMessage,
  onOpenDiceModal,
  onTyping,
  onOpenProfile,
}) => {
  const [content, setContent] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [attachedPhotoUrls, setAttachedPhotoUrls] = useState<string[]>([]);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);

  // Quick photo picker state
  const [showQuickPicker, setShowQuickPicker] = useState(false);
  const [activeQuickChar, setActiveQuickChar] = useState<CharacterProfile | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const characters = player.characters || [];

  const triggerTyping = () => {
    if (!onTyping) return;
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2500);
  };

  // Detect ¡name or !name shortcut
  const handleContentChange = (val: string) => {
    setContent(val);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
    if (val.trim().length > 0) {
      triggerTyping();
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      onTyping?.(false);
    }

    // Match ¡name or !name at the end or anywhere in current word
    const match = val.match(/(?:^|\s)[¡!]([a-zA-ZáéíóúÁÉÍÓÚñÑ0-9_-]*)$/);
    if (match) {
      const query = match[1].toLowerCase().trim();
      if (characters.length > 0) {
        if (!query) {
          // Just typed ¡ or !
          setActiveQuickChar(characters[0]);
          setShowQuickPicker(true);
        } else {
          // Find character matching query
          const found = characters.find(
            (c) =>
              c.name.toLowerCase().startsWith(query) ||
              c.name.toLowerCase().includes(query) ||
              (c.nickname && c.nickname.toLowerCase().includes(query))
          );
          if (found) {
            setActiveQuickChar(found);
            setShowQuickPicker(true);
          } else {
            // Still show picker with closest or all
            setActiveQuickChar(characters[0]);
            setShowQuickPicker(true);
          }
        }
      }
    } else {
      setShowQuickPicker(false);
    }
  };

  // Pick a reference photo from quick picker
  const handleSelectReferencePhoto = (photoUrl: string) => {
    SoundEffects.playChime();
    setAttachedPhotoUrls((prev) => [...prev, photoUrl]);
    // Remove the ¡name shortcut from content
    setContent((prev) => prev.replace(/(?:^|\s)[¡!][a-zA-ZáéíóúÁÉÍÓÚñÑ0-9_-]*$/, '').trim());
    setShowQuickPicker(false);
  };

  const handleSend = () => {
    if (!content.trim() && selectedImages.length === 0 && attachedPhotoUrls.length === 0) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    onTyping?.(false);

    SoundEffects.playSend();
    onSendMessage(
      content.trim(),
      'normal',
      selectedImages.length > 0 ? selectedImages : undefined,
      isSecret,
      attachedPhotoUrls.length > 0 ? attachedPhotoUrls : undefined
    );

    // Reset
    setContent('');
    setSelectedImages([]);
    imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setImagePreviewUrls([]);
    setAttachedPhotoUrls([]);
    setIsSecret(false);
    setShowQuickPicker(false);

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
      setSelectedImages((prev) => [...prev, ...newFilesArray]);
      const newUrls = newFilesArray.map((f) => URL.createObjectURL(f));
      setImagePreviewUrls((prev) => [...prev, ...newUrls]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveLocalImage = (indexToRemove: number) => {
    URL.revokeObjectURL(imagePreviewUrls[indexToRemove]);
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setImagePreviewUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRemoveAttachedUrl = (indexToRemove: number) => {
    setAttachedPhotoUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleToggleSecret = () => {
    SoundEffects.playChime();
    setIsSecret((prev) => !prev);
  };

  const handleInsertSlash = (slash: string) => {
    SoundEffects.playChime();
    setContent((prev) => {
      const next = prev ? `${prev} ${slash} ` : `${slash} `;
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(next.length, next.length);
        }
      }, 50);
      return next;
    });
    setShowVoiceMenu(false);
  };

  const totalAttachments = imagePreviewUrls.length + attachedPhotoUrls.length;

  return (
    <div className="relative z-20 bg-genshin-dark/95 backdrop-blur-md border-t border-genshin-gold/30 p-2 sm:p-3 pb-[max(env(safe-area-inset-bottom,0px),10px)] shadow-2xl">
      {/* QUICK CHARACTER PHOTO PICKER (Triggered by ¡lorena or !lorena) */}
      {showQuickPicker && activeQuickChar && (
        <div className="max-w-3xl mx-auto mb-2.5 p-3 rounded-2xl bg-genshin-card/95 border-2 border-genshin-gold/70 shadow-2xl backdrop-blur-lg animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl overflow-hidden border border-genshin-gold p-0.5 bg-black/40">
                <img
                  src={activeQuickChar.avatarUrl || player.avatarUrl}
                  alt={activeQuickChar.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div>
                <span className="font-serif font-bold text-xs text-amber-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-genshin-gold animate-spin" />
                  Fotos Referentes de {activeQuickChar.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  Toca una foto para adjuntarla y mandarla rápido
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {characters.length > 1 && (
                <div className="flex items-center gap-1 overflow-x-auto max-w-[140px]">
                  {characters.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveQuickChar(c)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-serif font-bold ${
                        activeQuickChar.id === c.id
                          ? 'bg-genshin-gold text-amber-950'
                          : 'bg-genshin-panel text-slate-300'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowQuickPicker(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reference Photos Horizontal Scroll */}
          {activeQuickChar.referencePhotos && activeQuickChar.referencePhotos.length > 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
              {activeQuickChar.referencePhotos.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectReferencePhoto(url)}
                  className="relative group cursor-pointer w-20 h-20 shrink-0 rounded-xl overflow-hidden border border-slate-700 hover:border-genshin-gold shadow-md hover:scale-105 active:scale-95 transition-all"
                >
                  <img
                    src={url}
                    alt={`Ref ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-[9px] font-serif font-bold text-amber-100 bg-black/70 px-1.5 py-0.5 rounded">
                      Adjuntar
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 text-slate-400 text-xs">
              <p>No tienes fotos referentes guardadas para {activeQuickChar.name}.</p>
              <button
                type="button"
                onClick={() => {
                  setShowQuickPicker(false);
                  onOpenProfile?.();
                }}
                className="mt-1 text-[11px] text-genshin-gold underline font-serif font-bold"
              >
                Abrir mi perfil para subir fotos referentes
              </button>
            </div>
          )}
        </div>
      )}

      {/* Multi-Image Preview bar (Local Files + Remote Reference Photos) */}
      {totalAttachments > 0 && (
        <div className="mb-2 p-2 rounded-2xl bg-genshin-panel/80 border border-genshin-gold/40 flex items-center gap-2 overflow-x-auto max-w-3xl mx-auto shadow-md">
          <span className="text-[10px] font-serif font-bold text-genshin-gold whitespace-nowrap pl-1">
            📷 {totalAttachments} {totalAttachments === 1 ? 'foto lista' : 'fotos listas'}:
          </span>
          <div className="flex items-center gap-1.5">
            {/* Local files */}
            {imagePreviewUrls.map((url, idx) => (
              <div key={`local-${idx}`} className="relative group shrink-0">
                <img
                  src={url}
                  alt={`Preview local ${idx + 1}`}
                  className="w-12 h-12 object-cover rounded-xl border border-slate-600 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveLocalImage(idx)}
                  className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-sm"
                  title="Eliminar esta foto"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Remote reference photo URLs */}
            {attachedPhotoUrls.map((url, idx) => (
              <div key={`remote-${idx}`} className="relative group shrink-0">
                <img
                  src={url}
                  alt={`Preview ref ${idx + 1}`}
                  className="w-12 h-12 object-cover rounded-xl border border-genshin-gold/70 shadow-sm"
                />
                <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[8px] text-amber-200 text-center font-mono">
                  Ref
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachedUrl(idx)}
                  className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-sm"
                  title="Eliminar esta foto referente"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-xl border border-dashed border-genshin-gold/50 hover:border-genshin-gold bg-genshin-dark/50 flex flex-col items-center justify-center text-genshin-gold hover:scale-105 transition-all shrink-0"
              title="Añadir más fotos"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[8px] font-serif">Más</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Input Bar */}
      <div className="max-w-3xl mx-auto flex items-end gap-2">
        {/* Player Avatar */}
        <div
          onClick={onOpenProfile}
          className="shrink-0 p-0.5 rounded-2xl bg-genshin-panel border border-genshin-gold/40 shadow-sm cursor-pointer hover:border-genshin-gold transition-all"
          title={`Escribiendo como ${player.displayName} (toca para ver perfil)`}
        >
          <img
            src={player.avatarUrl}
            alt={player.displayName}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover"
          />
        </div>

        {/* Input box */}
        <div className="flex-1 bg-genshin-panel/80 rounded-2xl border border-genshin-border focus-within:border-genshin-gold/80 transition-all flex flex-col p-1.5 shadow-inner">
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              totalAttachments > 0
                ? `Pie de foto para ${totalAttachments} ${totalAttachments === 1 ? 'foto' : 'fotos'}...`
                : `Escribe o usa ¡nombre (ej: ¡lorena para fotos)...`
            }
            className="w-full bg-transparent px-2.5 py-1 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none resize-none max-h-28"
          />

          {/* Tool row */}
          <div className="flex items-center gap-1 pt-1 px-1 border-t border-slate-700/40">
            {/* Character voice / colors popup toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  SoundEffects.playChime();
                  setShowVoiceMenu((prev) => !prev);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 transition-all border ${
                  showVoiceMenu
                    ? 'bg-genshin-gold/30 border-genshin-gold text-amber-200'
                    : 'text-slate-400 hover:text-slate-200 border-slate-700/60 hover:bg-genshin-card'
                }`}
                title="Voces de personaje: / a /////"
              >
                <span className="font-bold text-genshin-gold">/</span>
                <span className="text-[10px] hidden xs:inline font-sans">Voces</span>
              </button>

              {showVoiceMenu && (
                <div className="absolute bottom-full left-0 mb-2 p-1.5 rounded-2xl bg-genshin-card border border-genshin-gold/50 shadow-2xl flex flex-col gap-1 min-w-[155px] animate-fadeIn z-30">
                  <div className="text-[9px] font-serif font-bold text-genshin-gold px-2 py-0.5 border-b border-slate-700/60 uppercase">
                    Color de Personaje:
                  </div>
                  {VOICE_PRESETS.map((v) => (
                    <button
                      key={v.slash}
                      type="button"
                      onClick={() => handleInsertSlash(v.slash)}
                      className="px-2 py-1 rounded-xl text-xs flex items-center justify-between hover:bg-genshin-panel transition-all text-left"
                    >
                      <span className="font-mono font-bold text-slate-300 text-[11px]">{v.slash}</span>
                      <span className={`text-[11px] flex items-center gap-1.5 font-medium ${v.text}`}>
                        <span className={`w-2 h-2 rounded-full ${v.dot}`} />
                        {v.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Secret Spoiler shortcut ||...|| */}
            <button
              type="button"
              onClick={() => {
                SoundEffects.playChime();
                setContent((prev) => {
                  const next = prev ? `${prev} ||||` : '||||';
                  setTimeout(() => {
                    if (textareaRef.current) {
                      textareaRef.current.focus();
                      textareaRef.current.setSelectionRange(next.length - 2, next.length - 2);
                    }
                  }, 50);
                  return next;
                });
              }}
              className="px-1.5 py-0.5 rounded text-[11px] font-mono text-purple-300/90 hover:text-purple-200 hover:bg-purple-900/30 border border-purple-500/30"
              title="Insertar texto secreto difuminado ||...||"
            >
              ||secreto||
            </button>

            {/* Secret whole-message toggle */}
            <button
              type="button"
              onClick={handleToggleSecret}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                isSecret
                  ? 'bg-purple-900/60 border border-purple-500/60 text-purple-200 shadow-sm'
                  : 'text-slate-400 hover:text-purple-300'
              }`}
              title={isSecret ? 'Mensaje difuminado activo' : 'Enviar mensaje/fotos difuminadas'}
            >
              {isSecret ? <Lock className="w-3.5 h-3.5 text-purple-300" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="text-[10px] hidden sm:inline">{isSecret ? 'Difuminado' : 'Ocultar'}</span>
            </button>

            {/* Attach local images */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                selectedImages.length > 0
                  ? 'text-genshin-gold bg-genshin-gold/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-genshin-card'
              }`}
              title="Adjuntar fotos desde galería"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              {selectedImages.length > 0 && (
                <span className="text-[10px] font-bold font-mono">{selectedImages.length}</span>
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

            {/* Dice Roller */}
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

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim() && totalAttachments === 0}
          className={`shrink-0 p-2.5 sm:p-3 rounded-2xl flex items-center justify-center font-bold transition-all shadow-md active:scale-95 ${
            content.trim() || totalAttachments > 0
              ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-amber-950 shadow-genshin-gold hover:brightness-110'
              : 'bg-genshin-panel/50 text-slate-600 cursor-not-allowed'
          }`}
          title="Enviar"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};
