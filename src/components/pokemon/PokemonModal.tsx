import React, { useState, useEffect } from 'react';
import { 
  X, Heart, Shield, Flame, Sparkles, Swords, Compass, Award, 
  Utensils, Zap, Users, Share2, Crown, Sliders, Trash2, Plus, 
  Frown, Smile, Wind, UserPlus, Image as ImageIcon 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Player } from '../../types';
import { PokemonInstance, NPCProfile, TrainerProfile, BattleResult, PersonalityType } from '../../types/pokemon';
import { pokemonStorage, normalizeTrainerKey } from '../../data/pokemonStorage';
import { getAnimatedSpriteUrl, getFullAlolaPokedex } from '../../data/alolaPokedex';
import { 
  feedPokemon, 
  petPokemon, 
  trainPokemon, 
  checkAndEvolve, 
  generateWildPokemon, 
  attemptCatch, 
  simulateNarrativeBattle,
  applyPostBattleEmotions,
  createPokemonInstance,
  PERSONALITY_OPTIONS
} from '../../utils/pokemonEngine';

interface PokemonModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  onPublishToChat?: (message: string) => void;
}

type TabType = 'team' | 'wild' | 'arena' | 'trainers' | 'admin';

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
  const [rivalType, setRivalType] = useState<'rival_human' | 'npc' | 'coop'>('rival_human');
  const [selectedNpcId, setSelectedNpcId] = useState<string>('');
  const [strategy, setStrategy] = useState<'lead' | 'anchor'>('lead');
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [isFighting, setIsFighting] = useState(false);

  // Personajes / Placeholder
  const [placeholderTrainers, setPlaceholderTrainers] = useState<TrainerProfile[]>([]);

  // Modo Creador Manual de Personajes (como Miu)
  const [isCreatingNPC, setIsCreatingNPC] = useState(false);
  const [newNPCName, setNewNPCName] = useState('');
  const [newNPCTitle, setNewNPCTitle] = useState('');
  const [newNPCAvatar, setNewNPCAvatar] = useState('');
  const [newNPCBio, setNewNPCBio] = useState('');
  const [newNPCPkDexId, setNewNPCPkDexId] = useState<number>(7); // Popplio por defecto
  const [newNPCPkLevel, setNewNPCPkLevel] = useState<number>(5);
  const [newNPCPkNickname, setNewNPCPkNickname] = useState('');
  const [newNPCPkPersonality, setNewNPCPkPersonality] = useState<PersonalityType>('Valeroso (prioriza el respeto y honor)');

  // Modo Master / Admin
  const [adminTarget, setAdminTarget] = useState<string>('bruno');
  const [editingPk, setEditingPk] = useState<PokemonInstance | null>(null);
  const [newPkDexId, setNewPkDexId] = useState<number>(1);
  const [newPkLevel, setNewPkLevel] = useState<number>(5);

  // Identificar rol del jugador actual
  const currentKey = normalizeTrainerKey(player?.username || player?.displayName || player?.id);
  const isBruno = currentKey === 'bruno';
  const myDisplayName = isBruno ? 'Bruno' : 'Loreeena';
  const partnerDisplayName = isBruno ? 'Loreeena' : 'Bruno';
  const partnerKey = isBruno ? 'lorena' : 'bruno';

  const reloadData = () => {
    const myTeam = pokemonStorage.getTrainerPokemon(currentKey, myDisplayName);
    setTeam(myTeam);
    if (myTeam.length > 0) {
      setSelectedPk(prev => (prev ? myTeam.find(p => p.id === prev.id) || myTeam[0] : myTeam[0]));
    }
    const loadedNpcs = pokemonStorage.getNPCs();
    setNpcs(loadedNpcs);
    if (loadedNpcs.length > 0 && !selectedNpcId) {
      setSelectedNpcId(loadedNpcs[0].id);
    }
    const trainers = pokemonStorage.getTrainerProfiles(player);
    setPlaceholderTrainers(trainers);
  };

  useEffect(() => {
    if (isOpen && player) {
      reloadData();
    }
  }, [isOpen, player, currentKey, myDisplayName]);

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
    pokemonStorage.updatePokemon(currentKey, updated);
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
    pokemonStorage.updatePokemon(currentKey, updated);
    setTeam(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handlePet = () => {
    if (!selectedPk) return;
    const { pokemon: updated, narrative } = petPokemon(selectedPk);
    setSelectedPk(updated);
    setCareNarrative(narrative);
    pokemonStorage.updatePokemon(currentKey, updated);
    setTeam(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleTrain = () => {
    if (!selectedPk) return;
    const { pokemon: updated, narrative } = trainPokemon(selectedPk);
    setSelectedPk(updated);
    setCareNarrative(narrative);
    pokemonStorage.updatePokemon(currentKey, updated);
    setTeam(prev => prev.map(p => p.id === updated.id ? updated : p));

    const evoCheck = checkAndEvolve(updated);
    if (evoCheck.evolved) {
      setSelectedPk(evoCheck.pokemon);
      pokemonStorage.updatePokemon(currentKey, evoCheck.pokemon);
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
      const result = attemptCatch(wildPokemon, currentKey, myDisplayName);
      setCatchNarrative(result.narrative);
      if (result.success && result.pokemon) {
        pokemonStorage.addPokemonToTrainer(currentKey, result.pokemon);
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

  // Creador manual de personaje / NPC
  const handleCreateNPC = () => {
    if (!newNPCName.trim()) return;
    const pokedex = getFullAlolaPokedex();
    const entry = pokedex.find(p => p.id === Number(newNPCPkDexId)) || pokedex[0];
    const npcId = `npc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    const initialPk = createPokemonInstance(
      entry,
      Number(newNPCPkLevel),
      npcId,
      newNPCName.trim(),
      true,
      false,
      newNPCPkNickname.trim() || entry.name,
      true,
      newNPCPkPersonality
    );

    const newNPC: NPCProfile = {
      id: npcId,
      name: newNPCName.trim(),
      title: newNPCTitle.trim() || 'Entrenador/a de Alola',
      avatarUrl: newNPCAvatar.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      team: [initialPk]
    };

    pokemonStorage.addNPC(newNPC);
    reloadData();
    setIsCreatingNPC(false);
    setNewNPCName('');
    setNewNPCTitle('');
    setNewNPCAvatar('');
    setNewNPCBio('');
    setNewNPCPkNickname('');
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}
  };

  // Eliminar personaje / NPC
  const handleDeleteNPC = (npcId: string, npcName: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar al personaje "${npcName}"?`)) {
      pokemonStorage.deleteNPC(npcId);
      if (adminTarget === npcId) setAdminTarget('bruno');
      if (selectedNpcId === npcId) setSelectedNpcId('');
      reloadData();
    }
  };

  // Datos de los dos equipos de la Arena
  const partnerTeam = pokemonStorage.getTrainerPokemon(partnerKey, partnerDisplayName);

  let currentTeam1: PokemonInstance[] = team;
  let currentTeam1Name = myDisplayName;

  if (rivalType === 'coop') {
    currentTeam1Name = `${myDisplayName} & ${partnerDisplayName}`;
    currentTeam1 = [team[0], ...(partnerTeam.length > 0 ? [partnerTeam[0]] : [])].filter(Boolean);
  }

  let currentTeam2: PokemonInstance[] = [];
  let currentTeam2Name = '';

  if (rivalType === 'npc') {
    const npc = npcs.find(n => n.id === selectedNpcId) || npcs[0];
    currentTeam2Name = npc ? `${npc.name} (${npc.title})` : 'Jefe de Alola';
    currentTeam2 = npc ? npc.team : [];
  } else if (rivalType === 'coop') {
    const totem = npcs.find(n => n.isTotemBoss) || npcs[0];
    currentTeam2Name = totem ? totem.name : 'Jefe Dominante';
    currentTeam2 = totem ? totem.team : [];
  } else {
    currentTeam2Name = partnerDisplayName;
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
        isTotemBoss: (rivalType === 'coop') || npcs.find(n => n.id === selectedNpcId)?.isTotemBoss
      };

      const result = simulateNarrativeBattle(team1Data, team2Data, strategy);
      setBattleResult(result);
      setIsFighting(false);

      const team1Won = result.winnerTeam === 'team1';
      const isRival = rivalType === 'rival_human';

      // Actualizar estados emocionales de Team 1
      const updatedTeam1 = applyPostBattleEmotions(
        team, 
        team1Won, 
        isRival, 
        currentTeam1.map(p => p.id)
      );
      pokemonStorage.saveTrainerPokemon(currentKey, updatedTeam1);
      setTeam(updatedTeam1);

      // Si fue contra la pareja, actualizar también en el storage
      if (isRival) {
        const updatedPartnerTeam = applyPostBattleEmotions(
          partnerTeam,
          !team1Won,
          true,
          currentTeam2.map(p => p.id)
        );
        pokemonStorage.saveTrainerPokemon(partnerKey, updatedPartnerTeam);
      }

      reloadData();

      if (result.winnerNames.includes(myDisplayName)) {
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
    : 5;

  // Lógica del Modo Master / Admin
  const getAdminTeam = () => {
    if (adminTarget === 'bruno') return pokemonStorage.getTrainerPokemon('bruno', 'Bruno');
    if (adminTarget === 'lorena') return pokemonStorage.getTrainerPokemon('lorena', 'Loreeena');
    const npc = npcs.find(n => n.id === adminTarget);
    return npc ? npc.team : [];
  };

  const handleAdminSavePk = () => {
    if (!editingPk) return;
    if (adminTarget === 'bruno' || adminTarget === 'lorena') {
      pokemonStorage.updatePokemon(adminTarget, editingPk);
    } else {
      const npc = npcs.find(n => n.id === adminTarget);
      if (npc) {
        const updatedTeam = npc.team.map(p => p.id === editingPk.id ? editingPk : p);
        pokemonStorage.updateNPCPokemon(adminTarget, updatedTeam);
      }
    }
    reloadData();
    setEditingPk(null);
  };

  const handleAdminDeletePk = (pkId: string) => {
    if (adminTarget === 'bruno' || adminTarget === 'lorena') {
      pokemonStorage.deletePokemon(adminTarget, pkId);
    } else {
      const npc = npcs.find(n => n.id === adminTarget);
      if (npc) {
        const updatedTeam = npc.team.filter(p => p.id !== pkId);
        pokemonStorage.updateNPCPokemon(adminTarget, updatedTeam);
      }
    }
    reloadData();
    if (editingPk?.id === pkId) setEditingPk(null);
  };

  const handleAdminAddPk = () => {
    const pokedex = getFullAlolaPokedex();
    const entry = pokedex.find(p => p.id === Number(newPkDexId)) || pokedex[0];
    const targetName = adminTarget === 'bruno' ? 'Bruno' : adminTarget === 'lorena' ? 'Loreeena' : 'NPC';
    const newPk = createPokemonInstance(entry, Number(newPkLevel), adminTarget, targetName, false, false);

    if (adminTarget === 'bruno' || adminTarget === 'lorena') {
      pokemonStorage.addPokemonToTrainer(adminTarget, newPk);
    } else {
      const npc = npcs.find(n => n.id === adminTarget);
      if (npc) {
        pokemonStorage.updateNPCPokemon(adminTarget, [...npc.team, newPk]);
      }
    }
    reloadData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-5xl bg-genshin-card/95 border border-genshin-gold/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Cabecera del Modal */}
        <div className="px-5 py-3.5 bg-genshin-dark border-b border-genshin-gold/30 flex items-center justify-between">
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
                Entrenador/a: <span className="font-semibold text-amber-200">{myDisplayName}</span> • Nivel Medio: <span className="font-bold text-amber-300">Nv.{avgTeamLevel}</span>
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
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-t-xl transition-all ${
              activeTab === 'team'
                ? 'bg-genshin-card text-amber-200 border-t-2 border-amber-400 font-bold shadow-md'
                : 'text-amber-300/60 hover:text-amber-200 hover:bg-white/5'
            }`}
          >
            <Heart className="w-4 h-4 text-pink-400" />
            Mi Equipo ({team.length})
          </button>

          <button
            onClick={() => setActiveTab('wild')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-t-xl transition-all ${
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
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-t-xl transition-all ${
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
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-t-xl transition-all ${
              activeTab === 'trainers'
                ? 'bg-genshin-card text-amber-200 border-t-2 border-amber-400 font-bold shadow-md'
                : 'text-amber-300/60 hover:text-amber-200 hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4 text-cyan-400" />
            Personajes ({placeholderTrainers.length + npcs.length})
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-t-xl transition-all ml-auto ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-amber-600/30 to-yellow-600/30 text-amber-300 border-t-2 border-yellow-400 font-bold shadow-md'
                : 'text-amber-400/60 hover:text-amber-300 hover:bg-white/5'
            }`}
          >
            <Crown className="w-4 h-4 text-yellow-400" />
            Modo Master
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

                        <button
                          onClick={handleTogglePlotArmor}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 self-center sm:self-auto ${
                            selectedPk.hasPlotArmor
                              ? 'bg-pink-500/20 border-pink-400/80 text-pink-200 shadow-md'
                              : 'bg-white/5 border-white/20 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Shield className="w-3.5 h-3.5" />
                          Plot Armor: {selectedPk.hasPlotArmor ? 'ACTIVADO' : 'DESACTIVADO'}
                        </button>
                      </div>

                      <p className="text-xs text-amber-200/90 font-medium">
                        Personalidad: <span className="text-amber-300 italic">{selectedPk.personality}</span>
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

                  {/* 6 MEDIDORES PSICOLÓGICOS */}
                  <div className="space-y-3 bg-black/30 p-4 rounded-2xl border border-white/5">
                    <h5 className="text-xs uppercase font-semibold text-amber-300/80 tracking-wider">
                      Estado Emocional y Psicológico (Impacto en Combate)
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-pink-300 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5 fill-pink-400" /> Amor (Plot Armor)
                          </span>
                          <span>{selectedPk.affection.love}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-pink-500 transition-all duration-500" style={{ width: `${selectedPk.affection.love}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-blue-300 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-blue-400" /> Respeto (+Defensa)
                          </span>
                          <span>{selectedPk.affection.respect}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${selectedPk.affection.respect}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-orange-300 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-orange-400" /> Ira / Frustración (+Ataque)
                          </span>
                          <span>{selectedPk.affection.anger}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${selectedPk.affection.anger}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-purple-300 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Wind className="w-3.5 h-3.5 text-purple-400" /> Desesperación (+Vel, -Def)
                          </span>
                          <span>{selectedPk.affection.despair}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${selectedPk.affection.despair}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-300 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Frown className="w-3.5 h-3.5 text-slate-400" /> Desidia (Desobediencia)
                          </span>
                          <span>{selectedPk.affection.apathy}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-400 transition-all duration-500" style={{ width: `${selectedPk.affection.apathy}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-yellow-300 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Smile className="w-3.5 h-3.5 text-yellow-400" /> Motivación (Impredecible)
                          </span>
                          <span>{selectedPk.affection.motivation}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 transition-all duration-500" style={{ width: `${selectedPk.affection.motivation}%` }} />
                        </div>
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
                      <span className="text-[10px] text-pink-300/60">+Cariño, -Ira/Desidia</span>
                    </button>

                    <button
                      onClick={handleTrain}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-200 transition-all active:scale-95"
                    >
                      <Zap className="w-5 h-5 mb-1 text-cyan-400" />
                      <span className="text-xs font-bold">Entrenar</span>
                      <span className="text-[10px] text-cyan-300/60">+Nivel, +Motivación</span>
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
                  Exploración calibrada al nivel medio de tu equipo (<span className="text-amber-300 font-bold">Nv.{avgTeamLevel}</span>). Las criaturas evolucionadas solo aparecerán cuando alcances el nivel adecuado.
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-black/40 p-4 rounded-3xl border border-white/10">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-amber-300/80">Modo de Combate:</label>
                  <select
                    value={rivalType}
                    onChange={(e: any) => setRivalType(e.target.value)}
                    className="w-full bg-black/60 border border-amber-400/40 rounded-xl px-3 py-2 text-xs text-amber-100 focus:outline-none"
                  >
                    <option value="rival_human">⚔️ Vs {partnerDisplayName}</option>
                    <option value="npc">🏛️ Vs Personajes & Jefes de Alola</option>
                    <option value="coop">🤝 Cooperativo ({myDisplayName} & {partnerDisplayName} vs Jefe Totem)</option>
                  </select>
                </div>

                {rivalType === 'npc' && (
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
                  <label className="text-xs font-semibold text-amber-300/80">Estrategia de Despliegue:</label>
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

              {/* CARA A CARA DE EQUIPOS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            {p.isTotem ? (
                              <span className="text-amber-400 font-bold">✨ Aura Dominante</span>
                            ) : p.hasPlotArmor ? (
                              <span className="text-pink-300 font-semibold">🛡️ Plot Armor</span>
                            ) : null}
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
                  {isFighting ? 'Simulando combate épico en 3 tiempos...' : '¡Comenzar Combate Narrativo!'}
                </button>
              </div>

              {/* Crónica resultante con diseño cinemático */}
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

                  {/* Visualización en 3 Tiempos con Carisma */}
                  <div className="space-y-3 font-serif max-h-[460px] overflow-y-auto pr-2">
                    {battleResult.chronicleLines.map((line, idx) => {
                      if (line.includes('▶ [ATAQUE]:')) {
                        const parts = line.split('\n');
                        return (
                          <div key={idx} className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2 shadow-inner">
                            {parts.map((p, pIdx) => {
                              if (p.startsWith('▶ [ATAQUE]:')) {
                                return (
                                  <p key={pIdx} className="text-amber-300 font-semibold text-xs sm:text-sm flex items-start gap-1.5">
                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[10px] text-amber-400 font-mono uppercase tracking-wider">Ataque</span>
                                    <span>{p.replace('▶ [ATAQUE]: ', '')}</span>
                                  </p>
                                );
                              }
                              if (p.startsWith('▶ [REACCIÓN]:')) {
                                return (
                                  <p key={pIdx} className="text-cyan-300 font-medium text-xs sm:text-sm flex items-start gap-1.5 pl-2">
                                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-[10px] text-cyan-400 font-mono uppercase tracking-wider">Reacción</span>
                                    <span>{p.replace('▶ [REACCIÓN]: ', '')}</span>
                                  </p>
                                );
                              }
                              if (p.startsWith('▶ [IMPACTO]:')) {
                                return (
                                  <p key={pIdx} className="text-rose-200 text-xs sm:text-sm flex items-start gap-1.5 pl-4 italic">
                                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-[10px] text-rose-300 font-mono uppercase tracking-wider">Resultado</span>
                                    <span>{p.replace('▶ [IMPACTO]: ', '')}</span>
                                  </p>
                                );
                              }
                              return <p key={pIdx} className="text-xs sm:text-sm text-amber-100">{p}</p>;
                            })}
                          </div>
                        );
                      }

                      if (line.startsWith('«') || line.includes('«')) {
                        return (
                          <div key={idx} className="p-3 rounded-2xl bg-amber-500/10 border-l-4 border-amber-400 text-xs sm:text-sm text-amber-200 italic my-1 font-sans">
                            🗣️ {line}
                          </div>
                        );
                      }

                      return (
                        <p key={idx} className={line.startsWith('⚡') || line.startsWith('🏁') || line.startsWith('💥') ? 'font-bold text-amber-300 text-sm sm:text-base pt-1' : 'text-xs sm:text-sm text-amber-100/90 leading-relaxed'}>
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= PESTAÑA 4: PERSONAJES (BRUNO, LOREEENA, MIU IRUMA & CREADOR) ================= */}
          {activeTab === 'trainers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <h3 className="text-lg font-serif font-bold text-amber-100">
                    Entrenadores y Personajes de Alola
                  </h3>
                  <p className="text-xs text-amber-200/70">
                    Cuentas vinculadas y personajes personalizados. Puedes preparar nuevos NPCs libremente.
                  </p>
                </div>

                <button
                  onClick={() => setIsCreatingNPC(!isCreatingNPC)}
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  {isCreatingNPC ? 'Cerrar Formulario' : '➕ Crear Nuevo Personaje / NPC'}
                </button>
              </div>

              {/* FORMULARIO CREADOR DE PERSONAJES (COMO MIU IRUMA) */}
              {isCreatingNPC && (
                <div className="bg-black/50 border border-cyan-400/40 rounded-3xl p-5 sm:p-6 space-y-4 animate-fadeIn shadow-2xl">
                  <h4 className="font-serif font-bold text-cyan-200 text-base flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-cyan-400" />
                    Creador Manual de Personaje de Alola
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="text-cyan-300 font-semibold block mb-1">Nombre del Personaje:</label>
                      <input
                        type="text"
                        placeholder="Ej: Kokichi Oma, Gladio, Kukui..."
                        value={newNPCName}
                        onChange={(e) => setNewNPCName(e.target.value)}
                        className="w-full bg-black/60 border border-cyan-400/30 rounded-xl px-3 py-2 text-amber-100"
                      />
                    </div>

                    <div>
                      <label className="text-cyan-300 font-semibold block mb-1">Título / Rol:</label>
                      <input
                        type="text"
                        placeholder="Ej: Líder Supremo, Rival Sombrío..."
                        value={newNPCTitle}
                        onChange={(e) => setNewNPCTitle(e.target.value)}
                        className="w-full bg-black/60 border border-cyan-400/30 rounded-xl px-3 py-2 text-amber-100"
                      />
                    </div>

                    <div>
                      <label className="text-cyan-300 font-semibold block mb-1">URL de Foto / Avatar:</label>
                      <input
                        type="text"
                        placeholder="https://... o deja vacío para foto por defecto"
                        value={newNPCAvatar}
                        onChange={(e) => setNewNPCAvatar(e.target.value)}
                        className="w-full bg-black/60 border border-cyan-400/30 rounded-xl px-3 py-2 text-amber-100"
                      />
                    </div>
                  </div>

                  {/* Primer Pokémon del personaje */}
                  <div className="border-t border-white/10 pt-3 space-y-3">
                    <h5 className="text-xs font-bold text-amber-300 uppercase">
                      Compañero Pokémon Inicial de este Personaje:
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-amber-200/80 block mb-1">Especie de Alola (303):</label>
                        <select
                          value={newNPCPkDexId}
                          onChange={(e) => setNewNPCPkDexId(Number(e.target.value))}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-2 py-1.5 text-amber-100"
                        >
                          {getFullAlolaPokedex().map(p => (
                            <option key={p.id} value={p.id}>
                              #{p.id} {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-amber-200/80 block mb-1">Nivel Inicial:</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={newNPCPkLevel}
                          onChange={(e) => setNewNPCPkLevel(Number(e.target.value))}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-amber-100 font-mono text-center"
                        />
                      </div>

                      <div>
                        <label className="text-amber-200/80 block mb-1">Apodo (Opcional):</label>
                        <input
                          type="text"
                          placeholder="Nombre cariñoso..."
                          value={newNPCPkNickname}
                          onChange={(e) => setNewNPCPkNickname(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-amber-100"
                        />
                      </div>

                      <div>
                        <label className="text-amber-200/80 block mb-1">Personalidad Afín:</label>
                        <select
                          value={newNPCPkPersonality}
                          onChange={(e) => setNewNPCPkPersonality(e.target.value as PersonalityType)}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-2 py-1.5 text-amber-100"
                        >
                          {PERSONALITY_OPTIONS.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setIsCreatingNPC(false)}
                      className="px-4 py-2 rounded-xl bg-white/10 text-amber-200 text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreateNPC}
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg transition-all active:scale-95"
                    >
                      ✨ Guardar y Crear Personaje
                    </button>
                  </div>
                </div>
              )}

              {/* LISTADO DE PERSONAJES: JUGADORES + NPCS (MIU Y CREADOS) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bruno y Loreeena */}
                {placeholderTrainers.map(trainer => (
                  <div key={trainer.id} className="bg-black/40 border border-amber-400/30 rounded-3xl p-5 space-y-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={trainer.avatarUrl}
                        alt={trainer.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/40 shadow-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-serif font-bold text-amber-100">
                            {trainer.name}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Inicial Nv.5
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

                      <div className="grid grid-cols-1 gap-2">
                        {trainer.team.map(pk => (
                          <div key={pk.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                            <img
                              src={getAnimatedSpriteUrl(pk.spriteKey)}
                              alt={pk.name}
                              className="w-10 h-10 object-contain"
                            />
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-amber-100 truncate">{pk.nickname} ({pk.name})</p>
                                <span className="text-[10px] font-mono text-amber-300 font-bold">Nv.{pk.level}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-amber-200/70 mt-0.5">
                                <span>PS: {pk.maxHp}</span>
                                <span>•</span>
                                <span>{pk.types.join(' / ')}</span>
                                {pk.hasPlotArmor && (
                                  <span className="text-pink-300 font-semibold">🛡️ Plot Armor</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* NPCs (Miu Iruma + Creados manualmente + Jefes) */}
                {npcs.map(npc => (
                  <div key={npc.id} className="bg-black/40 border border-cyan-400/30 rounded-3xl p-5 space-y-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={npc.avatarUrl}
                        alt={npc.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400/40 shadow-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-serif font-bold text-cyan-200">
                            {npc.name}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              NPC
                            </span>
                            <button
                              onClick={() => handleDeleteNPC(npc.id, npc.name)}
                              title={`Eliminar personaje ${npc.name}`}
                              className="px-2.5 py-1 text-xs text-red-300 hover:text-white bg-red-950/50 hover:bg-red-800/80 border border-red-500/40 rounded-lg transition-all flex items-center gap-1 shadow-sm active:scale-95"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-amber-300/80 font-medium">
                          {npc.title}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-3 space-y-2">
                      <span className="text-xs font-semibold text-amber-300/80">Equipo de {npc.name}:</span>
                      <div className="grid grid-cols-1 gap-2">
                        {npc.team.map(pk => (
                          <div key={pk.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-cyan-500/20">
                            <img
                              src={getAnimatedSpriteUrl(pk.spriteKey)}
                              alt={pk.name}
                              className="w-10 h-10 object-contain"
                            />
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-cyan-200 truncate">{pk.nickname} ({pk.name})</p>
                                <span className="text-[10px] font-mono text-amber-300 font-bold">Nv.{pk.level}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-amber-200/70 mt-0.5">
                                <span>PS: {pk.maxHp}</span>
                                <span>•</span>
                                <span>{pk.types.join(' / ')}</span>
                                {pk.hasPlotArmor && (
                                  <span className="text-pink-300 font-semibold">🛡️ Plot Armor</span>
                                )}
                              </div>
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

          {/* ================= PESTAÑA 5: MODO MASTER / ADMIN ================= */}
          {activeTab === 'admin' && (
            <div className="space-y-6">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-serif font-bold text-amber-100 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-400" />
                    Panel de Control Maestro (Rol & DM)
                  </h3>
                  <p className="text-xs text-amber-200/70">
                    Modifica manualmente los niveles, emociones, personalidades o elimina/añade Pokémon de cualquier personaje.
                  </p>
                </div>
              </div>

              {/* Selector de Personaje a Administrar */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-amber-300/80">Gestionar a:</span>
                <button
                  onClick={() => { setAdminTarget('bruno'); setEditingPk(null); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    adminTarget === 'bruno' ? 'bg-amber-500 text-black shadow-md' : 'bg-white/10 text-amber-200 hover:bg-white/20'
                  }`}
                >
                  Bruno
                </button>
                <button
                  onClick={() => { setAdminTarget('lorena'); setEditingPk(null); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    adminTarget === 'lorena' ? 'bg-amber-500 text-black shadow-md' : 'bg-white/10 text-amber-200 hover:bg-white/20'
                  }`}
                >
                  Loreeena
                </button>
                {npcs.map(npc => (
                  <button
                    key={npc.id}
                    onClick={() => { setAdminTarget(npc.id); setEditingPk(null); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      adminTarget === npc.id ? 'bg-amber-500 text-black shadow-md' : 'bg-white/10 text-amber-200 hover:bg-white/20'
                    }`}
                  >
                    {npc.name}
                  </button>
                ))}
              </div>

              {/* Lista de Pokémon del objetivo seleccionado */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-amber-300/80 uppercase">
                      Equipo de {adminTarget === 'bruno' ? 'Bruno' : adminTarget === 'lorena' ? 'Loreeena' : npcs.find(n => n.id === adminTarget)?.name || adminTarget} ({getAdminTeam().length})
                    </h4>
                    {adminTarget !== 'bruno' && adminTarget !== 'lorena' && (
                      <button
                        onClick={() => {
                          const targetNpc = npcs.find(n => n.id === adminTarget);
                          if (targetNpc) handleDeleteNPC(targetNpc.id, targetNpc.name);
                        }}
                        className="px-2 py-0.5 text-[11px] text-red-300 hover:text-white bg-red-950/60 hover:bg-red-800/80 border border-red-500/40 rounded-lg transition-all flex items-center gap-1 shadow-sm active:scale-95"
                        title="Eliminar este personaje y su equipo"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                        <span>Eliminar Personaje</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {getAdminTeam().map(pk => (
                      <div
                        key={pk.id}
                        onClick={() => setEditingPk(pk)}
                        className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border ${
                          editingPk?.id === pk.id ? 'bg-yellow-500/20 border-yellow-400' : 'bg-black/30 border-white/5 hover:bg-white/5'
                        }`}
                      >
                        <img src={getAnimatedSpriteUrl(pk.spriteKey)} alt={pk.name} className="w-10 h-10 object-contain" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-amber-100 truncate">{pk.nickname} ({pk.name})</p>
                          <p className="text-[10px] text-amber-300/70 font-mono">Nv.{pk.level} • {pk.personality}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAdminDeletePk(pk.id); }}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Eliminar Pokémon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Formulario Añadir Pokémon Nuevo */}
                  <div className="border-t border-white/10 pt-4 space-y-2">
                    <h5 className="text-xs font-bold text-amber-200 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Añadir Criatura de Alola:
                    </h5>
                    <div className="flex gap-2">
                      <select
                        value={newPkDexId}
                        onChange={(e) => setNewPkDexId(Number(e.target.value))}
                        className="flex-1 bg-black/60 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-amber-100"
                      >
                        {getFullAlolaPokedex().map(p => (
                          <option key={p.id} value={p.id}>
                            #{p.id} {p.name} ({p.types.join('/')})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={newPkLevel}
                        onChange={(e) => setNewPkLevel(Number(e.target.value))}
                        className="w-16 bg-black/60 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-amber-100 text-center font-mono"
                        title="Nivel inicial"
                      />
                      <button
                        onClick={handleAdminAddPk}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>
                </div>

                {/* Panel Editor de Ficha del Pokémon */}
                {editingPk ? (
                  <div className="md:col-span-7 bg-black/40 border border-yellow-400/40 rounded-3xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <h4 className="font-serif font-bold text-amber-100 text-sm flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-yellow-400" />
                        Editando: {editingPk.name}
                      </h4>
                      <button
                        onClick={handleAdminSavePk}
                        className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
                      >
                        💾 Guardar Ficha
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-amber-300/80 font-semibold block mb-1">Apodo:</label>
                        <input
                          type="text"
                          value={editingPk.nickname}
                          onChange={(e) => setEditingPk({ ...editingPk, nickname: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-amber-100"
                        />
                      </div>

                      <div>
                        <label className="text-amber-300/80 font-semibold block mb-1">Nivel:</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={editingPk.level}
                          onChange={(e) => {
                            const lvl = Number(e.target.value);
                            setEditingPk({
                              ...editingPk,
                              level: lvl,
                              maxHp: 20 + lvl * 3,
                              currentHp: 20 + lvl * 3,
                              attack: 15 + Math.round(lvl * 1.5),
                              defense: 12 + Math.round(lvl * 1.3),
                              speed: 14 + Math.round(lvl * 1.2)
                            });
                          }}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-amber-100 font-mono text-center"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-amber-300/80 font-semibold block mb-1">Personalidad Afín:</label>
                      <select
                        value={editingPk.personality}
                        onChange={(e) => setEditingPk({ ...editingPk, personality: e.target.value })}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-amber-100"
                      >
                        {PERSONALITY_OPTIONS.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-xs text-pink-300 font-semibold">Plot Armor (Segundo Aire / Inmunidad):</span>
                      <button
                        onClick={() => setEditingPk({ ...editingPk, hasPlotArmor: !editingPk.hasPlotArmor })}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          editingPk.hasPlotArmor ? 'bg-pink-500 text-white' : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {editingPk.hasPlotArmor ? 'ACTIVO' : 'INACTIVO'}
                      </button>
                    </div>

                    {/* Deslizadores Emocionales */}
                    <div className="space-y-3 border-t border-white/10 pt-3">
                      <span className="text-xs font-bold text-amber-300 uppercase">Calibrador Emocional (0 - 100):</span>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-pink-300">
                          <span>Amor:</span>
                          <span className="font-mono">{editingPk.affection.love}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={editingPk.affection.love}
                          onChange={(e) => setEditingPk({ ...editingPk, affection: { ...editingPk.affection, love: Number(e.target.value) } })}
                          className="w-full accent-pink-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-blue-300">
                          <span>Respeto (+Defensa):</span>
                          <span className="font-mono">{editingPk.affection.respect}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={editingPk.affection.respect}
                          onChange={(e) => setEditingPk({ ...editingPk, affection: { ...editingPk.affection, respect: Number(e.target.value) } })}
                          className="w-full accent-blue-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-orange-300">
                          <span>Ira / Frustración (+Ataque):</span>
                          <span className="font-mono">{editingPk.affection.anger}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={editingPk.affection.anger}
                          onChange={(e) => setEditingPk({ ...editingPk, affection: { ...editingPk.affection, anger: Number(e.target.value) } })}
                          className="w-full accent-orange-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-purple-300">
                          <span>Desesperación (+Vel, -Def):</span>
                          <span className="font-mono">{editingPk.affection.despair}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={editingPk.affection.despair}
                          onChange={(e) => setEditingPk({ ...editingPk, affection: { ...editingPk.affection, despair: Number(e.target.value) } })}
                          className="w-full accent-purple-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-300">
                          <span>Desidia (Desobediencia):</span>
                          <span className="font-mono">{editingPk.affection.apathy}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={editingPk.affection.apathy}
                          onChange={(e) => setEditingPk({ ...editingPk, affection: { ...editingPk.affection, apathy: Number(e.target.value) } })}
                          className="w-full accent-slate-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-yellow-300">
                          <span>Motivación (Impredecible):</span>
                          <span className="font-mono">{editingPk.affection.motivation}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={editingPk.affection.motivation}
                          onChange={(e) => setEditingPk({ ...editingPk, affection: { ...editingPk.affection, motivation: Number(e.target.value) } })}
                          className="w-full accent-yellow-400"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="md:col-span-7 flex items-center justify-center text-amber-300/50 p-12 text-xs italic">
                    Selecciona un Pokémon de la lista izquierda para editar sus atributos o emociones.
                  </div>
                )}
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
