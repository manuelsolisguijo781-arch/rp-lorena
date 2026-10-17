import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { RoomDrawer } from './components/RoomDrawer';
import { MessageItem } from './components/MessageItem';
import { MessageInput } from './components/MessageInput';
import { DiceModal } from './components/DiceModal';
import { PhotoModal } from './components/PhotoModal';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import { DEFAULT_ROOMS, DEFAULT_CHARACTERS } from './data/initialData';
import { Room, Character, Message, Expression, DiceRoll } from './types';
import { parseMessageContent } from './utils/parser';
import { supabase, dbService, PlayerProfile } from './lib/supabase';
import { Sparkles, MessageSquare, Wifi, Loader2 } from 'lucide-react';

const DEFAULT_PROFILES: PlayerProfile[] = [
  {
    id: 'profile-lorena',
    username: 'lorena',
    display_name: 'Lorena',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'Dama de las Estrellas • Hechicera Cryo',
    active_character_id: 'char-lorena',
  },
  {
    id: 'profile-bruno',
    username: 'bruno',
    display_name: 'Bruno',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Caballero Errante • Portador Pyro',
    active_character_id: 'char-bruno',
  },
];

export const App: React.FC = () => {
  // Core Data States
  const [rooms, setRooms] = useState<Room[]>(DEFAULT_ROOMS);
  const [currentRoomId, setCurrentRoomId] = useState<string>(DEFAULT_ROOMS[0].id);
  const [characters, setCharacters] = useState<Character[]>(DEFAULT_CHARACTERS);
  const [activeCharacterId, setActiveCharacterId] = useState<string>(DEFAULT_CHARACTERS[0].id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<PlayerProfile[]>(DEFAULT_PROFILES);
  const [activeProfileId, setActiveProfileId] = useState<string>(DEFAULT_PROFILES[0].id);

  // Status & Modals
  const [isLoading, setIsLoading] = useState(true);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isRoomDrawerOpen, setIsRoomDrawerOpen] = useState(false);
  const [isDiceModalOpen, setIsDiceModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load from Supabase
  useEffect(() => {
    let isMounted = true;

    async function loadCloudData() {
      try {
        setIsLoading(true);
        const [cloudRooms, cloudChars, cloudMsgs, cloudProfiles] = await Promise.all([
          dbService.fetchRooms(),
          dbService.fetchCharacters(),
          dbService.fetchMessages(),
          dbService.fetchProfiles(),
        ]);

        if (!isMounted) return;

        if (cloudRooms.length > 0) {
          setRooms(cloudRooms);
          setCurrentRoomId(cloudRooms[0].id);
        }
        if (cloudChars.length > 0) {
          setCharacters(cloudChars);
          setActiveCharacterId(cloudChars[0].id);
        }
        if (cloudMsgs.length > 0) {
          setMessages(cloudMsgs);
        }
        if (cloudProfiles.length > 0) {
          setProfiles(cloudProfiles);
          setActiveProfileId(cloudProfiles[0].id);
        }

        setIsCloudConnected(true);
      } catch (err) {
        console.error('Error loading Supabase data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCloudData();

    // 2. Realtime Subscription on Messages, Rooms, and Characters
    const channel = supabase
      .channel('realtime:roleplay')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new as any;
          const incomingMsg: Message = {
            id: m.id,
            roomId: m.room_id,
            characterId: m.character_id,
            characterName: m.character_name,
            characterAvatar: m.character_avatar || '',
            characterVision: m.character_vision || 'Pyro',
            expression: m.expression || 'normal',
            content: m.content || '',
            parsedBlocks: m.parsed_blocks || [],
            diceRoll: m.dice_roll || undefined,
            imageUrl: m.image_url || undefined,
            timestamp: new Date(m.created_at).getTime(),
          };

          setMessages((prev) => {
            if (prev.some((existing) => existing.id === incomingMsg.id)) return prev;
            return [...prev, incomingMsg];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rooms' },
        (payload) => {
          const r = payload.new as any;
          const incomingRoom: Room = {
            id: r.id,
            name: r.name,
            location: r.location || '',
            region: r.region || 'Mondstadt',
            description: r.description || '',
            backgroundUrl: r.background_url || '',
            ambientType: r.ambient_type || 'night',
            createdAt: new Date(r.created_at).getTime(),
          };
          setRooms((prev) => {
            if (prev.some((existing) => existing.id === incomingRoom.id)) return prev;
            return [incomingRoom, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'characters' },
        (payload) => {
          const c = payload.new as any;
          setCharacters((prev) =>
            prev.map((char) =>
              char.id === c.id
                ? {
                    id: c.id,
                    name: c.name,
                    title: c.title || '',
                    avatarUrl: c.avatar_url || '',
                    vision: c.vision || 'Pyro',
                    color: c.color || '#e05353',
                  }
                : char
            )
          );
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Current room, character, and profile
  const currentRoom = rooms.find((r) => r.id === currentRoomId) || rooms[0] || DEFAULT_ROOMS[0];
  const activeCharacter = characters.find((c) => c.id === activeCharacterId) || characters[0] || DEFAULT_CHARACTERS[0];
  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0] || DEFAULT_PROFILES[0];

  // Room messages
  const currentRoomMessages = messages.filter((m) => m.roomId === currentRoom.id);

  // Auto scroll
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [currentRoomId]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length]);

  // Handler: send text or image message
  const handleSendMessage = async (content: string, expression: Expression, imageFile?: File) => {
    let uploadedImageUrl: string | undefined = undefined;

    if (imageFile) {
      // Upload to Supabase Storage bucket
      const cloudUrl = await dbService.uploadImage(imageFile);
      if (cloudUrl) {
        uploadedImageUrl = cloudUrl;
      } else {
        // Fallback to local DataURL if offline
        uploadedImageUrl = await new Promise((res) => {
          const reader = new FileReader();
          reader.onload = (e) => res(e.target?.result as string);
          reader.readAsDataURL(imageFile);
        });
      }
    }

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      roomId: currentRoom.id,
      characterId: activeCharacter.id,
      characterName: activeCharacter.name,
      characterAvatar: activeCharacter.avatarUrl,
      characterVision: activeCharacter.vision,
      expression: expression,
      content: content,
      parsedBlocks: parseMessageContent(content),
      imageUrl: uploadedImageUrl,
      timestamp: Date.now(),
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, newMessage]);

    // Push to Supabase Cloud
    await dbService.insertMessage(newMessage);
  };

  // Handler: publish D&D dice roll
  const handleSendDiceRoll = async (roll: DiceRoll, optionalMessage?: string) => {
    const rawContent = optionalMessage || `*${activeCharacter.name} lanza los dados con determinación.*`;
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      roomId: currentRoom.id,
      characterId: activeCharacter.id,
      characterName: activeCharacter.name,
      characterAvatar: activeCharacter.avatarUrl,
      characterVision: activeCharacter.vision,
      expression: roll.outcome === 'critical_success' ? 'smirk' : roll.outcome === 'critical_failure' ? 'surprised' : 'normal',
      content: rawContent,
      parsedBlocks: parseMessageContent(rawContent),
      diceRoll: roll,
      timestamp: Date.now(),
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, newMessage]);

    // Push to Supabase Cloud
    await dbService.insertMessage(newMessage);
  };

  // Handler: create room
  const handleCreateRoom = async (newRoomData: Omit<Room, 'id' | 'createdAt'>) => {
    const newRoom: Room = {
      ...newRoomData,
      id: `room-${Date.now()}`,
      createdAt: Date.now(),
    };

    setRooms((prev) => [newRoom, ...prev]);
    setCurrentRoomId(newRoom.id);

    await dbService.insertRoom(newRoom);
  };

  // Handler: update character
  const handleUpdateCharacter = async (updated: Character) => {
    setCharacters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    await dbService.updateCharacter(updated);
  };

  // Handler: update profile
  const handleSaveProfile = async (updated: PlayerProfile) => {
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    await dbService.upsertProfile(updated);
  };

  // Handler: clear history
  const handleClearRoomHistory = async (roomId: string) => {
    setMessages((prev) => prev.filter((m) => m.roomId !== roomId));
    await dbService.clearRoomMessages(roomId);
  };

  // Message counts
  const messageCounts = rooms.reduce((acc, r) => {
    acc[r.id] = messages.filter((m) => m.roomId === r.id).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="relative w-full h-[100dvh] flex flex-col overflow-hidden bg-genshin-dark select-none">
      {/* Background Wallpaper */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out opacity-25 scale-105"
        style={{ backgroundImage: `url(${currentRoom.backgroundUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-genshin-dark/95 via-genshin-dark/80 to-genshin-dark/95 pointer-events-none" />

      {/* Decorative Star Vignette */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-genshin-gold/60 to-transparent pointer-events-none z-30" />

      {/* Header */}
      <Header
        currentRoom={currentRoom}
        activeProfile={activeProfile}
        onOpenRoomDrawer={() => setIsRoomDrawerOpen(true)}
        onOpenDiceModal={() => setIsDiceModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Cloud Status Indicator Bar */}
      <div className="relative z-10 px-3 py-1 bg-black/40 border-b border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <Wifi className={`w-3 h-3 ${isCloudConnected ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
          <span>{isCloudConnected ? 'En directo con Supabase (Tiempo Real)' : 'Conectando con la nube...'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Jugando como: <strong className="text-genshin-gold font-serif">{activeProfile.display_name}</strong></span>
        </div>
      </div>

      {/* Main Messages Feed */}
      <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 space-y-3">
        {/* Room Intro Banner */}
        <div className="max-w-xl mx-auto my-3 p-3.5 rounded-3xl bg-genshin-card/60 backdrop-blur-md border border-genshin-gold/30 text-center shadow-lg">
          <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-genshin-gold/20 border border-genshin-gold/40 text-genshin-gold mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-sm font-serif font-bold text-amber-100 tracking-wide">
            {currentRoom.name}
          </h2>
          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed max-w-md mx-auto">
            {currentRoom.description}
          </p>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-genshin-gold" />
            <span className="text-xs font-serif">Sincronizando crónicas de Teyvat...</span>
          </div>
        ) : currentRoomMessages.length > 0 ? (
          currentRoomMessages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              onImageClick={(url) => setSelectedPhotoUrl(url)}
            />
          ))
        ) : (
          <div className="text-center py-12 text-slate-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-500 opacity-60" />
            <p className="text-xs font-serif text-slate-300">
              Aún no hay mensajes en esta sala.
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Escribe abajo para dar comienzo a la historia...
            </p>
          </div>
        )}

        <div ref={messagesEndRef} className="h-2" />
      </main>

      {/* Message Input Bottom Bar */}
      <MessageInput
        characters={characters}
        activeCharacter={activeCharacter}
        onSwitchCharacter={(char) => setActiveCharacterId(char.id)}
        onSendMessage={handleSendMessage}
        onOpenDiceModal={() => setIsDiceModalOpen(true)}
      />

      {/* Room Drawer */}
      <RoomDrawer
        isOpen={isRoomDrawerOpen}
        onClose={() => setIsRoomDrawerOpen(false)}
        rooms={rooms}
        currentRoomId={currentRoom.id}
        onSelectRoom={(id) => setCurrentRoomId(id)}
        onCreateRoom={handleCreateRoom}
        messageCounts={messageCounts}
      />

      {/* D&D Dice Roller Modal */}
      <DiceModal
        isOpen={isDiceModalOpen}
        onClose={() => setIsDiceModalOpen(false)}
        onSendRoll={handleSendDiceRoll}
      />

      {/* Fullscreen Photo Lightbox */}
      <PhotoModal
        imageUrl={selectedPhotoUrl}
        onClose={() => setSelectedPhotoUrl(null)}
      />

      {/* Player Profile & Customization Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        activeProfile={activeProfile}
        allProfiles={profiles}
        onSelectProfile={(p) => setActiveProfileId(p.id)}
        onSaveProfile={handleSaveProfile}
        messageCount={messages.length}
      />

      {/* Settings & Export Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentRoom={currentRoom}
        messages={messages}
        characters={characters}
        onUpdateCharacter={handleUpdateCharacter}
        onClearRoomHistory={handleClearRoomHistory}
      />
    </div>
  );
};
