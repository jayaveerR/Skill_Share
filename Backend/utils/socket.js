const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;
const Message = require('../models/Message');
const Chat = require('../models/Chat');

const users = new Map(); // Map to store userId -> Set(socketIds)
const User = require('../models/User');

const isUserOnline = (userId) => {
    return users.has(userId.toString()) && users.get(userId.toString()).size > 0;
};


const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Adjust this in production
            methods: ["GET", "POST"]
        }
    });

    // Authentication middleware for Socket.IO
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return next(new Error('Authentication error'));
            socket.user = decoded;
            next();
        });
    });

    io.on('connection', async (socket) => {
        const userId = socket.user.id;

        // Multi-tab handling: Add socket to user's set
        if (!users.has(userId)) {
            users.set(userId, new Set());
        }
        users.get(userId).add(socket.id);

        // Join private room for all tabs of this user
        socket.join(`user:${userId}`);

        const isFirstSocket = users.get(userId).size === 1;
        console.log(`User connected: ${userId} (Socket: ${socket.id}, Total: ${users.get(userId).size})`);

        if (isFirstSocket) {
            try {
                // Update MongoDB
                await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: null });
                // Broadcast presence
                io.emit('user-online', { userId });
            } catch (err) {
                console.error('Error updating presence on connect:', err);
            }
        }

        // Offline -> Online Delivery Sync
        (async () => {
            try {
                // 1. Find all chats where user is a participant
                const chats = await Chat.find({ participants: userId });
                const chatIds = chats.map(c => c._id);

                // 2. Find pending messages: in these chats, NOT sent by me, status is 'sent'
                const pendingMessages = await Message.find({
                    chatId: { $in: chatIds },
                    senderId: { $ne: userId },
                    status: 'sent'
                });

                if (pendingMessages.length > 0) {
                    // 3. Update status to 'delivered'
                    await Message.updateMany(
                        { _id: { $in: pendingMessages.map(m => m._id) } },
                        { $set: { status: 'delivered' } }
                    );

                    // 4. Notify Senders
                    // Group by sender to avoid flooding? Or just iterate.
                    // pendingMessages contains various senders.
                    pendingMessages.forEach(msg => {
                        const senderId = msg.senderId.toString();
                        // Check if sender is online (optimization)
                        if (isUserOnline(senderId)) {
                            emitToUser(senderId, 'message-delivered', {
                                messageId: msg._id,
                                chatId: msg.chatId,
                                status: 'delivered'
                            });
                        }
                    });
                    console.log(`Marked ${pendingMessages.length} pending messages as delivered for user ${userId}`);
                }
            } catch (err) {
                console.error('Error syncing offline messages:', err);
            }
        })();

        socket.on('disconnect', async () => {
            if (users.has(userId)) {
                users.get(userId).delete(socket.id);
                const isLastSocket = users.get(userId).size === 0;

                if (isLastSocket) {
                    users.delete(userId);
                    const lastSeen = new Date();
                    console.log(`User disconnected: ${userId}`);
                    try {
                        // Update MongoDB
                        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
                        // Broadcast presence
                        io.emit('user-offline', { userId, lastSeen });
                    } catch (err) {
                        console.error('Error updating presence on disconnect:', err);
                    }
                }
            }
        });

        // Room Management
        socket.on('join-chat', ({ chatId }) => {
            if (chatId) {
                socket.join(`chat:${chatId}`);
                console.log(`User ${userId} joined room chat:${chatId}`);
            }
        });

        socket.on('leave-chat', ({ chatId }) => {
            if (chatId) {
                socket.leave(`chat:${chatId}`);
                console.log(`User ${userId} left room chat:${chatId}`);
            }
        });

        // Community Room Management
        socket.on('join-room', (roomId) => {
            if (roomId) {
                socket.join(roomId);
                console.log(`User ${userId} joined room ${roomId}`);
            }
        });

        socket.on('leave-room', (roomId) => {
            if (roomId) {
                socket.leave(roomId);
                console.log(`User ${userId} left room ${roomId}`);
            }
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

const emitToUser = (userId, event, data) => {
    if (isUserOnline(userId)) {
        io.to(`user:${userId}`).emit(event, data);
        return true;
    }
    return false;
};

module.exports = {
    initSocket,
    getIO,
    emitToUser,
    isUserOnline
};
