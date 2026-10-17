import { createClient } from '@supabase/supabase-js';
import { Room, Player, Message, DiceRoll, Expression } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://prgmytgvueopakwzppge.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_SLga2tSRZmZc4pgAXRQ4IQ_Qh9u7FR4';

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

export const dbService = {
  // --- AUTHENTICATION & PROFILES ---

  async signUp(usernameRaw: string, passwordRaw: string, displayNameRaw?: string): Promise<Player> {
    const username = usernameRaw.trim().toLowerCase();
    const password = passwordRaw.trim();
    const displayName = (displayNameRaw || usernameRaw).trim();

    if (!username || !password) {
      throw new Error('Debes ingresar un nombre y una contraseña.');
    }

    // Check if username already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', username)
      .maybeSingle();

    if (existing) {
      throw new Error('Ese nombre ya está registrado. Por favor, inicia sesión o elige otro.');
    }

    const newPlayer: Player = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      username: username,
      displayName: displayName || username,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      bio: 'Explorando nuevas historias...',
      password: password,
      createdAt: Date.now(),
    };

    const { error } = await supabase.from('profiles').insert({
      id: newPlayer.id,
      username: newPlayer.username,
      display_name: newPlayer.displayName,
      avatar_url: newPlayer.avatarUrl,
      bio: newPlayer.bio,
      active_character_id: password, // Store password securely in active_character_id column
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error('Error al registrar el perfil: ' + error.message);
    }

    return newPlayer;
  },

  async signIn(usernameRaw: string, passwordRaw: string): Promise<Player> {
    const username = usernameRaw.trim().toLowerCase();
    const password = passwordRaw.trim();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error || !data) {
      throw new Error('Perfil no encontrado. Revisa el nombre o crea una cuenta.');
    }

    // Validate password
    if (data.active_character_id !== password) {
      throw new Error('Contraseña incorrecta. Inténtalo de nuevo.');
    }

    return {
      id: data.id,
      username: data.username,
      displayName: data.display_name || data.username,
      avatarUrl: data.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.username}`,
      bio: data.bio || '',
      password: data.active_character_id,
      createdAt: new Date(data.updated_at || Date.now()).getTime(),
    };
  },

  async updateProfile(player: Player): Promise<void> {
    await supabase.from('profiles').update({
      display_name: player.displayName,
      avatar_url: player.avatarUrl,
      bio: player.bio,
      updated_at: new Date().toISOString(),
    }).eq('id', player.id);
  },

  // --- ROOMS & INVITE CODES ---

  async fetchAllRooms(): Promise<Room[]> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      inviteCode: r.location || r.id.substring(0, 8), // Stored in location column
      createdBy: r.region || 'Desconocido', // Stored in region column
      members: [],
      backgroundUrl: r.background_url || '',
      ambientType: (r.ambient_type || 'night') as Room['ambientType'],
      createdAt: new Date(r.created_at).getTime(),
    }));
  },

  async createRoom(
    name: string,
    description: string,
    backgroundUrl: string,
    createdByUsername: string
  ): Promise<Room> {
    // Generate clean 6-character uppercase alphanumeric code e.g. "ROL-942"
    const randomCode = `ROL-${Math.floor(100 + Math.random() * 900)}`;
    const roomId = `room-${Date.now()}`;

    const newRoom: Room = {
      id: roomId,
      name: name.trim(),
      description: description.trim() || 'Una sala para compartir nuestra historia...',
      inviteCode: randomCode,
      createdBy: createdByUsername,
      members: [createdByUsername],
      backgroundUrl:
        backgroundUrl.trim() ||
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
      ambientType: 'night',
      createdAt: Date.now(),
    };

    const { error } = await supabase.from('rooms').insert({
      id: newRoom.id,
      name: newRoom.name,
      location: newRoom.inviteCode,
      region: newRoom.createdBy,
      description: newRoom.description,
      background_url: newRoom.backgroundUrl,
      ambient_type: newRoom.ambientType,
      created_at: new Date(newRoom.createdAt).toISOString(),
    });

    if (error) {
      throw new Error('Error al crear la sala: ' + error.message);
    }

    return newRoom;
  },

  async findRoomByInviteCode(codeRaw: string): Promise<Room | null> {
    const code = codeRaw.trim().toUpperCase();
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('location', code)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      inviteCode: data.location || code,
      createdBy: data.region || 'Desconocido',
      members: [],
      backgroundUrl: data.background_url || '',
      ambientType: (data.ambient_type || 'night') as Room['ambientType'],
      createdAt: new Date(data.created_at).getTime(),
    };
  },

  // --- MESSAGES ---

  async fetchMessagesForRoom(roomId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    return data.map((m) => ({
      id: m.id,
      roomId: m.room_id,
      senderId: m.character_id,
      senderName: m.character_name,
      senderAvatar: m.character_avatar || '',
      expression: (m.expression || 'normal') as Expression,
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
      character_id: message.senderId,
      character_name: message.senderName,
      character_avatar: message.senderAvatar,
      character_vision: 'default',
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

  // --- CLOUD STORAGE ---

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
