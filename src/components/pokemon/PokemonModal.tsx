import React, { useState, useEffect } from 'react';
import { X, Heart, Shield, Flame, Sparkles, Swords, Compass, Award, Utensils, Zap, Users, Share2, ToggleLeft, ToggleRight, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Player } from '../../types';
import { PokemonInstance, NPCProfile, TrainerProfile, BattleResult } from '../../types/pokemon';
import { pokemonStorage } from '../../data/pokemonStorage';
import { getAnimatedSpriteUrl } from '../../data/alolaPokedex';
import { 
  feedPokemon, 
  petPokemon, 
  trainPokemon, 
  checkAndEvolve, 
  generateWildPokemon, 
  attemptCatch, 
  simulateNarrativeBattle
} from '../../utils/pokemonEngine';

interface PokemonModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  onPublishToChat?: (message: string) => void;
}

type TabType = 'team' | 'wild' | 'arena' | 'trainers';

export const PokemonModal: React.FC<PokemonModalProps> = ({
  isOpen,
  onClose,
  player,
  onPublishToChat
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('team');
  const [team, setTeam] = useState<PokemonInstance[]>([]);
  const [selectedPk, setSelectedPk] = useState<PokemonInstance | null>(null);
  const [careNarrative, setCareNarrative] = useState<string | null>(null);

  // Zona salvaje
  const [wildPokemon, setWildPokemon] = useState<PokemonInstance | null>(null);
  const [catchNarrative, setCatchNarrative] = useState<string | null>(null);
  const [isCatching, setIsCatching] = useState(false);

  // Arena de combate
  const [npcs, setNpcs] = useState<NPCProfile[]>([]);
  const [rivalType, setRivalType] = useState<'lorena' | 'bruno' | 'npc' | 'coop'>('npc');
  const [selectedNpcId, setSelectedNpcId] = useState<string>('');
  const [strategy, setStrategy] = useState<'lead' | 'anchor'>('lead');
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [isFighting, setIsFighting] = useState(false);

  // Personajes / Placeholder
  const [placeholderTrainers, setPlaceholderTrainers] = useState<TrainerProfile[]>([]);

  // Cargar datos al abrir
  useEffect(() => {
    if (isOpen && player) {
      const myTeam = pokemonStorage.getTrainerPokemon(player.id, player.displayName || player.username);
      setTeam(myTeam);
      if (myTeam.length > 0 && !selectedPk) {
        setSelectedPk(myTeam[0]);
      }
      const loadedNpcs = pokemonStorage.getNPCs();
      setNpcs(loadedNpcs);
      if (loadedNpcs.length > 0) {
        setSelectedNpcId(loadedNpcs[0].id);
      }
      const trainers = pokemonStorage.getPlaceholderTrainers();
      setPlaceholderTrainers(trainers);
    }
  }, [isOpen, player]);

  if (!isOpen) return null;

  // Toggle manual de Plot Armor
  const handleTogglePlotArmor = () => {
    if (!selectedPk) return;
    const newStatus = !selectedPk.hasPlotArmor;
    const updated: PokemonInstance = {
      ...selectedPk,
      hasPlotArmor: newStatus,
      hazañas: newStatus 
        ? [...selectedPk.hazañas, 'Se le concedió la bendición de Plot Armor (Segundo Aire)']
        : selectedPk.hazañas
    };
    setSelectedPk(updated);
    pokemonStorage.updatePokemon(player.id, updated);
    setTeam(prev => prev.map(p => p.id === updated.id ? updated : p));
    setCareNarrative(newStatus 
      ? `¡Plot Armor ACTIVADO para ${updated.nickname}! Ignorará debilidades elementales y podrá revivir si cae.`
      : `Plot Armor desactivado para ${updated.nickname}. Peleará bajo reglas normales.`
    );
  };

  // Acciones de cuidado
  const handleFeed = () => {
    if (!selectedPk) return;
    const { pokemon: updated, narrative } = feedPokemon(selectedPk);
    setSelectedPk(updated);
    setCareNarrative(narrative);
    pokemonStorage.updatePokemon(player.id, updated);
    setTeam(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handlePet = () => {
    if (!selectedPk) return;
    const { pokemon: updated, narrative } = petPokemon(selectedPk);
    setSelectedPk(updated);
    setCareNarrative(narrative);
    pokemonStorage.updatePokemon(player.id, updated);
    setTeam(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleTrain = () => {
    if (!selectedPk) return;
    const { pokemon: updated, narrative } = trainPokemon(selectedPk);
    setSelectedPk(updated);
    setCareNarrative(narrative);
    pokemonStorage.updatePokemon(player.id, updated);
    setTeam(prev => prev.map(p => p.id === updated.id ? updated : p));

    const evoCheck = checkAndEvolve(updated);
    if (evoCheck.evolved) {
      setSelectedPk(evoCheck.pokemon);
      pokemonStorage.updatePokemon(player.id, evoCheck.pokemon);
      setTeam(prev => prev.map(p => p.id === evoCheck.pokemon.id ? evoCheck.pokemon : p));
      setCareNarrative(evoCheck.message || '¡Tu Pokémon ha evolucionado!');
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
    }
  };

  // Explorar Alola (con coherencia evolutiva y nivel medio)
  const handleExplore = () => {
    const wild = generateWildPokemon(team);
    setWildPokemon(wild);
    setCatchNarrative(`¡Un ${wild.name} salvaje de nivel ${wild.level} emergió de la hierba alta de Alola! (Ajustado al nivel medio de tu equipo)`);
  };

  const handleCatch = () => {
    if (!wildPokemon || isCatching) return;
    setIsCatching(true);
    setTimeout(() => {
      const result = attemptCatch(wildPokemon, player.id, player.displayName || player.username);
      setCatchNarrative(result.narrative);
      if (result.success && result.pokemon) {
        pokemonStorage.addPokemonToTrainer(player.id, result.pokemon);
        setTeam(prev => [...prev, result.pokemon!]);
        setSelectedPk(result.pokemon);
        setWildPokemon(null);
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch (e) {}
      }
      setIsCatching(false);
    }, 1000);
  };

  // Datos de los dos equipos de la Arena para mostrar stats y vida
  const myName = player.displayName || player.username;
  const partnerName = myName.toLowerCase().includes('bruno') ? 'Lorena' : 'Bruno';
  const partnerId = myName.toLowerCase().includes('bruno') ? 'lorena' : 'bruno';
  const partnerTeam = pokemonStorage.getTrainerPokemon(partnerId, partnerName);

  let currentTeam1: PokemonInstance[] = team;
  let currentTeam1Name = myName;

  if (rivalType === 'coop') {
    currentTeam1Name = `${myName} & ${partnerName}`;
    currentTeam1 = [team[0], ...(partnerTeam.length > 0 ? [partnerTeam[0]] : [])].filter(Boolean);
  }

  let currentTeam2: PokemonInstance[] = [];
  let currentTeam2Name = '';

  if (rivalType === 'npc' || rivalType === 'coop') {
    const npc = npcs.find(n => n.id === selectedNpcId) || npcs[0];
    currentTeam2Name = npc ? `${npc.name} (${npc.title})` : 'Jefe de Alola';
    currentTeam2 = npc ? npc.team : [];
  } else {
    currentTeam2Name = partnerName;
    currentTeam2 = partnerTeam;
  }

  // Iniciar combate
  const handleStartBattle = () => {
    if (currentTeam1.length === 0 || currentTeam2.length === 0) return;
    setIsFighting(true);

    setTimeout(() => {
      const team1Data = {
        name: currentTeam1Name,
        pokemons: [...currentTeam1],
        isCoop: rivalType === 'coop'
      };

      const team2Data = {
        name: currentTeam2Name,
        pokemons: [...currentTeam2],
        isTotemBoss: npcs.find(n => n.id === selectedNpcId)?.isTotemBoss
      };

      const result = simulateNarrativeBattle(team1Data, team2Data, strategy);
      setBattleResult(result);
      setIsFighting(false);

      if (result.winnerNames.includes(myName)) {
        try {
          confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
        } catch (e) {}
      }
    }, 800);
  };

  const handlePublishChronicle = () => {
    if (!battleResult || !onPublishToChat) return;
    const formatted = `📜 **${battleResult.title}**\n\n` +
      battleResult.chronicleLines.join('\n\n') +
      `\n\n⭐ **MVP del Combate:** ${battleResult.mvpPokemon}`;
    onPublishToChat(formatted);
    onClose();
  };

  const avgTeamLevel = team.length > 0 
    ? Math.round(team.reduce((acc, p) => acc + p.level, 0) / team.length)
    : 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-5xl bg-genshin-card/95 border border-genshin-gold/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Cabecera del Modal */}
        <div className="px-5 py-4 bg-genshin-dark border-b border-genshin-gold/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl shadow-inner">
              ⚡
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-amber-100 flex items-center gap-2">
                Pokédex & Arena de Alola
                <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Gen 7 (Sol)
                </span>
              </h2>
              <p className="text-xs text-amber-300/70">
                Entrenador: <span className="font-semibold text-amber-200">{player.displayName || player.username}</span> • Nivel Medio del Equipo: <span className="font-bold text-amber-300">Nv.{avgTeamLevel}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-amber-300/70 hover:text-amber-100 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Pestañas */}
        <div className="flex border-b border-genshin-gold/20 bg-black/40 px-3 pt-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-t-xl transition-all ${
              activeTab === 'team'
                ? 'bg-genshin-card text-amber-200 border-t-2 border-amber-400 font-bold shadow-md'
                : 'text-amber-300/60 hover:text-amber-200 hover:bg-white/5'
            }`}
          >
            <Heart className="w-4 h-4 text-pink-400" />
            Mi Equipo & Cuidados ({team.length})
          </button>

          <button
            onClick={() => setActiveTab('wild')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-t-xl transition-all ${
              activeTab === 'wild'
                ? 'bg-genshin-card text-amber-200 border-t-2 border-amber-400 font-bold shadow-md'
                : 'text-amber-300/60 hover:text-amber-200 hover:bg-white/5'
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            Explorar Alola
          </button>

          <button
            onClick={() => setActiveTab('arena')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-t-xl transition-all ${
              activeTab === 'arena'
                ? 'bg-genshin-card text-amber-200 border-t-2 border-amber-400 font-bold shadow-md'
                : 'text-amber-300/60 hover:text-amber-200 hover:bg-white/5'
            }`}
          >
            <Swords className="w-4 h-4 text-amber-400" />
            Arena de Combate
          </button>

          <button
            onClick={() => setActiveTab('trainers')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-t-xl transition-all ${
              activeTab === 'trainers'
                ? 'bg-genshin-card text-amber-200 border-t-2 border-amber-400 font-bold shadow-md'
                : 'text-amber-300/60 hover:text-amber-200 hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4 text-cyan-400" />
            Personajes (Bruno & Lorena)
          </button>
        </div>

        {/* Contenido según pestaña */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* ================= PESTAÑA 1: MI EQUIPO Y CUIDADOS ================= */}
          {activeTab === 'team' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-4 space-y-2">
                <h3 className="text-xs uppercase tracking-wider text-amber-300/70 font-semibold mb-2">
                  Tus Compañeros ({team.length})
                </h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {team.map((pk) => (
                    <div
                      key={pk.id}
                      onClick={() => {
                        setSelectedPk(pk);
                        setCareNarrative(null);
                      }}
                      className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all border ${
                        selectedPk?.id === pk.id
                          ? 'bg-amber-500/20 border-amber-400/80 shadow-lg'
                          : 'bg-black/30 border-white/5 hover:bg-white/5 hover:border-amber-400/30'
                      }`}
                    >
                      <img
                        src={getAnimatedSpriteUrl(pk.spriteKey)}
                        alt={pk.name}
                        className="w-12 h-12 object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-100 text-sm truncate">
                            {pk.nickname}
                          </span>
                          <span className="text-[11px] font-mono text-amber-300/80">
                            Nv.{pk.level}
                          </span>
                        </div>
                        <div className="flex gap-1 mt-1 items-center">
                          {pk.types.map(t => (
                            <span key={t} className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-amber-200">
                              {t}
                            </span>
                          ))}
                          {pk.hasPlotArmor && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-500/30 text-pink-300 font-semibold border border-pink-400/40">
                              🛡️ Armor
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPk ? (
                <div className="md:col-span-8 bg-black/40 border border-white/10 rounded-3xl p-5 space-y-5">
                  <div className="flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-amber-500/10 to-transparent p-4 rounded-2xl border border-amber-400/20">
                    <div className="relative w-32 h-32 flex items-center justify-center bg-black/40 rounded-2xl border border-white/10 p-2">
                      <img
                        src={getAnimatedSpriteUrl(selectedPk.spriteKey)}
                        alt={selectedPk.name}
                        className="max-h-28 max-w-28 object-contain scale-125"
                      />
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h4 className="text-xl font-serif font-bold text-amber-100">
                          {selectedPk.nickname}
                          <span className="text-sm font-normal text-amber-300/70 ml-2">
                            ({selectedPk.name})
                          </span>
                        </h4>

                        {/* TOGGLE MANUAL DE PLOT ARMOR */}
                        <button
                          onClick={handleTogglePlotArmor}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 self-center sm:self-auto ${
                            selectedPk.hasPlotArmor
                              ? 'bg-pink-500/20 border-pink-400/80 text-pink-200 shadow-md'
                              : 'bg-white/5 border-white/20 text-slate-400 hover:text-white'
                          }`}
                          title="Permite al Pokémon ignorar debilidades elementales y revivir si cae en combate por lealtad o ira."
                        >
                          <Shield className="w-3.5 h-3.5" />
                          Plot Armor: {selectedPk.hasPlotArmor ? 'ACTIVADO' : 'DESACTIVADO'}
                        </button>
                      </div>

                      <p className="text-xs text-amber-200/80 italic">
                        "{selectedPk.personality}"
                      </p>

                      <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-xs font-mono text-amber-200">
                          Nivel {selectedPk.level}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-xs font-mono text-emerald-200">
                          PS: {selectedPk.maxHp}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-red-500/20 text-xs font-mono text-red-200">
                          ATK: {selectedPk.attack}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-xs font-mono text-blue-200">
                          DEF: {selectedPk.defense}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-xs font-mono text-cyan-200">
                          VEL: {selectedPk.speed}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Medidores Emocionales */}
                  <div className="space-y-3 bg-black/30 p-4 rounded-2xl border border-white/5">
                    <h5 className="text-xs uppercase font-semibold text-amber-300/80 tracking-wider">
                      Vínculo Emocional (Afecta el Combate)
                    </h5>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-pink-300 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Heart className="w-3.5 h-3.5 fill-pink-400" /> Amor / Cariño
                        </span>
                        <span>{selectedPk.affection.love}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-500"
                          style={{ width: `${selectedPk.affection.love}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-blue-300 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-blue-400" /> Respeto / Disciplina
                        </span>
                        <span>{selectedPk.affection.respect}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                          style={{ width: `${selectedPk.affection.respect}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-orange-300 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-orange-400" /> Ira / Desprecio al Rival
                        </span>
                        <span>{selectedPk.affection.anger}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                          style={{ width: `${selectedPk.affection.anger}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botones de Cuidado */}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={handleFeed}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-200 transition-all active:scale-95"
                    >
                      <Utensils className="w-5 h-5 mb-1 text-amber-400" />
                      <span className="text-xs font-bold">Dar Baya</span>
                      <span className="text-[10px] text-amber-300/60">+Amor, -Hambre</span>
                    </button>

                    <button
                      onClick={handlePet}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-200 transition-all active:scale-95"
                    >
                      <Sparkles className="w-5 h-5 mb-1 text-pink-400" />
                      <span className="text-xs font-bold">Acariciar</span>
                      <span className="text-[10px] text-pink-300/60">+Cariño, -Ira</span>
                    </button>

                    <button
                      onClick={handleTrain}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-200 transition-all active:scale-95"
                    >
                      <Zap className="w-5 h-5 mb-1 text-cyan-400" />
                      <span className="text-xs font-bold">Entrenar</span>
                      <span className="text-[10px] text-cyan-300/60">+Nivel, +Stats</span>
                    </button>
                  </div>

                  {careNarrative && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 italic animate-fadeIn">
                      💬 {careNarrative}
                    </div>
                  )}

                  {selectedPk.hazañas && selectedPk.hazañas.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-xs font-semibold text-amber-300/70 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-400" /> Memoria de Hazañas:
                      </span>
                      <ul className="text-xs text-amber-100/80 space-y-1 list-disc pl-5">
                        {selectedPk.hazañas.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="md:col-span-8 flex items-center justify-center text-amber-300/50 p-12">
                  Selecciona un compañero para ver sus estadísticas y cuidarlo.
                </div>
              )}
            </div>
          )}

          {/* ================= PESTAÑA 2: EXPLORAR ALOLA ================= */}
          {activeTab === 'wild' && (
            <div className="max-w-xl mx-auto space-y-6 text-center">
              <div className="space-y-2">
                <h3 className="text-lg font-serif font-bold text-amber-100">
                  Hierba Alta de las Islas de Alola
                </h3>
                <p className="text-xs text-amber-200/70">
                  Exploración calibrada al nivel medio de tu equipo (<span className="text-amber-300 font-bold">Nv.{avgTeamLevel}</span>). Solo aparecerán criaturas en fases evolutivas congruentes con su fuerza.
                </p>
              </div>

              {!wildPokemon ? (
                <div className="p-10 rounded-3xl bg-black/40 border border-white/10 space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-3xl">
                    🌿
                  </div>
                  <button
                    onClick={handleExplore}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg transition-all active:scale-95"
                  >
                    🔍 Buscar en la Hierba Alta
                  </button>
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-black/40 border border-amber-400/30 space-y-5 animate-fadeIn">
                  <div className="w-32 h-32 mx-auto flex items-center justify-center bg-black/40 rounded-2xl border border-white/10 p-2">
                    <img
                      src={getAnimatedSpriteUrl(wildPokemon.spriteKey)}
                      alt={wildPokemon.name}
                      className="max-h-28 max-w-28 object-contain scale-125"
                    />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xl font-serif font-bold text-amber-100">
                      ¡Un {wildPokemon.name} salvaje!
                    </h4>
                    <p className="text-xs text-amber-300/80">
                      Nivel {wildPokemon.level} • Tipos: {wildPokemon.types.join(' / ')} • PS: {wildPokemon.maxHp}
                    </p>
                    <p className="text-xs text-amber-200/60 italic">
                      "{wildPokemon.personality}"
                    </p>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleCatch}
                      disabled={isCatching}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-bold text-sm shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                      🔴 {isCatching ? 'Lanzando Pokéball...' : 'Lanzar Pokéball'}
                    </button>
                    <button
                      onClick={handleExplore}
                      disabled={isCatching}
                      className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-amber-200 text-sm font-semibold transition-all"
                    >
                      Buscar otro
                    </button>
                  </div>
                </div>
              )}

              {catchNarrative && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs sm:text-sm text-amber-200 italic">
                  📖 {catchNarrative}
                </div>
              )}
            </div>
          )}

          {/* ================= PESTAÑA 3: ARENA DE COMBATE NARRATIVO ================= */}
          {activeTab === 'arena' && (
            <div className="space-y-6">
              {/* Opciones de la batalla */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-black/40 p-4 rounded-3xl border border-white/10">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-amber-300/80">Modo de Combate:</label>
                  <select
                    value={rivalType}
                    onChange={(e: any) => setRivalType(e.target.value)}
                    className="w-full bg-black/60 border border-amber-400/40 rounded-xl px-3 py-2 text-xs text-amber-100 focus:outline-none"
                  >
                    <option value="npc">Vs Jefe de Gimnasio / NPC de Alola</option>
                    <option value="lorena">Vs {partnerName}</option>
                    <option value="coop">🤝 Cooperativo (Bruno & Lorena vs Jefe Totem)</option>
                  </select>
                </div>

                {(rivalType === 'npc' || rivalType === 'coop') && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-amber-300/80">Seleccionar Rival:</label>
                    <select
                      value={selectedNpcId}
                      onChange={(e) => setSelectedNpcId(e.target.value)}
                      className="w-full bg-black/60 border border-amber-400/40 rounded-xl px-3 py-2 text-xs text-amber-100 focus:outline-none"
                    >
                      {npcs.map(npc => (
                        <option key={npc.id} value={npc.id}>
                          {npc.name} ({npc.title})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-amber-300/80">Estrategia de Equipo:</label>
                  <select
                    value={strategy}
                    onChange={(e: any) => setStrategy(e.target.value)}
                    className="w-full bg-black/60 border border-amber-400/40 rounded-xl px-3 py-2 text-xs text-amber-100 focus:outline-none"
                  >
                    <option value="lead">Primer Guerrero (Líder abre combate)</option>
                    <option value="anchor">As bajo la Manga (Guardar el mejor al final)</option>
                  </select>
                </div>
              </div>

              {/* VISUALIZADOR DE EQUIPOS CARA A CARA (STATS, NIVEL Y HP) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Equipo 1 */}
                <div className="bg-black/40 border border-amber-400/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h5 className="font-serif font-bold text-amber-200 text-sm flex items-center gap-2">
                      🔵 Equipo: {currentTeam1Name}
                    </h5>
                    <span className="text-[11px] text-amber-300/70 font-mono">
                      {currentTeam1.length} combatiente(s)
                    </span>
                  </div>

                  <div className="space-y-2">
                    {currentTeam1.map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
                        <img
                          src={getAnimatedSpriteUrl(p.spriteKey)}
                          alt={p.name}
                          className="w-10 h-10 object-contain"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-amber-100 truncate">{p.nickname}</span>
                            <span className="font-mono text-amber-300 text-[11px]">Nv.{p.level}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-emerald-300/80 mt-1">
                            <span>HP: {p.maxHp} / {p.maxHp}</span>
                            {p.hasPlotArmor && (
                              <span className="text-pink-300 font-semibold">🛡️ Plot Armor</span>
                            )}
                          </div>
                          <div className="w-full h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-emerald-500 w-full rounded-full" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Equipo 2 */}
                <div className="bg-black/40 border border-rose-400/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h5 className="font-serif font-bold text-rose-200 text-sm flex items-center gap-2">
                      🔴 Rival: {currentTeam2Name}
                    </h5>
                    <span className="text-[11px] text-rose-300/70 font-mono">
                      {currentTeam2.length} combatiente(s)
                    </span>
                  </div>

                  <div className="space-y-2">
                    {currentTeam2.map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
                        <img
                          src={getAnimatedSpriteUrl(p.spriteKey)}
                          alt={p.name}
                          className="w-10 h-10 object-contain"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-rose-100 truncate">{p.nickname}</span>
                            <span className="font-mono text-rose-300 text-[11px]">Nv.{p.level}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-emerald-300/80 mt-1">
                            <span>HP: {p.maxHp} / {p.maxHp}</span>
                            {p.isTotem && (
                              <span className="text-amber-400 font-bold">✨ Aura Dominante</span>
                            )}
                          </div>
                          <div className="w-full h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-rose-500 w-full rounded-full" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botón de Iniciar */}
              <div className="text-center">
                <button
                  onClick={handleStartBattle}
                  disabled={isFighting || currentTeam1.length === 0 || currentTeam2.length === 0}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-extrabold text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <Swords className="w-5 h-5" />
                  {isFighting ? 'Simulando combate épico...' : '¡Comenzar Combate Narrativo!'}
                </button>
              </div>

              {/* Crónica resultante */}
              {battleResult && (
                <div className="bg-black/50 border border-amber-400/40 rounded-3xl p-5 sm:p-6 space-y-4 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/10 pb-3">
                    <div>
                      <h4 className="text-lg font-serif font-bold text-amber-100">
                        {battleResult.title}
                      </h4>
                      <p className="text-xs text-emerald-400 font-semibold">
                        Vencedor: {battleResult.winnerNames} • MVP: {battleResult.mvpPokemon}
                      </p>
                    </div>

                    {onPublishToChat && (
                      <button
                        onClick={handlePublishChronicle}
                        className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Share2 className="w-4 h-4 text-amber-300" />
                        Publicar en el Chat de la Sala
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 font-serif text-sm text-amber-100/90 leading-relaxed max-h-[400px] overflow-y-auto pr-2">
                    {battleResult.chronicleLines.map((line, idx) => (
                      <p key={idx} className={line.startsWith('⚡') || line.startsWith('🏁') || line.startsWith('💥') ? 'font-bold text-amber-300' : ''}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= PESTAÑA 4: PERSONAJES (BRUNO & LORENA) ================= */}
          {activeTab === 'trainers' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-serif font-bold text-amber-100">
                  Entrenadores y Personajes de Alola
                </h3>
                <p className="text-xs text-amber-200/70">
                  Perfiles activos y pasivos. Puedes consultar los equipos de cada personaje o desafiarlos en la Arena.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {placeholderTrainers.map(trainer => (
                  <div key={trainer.id} className="bg-black/40 border border-amber-400/30 rounded-3xl p-5 space-y-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={trainer.avatarUrl}
                        alt={trainer.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/40 shadow-md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-serif font-bold text-amber-100">
                            {trainer.name}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Entrenador/a
                          </span>
                        </div>
                        <p className="text-xs text-amber-300/80 font-medium">
                          {trainer.title}
                        </p>
                        <p className="text-[11px] text-amber-200/60 mt-1 line-clamp-2">
                          {trainer.bio}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-3 space-y-2">
                      <span className="text-xs font-semibold text-amber-300/80 flex items-center justify-between">
                        <span>Equipo Pokémon ({trainer.team.length}):</span>
                        <span className="text-[10px] text-amber-400/70 font-mono">
                          Media Nv.{trainer.team.length > 0 ? Math.round(trainer.team.reduce((a, b) => a + b.level, 0) / trainer.team.length) : 0}
                        </span>
                      </span>

                      <div className="grid grid-cols-2 gap-2">
                        {trainer.team.map(pk => (
                          <div key={pk.id} className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                            <img
                              src={getAnimatedSpriteUrl(pk.spriteKey)}
                              alt={pk.name}
                              className="w-8 h-8 object-contain"
                            />
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-xs font-bold text-amber-100 truncate">{pk.nickname}</p>
                              <p className="text-[10px] text-amber-300/70 font-mono">Nv.{pk.level} • {pk.maxHp} PS</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Pie del modal */}
        <div className="px-5 py-3 bg-genshin-dark border-t border-genshin-gold/20 flex justify-between items-center text-xs text-amber-300/60 font-mono">
          <span>Pokémon Companion Engine • Alola Regional Dex</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-amber-200 transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
