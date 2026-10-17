import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { RoomDrawer } from './components/RoomDrawer';
import { MessageItem } from './components/MessageItem';
import { MessageInput } from './components/MessageInput';
import { DiceModal } from './components/DiceModal';
import { PhotoModal } from './components/PhotoModal';
import { SettingsModal } from './components/SettingsModal';
import { DEFAULT_ROOMS, DEFAULT_CHARACTERS, INITIAL_MESSAGES } from './data/initialData';
import { Room, Character, Message, Expression, DiceRoll } from './types';
import { parseMessageContent } from './utils/parser';
import { Sparkles, MessageSquare } from 'lucide-react';

const STORAGE_KEY_ROOMS = 'rp_lorena_rooms_v1';
const STORAGE_KEY_CHARS = 'rp_lorena_chars_v1';
const STORAGE_KEY_MSGS = 'rp_lorena_msgs_v1';

export const App: React.FC = () => {
  // Load initial states from localStorage with fallbacks
  const [rooms, setRooms] = useState<Room[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ROOMS);
      return saved ? JSON.parse(saved) : DEFAULT_ROOMS;
    } catch {
      return DEFAULT_ROOMS;
    }
  });

  const [currentRoomId, setCurrentRoomId] = useState<string>(() => rooms[0]?.id || DEFAULT_ROOMS[0].id);

  const [characters, setCharacters] = useState<Character[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHARS);
      return saved ? JSON.parse(saved) : DEFAULT_CHARACTERS;
    } catch {
      return DEFAULT_CHARACTERS;
    }
  });

  const [activeCharacterId, setActiveCharacterId] = useState<string>(() => characters[0]?.id || DEFAULT_CHARACTERS[0].id);

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MSGS);
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  // Modal states
  const [isRoomDrawerOpen, setIsRoomDrawerOpen] = useState(false);
  const [isDiceModalOpen, setIsDiceModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(rooms));
    } catch (e) {
      console.error(e);
    }
  }, [rooms]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHARS, JSON.stringify(characters));
    } catch (e) {
      console.error(e);
    }
  }, [characters]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MSGS, JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  // Current room object
  const currentRoom = rooms.find((r) => r.id === currentRoomId) || rooms[0] || DEFAULT_ROOMS[0];
  const activeCharacter = characters.find((c) => c.id === activeCharacterId) || characters[0] || DEFAULT_CHARACTERS[0];

  // Room messages
  const currentRoomMessages = messages.filter((m) => m.roomId === currentRoom.id);

  // Auto scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [currentRoomId]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length]);

  // Handler: send text/image message
  const handleSendMessage = (content: string, expression: Expression, imageFile?: File) => {
    const processSend = (imageUrl?: string) => {
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
        imageUrl: imageUrl,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, newMessage]);
    };

    if (imageFile) {
      // Read image as Data URL (can also be compressed)
      const reader = new FileReader();
      reader.onload = (e) => {
        const resultUrl = e.target?.result as string;
        processSend(resultUrl);
      };
      reader.readAsDataURL(imageFile);
    } else {
      processSend();
    }
  };

  // Handler: publish dice roll
  const handleSendDiceRoll = (roll: DiceRoll, optionalMessage?: string) => {
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

    setMessages((prev) => [...prev, newMessage]);
  };

  // Handler: create room
  const handleCreateRoom = (newRoomData: Omit<Room, 'id' | 'createdAt'>) => {
    const newRoom: Room = {
      ...newRoomData,
      id: `room-${Date.now()}`,
      createdAt: Date.now(),
    };
    setRooms((prev) => [newRoom, ...prev]);
    setCurrentRoomId(newRoom.id);
  };

  // Handler: update character
  const handleUpdateCharacter = (updated: Character) => {
    setCharacters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  // Handler: clear history for room
  const handleClearRoomHistory = (roomId: string) => {
    setMessages((prev) => prev.filter((m) => m.roomId !== roomId));
  };

  // Message count per room
  const messageCounts = rooms.reduce((acc, r) => {
    acc[r.id] = messages.filter((m) => m.roomId === r.id).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="relative w-full h-[100dvh] flex flex-col overflow-hidden bg-genshin-dark select-none">
      {/* Background Wallpaper with Ambient Blur and Dark Vignette */}
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
        onOpenRoomDrawer={() => setIsRoomDrawerOpen(true)}
        onOpenDiceModal={() => setIsDiceModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Messages Feed */}
      <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 space-y-3">
        {/* Room Intro Banner */}
        <div className="max-w-xl mx-auto my-4 p-4 rounded-3xl bg-genshin-card/60 backdrop-blur-md border border-genshin-gold/30 text-center shadow-lg">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-genshin-gold/20 border border-genshin-gold/40 text-genshin-gold mb-2">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-sm sm:text-base font-serif font-bold text-amber-100 tracking-wide">
            {currentRoom.name}
          </h2>
          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed max-w-md mx-auto">
            {currentRoom.description}
          </p>
        </div>

        {/* Message Items */}
        {currentRoomMessages.length > 0 ? (
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
