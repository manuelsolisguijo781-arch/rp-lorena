import { PokemonInstance, NPCProfile } from '../types/pokemon';
import { ALOLA_POKEDEX } from './alolaPokedex';
import { createPokemonInstance } from '../utils/pokemonEngine';

const STORAGE_KEY_TRAINERS = 'rp_alola_trainers_v2';
const STORAGE_KEY_NPCS = 'rp_alola_npcs_v2';

// Equipos iniciales por defecto para que al abrir la app todo esté listo
const getInitialPokemonForTrainer = (ownerId: string, ownerName: string): PokemonInstance[] => {
  if (ownerId === 'bruno' || ownerName.toLowerCase().includes('bruno')) {
    const rowletEntry = ALOLA_POKEDEX.find(p => p.name === 'Rowlet') || ALOLA_POKEDEX[0];
    const pikaEntry = ALOLA_POKEDEX.find(p => p.name === 'Pikachu') || ALOLA_POKEDEX[1];
    return [
      createPokemonInstance(rowletEntry, 14, 'bruno', 'Bruno', true, false, 'Rowlet'),
      createPokemonInstance(pikaEntry, 15, 'bruno', 'Bruno', true, false, 'Pikachu')
    ];
  } else {
    const littenEntry = ALOLA_POKEDEX.find(p => p.name === 'Litten') || ALOLA_POKEDEX[3];
    const vulpixEntry = ALOLA_POKEDEX.find(p => p.name === 'Vulpix de Alola') || ALOLA_POKEDEX[7];
    return [
      createPokemonInstance(littenEntry, 14, 'lorena', 'Lorena', true, false, 'Litten'),
      createPokemonInstance(vulpixEntry, 15, 'lorena', 'Lorena', true, false, 'Vulpix Nieve')
    ];
  }
};

const getInitialNPCs = (): NPCProfile[] => {
  const gumshoos = ALOLA_POKEDEX.find(p => p.name === 'Gumshoos') || ALOLA_POKEDEX[13];
  const lurantis = ALOLA_POKEDEX.find(p => p.name === 'Lurantis') || ALOLA_POKEDEX[30];
  const kommoo = ALOLA_POKEDEX.find(p => p.name === 'Kommo-o') || ALOLA_POKEDEX[40];

  return [
    {
      id: 'totem_gumshoos',
      name: 'Gumshoos Dominante',
      title: 'Pokémon Dominante de la Cueva Sotobosque',
      avatarUrl: 'https://play.pokemonshowdown.com/sprites/ani/gumshoos.gif',
      isTotemBoss: true,
      team: [createPokemonInstance(gumshoos, 18, 'totem_gumshoos', 'Totem Gumshoos', false, true, 'Gumshoos Dominante')]
    },
    {
      id: 'totem_lurantis',
      name: 'Lurantis Dominante',
      title: 'Pokémon Dominante de la Jungla Umbría',
      avatarUrl: 'https://play.pokemonshowdown.com/sprites/ani/lurantis.gif',
      isTotemBoss: true,
      team: [createPokemonInstance(lurantis, 24, 'totem_lurantis', 'Totem Lurantis', false, true, 'Lurantis Dominante')]
    },
    {
      id: 'kahuna_kaudan',
      name: 'Kahuna Kaudan',
      title: 'Líder Kahuna de la Isla Melemele',
      avatarUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/hala.png',
      isTotemBoss: false,
      team: [
        createPokemonInstance(ALOLA_POKEDEX.find(p => p.name === 'Hariyama') || ALOLA_POKEDEX[24], 20, 'kaudan', 'Kaudan', false, false),
        createPokemonInstance(ALOLA_POKEDEX.find(p => p.name === 'Crabrawler') || ALOLA_POKEDEX[22], 19, 'kaudan', 'Kaudan', false, false)
      ]
    }
  ];
};

export const pokemonStorage = {
  getTrainerPokemon: (ownerId: string, ownerName: string): PokemonInstance[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TRAINERS);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed[ownerId] && parsed[ownerId].length > 0) {
          return parsed[ownerId];
        }
      }
    } catch (e) {
      console.error('Error reading trainer pokemon', e);
    }
    const initial = getInitialPokemonForTrainer(ownerId, ownerName);
    pokemonStorage.saveTrainerPokemon(ownerId, initial);
    return initial;
  },

  saveTrainerPokemon: (ownerId: string, team: PokemonInstance[]) => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TRAINERS);
      const parsed = data ? JSON.parse(data) : {};
      parsed[ownerId] = team;
      localStorage.setItem(STORAGE_KEY_TRAINERS, JSON.stringify(parsed));
    } catch (e) {
      console.error('Error saving trainer pokemon', e);
    }
  },

  addPokemonToTrainer: (ownerId: string, pokemon: PokemonInstance) => {
    const team = pokemonStorage.getTrainerPokemon(ownerId, pokemon.ownerName);
    team.push(pokemon);
    pokemonStorage.saveTrainerPokemon(ownerId, team);
  },

  updatePokemon: (ownerId: string, updated: PokemonInstance) => {
    const team = pokemonStorage.getTrainerPokemon(ownerId, updated.ownerName);
    const index = team.findIndex(p => p.id === updated.id);
    if (index !== -1) {
      team[index] = updated;
      pokemonStorage.saveTrainerPokemon(ownerId, team);
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
  }
};
