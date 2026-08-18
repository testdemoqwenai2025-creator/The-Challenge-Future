// NEXUS Real-Time Collaboration Service
// WebSocket/Socket.IO service for multi-user collaboration features
// Port: 3003 (configured via Caddy gateway)

import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

// ==================== TYPES ====================

interface CollaborativeUser {
  id: string;
  socketId: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  cursor?: { x: number; y: number };
  selection?: { start: number; end: number };
  lastActivity: Date;
}

interface CollaborationRoom {
  id: string;
  type: 'application' | 'document' | 'dashboard' | 'whiteboard';
  entityId: string; // Application ID, Document ID, etc.
  users: Map<string, CollaborativeUser>;
  content?: any; // Current document/application state
  version: number;
  createdAt: Date;
  lastActivity: Date;
}

interface CursorUpdate {
  x: number;
  y: number;
}

interface SelectionUpdate {
  start: number;
  end: number;
}

interface ContentChange {
  type: 'insert' | 'delete' | 'format';
  position: number;
  length?: number;
  content?: string;
  userId: string;
  timestamp: Date;
  version: number;
}

interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'file';
}

interface PresenceUpdate {
  userId: string;
  userName: string;
  status: 'online' | 'away' | 'offline';
  lastActivity: Date;
}

// ==================== SERVER SETUP ====================

const PORT = parseInt(process.env.COLLAB_PORT || '3003');
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ==================== STATE MANAGEMENT ====================

const rooms = new Map<string, CollaborationRoom>();
const userSessions = new Map<string, { userId: string; socketId: string }>();

/**
 * Create or get a collaboration room
 */
function getOrCreateRoom(roomId: string, type: CollaborationRoom['type'], entityId: string): CollaborationRoom {
  if (!rooms.has(roomId)) {
    const room: CollaborationRoom = {
      id: roomId,
      type,
      entityId,
      users: new Map(),
      version: 1,
      createdAt: new Date(),
      lastActivity: new Date(),
    };
    rooms.set(roomId, room);
    console.log(`📝 Room created: ${roomId} (${type})`);
  }
  return rooms.get(roomId)!;
}

/**
 * Get all users in a room (excluding the sender)
 */
function getOtherUsersInRoom(roomId: string, excludeUserId: string): CollaborativeUser[] {
  const room = rooms.get(roomId);
  if (!room) return [];
  
  return Array.from(room.users.values()).filter(u => u.id !== excludeUserId);
}

/**
 * Broadcast to room (with optional exclusion)
 */
function broadcastToRoom(
  roomId: string, 
  event: string, 
  data: any, 
  excludeSocketId?: string
): void {
  const room = rooms.get(roomId);
  if (!room) return;

  for (const [socketId, user] of room.users) {
    if (socketId !== excludeSocketId) {
      io.to(socketId).emit(event, data);
    }
  }
}

