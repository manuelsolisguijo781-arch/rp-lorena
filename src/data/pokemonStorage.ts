import { PokemonInstance, NPCProfile, TrainerProfile } from '../types/pokemon';
import { Player } from '../types';
import { ALOLA_POKEDEX } from './alolaPokedex';
import { createPokemonInstance } from '../utils/pokemonEngine';

// Version 4 para reiniciar y vincular limpiamente las cuentas de Bruno y Loreeena con Rowlet y Litten Nv. 5
const STORAGE_KEY_TRAINERS = 'rp_alola_trainers_v4';
const STORAGE_KEY_NPCS = 'rp_alola_npcs_v4';

export const normalizeTrainerKey = (idOrNameOrEmail: string): 'bruno' | 'lorena' => {
  const s = (idOrNameOrEmail || '').toLowerCase();
  if (s.includes('bruno')) return 'bruno';
  return 'lorena'; // Defaults to lorena for manuloelculo07@gmail.com, loreeena, lorena, etc.
};

// Equipos iniciales oficiales pedidos: Bruno (Rowlet Nv.5) y Loreeena (Litten Nv.5)
const getInitialPokemonForTrainer = (ownerId: string, ownerName: string): PokemonInstance[] => {
  const key = normalizeTrainerKey(ownerId || ownerName);

  if (key === 'bruno') {
    const rowletEntry = ALOLA_POKEDEX.find(p => p.name === 'Rowlet') || ALOLA_POKEDEX[0];
    return [
      createPokemonInstance(rowletEntry, 5, 'bruno', 'Bruno', true, false, 'Rowlet', true)
    ];
  } else {
    const littenEntry = ALOLA_POKEDEX.find(p => p.name === 'Litten') || ALOLA_POKEDEX[3];
    return [
      createPokemonInstance(littenEntry, 5, 'lorena', 'Loreeena', true, false, 'Litten', true)
    ];
  }
};

const getInitialNPCs = (): NPCProfile[] => {
  const gumshoos = ALOLA_POKEDEX.find(p => p.name === 'Gumshoos') || ALOLA_POKEDEX[13];
  const lurantis = ALOLA_POKEDEX.find(p => p.name === 'Lurantis') || ALOLA_POKEDEX[30];

  return [
    {
      id: 'totem_gumshoos',
      name: 'Gumshoos Dominante',
      title: 'Pokémon Dominante de la Cueva Sotobosque',
      avatarUrl: 'https://play.pokemonshowdown.com/sprites/ani/gumshoos.gif',
      isTotemBoss: true,
      team: [createPokemonInstance(gumshoos, 12, 'totem_gumshoos', 'Totem Gumshoos', false, true, 'Gumshoos Dominante')]
    },
    {
      id: 'totem_lurantis',
      name: 'Lurantis Dominante',
      title: 'Pokémon Dominante de la Jungla Umbría',
      avatarUrl: 'https://play.pokemonshowdown.com/sprites/ani/lurantis.gif',
      isTotemBoss: true,
      team: [createPokemonInstance(lurantis, 15, 'totem_lurantis', 'Totem Lurantis', false, true, 'Lurantis Dominante')]
    },
    {
      id: 'kahuna_kaudan',
      name: 'Kahuna Kaudan',
      title: 'Líder Kahuna de la Isla Melemele',
      avatarUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/hala.png',
      isTotemBoss: false,
      team: [
        createPokemonInstance(ALOLA_POKEDEX.find(p => p.name === 'Hariyama') || ALOLA_POKEDEX[24], 14, 'kaudan', 'Kaudan', false, false),
        createPokemonInstance(ALOLA_POKEDEX.find(p => p.name === 'Crabrawler') || ALOLA_POKEDEX[22], 12, 'kaudan', 'Kaudan', false, false)
      ]
    }
  ];
};

export const pokemonStorage = {
  getTrainerPokemon: (ownerId: string, ownerName: string): PokemonInstance[] => {
    const key = normalizeTrainerKey(ownerId || ownerName);
    try {
      const data = localStorage.getItem(STORAGE_KEY_TRAINERS);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed[key] && parsed[key].length > 0) {
          return parsed[key];
        }
      }
    } catch (e) {
      console.error('Error reading trainer pokemon', e);
    }
    const initial = getInitialPokemonForTrainer(ownerId, ownerName);
    pokemonStorage.saveTrainerPokemon(key, initial);
    return initial;
  },

  saveTrainerPokemon: (ownerId: string, team: PokemonInstance[]) => {
    const key = normalizeTrainerKey(ownerId);
    try {
      const data = localStorage.getItem(STORAGE_KEY_TRAINERS);
      const parsed = data ? JSON.parse(data) : {};
      parsed[key] = team;
      localStorage.setItem(STORAGE_KEY_TRAINERS, JSON.stringify(parsed));
    } catch (e) {
      console.error('Error saving trainer pokemon', e);
    }
  },

  addPokemonToTrainer: (ownerId: string, pokemon: PokemonInstance) => {
    const key = normalizeTrainerKey(ownerId);
    const team = pokemonStorage.getTrainerPokemon(key, pokemon.ownerName);
    team.push(pokemon);
    pokemonStorage.saveTrainerPokemon(key, team);
  },

  updatePokemon: (ownerId: string, updated: PokemonInstance) => {
    const key = normalizeTrainerKey(ownerId);
    const team = pokemonStorage.getTrainerPokemon(key, updated.ownerName);
    const index = team.findIndex(p => p.id === updated.id);
    if (index !== -1) {
      team[index] = updated;
      pokemonStorage.saveTrainerPokemon(key, team);
    }
  },

  getNPCs: (): NPCProfile[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_NPCS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading NPCs', e);
    }
    const defaults = getInitialNPCs();
    pokemonStorage.saveNPCs(defaults);
    return defaults;
  },

  saveNPCs: (npcs: NPCProfile[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_NPCS, JSON.stringify(npcs));
    } catch (e) {
      console.error('Error saving NPCs', e);
    }
  },

  getTrainerProfiles: (currentPlayer?: Player | null): TrainerProfile[] => {
    const brunoTeam = pokemonStorage.getTrainerPokemon('bruno', 'Bruno');
    const lorenaTeam = pokemonStorage.getTrainerPokemon('lorena', 'Loreeena');

    const isCurrentBruno = currentPlayer && normalizeTrainerKey(currentPlayer.username || currentPlayer.displayName) === 'bruno';

    // Usar los avatares reales de las cuentas en la medida de lo posible
    const brunoAvatar = (isCurrentBruno && currentPlayer?.avatarUrl) 
      ? currentPlayer.avatarUrl 
      : 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80';

    const lorenaAvatar = (!isCurrentBruno && currentPlayer?.avatarUrl)
      ? currentPlayer.avatarUrl
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    return [
      {
        id: 'bruno',
        name: 'Bruno',
        title: 'Entrenador de Alola (@bruno)',
        role: 'jugador',
        avatarUrl: brunoAvatar,
        bio: 'Determinado y aventurero. Ha iniciado su recorrido insular en Alola junto a su compañero inicial Rowlet.',
        team: brunoTeam
      },
      {
        id: 'lorena',
        name: 'Loreeena',
        title: 'Entrenadora de Alola (@manuloelculo07@gmail.com)',
        role: 'jugador',
        avatarUrl: lorenaAvatar,
        bio: 'Estratega innata y protectora. Ha comenzado su viaje por el archipiélago de Alola acompañada de su compañero inicial Litten.',
        team: lorenaTeam
      }
    ];
  }
};
