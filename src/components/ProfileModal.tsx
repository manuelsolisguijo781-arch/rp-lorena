import React, { useState, useRef } from 'react';
import {
  X,
  User,
  Heart,
  Sparkles,
  Shield,
  Award,
  LogOut,
  Camera,
  Loader2,
  Image as ImageIcon,
  Plus,
  Trash2,
  Link as LinkIcon,
  Layers,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { Player, CharacterProfile } from '../types';
import { dbService } from '../lib/supabase';
import { SoundEffects } from '../utils/sound';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  onSaveProfile: (updated: Player) => void;
  onLogout: () => void;
  messageCount: number;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  player,
  onSaveProfile,
  onLogout,
  messageCount,
}) => {
  const [displayName, setDisplayName] = useState(player.displayName || '');
  const [nickname, setNickname] = useState(player.nickname || '');
  const [bio, setBio] = useState(player.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(player.avatarUrl || '');
  const [activeTab, setActiveTab] = useState<'profile' | 'characters' | 'stats'>('profile');
  const [isUploading, setIsUploading] = useState(false);

  // Character roster state
  const initialCharacters: CharacterProfile[] =
    player.characters && player.characters.length > 0
      ? player.characters
      : [
          {
            id: `char-${player.id}-1`,
            name: player.displayName || player.username,
            nickname: player.nickname || 'Principal',
            bio: player.bio || 'Mi personaje principal de rol.',
            avatarUrl: player.avatarUrl,
            referencePhotos: [],
          },
        ];

  const [characters, setCharacters] = useState<CharacterProfile[]>(initialCharacters);
  const [selectedCharIndex, setSelectedCharIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const charAvatarInputRef = useRef<HTMLInputElement>(null);
  const charPhotoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentCharacter = characters[selectedCharIndex] || characters[0];

  const affectionLevel = Math.min(10, Math.floor(messageCount / 10) + 1);
  const affectionProgress = Math.min(100, ((messageCount % 10) / 10) * 100);

  // Upload user profile avatar
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    SoundEffects.playChime();

    try {
      const publicUrl = await dbService.uploadImage(file);
      if (publicUrl) {
        setAvatarUrl(publicUrl);
        SoundEffects.playCriticalSuccess();
      } else {
        alert('No se pudo subir la foto. Inténtalo de nuevo.');
      }
    } catch (err) {
      console.error(err);
      alert('Error al procesar la foto de la galería.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Upload character avatar
  const handleCharAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentCharacter) return;

    setIsUploading(true);
    SoundEffects.playChime();

    try {
      const publicUrl = await dbService.uploadImage(file);
      if (publicUrl) {
        updateCurrentCharacter({ avatarUrl: publicUrl });
        SoundEffects.playCriticalSuccess();
      } else {
        alert('No se pudo subir la foto del personaje.');
      }
    } catch (err) {
      console.error(err);
      alert('Error al subir el avatar del personaje.');
    } finally {
      setIsUploading(false);
      if (charAvatarInputRef.current) charAvatarInputRef.current.value = '';
    }
  };

  // Upload character reference photo from gallery
  const handleCharPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentCharacter) return;

    setIsUploading(true);
    SoundEffects.playChime();

    try {
      const publicUrl = await dbService.uploadImage(file);
      if (publicUrl) {
        const existing = currentCharacter.referencePhotos || [];
        updateCurrentCharacter({
          referencePhotos: [...existing, publicUrl],
        });
        SoundEffects.playCriticalSuccess();
      } else {
        alert('No se pudo subir la foto referente.');
      }
    } catch (err) {
      console.error(err);
      alert('Error al subir foto de referencia.');
    } finally {
      setIsUploading(false);
      if (charPhotoInputRef.current) charPhotoInputRef.current.value = '';
    }
  };

  // Add reference photo by direct URL
  const handleAddPhotoByUrl = () => {
    const url = prompt('Introduce la URL directa de la foto de referencia (https://...):');
    if (url && url.trim().startsWith('http')) {
      const existing = currentCharacter.referencePhotos || [];
      updateCurrentCharacter({
        referencePhotos: [...existing, url.trim()],
      });
      SoundEffects.playChime();
    }
  };

  // Remove reference photo
  const handleRemovePhoto = (photoIdx: number) => {
    if (!currentCharacter) return;
    const existing = currentCharacter.referencePhotos || [];
    updateCurrentCharacter({
      referencePhotos: existing.filter((_, idx) => idx !== photoIdx),
    });
    SoundEffects.playChime();
  };

  // Update current character in state
  const updateCurrentCharacter = (fields: Partial<CharacterProfile>) => {
    setCharacters((prev) =>
      prev.map((c, idx) => (idx === selectedCharIndex ? { ...c, ...fields } : c))
    );
  };

  // Add new character
  const handleAddNewCharacter = () => {
    SoundEffects.playChime();
    const newChar: CharacterProfile = {
      id: `char-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: `Personaje ${characters.length + 1}`,
      nickname: 'Apodo',
      bio: 'Descripción del personaje...',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=char-${characters.length + 1}`,
      referencePhotos: [],
    };
    setCharacters((prev) => [...prev, newChar]);
    setSelectedCharIndex(characters.length);
  };

  // Delete character
  const handleDeleteCharacter = (idxToDelete: number) => {
    if (characters.length <= 1) {
      alert('Debes mantener al menos un personaje.');
      return;
    }
    if (!confirm('¿Seguro que quieres eliminar este personaje?')) return;
    SoundEffects.playChime();
    setCharacters((prev) => prev.filter((_, idx) => idx !== idxToDelete));
    setSelectedCharIndex((prev) => Math.max(0, prev - 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    SoundEffects.playCriticalSuccess();
    onSaveProfile({
      ...player,
      displayName: displayName.trim() || player.username,
      nickname: nickname.trim(),
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim() || player.avatarUrl,
      characters: characters,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-genshin-card border border-genshin-gold/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-genshin-dark border-b border-genshin-gold/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-genshin-gold" />
            <h2 className="text-base font-serif font-bold text-amber-100 tracking-wide">
              Mi Perfil & Personajes
            </h2>
          </div>
          <button
            onClick={() => {
              SoundEffects.playChime();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-genshin-panel/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level & Vínculo Banner */}
        <div className="mx-4 mt-3 p-3 rounded-2xl bg-gradient-to-r from-amber-950/40 via-genshin-panel to-amber-950/40 border border-genshin-gold/30">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-serif font-bold text-genshin-gold flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-400 fill-rose-400/30" />
              Nivel de Vínculo: {affectionLevel} / 10
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {messageCount} memorias compartidas
            </span>
          </div>
          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${affectionProgress}%` }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/60 mx-4 mt-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 font-serif font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-genshin-gold text-genshin-gold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Perfil & Apodo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('characters')}
            className={`flex-1 py-2 font-serif font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'characters'
                ? 'border-genshin-gold text-genshin-gold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mis Personajes ({characters.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 font-serif font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'stats'
                ? 'border-genshin-gold text-genshin-gold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Atributos D&D</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* TAB 1: PERFIL GENERAL */}
          {activeTab === 'profile' && (
            <form id="profileForm" onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Photo Upload Area */}
              <div className="flex flex-col items-center justify-center pt-1 pb-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group cursor-pointer w-24 h-24 rounded-3xl overflow-hidden border-2 border-genshin-gold/60 hover:border-genshin-gold p-1 bg-genshin-dark/80 shadow-genshin-gold transition-all active:scale-95"
                  title="Toca para abrir la galería y cambiar foto"
                >
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                    {isUploading ? (
                      <Loader2 className="w-7 h-7 text-genshin-gold animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-genshin-gold mb-1" />
                        <span className="text-[10px] text-amber-100 font-serif font-bold">
                          Cambiar Foto
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2.5 px-3 py-1.5 rounded-xl bg-genshin-panel hover:bg-genshin-border text-genshin-gold border border-genshin-gold/40 text-[11px] font-serif font-bold inline-flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Subiendo foto...' : 'Abrir Galería del Móvil'}</span>
                </button>
              </div>

              <div>
                <label className="text-[11px] text-genshin-gold font-medium block mb-1">
                  Nombre de Usuario (Login)
                </label>
                <div className="px-3 py-2 rounded-xl bg-genshin-dark/60 border border-slate-800 text-slate-400 font-mono text-xs">
                  @{player.username}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-genshin-gold font-medium block mb-1">
                  Nombre Principal en el Rol
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu nombre principal"
                  className="w-full px-3 py-2 rounded-xl bg-genshin-panel border border-slate-700 text-slate-100 focus:border-genshin-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-genshin-gold font-medium block mb-1">
                  Apodo / Título Personal
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Ej: Mi Reina, Lori, Sacerdotisa, Cazadora..."
                  className="w-full px-3 py-2 rounded-xl bg-genshin-panel border border-slate-700 text-slate-100 focus:border-genshin-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-genshin-gold font-medium block mb-1">
                  Biografía / Historia Personal
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe la historia o trasfondo de tu perfil..."
                  className="w-full px-3 py-2 rounded-xl bg-genshin-panel border border-slate-700 text-slate-100 focus:border-genshin-gold focus:outline-none resize-none"
                />
              </div>

              {/* Logout button */}
              <div className="pt-2 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={() => {
                    SoundEffects.playChime();
                    onLogout();
                    onClose();
                  }}
                  className="w-full py-2 rounded-xl bg-red-950/30 hover:bg-red-950/60 text-red-400 border border-red-900/40 text-xs font-serif font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PERSONAJES Y FOTOS REFERENTES */}
          {activeTab === 'characters' && (
            <div className="space-y-4 text-xs">
              {/* Character Selector Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {characters.map((char, idx) => (
                  <button
                    key={char.id || idx}
                    type="button"
                    onClick={() => {
                      SoundEffects.playChime();
                      setSelectedCharIndex(idx);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-serif text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
                      selectedCharIndex === idx
                        ? 'bg-genshin-gold text-amber-950 shadow-md scale-105'
                        : 'bg-genshin-panel/80 text-slate-300 border border-slate-700 hover:text-white'
                    }`}
                  >
                    <span>{char.name || `Personaje ${idx + 1}`}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleAddNewCharacter}
                  className="px-2.5 py-1.5 rounded-xl bg-genshin-dark border border-dashed border-genshin-gold/60 text-genshin-gold font-serif text-xs font-bold flex items-center gap-1 hover:bg-genshin-panel transition-all shrink-0"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nuevo</span>
                </button>
              </div>

              {/* Current Character Card */}
              {currentCharacter && (
                <div className="p-3.5 rounded-2xl bg-genshin-panel/80 border border-genshin-gold/40 shadow-lg space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    {/* Character Avatar */}
                    <div className="flex items-center gap-3">
                      <input
                        ref={charAvatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCharAvatarSelect}
                        className="hidden"
                      />
                      <div
                        onClick={() => charAvatarInputRef.current?.click()}
                        className="relative cursor-pointer w-14 h-14 rounded-2xl overflow-hidden border border-genshin-gold p-0.5 bg-genshin-dark shrink-0 shadow-md group"
                        title="Cambiar foto de este personaje"
                      >
                        <img
                          src={currentCharacter.avatarUrl || avatarUrl}
                          alt={currentCharacter.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                          <Camera className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-sm text-amber-100">
                          {currentCharacter.name || 'Sin nombre'}
                        </h3>
                        <span className="text-[10px] text-amber-300/80 font-mono bg-black/40 px-2 py-0.5 rounded-md border border-slate-700 inline-block mt-0.5">
                          Atajo en chat: ¡{currentCharacter.name?.toLowerCase().trim() || 'nombre'}
                        </span>
                      </div>
                    </div>

                    {characters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCharacter(selectedCharIndex)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/50 transition-colors"
                        title="Eliminar este personaje"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Character Name & Nickname inputs */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-genshin-gold font-medium block mb-1">
                        Nombre del Personaje
                      </label>
                      <input
                        type="text"
                        value={currentCharacter.name}
                        onChange={(e) => updateCurrentCharacter({ name: e.target.value })}
                        placeholder="Ej: Lorena"
                        className="w-full px-2.5 py-1.5 rounded-xl bg-genshin-dark border border-slate-700 text-slate-100 focus:border-genshin-gold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-genshin-gold font-medium block mb-1">
                        Apodo / Título
                      </label>
                      <input
                        type="text"
                        value={currentCharacter.nickname || ''}
                        onChange={(e) => updateCurrentCharacter({ nickname: e.target.value })}
                        placeholder="Ej: Sacerdotisa, Lori..."
                        className="w-full px-2.5 py-1.5 rounded-xl bg-genshin-dark border border-slate-700 text-slate-100 focus:border-genshin-gold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Character Bio */}
                  <div>
                    <label className="text-[10px] text-genshin-gold font-medium block mb-1">
                      Biografía / Personalidad del Personaje
                    </label>
                    <textarea
                      rows={2}
                      value={currentCharacter.bio || ''}
                      onChange={(e) => updateCurrentCharacter({ bio: e.target.value })}
                      placeholder="Rasgos, actitud, secretos o apariencia..."
                      className="w-full px-2.5 py-1.5 rounded-xl bg-genshin-dark border border-slate-700 text-slate-100 focus:border-genshin-gold focus:outline-none resize-none text-xs"
                    />
                  </div>

                  {/* REFERENCE PHOTOS SECTION */}
                  <div className="pt-2 border-t border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-genshin-gold" />
                        <span className="font-serif font-bold text-amber-200">
                          Fotos Referentes ({currentCharacter.referencePhotos?.length || 0})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          ref={charPhotoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleCharPhotoUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={() => charPhotoInputRef.current?.click()}
                          className="px-2 py-1 rounded-lg bg-genshin-gold hover:bg-amber-400 text-amber-950 font-serif font-bold text-[10px] flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                        >
                          <Camera className="w-3 h-3" />
                          <span>+ Galería</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleAddPhotoByUrl}
                          className="px-2 py-1 rounded-lg bg-genshin-dark hover:bg-genshin-border text-slate-200 border border-slate-700 font-serif font-bold text-[10px] flex items-center gap-1 active:scale-95 transition-all"
                        >
                          <LinkIcon className="w-3 h-3" />
                          <span>+ URL</span>
                        </button>
                      </div>
                    </div>

                    {/* Explanatory Help Card */}
                    <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-600/30 text-[10px] text-amber-200 leading-relaxed flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-genshin-gold shrink-0 mt-0.5" />
                      <span>
                        <strong>¡Atajo rápido en el chat!:</strong> Escribe{' '}
                        <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300 font-bold">
                          ¡{currentCharacter.name?.toLowerCase().trim() || 'lorena'}
                        </code>{' '}
                        (o con signo de exclamación normal{' '}
                        <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300 font-bold">
                          !{currentCharacter.name?.toLowerCase().trim() || 'lorena'}
                        </code>
                        ) mientras escribes tu mensaje y se abrirá el selector flotante para enviar cualquiera de estas fotos al instante.
                      </span>
                    </div>

                    {/* Reference Photos Grid */}
                    {currentCharacter.referencePhotos && currentCharacter.referencePhotos.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-black/30 rounded-xl border border-slate-800">
                        {currentCharacter.referencePhotos.map((photoUrl, pIdx) => (
                          <div
                            key={pIdx}
                            className="relative group rounded-xl overflow-hidden border border-slate-700 aspect-square shadow-sm"
                          >
                            <img
                              src={photoUrl}
                              alt={`Referencia ${pIdx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(pIdx)}
                              className="absolute top-1 right-1 p-1 rounded-full bg-red-600/90 hover:bg-red-500 text-white shadow-md transition-all active:scale-95"
                              title="Eliminar foto"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 px-2 rounded-xl border border-dashed border-slate-700 bg-black/20 text-slate-400">
                        <ImageIcon className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                        <p className="text-[11px]">No hay fotos referentes aún.</p>
                        <p className="text-[10px] text-slate-500">
                          Sube fotos de ropa, poses o expresiones para mandarlas rápido en el rol.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ATRIBUTOS D&D */}
          {activeTab === 'stats' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-genshin-panel/60 border border-slate-700 text-slate-300 space-y-2">
                <div className="font-serif font-bold text-genshin-gold flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>Modificadores de Tirada Automáticos</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Estos atributos otorgan bonificadores naturales a tus tiradas de dados:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                  <div className="p-2 rounded-xl bg-genshin-dark border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Seducción</span>
                    <span className="text-amber-300 font-bold">+2</span>
                  </div>
                  <div className="p-2 rounded-xl bg-genshin-dark border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Persuasión</span>
                    <span className="text-amber-300 font-bold">+1</span>
                  </div>
                  <div className="p-2 rounded-xl bg-genshin-dark border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Percepción</span>
                    <span className="text-amber-300 font-bold">+2</span>
                  </div>
                  <div className="p-2 rounded-xl bg-genshin-dark border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Pasión / Fuerza</span>
                    <span className="text-amber-300 font-bold">+1</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-genshin-dark border-t border-genshin-gold/30 flex items-center gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isUploading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-amber-950 font-serif font-bold text-xs uppercase tracking-wider shadow-genshin-gold hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Guardar Perfil & Personajes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
