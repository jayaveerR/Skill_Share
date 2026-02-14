import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { getSocket } from './socket';

interface ChatContextType {
    endSession: (requestId: string) => void;
    unreadChats: Set<string>;
    markAsRead: (requestId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [unreadChats, setUnreadChats] = React.useState<Set<string>>(new Set());

    // In the new architecture, session cleanup is handled by unmounting components
    // and socket room management. This function is kept for compatibility 
    // with Dashboard logic but can be expanded if global cleanup is needed.
    const endSession = useCallback((requestId: string) => {
        // No-op for now as we rely on component unmount and DB persistence
        // Could potentially emit a 'leave-chat' here if manual cleanup is forced
        console.log(`Session closed for ${requestId}`);
    }, []);

    const markAsRead = useCallback((requestId: string) => {
        setUnreadChats(prev => {
            const newSet = new Set(prev);
            newSet.delete(requestId);
            return newSet;
        });
    }, []);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const handleReceiveMessage = (data: { requestId: string, content: string, senderId: string }) => {
            // If we are NOT in this chat currently (logic to check active route?), add to unread
            // For now, we rely on the component using this context to clear it if active
            // Actually, we can check if the user is on the dashboard and looking at this chat?
            // Simpler: Just always add, and let the ChatPanel clear it immediately if open.

            // NOTE: Ideally we check `window.location` or similar, but Context is agnostic.
            // We will let the Navbar consume this.

            setUnreadChats(prev => new Set(prev).add(data.requestId));
        };

        socket.on('receive-message', handleReceiveMessage);

        return () => {
            socket.off('receive-message', handleReceiveMessage);
        };
    }, []);

    return (
        <ChatContext.Provider value={{ endSession, unreadChats, markAsRead }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
