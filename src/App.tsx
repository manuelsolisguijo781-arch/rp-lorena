import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { RoomDrawer } from './components/RoomDrawer';
import { MessageItem } from './components/MessageItem';
import { MessageInput } from './components/MessageInput';
import { DiceModal } from './components/DiceModal';
import { PhotoModal } from './components/PhotoModal';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import { InviteModal } from './components/InviteModal';
import { EmptyRoomsView } from './components/EmptyRoomsView';
import { AuthModal } from './components/AuthModal';
import { ContextModal } from './components/ContextModal';
import { NotificationModal } from './components/NotificationModal';
import { Room, Player, Message, Expression, DiceRoll } from './types';
import { parseMessageContent } from './utils/parser';
import { supabase, dbService } from './lib/supabase';
import { Sparkles, MessageSquare, Wifi, Loader2 } from 'lucide-react';
import { notificationService } from './utils/notifications';

const STORAGE_AUTH_KEY = 'rp_auth_user_v2';

export const App: React.FC = () => {
  // Authentication State
  const [player, setPlayer] = useState<Player | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AUTH_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Core Data States
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Status & Modals
  const [isLoading, setIsLoading] = useState(true);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isRoomDrawerOpen, setIsRoomDrawerOpen] = useState(false);
  const [isDiceModalOpen, setIsDiceModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const roomsRef = useRef<Room[]>([]);
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  // Initialize Service Worker and Notifications on mount
  useEffect(() => {
    notificationService.init();
  }, []);

  // Sync auth player to localStorage
  useEffect(() => {
    if (player) {
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(player));
    } else {
      localStorage.removeItem(STORAGE_AUTH_KEY);
    }
  }, [player]);

  // Check URL hash for direct invite e.g. #invite=ROL-829
  const handleCheckInviteLink = async (currentRooms: Room[]) => {
    const hash = window.location.hash;
    if (hash.startsWith('#invite=') && player) {
      const inviteCode = hash.replace('#invite=', '').trim().toUpperCase();
      if (inviteCode) {
        try {
          const matchedRoom = await dbService.findRoomByInviteCode(inviteCode);
          if (matchedRoom) {
            await dbService.joinRoom(matchedRoom.id, player.id, player.username);
            setRooms((prev) => {
              if (prev.some((r) => r.id === matchedRoom.id)) return prev;
              return [matchedRoom, ...prev];
            });
            setCurrentRoomId(matchedRoom.id);
            // Clean up hash
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }
        } catch (e) {
          console.error('Error handling invite link:', e);
        }
      }
    }

    if (currentRooms.length > 0 && !currentRoomId) {
      setCurrentRoomId(currentRooms[0].id);
    }
  };

  // 1. Initial Load when Player is Logged In
  useEffect(() => {
    if (!player) {
      setIsLoading(false);
      return;
    }

    const currentPlayer = player;
    let isMounted = true;

    async function loadCloudData() {
      try {
        setIsLoading(true);
        const cloudRooms = await dbService.fetchAllRooms(currentPlayer.id, currentPlayer.username);

        if (!isMounted) return;

        setRooms(cloudRooms);
        await handleCheckInviteLink(cloudRooms);

        setIsCloudConnected(true);
      } catch (err) {
        console.error('Error loading cloud data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCloudData();

    // 2. Realtime Subscriptions
    const channel = supabase
      .channel('realtime:roleplay_app')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new as any;
          const incomingMsg: Message = {
            id: m.id,
            roomId: m.room_id,
            senderId: m.character_id,
            senderName: m.character_name,
            senderAvatar: m.character_avatar || '',
            expression: (m.expression || 'normal') as Expression,
            content: m.content || '',
            parsedBlocks: m.parsed_blocks || [],
            diceRoll: m.dice_roll || undefined,
            imageUrl: m.image_url || undefined,
            timestamp: new Date(m.created_at).getTime(),
          };

          // Only process message if it belongs to one of user's active rooms
          const isMemberOfRoom = roomsRef.current.some((r) => r.id === incomingMsg.roomId);
          if (!isMemberOfRoom && incomingMsg.roomId !== currentRoomId) {
            return;
          }

          setMessages((prev) => {
            if (prev.some((existing) => existing.id === incomingMsg.id)) return prev;
            return [...prev, incomingMsg];
          });

          // Trigger mobile notification & vibration if message is from the other person
          if (m.character_id !== currentPlayer.id) {
            notificationService.notify(
              incomingMsg.senderName,
              incomingMsg.content || (incomingMsg.imageUrl ? '📷 Te ha enviado una foto' : '🎲 Ha lanzado los dados'),
              incomingMsg.senderAvatar
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rooms' },
        (payload) => {
          const r = payload.new as any;
          // Only automatically add room to state if this user is the creator
          if (r.region === currentPlayer.username) {
            const incomingRoom: Room = {
              id: r.id,
              name: r.name,
              description: r.description || '',
              inviteCode: r.location || '',
              createdBy: r.region || '',
              members: [],
              backgroundUrl: r.background_url || '',
              ambientType: (r.ambient_type || 'night') as Room['ambientType'],
              createdAt: new Date(r.created_at).getTime(),
            };

            setRooms((prev) => {
              if (prev.some((existing) => existing.id === incomingRoom.id)) return prev;
              return [incomingRoom, ...prev];
            });
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [player]);

  // Load messages whenever currentRoomId changes
  useEffect(() => {
    if (!currentRoomId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    dbService.fetchMessagesForRoom(currentRoomId).then((cloudMsgs) => {
      if (isMounted) {
        setMessages(cloudMsgs);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentRoomId]);

  // Current active room
  const currentRoom = rooms.find((r) => r.id === currentRoomId) || null;

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

  // Handlers
  const handleSendMessage = async (content: string, expression: Expression, imageFile?: File) => {
    if (!currentRoom || !player) return;

    let uploadedImageUrl: string | undefined = undefined;

    if (imageFile) {
      const cloudUrl = await dbService.uploadImage(imageFile);
      if (cloudUrl) {
        uploadedImageUrl = cloudUrl;
      } else {
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
      senderId: player.id,
      senderName: player.displayName,
      senderAvatar: player.avatarUrl,
      expression: expression,
      content: content,
      parsedBlocks: parseMessageContent(content),
      imageUrl: uploadedImageUrl,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMessage]);
    await dbService.insertMessage(newMessage);
  };

  const handleSendDiceRoll = async (roll: DiceRoll, optionalMessage?: string) => {
    if (!currentRoom || !player) return;

    const rawContent = optionalMessage || `*${player.displayName} lanza los dados con determinación.*`;
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      roomId: currentRoom.id,
      senderId: player.id,
      senderName: player.displayName,
      senderAvatar: player.avatarUrl,
      expression: roll.outcome === 'critical_success' ? 'smirk' : roll.outcome === 'critical_failure' ? 'surprised' : 'normal',
      content: rawContent,
      parsedBlocks: parseMessageContent(rawContent),
      diceRoll: roll,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMessage]);
    await dbService.insertMessage(newMessage);
  };

  const handleCreateRoom = async (name: string, desc: string, bg: string) => {
    if (!player) return;
    try {
      const newRoom = await dbService.createRoom(name, desc, bg, player.username, player.id);
      setRooms((prev) => [newRoom, ...prev]);
      setCurrentRoomId(newRoom.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoinRoom = async (code: string) => {
    if (!player) return;
    try {
      const matched = await dbService.findRoomByInviteCode(code);
      if (matched) {
        await dbService.joinRoom(matched.id, player.id, player.username);
        setRooms((prev) => {
          if (prev.some((r) => r.id === matched.id)) return prev;
          return [matched, ...prev];
        });
        setCurrentRoomId(matched.id);
      } else {
        alert('No se encontró ninguna sala con el código ' + code);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async (updated: Player) => {
    setPlayer(updated);
    await dbService.updateProfile(updated);
  };

  const handleLogout = () => {
    setPlayer(null);
    setRooms([]);
    setCurrentRoomId(null);
    setMessages([]);
  };

  const handleClearRoomHistory = async (roomId: string) => {
    setMessages([]);
    await dbService.clearRoomMessages(roomId);
  };

  const handleLeaveRoom = async (roomId: string) => {
    if (!player) return;
    await dbService.leaveRoom(roomId, player.id);
    const updated = rooms.filter((r) => r.id !== roomId);
    setRooms(updated);
    if (currentRoomId === roomId) {
      setCurrentRoomId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleUpdateRoomContext = async (newContext: string) => {
    if (!currentRoom) return;
    const updatedRoom = { ...currentRoom, description: newContext };
    setRooms((prev) => prev.map((r) => (r.id === currentRoom.id ? updatedRoom : r)));
    await supabase.from('rooms').update({ description: newContext }).eq('id', currentRoom.id);
  };

  // Message counts
  const messageCounts = rooms.reduce((acc, r) => {
    acc[r.id] = r.id === currentRoomId ? messages.length : 0;
    return acc;
  }, {} as Record<string, number>);

  // Render Auth if not logged in
  if (!player) {
    return <AuthModal onLoginSuccess={(p) => setPlayer(p)} />;
  }

  return (
    <div className="relative w-full h-[100dvh] flex flex-col overflow-hidden bg-genshin-dark select-none">
      {/* Background Wallpaper */}
      {currentRoom && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out opacity-25 scale-105"
          style={{ backgroundImage: `url(${currentRoom.backgroundUrl})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-genshin-dark/95 via-genshin-dark/80 to-genshin-dark/95 pointer-events-none" />

      {/* Decorative Star Vignette */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-genshin-gold/60 to-transparent pointer-events-none z-30" />

      {/* Header */}
      <Header
        currentRoom={currentRoom}
        player={player}
        onOpenRoomDrawer={() => setIsRoomDrawerOpen(true)}
        onOpenDiceModal={() => setIsDiceModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenInvite={() => setIsInviteOpen(true)}
        onOpenContext={() => setIsContextOpen(true)}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
      />

      {/* Cloud Status Indicator Bar */}
      <div className="relative z-10 px-3 py-1 bg-black/40 border-b border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <Wifi className={`w-3 h-3 ${isCloudConnected ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
          <span>{isCloudConnected ? 'Conectado a la nube (Tiempo Real)' : 'Conectando...'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>@{player.username}</span>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-7 h-7 animate-spin text-genshin-gold" />
          <span className="text-xs font-serif">Cargando salas y crónicas...</span>
        </div>
      ) : !currentRoom ? (
        /* Empty State: No Rooms yet */
        <EmptyRoomsView
          player={player}
          onRoomCreatedOrJoined={(room) => {
            setRooms((prev) => [room, ...prev]);
            setCurrentRoomId(room.id);
          }}
        />
      ) : (
        /* Inside Active Room */
        <>
          <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 space-y-3">
            {/* Room Banner */}
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

            {/* Messages Feed */}
            {messages.length > 0 ? (
              messages.map((msg) => (
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

          {/* Input Bottom Bar */}
          <MessageInput
            player={player}
            onSendMessage={handleSendMessage}
            onOpenDiceModal={() => setIsDiceModalOpen(true)}
          />
        </>
      )}

      {/* Drawer */}
      <RoomDrawer
        isOpen={isRoomDrawerOpen}
        onClose={() => setIsRoomDrawerOpen(false)}
        rooms={rooms}
        currentRoomId={currentRoomId}
        onSelectRoom={(id) => setCurrentRoomId(id)}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
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
        player={player}
        onSaveProfile={handleSaveProfile}
        onLogout={handleLogout}
        messageCount={messages.length}
      />

      {/* Room Invite Modal */}
      {currentRoom && (
        <InviteModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          room={currentRoom}
        />
      )}

      {/* Context & World Lore Modal */}
      <ContextModal
        isOpen={isContextOpen}
        onClose={() => setIsContextOpen(false)}
        currentRoom={currentRoom}
        onUpdateRoomContext={handleUpdateRoomContext}
      />

      {/* Push Notification Preferences Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        playerAvatar={player.avatarUrl}
      />

      {/* Settings & Export Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentRoom={currentRoom}
        messages={messages}
        player={player}
        onClearRoomHistory={handleClearRoomHistory}
        onLeaveRoom={handleLeaveRoom}
        onLogout={handleLogout}
      />
    </div>
  );
};
