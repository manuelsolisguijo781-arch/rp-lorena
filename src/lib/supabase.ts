import { createClient } from '@supabase/supabase-js';
import { Room, Character, Message, DiceRoll, VisionElement } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export interface PlayerProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  active_character_id: string;
  updated_at?: string;
}

/**
 * DB Row conversions
 */
export const dbService = {
  // --- ROOMS ---
  async fetchRooms(): Promise<Room[]> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) return [];
    return data.map((r) => ({
      id: r.id,
      name: r.name,
      location: r.location || '',
      region: r.region || 'Mondstadt',
      description: r.description || '',
      backgroundUrl: r.background_url || '',
      ambientType: r.ambient_type || 'night',
      createdAt: new Date(r.created_at).getTime(),
    }));
  },

  async insertRoom(room: Room): Promise<void> {
    await supabase.from('rooms').insert({
      id: room.id,
      name: room.name,
      location: room.location,
      region: room.region,
      description: room.description,
      background_url: room.backgroundUrl,
      ambient_type: room.ambientType,
      created_at: new Date(room.createdAt).toISOString(),
    });
  },

  // --- CHARACTERS ---
  async fetchCharacters(): Promise<Character[]> {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) return [];
    return data.map((c) => ({
      id: c.id,
      name: c.name,
      title: c.title || '',
      avatarUrl: c.avatar_url || '',
      vision: (c.vision || 'Pyro') as VisionElement,
      color: c.color || '#e05353',
    }));
  },

  async updateCharacter(character: Character): Promise<void> {
    await supabase.from('characters').upsert({
      id: character.id,
      name: character.name,
      title: character.title,
      avatar_url: character.avatarUrl,
      vision: character.vision,
      color: character.color,
    });
  },

  // --- MESSAGES ---
  async fetchMessages(): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data.map((m) => ({
      id: m.id,
      roomId: m.room_id,
      characterId: m.character_id,
      characterName: m.character_name,
      characterAvatar: m.character_avatar || '',
      characterVision: (m.character_vision || 'Pyro') as VisionElement,
      expression: m.expression || 'normal',
      content: m.content || '',
      parsedBlocks: m.parsed_blocks || [],
      diceRoll: (m.dice_roll as DiceRoll) || undefined,
      imageUrl: m.image_url || undefined,
      timestamp: new Date(m.created_at).getTime(),
    }));
  },

  async insertMessage(message: Message): Promise<void> {
    await supabase.from('messages').insert({
      id: message.id,
      room_id: message.roomId,
      character_id: message.characterId,
      character_name: message.characterName,
      character_avatar: message.characterAvatar,
      character_vision: message.characterVision,
      expression: message.expression,
      content: message.content,
      parsed_blocks: message.parsedBlocks,
      dice_roll: message.diceRoll || null,
      image_url: message.imageUrl || null,
      created_at: new Date(message.timestamp).toISOString(),
    });
  },

  async clearRoomMessages(roomId: string): Promise<void> {
    await supabase.from('messages').delete().eq('room_id', roomId);
  },

  // --- PLAYER PROFILES ---
  async fetchProfiles(): Promise<PlayerProfile[]> {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error || !data) return [];
    return data;
  },

  async upsertProfile(profile: PlayerProfile): Promise<void> {
    await supabase.from('profiles').upsert({
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      active_character_id: profile.active_character_id,
      updated_at: new Date().toISOString(),
    });
  },

  // --- STORAGE (IMAGE UPLOADS) ---
  async uploadImage(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `chat-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('roleplay-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from('roleplay-media')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (e) {
      console.error('Upload exception:', e);
      return null;
    }
  },
};
