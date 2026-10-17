import React, { useState } from 'react';
import { X, Map, BookOpen, Compass, Sparkles, Feather, MapPin, Eye, Save, Check } from 'lucide-react';
import { COSMOLOGY_LORE, WORLD_REGIONS, RegionLocation, LoreSection } from '../data/loreData';
import { Room } from '../types';
import { SoundEffects } from '../utils/sound';

interface ContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoom: Room | null;
  onUpdateRoomContext?: (newContext: string) => Promise<void>;
}

export const ContextModal: React.FC<ContextModalProps> = ({
  isOpen,
  onClose,
  currentRoom,
  onUpdateRoomContext,
}) => {
  const [activeTab, setActiveTab] = useState<'cosmology' | 'map' | 'roomNotes'>('cosmology');
  const [selectedRegion, setSelectedRegion] = useState<RegionLocation>(WORLD_REGIONS[0]);
  const [roomContextText, setRoomContextText] = useState(currentRoom?.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveContext = async () => {
    if (!onUpdateRoomContext) return;
    setIsSaving(true);
    SoundEffects.playCriticalSuccess();
    try {
      await onUpdateRoomContext(roomContextText);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl h-[92vh] max-h-[750px] bg-genshin-card/95 border border-genshin-gold/50 rounded-3xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-genshin-dark/95 border-b border-genshin-gold/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-genshin-panel border border-genshin-gold/40 text-genshin-gold shadow-sm">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-amber-100 flex items-center gap-2">
                <span>Contexto & Crónicas del Mundo</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-genshin-gold/20 text-genshin-gold border border-genshin-gold/30 font-sans font-normal">
                  Lore & Mapa
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                La cosmología de Teyvat, regiones del mapa y notas del escenario actual
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

        {/* Tab Navigation */}
        <div className="flex border-b border-genshin-gold/20 bg-genshin-panel/40 px-3 shrink-0">
          <button
            onClick={() => {
              SoundEffects.playChime();
              setActiveTab('cosmology');
            }}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-serif font-bold transition-all ${
              activeTab === 'cosmology'
                ? 'border-genshin-gold text-genshin-gold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Cosmología & Reglas</span>
          </button>

          <button
            onClick={() => {
              SoundEffects.playChime();
              setActiveTab('map');
            }}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-serif font-bold transition-all ${
              activeTab === 'map'
                ? 'border-genshin-gold text-genshin-gold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Mapa & Regiones</span>
          </button>

          {currentRoom && (
            <button
              onClick={() => {
                SoundEffects.playChime();
                setActiveTab('roomNotes');
              }}
              className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-serif font-bold transition-all ${
                activeTab === 'roomNotes'
                  ? 'border-genshin-gold text-genshin-gold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Feather className="w-3.5 h-3.5" />
              <span>Notas de la Sala</span>
            </button>
          )}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 1. COSMOLOGY & LORE */}
          {activeTab === 'cosmology' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-genshin-gold/30 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-genshin-gold shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold font-serif text-genshin-gold block mb-0.5">
                    Roadmap Cosmológico de Teyvat
                  </span>
                  Este documento rige la magia, los elementos, Celestia y el Abismo en vuestras crónicas de rol. Úsalo como guía para vuestras aventuras e intrigas.
                </div>
              </div>

              {COSMOLOGY_LORE.map((section: LoreSection) => (
                <div
                  key={section.id}
                  className="rounded-2xl bg-genshin-panel/50 border border-slate-700/80 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-center gap-2.5 border-b border-slate-700/60 pb-2">
                    <span className="text-xl">{section.icon}</span>
                    <div>
                      <h3 className="text-sm font-serif font-bold text-amber-100">
                        {section.title}
                      </h3>
                      <p className="text-[10px] text-genshin-gold font-mono uppercase tracking-wider">
                        {section.subtitle}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 italic bg-genshin-dark/60 p-2.5 rounded-xl border border-slate-800">
                    "{section.summary}"
                  </p>

                  <div className="space-y-3 pt-1">
                    {section.content.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <h4 className="text-xs font-serif font-bold text-genshin-gold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-genshin-gold/80" />
                          {item.heading}
                        </h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed pl-3">
                          {item.description}
                        </p>
                        {item.bullets && item.bullets.length > 0 && (
                          <ul className="pl-6 space-y-1 text-[11px] text-slate-400 list-disc pt-1">
                            {item.bullets.map((bullet, bIdx) => (
                              <li key={bIdx} className="leading-snug">{bullet}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. MAP & REGIONS */}
          {activeTab === 'map' && (
            <div className="space-y-4">
              {/* Region Selector Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {WORLD_REGIONS.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => {
                      SoundEffects.playChime();
                      setSelectedRegion(region);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold whitespace-nowrap transition-all border shrink-0 ${
                      selectedRegion.id === region.id
                        ? 'bg-genshin-gold text-amber-950 border-genshin-gold shadow-sm scale-105'
                        : 'bg-genshin-panel/80 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {region.name}
                  </button>
                ))}
              </div>

              {/* Selected Region Card */}
              <div className="rounded-3xl overflow-hidden border border-genshin-gold/40 bg-genshin-panel/80 shadow-lg relative">
                {/* Hero Image */}
                <div className="relative h-44 sm:h-52 w-full overflow-hidden">
                  <img
                    src={selectedRegion.imageUrl}
                    alt={selectedRegion.name}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-genshin-card via-genshin-card/40 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md text-white mb-1 inline-block"
                        style={{ backgroundColor: `${selectedRegion.color}99` }}
                      >
                        {selectedRegion.element}
                      </span>
                      <h3 className="text-lg font-serif font-bold text-white drop-shadow">
                        {selectedRegion.name}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Region Details */}
                <div className="p-4 space-y-3">
                  <p className="text-xs font-serif italic text-amber-200/90 font-medium">
                    "{selectedRegion.tagline}"
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedRegion.description}
                  </p>

                  <div className="pt-2 border-t border-slate-700/60">
                    <span className="text-[11px] font-serif font-bold text-genshin-gold block mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      Lugares & Puntos de Interés:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRegion.notablePlaces.map((place, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2.5 py-1 rounded-xl bg-genshin-dark border border-slate-700 text-slate-300"
                        >
                          {place}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. ROOM CONTEXT & NOTES */}
          {activeTab === 'roomNotes' && currentRoom && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-genshin-panel/80 border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Sala Actual</span>
                  <h3 className="text-sm font-serif font-bold text-amber-100">{currentRoom.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-genshin-gold bg-genshin-gold/10 px-2 py-0.5 rounded border border-genshin-gold/30">
                    {currentRoom.inviteCode}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-serif font-bold text-genshin-gold block mb-1.5 flex items-center justify-between">
                  <span>Contexto de la Escena / Capítulo:</span>
                  <span className="text-[10px] text-slate-400 font-sans font-normal">
                    Ambos podéis leerlo y actualizarlo
                  </span>
                </label>
                <textarea
                  rows={6}
                  value={roomContextText}
                  onChange={(e) => setRoomContextText(e.target.value)}
                  placeholder="Escribe el resumen o estado actual de los personajes en esta escena (ej: Estamos en la posada tras la emboscada...)"
                  className="w-full text-xs p-3.5 rounded-2xl bg-genshin-panel border border-slate-700 focus:border-genshin-gold focus:outline-none text-slate-100 placeholder:text-slate-500 leading-relaxed resize-none"
                />
              </div>

              <button
                onClick={handleSaveContext}
                disabled={isSaving}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-amber-950 font-serif font-bold text-xs uppercase tracking-wider shadow-genshin-gold hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-950" />
                    <span>¡Contexto Guardado con Éxito!</span>
                  </>
                ) : isSaving ? (
                  <span>Guardando...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Contexto de la Escena</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
