import React, { useState, useEffect, useRef } from 'react';
import { getSocket } from '@/services/socket';
import { chatAPI } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/services/ChatContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Info, CheckCircle, Trash2, Phone, Video, MoreVertical, Paperclip, Smile, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Message {
    _id: string;
    chatId: string;
    senderId: string;
    content: string;
    createdAt: string;
    status?: 'sent' | 'delivered' | 'read';
}

interface ChatPanelProps {
    requestId: string;
    peerId: string;
    skillName: string;
    status: string;
    peerName?: string;
    peerAvatar?: string;
    onClose?: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ requestId, peerId, skillName, status, peerName = "User", onClose }) => {
    const { user } = useAuth();
    const { markAsRead } = useChat();
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatId, setChatId] = useState<string | null>(null);
    const [initializing, setInitializing] = useState(true);
    const [socketConnected, setSocketConnected] = useState(false);
    const [deletingChat, setDeletingChat] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isPeerOnline, setIsPeerOnline] = useState(false);
    const [peerLastSeen, setPeerLastSeen] = useState<string | null>(null);

    const isLocked = status === 'Completed' || status === 'Rejected';

    // 1. Initialize Chat Session
    useEffect(() => {
        let isMounted = true;

        const initSession = async () => {
            try {
                if (isMounted) setInitializing(true);
                const response = await chatAPI.createSession(requestId);
                if (response.success && response.data) {
                    if (isMounted) {
                        setChatId(response.data._id);
                        setIsPeerOnline(response.data.isPartnerOnline);
                        setPeerLastSeen(response.data.partnerLastSeen);
                    }
                }
            } catch (error) {
                console.error('Session init error:', error);
            } finally {
                if (isMounted) setInitializing(false);
            }
        };

        if (requestId) {
            initSession();
            markAsRead(requestId);
        }

        return () => { isMounted = false; };
    }, [requestId, markAsRead]);

    // 2. Fetch Messages & Socket Setup
    useEffect(() => {
        if (!chatId) return;

        let isMounted = true;
        const fetchMessages = async () => {
            try {
                const response = await chatAPI.getMessages(chatId);
                if (response.success && isMounted) {
                    setMessages(response.data);
                }
            } catch (error) {
                console.error('Fetch messages error:', error);
            }
        };

        fetchMessages();

        const socket = getSocket();
        if (socket) {
            setSocketConnected(true);
            socket.emit('join-chat', { chatId });

            const handleNewMessage = (newMsg: Message) => {
                // If I sent it, ignore socket event (optimistic UI handles it)
                if (newMsg.senderId === user?._id) return;

                if (newMsg.chatId === chatId) {
                    setMessages(prev => {
                        if (prev.find(m => m._id === newMsg._id)) return prev;
                        return [...prev, newMsg];
                    });
                }
            };

            const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
                setMessages(prev => prev.filter(m => m._id !== messageId));
            };

            socket.on('new-message', handleNewMessage);
            socket.on('message-deleted', handleMessageDeleted);
            socket.on('connect', () => setSocketConnected(true));
            socket.on('disconnect', () => setSocketConnected(false));

            return () => {
                isMounted = false;
                socket.emit('leave-chat', { chatId });
                socket.off('new-message', handleNewMessage);
                socket.off('message-deleted', handleMessageDeleted);
            };
        }

        return () => { isMounted = false; };
    }, [chatId, user?._id]); // Added user?._id dependency

    // 3. Mark Read & Presence Listeners
    useEffect(() => {
        if (!chatId || !socketConnected) return;
        const socket = getSocket();
        if (!socket) return;

        // Mark read when entering
        chatAPI.markMessagesRead(chatId);

        const handlePresenceOnline = (data: { userId: string }) => {
            if (data.userId === peerId) {
                setIsPeerOnline(true);
                setPeerLastSeen(null);
            }
        };

        const handlePresenceOffline = (data: { userId: string, lastSeen?: string }) => {
            if (data.userId === peerId) {
                setIsPeerOnline(false);
                if (data.lastSeen) setPeerLastSeen(data.lastSeen);
            }
        };

        const handleMessageDelivered = (data: { messageId: string, chatId: string, status: string }) => {
            if (data.chatId === chatId) {
                setMessages(prev => prev.map(m =>
                    m._id === data.messageId ? { ...m, status: 'delivered' as const } : m
                ));
            }
        };

        const handleMessageRead = (data: { chatId: string, readerId: string }) => {
            if (data.chatId === chatId) {
                setMessages(prev => prev.map(m =>
                    m.status !== 'read' ? { ...m, status: 'read' as const } : m
                ));
            }
        };

        socket.on('user-online', handlePresenceOnline);
        socket.on('user-offline', handlePresenceOffline);
        socket.on('message-delivered', handleMessageDelivered);
        socket.on('message-read', handleMessageRead);

        return () => {
            socket.off('user-online', handlePresenceOnline);
            socket.off('user-offline', handlePresenceOffline);
            socket.off('message-delivered', handleMessageDelivered);
            socket.off('message-read', handleMessageRead);
        };
    }, [chatId, socketConnected, peerId]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [messages, initializing]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!inputText.trim() && !attachedImage) || !chatId || isLocked) return;

        // Optimistic Update
        const tempId = 'temp-' + Date.now();
        const contentToSend = inputText.trim();

        let optimisticMsg: Message | null = null;
        if (contentToSend) {
            optimisticMsg = {
                _id: tempId,
                chatId: chatId,
                senderId: user?._id || '',
                content: contentToSend,
                createdAt: new Date().toISOString(),
                status: 'sent'
            };
            setMessages(prev => [...prev, optimisticMsg!]);
        }

        setInputText('');
        setAttachedImage(null);

        try {
            setLoading(true);
            // If there's an attached image, send it first as a separate message (optimistic not implemented for image yet)
            if (attachedImage) {
                await chatAPI.sendMessage(chatId, attachedImage);
            }

            if (contentToSend) {
                const res = await chatAPI.sendMessage(chatId, contentToSend);
                if (res && res.success && res.data) {
                    // Replace temp message with real one
                    setMessages(prev => prev.map(m => m._id === tempId ? res.data : m));
                }
            }
        } catch (error) {
            console.error('Send message error:', error);
            // Revert optimistic update
            if (optimisticMsg) {
                setMessages(prev => prev.filter(m => m._id !== tempId));
            }
            toast.error('Failed to send message');
            setInputText(contentToSend); // Restore text
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        try {
            await chatAPI.deleteMessage(messageId);
        } catch (error) {
            toast.error('Failed to delete message');
        }
    };

    const handleDeleteChat = async () => {
        if (!chatId) return;

        try {
            setDeletingChat(true);
            await chatAPI.deleteChat(chatId);
            toast.success('Chat deleted');
            if (onClose) onClose();
            // We need to refresh the dashboard list. Ideally, pass a callback or use query invalidation in parent.
            // But onClose normally triggers a refresh or the dashboard query should re-fetch if we invalidate it.
            // Dashboard uses 'my-requests' query. We should probably invalidate it. 
            // Since we can't easily access queryClient here without prop drilling or hook, we assume Dashboard handles it or we rely on onClose.
            // Actually, we can use useQueryClient hook if we want, but let's stick to simple onClose for now.
            window.location.reload(); // Quick fix to ensure list is updated as per Prompt requirements ("Page refresh does NOT restore chat")
            // Better: invalidating query. But reload ensures prompt guarantees.
        } catch (error) {
            toast.error('Failed to delete chat');
        } finally {
            setDeletingChat(false);
            setShowDeleteAlert(false);
        }
    };

    if (initializing) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-[#E5DDD5] space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-[#008069]" />
                <p className="text-sm text-gray-500 font-medium">Loading chat...</p>
            </div>
        );
    }

    if (!chatId) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#E5DDD5]">
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <Info className="w-10 h-10 text-gray-400 mb-2 mx-auto" />
                    <p className="text-gray-900 font-bold mb-1">Connection Failed</p>
                    <p className="text-gray-500 text-sm mb-4">Could not establish a secure connection.</p>
                    <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                        Refresh Page
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#efeae2]">
            {/* WhatsApp Header */}
            <div className="px-4 py-2 bg-[#f0f2f5] border-l border-gray-300 flex items-center justify-between z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-lg overflow-hidden">
                        {peerName[0]?.toUpperCase()}
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="font-semibold text-gray-900 leading-none text-base">{peerName}</span>
                        <span className="text-xs text-gray-500 truncate max-w-[150px] mt-0.5">
                            {isPeerOnline ? (
                                <span className="text-green-600 font-medium">Online</span>
                            ) : (
                                peerLastSeen ? `Last seen ${format(new Date(peerLastSeen), 'HH:mm')}` : skillName
                            )}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-[#54656f]">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="cursor-pointer hover:bg-gray-200 rounded-full p-1 w-9 h-9 box-content"
                                type="button"
                                aria-label="Chat menu"
                            >
                                <MoreVertical size={20} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[180px]">
                            <DropdownMenuItem
                                disabled={deletingChat}
                                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer text-sm py-2 gap-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDeleteAlert(true);
                                }}
                            >
                                <Trash2 size={16} />
                                <span>Delete chat</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-0 bg-transparent relative custom-scrollbar">
                <div className="p-3 sm:p-5 pb-2 relative z-0 min-h-full flex flex-col justify-end space-y-4">
                    <AnimatePresence initial={false}>
                        {messages.map((msg, i) => {
                            const isMe = msg.senderId === user?._id;
                            const isImage = typeof msg.content === 'string' && (msg.content.startsWith('data:image/') || /https?:\/\/.*\.(png|jpg|jpeg|gif|webp)$/i.test(msg.content));

                            return (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    key={msg._id || i}
                                    className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`relative max-w-[85%] sm:max-w-[70%] px-2 py-1 rounded-lg text-sm shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] group
                                        ${isMe
                                                ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none'
                                                : 'bg-white text-[#111b21] rounded-tl-none'
                                            }`}
                                    >
                                        {isImage ? (
                                            <div className="relative mb-1">
                                                <img src={msg.content} alt="attachment" className="max-w-full rounded-md" />
                                            </div>
                                        ) : (
                                            <div className="pr-[50px] whitespace-pre-wrap break-words leading-[19px] pb-1">{msg.content}</div>
                                        )}

                                        <div className="flex items-center justify-end gap-0.5 absolute bottom-1 right-1.5 select-none h-4">
                                            <span className="text-[10px] text-[#667781] min-w-[35px] text-right">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                            </span>
                                            {isMe && (
                                                <span>
                                                    {msg.status === 'read' ? (
                                                        <CheckCheck size={16} className="text-[#53bdeb]" />
                                                    ) : msg.status === 'delivered' ? (
                                                        <CheckCheck size={16} className="text-gray-500" />
                                                    ) : (
                                                        <Check size={16} className="text-gray-500" />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    <div ref={scrollRef} className="pb-2" />
                </div>
            </div>

            {/* Input Area */}
            {isLocked ? (
                <div className="p-4 bg-[#f0f2f5] text-center text-gray-500 text-sm font-medium border-t border-gray-300">
                    This conversation is closed.
                </div>
            ) : (
                <form onSubmit={handleSendMessage} className="px-3 py-2 bg-[#f0f2f5] flex items-center gap-2 z-10 min-h-[50px]">
                    <div className="flex gap-3 text-[#54656f]">
                        <Smile className="w-6 h-6 cursor-pointer hover:text-gray-600" />
                        <Paperclip
                            className="w-6 h-6 cursor-pointer hover:text-gray-600"
                            onClick={() => fileInputRef.current?.click()}
                        />
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            title="Upload image"
                            aria-label="Upload image"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = () => {
                                    const result = reader.result as string;
                                    setAttachedImage(result);
                                };
                                reader.readAsDataURL(file);
                            }}
                        />
                    </div>

                    <div className="flex-1 bg-white rounded-lg px-4 py-2 shadow-sm flex items-center">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type a message"
                            aria-label="Type a message"
                            disabled={loading}
                            className="w-full bg-transparent border-none outline-none text-[#111b21] placeholder:text-[#8696a0] text-[15px] leading-normal p-0 h-auto"
                        />
                    </div>

                    {attachedImage && (
                        <div className="mb-2">
                            <img src={attachedImage} alt="preview" className="max-h-24 rounded-md" />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || (!inputText.trim() && !attachedImage)}
                        className={`p-2 rounded-full flex items-center justify-center transition-colors
                            ${(!inputText.trim() && !attachedImage)
                                ? 'text-[#54656f]'
                                : 'text-[#008069]'}`}
                    >
                        {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Send size={24} />}
                    </button>
                </form>
            )}

            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete chat?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will hide the chat from your list. History will be preserved for the other user.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteChat} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ChatPanel;