// ==================== SOCKET HANDLERS ====================

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // ==================== ROOM MANAGEMENT ====================

  /**
   * Join a collaboration room
   */
  socket.on('join-room', (data: {
    roomId: string;
    roomType: CollaborationRoom['type'];
    entityId: string;
    user: { id: string; name: string; email: string; avatar?: string; role: CollaborativeUser['role'] };
  }) => {
    try {
      const room = getOrCreateRoom(data.roomId, data.roomType, data.entityId);
      
      // Create collaborative user object
      const collabUser: CollaborativeUser = {
        id: data.user.id,
        socketId: socket.id,
        name: data.user.name,
        email: data.user.email,
        avatar: data.user.avatar,
        role: data.user.role,
        lastActivity: new Date(),
      };

      // Add user to room
      room.users.set(data.user.id, collabUser);
      socket.join(data.roomId);
      
      // Track session
      userSessions.set(socket.id, { userId: data.user.id, socketId: socket.id });

      // Notify others in room
      socket.to(data.roomId).emit('user-joined', {
        user: {
          id: collabUser.id,
          name: collabUser.name,
          role: collabUser.role,
          avatar: collabUser.avatar,
        },
        totalUsers: room.users.size,
      });

      // Send current state to joining user
      socket.emit('room-joined', {
        roomId: data.roomId,
        users: Array.from(room.users.values()).map(u => ({
          id: u.id,
          name: u.name,
          role: u.role,
          avatar: u.avatar,
          cursor: u.cursor,
          selection: u.selection,
        })),
        version: room.version,
        content: room.content, // Initial content snapshot
      });

      console.log(`✅ ${data.user.name} joined room ${data.roomId} (${room.users.size} users)`);

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  /**
   * Leave a collaboration room
   */
  socket.on('leave-room', (data: { roomId: string }) => {
    const session = userSessions.get(socket.id);
    if (!session) return;

    const room = rooms.get(data.roomId);
    if (room) {
      // Remove user from room
      room.users.delete(session.userId);

      // Notify others
      socket.to(data.roomId).emit('user-left', {
        userId: session.userId,
        totalUsers: room.users.size,
      });

      console.log(`👋 User ${session.userId} left room ${data.roomId}`);

      // Clean up empty rooms after delay
      if (room.users.size === 0) {
        setTimeout(() => {
          if (rooms.has(data.roomId) && rooms.get(data.roomId)!.users.size === 0) {
            rooms.delete(data.roomId);
            console.log(`🧹 Cleaned up empty room: ${data.roomId}`);
          }
        }, 5 * 60 * 1000); // 5 minutes
      }
    }

    userSessions.delete(socket.id);
    socket.leave(data.roomId);
  });

  // ==================== REAL-TIME CURSOR & SELECTION ====================

  /**
   * Broadcast cursor position updates
   */
  socket.on('cursor-update', (data: { roomId: string; cursor: CursorUpdate }) => {
    const session = userSessions.get(socket.id);
    if (!session) return;

    const room = rooms.get(data.roomId);
    if (room) {
      const user = room.users.get(session.userId);
      if (user) {
        user.cursor = data.cursor;
        user.lastActivity = new Date();
      }

      // Broadcast to others (low priority - can be throttled)
      broadcastToRoom(data.roomId, 'cursor-update', {
        userId: session.userId,
        cursor: data.cursor,
      }, socket.id);
    }
  });

  /**
   * Broadcast text selection updates
   */
  socket.on('selection-update', (data: { roomId: string; selection: SelectionUpdate }) => {
    const session = userSessions.get(socket.id);
    if (!session) return;

    const room = rooms.get(data.roomId);
    if (room) {
      const user = room.users.get(session.userId);
      if (user) {
        user.selection = data.selection;
        user.lastActivity = new Date();
      }

      broadcastToRoom(data.roomId, 'selection-update', {
        userId: session.userId,
        selection: data.selection,
      }, socket.id);
    }
  });

  // ==================== COLLABORATIVE EDITING ====================

  /**
   * Handle content changes (OT - Operational Transformation)
   */
  socket.on('content-change', (data: {
    roomId: string;
    change: ContentChange;
  }) => {
    const session = userSessions.get(socket.id);
    if (!session) return;

    const room = rooms.get(data.roomId);
    if (!room) return;

    // Update version
    room.version++;
    room.lastActivity = new Date();

    // Apply change to server-side content (simplified)
    // In production, implement proper OT algorithm
    if (room.content && typeof room.content === 'string') {
      // Simple text change application
      switch (data.change.type) {
        case 'insert':
          room.content = 
            room.content.slice(0, data.change.position) + 
            data.change.content + 
            room.content.slice(data.change.position);
          break;
        case 'delete':
          room.content =
            room.content.slice(0, data.change.position) +
            room.content.slice(data.change.position + (data.change.length || 0));
          break;
      }
    } else if (!room.content) {
      room.content = data.change.content || '';
    }

    // Broadcast change to other users with version info
    broadcastToRoom(data.roomId, 'content-change', {
      change: {
        ...data.change,
        version: room.version,
      },
      userId: session.userId,
      userName: room.users.get(session.userId)?.name,
    }, socket.id);

    // Acknowledge to sender
    socket.emit('change-acknowledged', {
      version: room.version,
      changeId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  });

  /**
   * Request content sync (for reconnection)
   */
  socket.on('request-sync', (data: { roomId: string; clientVersion: number }) => {
    const room = rooms.get(data.roomId);
    if (room) {
      socket.emit('sync-response', {
        content: room.content,
        version: room.version,
        hasUpdates: room.version > data.clientVersion,
      });
    }
  });

  // ==================== CHAT & COMMENTS ====================

  /**
   * Send chat message to room
   */
  socket.on('chat-message', (data: {
    roomId: string;
    content: string;
    type?: 'text' | 'file';
  }) => {
    const session = userSessions.get(socket.id);
    if (!session) return;

    const room = rooms.get(data.roomId);
    if (!room) return;

    const user = room.users.get(session.userId);
    if (!user) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      roomId: data.roomId,
      userId: session.userId,
      userName: user.name,
      userAvatar: user.avatar,
      content: data.content,
      timestamp: new Date(),
      type: data.type || 'text',
    };

    // Broadcast to all users in room (including sender for consistency)
    io.to(data.roomId).emit('chat-message', message);
  });

  /**
   * Start typing indicator
   */
  socket.on('typing-start', (data: { roomId: string }) => {
    const session = userSessions.get(socket.id);
    if (!session) return;

    const room = rooms.get(data.roomId);
    if (!room) return;

    socket.to(data.roomId).emit('user-typing', {
      userId: session.userId,
      userName: room.users.get(session.userId)?.name,
    });
  });

  /**
   * Stop typing indicator
   */
  socket.on('typing-stop', (data: { roomId: string }) => {
    const session = userSessions.get(socket.id);
    if (!session) return;

    socket.to(data.roomId).emit('user-stopped-typing', {
      userId: session.userId,
    });
  });

  // ==================== PRESENCE & STATUS ====================

  /**
   * Update user presence status
   */
  socket.on('presence-update', (data: { status: 'online' | 'away' | 'offline' }) => {
    const session = userSessions.get(socket.id);
    if (!session) return;

    // Find all rooms this user is in and broadcast presence update
    for (const [roomId, room] of rooms.entries()) {
      if (room.users.has(session.userId)) {
        const user = room.users.get(session.userId)!;
        user.lastActivity = new Date();

        broadcastToRoom(roomId, 'presence-update', {
          userId: session.userId,
          userName: user.name,
          status: data.status,
          lastActivity: user.lastActivity,
        } as PresenceUpdate, socket.id);
      }
    }
  });

  // ==================== TEAM FEATURES ====================

  /**
   * Invite user to collaborate (sends notification)
   */
  socket.on('collaboration-invite', (data: {
    targetUserId: string;
    roomId: string;
    roomType: string;
    message?: string;
  }) => {
    const session = userSessions.get(socket.id);
    if (!session) return;

    // Find target user's socket(s)
    for (const [socketId, sess] of userSessions.entries()) {
      if (sess.userId === data.targetUserId) {
        io.to(socketId).emit('collaboration-invite', {
          inviterId: session.userId,
          inviterName: rooms.get(data.roomId)?.users.get(session.userId)?.name || 'Someone',
          roomId: data.roomId,
          roomType: data.roomType,
          message: data.message || 'Would you like to collaborate on this?',
          timestamp: new Date(),
        });
        break;
      }
    }
  });

  /**
   * Handle disconnection
   */
  socket.on('disconnect', (reason) => {
    console.log(`❌ User disconnected: ${socket.id} (reason: ${reason})`);

    const session = userSessions.get(socket.id);
    if (session) {
      // Mark as offline in all rooms
      for (const [roomId, room] of rooms.entries()) {
        if (room.users.has(session.userId)) {
          const user = room.users.get(session.userId)!;
          
          // Keep user in room briefly for reconnection
          setTimeout(() => {
            // Check if user reconnected
            const stillConnected = Array.from(userSessions.values())
              .some(s => s.userId === session.userId);
            
            if (!stillConnected && room.users.has(session.userId)) {
              room.users.delete(session.userId);
              
              socket.to(roomId).emit('user-left', {
                userId: session.userId,
                totalUsers: room.users.size,
                reason: 'disconnected',
              });

              console.log(`⏰ Timed out user ${session.userId} from room ${roomId}`);
            }
          }, 30 * 1000); // 30 second grace period for reconnection
        }
      }

      userSessions.delete(socket.id);
    }
  });

  // ==================== ERROR HANDLING ====================

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// ==================== HEALTH CHECKS & MAINTENANCE ====================

// Periodic cleanup of inactive users
setInterval(() => {
  const now = Date.now();
  const INACTIVE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  for (const [roomId, room] of rooms.entries()) {
    for (const [userId, user] of room.users.entries()) {
      if (now - user.lastActivity.getTime() > INACTIVE_THRESHOLD) {
        // Mark as away
        io.to(user.socketId).emit('status-warning', {
          type: 'inactive',
          message: 'You appear to be inactive',
        });
      }
    }
  }
}, 60 * 1000); // Check every minute

// ==================== START SERVER ====================

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║     🚀 NEXUS Collaboration Service Running           ║
║     Port: ${PORT.toString().padEnd(40)}║
║     Mode: ${process.env.NODE_ENV || 'development'.padEnd(38)}║
╚═══════════════════════════════════════════════════════╝
  `);
  
  console.log(`📊 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🔗 CORS origins: ${process.env.CORS_ORIGINS || 'http://localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received. Closing connections...');
  io.close(() => {
    console.log('✅ All connections closed');
    process.exit(0);
  });
});

export { io, rooms, userSessions };
