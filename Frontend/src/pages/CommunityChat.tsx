import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Hash, Users, MoreVertical, Search, ArrowLeft, ShieldCheck, Clock, PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { communityChatAPI, CommunityRoom, CommunityMessage } from '@/services/api';
import { getSocket } from '@/services/socket';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const CommunityChat = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const socket = getSocket();

    const [rooms, setRooms] = useState<CommunityRoom[]>([]);
    const [activeRoom, setActiveRoom] = useState<CommunityRoom | null>(null);
    const [messages, setMessages] = useState<CommunityMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingRooms, setIsLoadingRooms] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    // Auto-scroll ref
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Fetch Rooms
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await communityChatAPI.getRooms();
                if (res.success) {
                    setRooms(res.data);
                    if (res.data.length > 0) {
                        setActiveRoom(res.data[0]); // Default to first room
                    }
                }
            } catch (error) {
                console.error("Failed to fetch rooms", error);
                toast.error("Failed to load community rooms");
            } finally {
                setIsLoadingRooms(false);
            }
        };
        fetchRooms();
    }, []);

    // Create a default room if none exist (Dev Helper)
    const createDefaultRoom = async () => {
        try {
            await communityChatAPI.createRoom({
                roomId: 'general',
                name: 'General Discussion',
                description: 'Talk about anything related to tech and career.'
            });
            const res = await communityChatAPI.getRooms();
            if (res.success) setRooms(res.data);
        } catch (e) {
            toast.error("Failed to create room");
        }
    };

    // Join Room & Fetch Messages
    useEffect(() => {
        if (!activeRoom || !socket) return;

        // 1. Join Room via Socket
        // socket.emit('leave-room', previousRoomId); // If needed, but let's just handle join
        socket.emit('join-room', activeRoom.roomId);

        // 2. Fetch History
        const fetchHistory = async () => {
            setIsLoadingMessages(true);
            try {
                const res = await communityChatAPI.getMessages(activeRoom.roomId);
                if (res.success) {
                    setMessages(res.data);
                    setTimeout(scrollToBottom, 100);
                }
            } catch (error) {
                console.error("Failed to fetch history", error);
            } finally {
                setIsLoadingMessages(false);
            }
        };
        fetchHistory();

        // 3. Listen for new messages
        const handleNewMessage = (msg: CommunityMessage) => {
            // Only append if it belongs to current room
            if (msg.roomId === activeRoom.roomId) {
                setMessages((prev) => [...prev, msg]);
                setTimeout(scrollToBottom, 100);
            }
        };

        socket.on('new-community-message', handleNewMessage);

        return () => {
            socket.emit('leave-room', activeRoom.roomId);
            socket.off('new-community-message', handleNewMessage);
        };
    }, [activeRoom, socket]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !activeRoom) return;

        const tempContent = newMessage;
        setNewMessage(''); // Optimistic clear

        try {
            const res = await communityChatAPI.sendMessage(activeRoom.roomId, tempContent);
            if (!res.success) {
                setNewMessage(tempContent); // Revert on fail
                toast.error("Failed to send message");
            }
            // Message will be added via socket event
        } catch (error) {
            console.error("Send error", error);
            setNewMessage(tempContent);
            toast.error("Failed to send message");
        }
    };

    return (
        <div className="flex h-screen bg-background dark:bg-black overflow-hidden">
            {/* LEFT SIDEBAR - ROOMS */}
            <div className="w-80 bg-muted/30 dark:bg-zinc-950 border-r border-border flex flex-col">
                <div className="p-4 border-b border-border bg-white/50 dark:bg-black/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/community')} className="-ml-2">
                            <ArrowLeft size={20} />
                        </Button>
                        <h2 className="text-xl font-black tracking-tight">Community</h2>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input placeholder="Search topics..." className="pl-9 bg-background/50 border-transparent focus:border-orange-500 transition-all text-sm rounded-xl" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {isLoadingRooms ? (
                        [1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />)
                    ) : rooms.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground mb-4">No rooms specificied.</p>
                            <Button size="sm" onClick={createDefaultRoom} variant="outline">
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Create General
                            </Button>
                        </div>
                    ) : (
                        rooms.map(room => (
                            <button
                                key={room._id}
                                onClick={() => setActiveRoom(room)}
                                className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 group ${activeRoom?.roomId === room.roomId
                                        ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 shadow-sm ring-1 ring-orange-200 dark:ring-orange-900/50'
                                        : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${activeRoom?.roomId === room.roomId ? 'bg-orange-100 dark:bg-orange-900/40' : 'bg-muted dark:bg-zinc-900'
                                    }`}>
                                    <Hash size={18} className={activeRoom?.roomId === room.roomId ? 'text-orange-600' : 'text-gray-500'} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold truncate text-sm">{room.name}</div>
                                    <div className="text-xs truncate opacity-70">{room.description || 'Join the discussion...'}</div>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-border bg-background/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border">
                            <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}`} />
                            <AvatarFallback>ME</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold truncate">{user?.name}</div>
                            <div className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                ONLINE
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT MAIN CHAT */}
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-zinc-950/50 relative">
                {/* Chat Header */}
                <div className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                            <Hash className="text-orange-600 dark:text-orange-500" size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-foreground">{activeRoom?.name || 'Select a Room'}</h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Users size={12} />
                                {activeRoom?.description || 'Topic specific group chat'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                    {isLoadingMessages ? (
                        <div className="flex justify-center p-8">
                            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Users size={32} />
                            </div>
                            <h3 className="text-lg font-bold">No messages yet</h3>
                            <p className="text-sm">Be the first to say hello!</p>
                        </div>
                    ) : (
                        messages.map((msg, i) => {
                            const isMe = msg.senderId?._id === user?._id;
                            const showAvatar = i === 0 || messages[i - 1]?.senderId?._id !== msg.senderId?._id;

                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={msg._id}
                                    className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-8 h-8 shrink-0 ${!showAvatar ? 'opacity-0' : ''}`}>
                                        <Avatar className="w-8 h-8 border border-border">
                                            <AvatarImage src={msg.senderId?.avatar || `https://ui-avatars.com/api/?name=${msg.senderId?.name}`} />
                                            <AvatarFallback>{msg.senderId?.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                    </div>

                                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                        {showAvatar && !isMe && (
                                            <span className="text-[10px] font-bold text-muted-foreground mb-1 ml-1">
                                                {msg.senderId?.name}
                                            </span>
                                        )}

                                        <div className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm relative group ${isMe
                                                ? 'bg-orange-500 text-white rounded-tr-sm'
                                                : 'bg-white dark:bg-zinc-800 text-foreground rounded-tl-sm border border-border'
                                            }`}>
                                            {msg.content}

                                            <div className={`text-[9px] font-bold mt-1 opacity-70 flex justify-end gap-1 ${isMe ? 'text-orange-100' : 'text-zinc-500'}`}>
                                                {format(new Date(msg.createdAt), 'h:mm a')}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-background border-t border-border">
                    <form
                        onSubmit={handleSendMessage}
                        className="flex items-end gap-2 max-w-4xl mx-auto bg-muted/50 dark:bg-zinc-900 border border-border rounded-[24px] p-2 focus-within:ring-2 ring-orange-100 dark:ring-orange-900/20 transition-all"
                    >
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={`Message #${activeRoom?.name || '...'}`}
                            className="flex-1 min-h-[44px] border-0 bg-transparent focus-visible:ring-0 px-4 py-3 placeholder:text-muted-foreground/70"
                        />
                        <Button
                            disabled={!newMessage.trim()}
                            type="submit"
                            size="icon"
                            className="h-10 w-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 mb-0.5 mr-0.5"
                        >
                            <Send size={18} className={newMessage.trim() ? 'ml-0.5' : ''} />
                        </Button>
                    </form>
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1.5">
                            <ShieldCheck size={10} className="text-green-500" />
                            Community Guidelines Apply. Treat everyone with respect.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunityChat;
