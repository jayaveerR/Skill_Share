import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

let socket: Socket | null = null;

export const initSocket = (token: string) => {
    if (socket) return socket;

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    socket = io(SOCKET_URL, {
        auth: {
            token
        }
    });

    socket.on('connect', () => {
        console.log('Connected to socket server');
    });

    socket.on('new-request', (data) => {
        toast.success(`New request for ${data.skillName} from ${data.requestedBy}`, {
            description: data.message,
            duration: 5000,
        });
        // You can also trigger a query invalidation here if you have access to queryClient
    });

    socket.on('request-accepted', (data) => {
        toast.success(`Request Accepted!`, {
            description: `Your request to learn ${data.skillName} has been accepted. You can now start a secure chat!`,
            duration: 5000,
        });
    });

    socket.on('request-rejected', (data) => {
        toast.info(`Request Rejected`, {
            description: `Your request to learn ${data.skillName} was rejected.`,
            duration: 5000,
        });
    });

    // Keeping status-update for backward compatibility or other status changes
    socket.on('status-update', (data) => {
        const statusColor = data.status === 'Accepted' ? 'text-green-500' : 'text-red-500';
        toast.info(`Request Status Update`, {
            description: `Request for ${data.skillName} is now ${data.status}.`,
            duration: 4000,
        });
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
