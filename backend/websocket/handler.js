import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import url from 'url';

let wss = null;
const clients = new Map(); // Map to store userId -> WebSocket connection

/**
 * Initialize WebSocket server
 * @param {Object} server - HTTP server instance
 */
export const initializeWebSocket = (server) => {
  wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws, req) => {
    const queryParams = url.parse(req.url, true).query;
    const token = queryParams.token;
    
    if (!token) {
      ws.close(1008, 'Authentication required');
      return;
    }
    
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretKey');
      
      // Store client connection
      const clientId = `${decoded.role}_${decoded.id}`;
      clients.set(clientId, ws);
      
      console.log(`✅ WebSocket client connected: ${decoded.role} - ${decoded.id}`);
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection_established',
        message: 'Connected to notification service',
        clientId
      }));
      
      // Handle incoming messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          handleClientMessage(ws, clientId, data);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });
      
      // Handle client disconnect
      ws.on('close', () => {
        clients.delete(clientId);
        console.log(`❌ WebSocket client disconnected: ${clientId}`);
      });
      
      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(clientId);
      });
      
    } catch (err) {
      console.error('WebSocket authentication error:', err);
      ws.close(1008, 'Authentication failed');
    }
  });
  
  console.log('✅ WebSocket server initialized');
};

/**
 * Handle messages from clients
 * @param {WebSocket} ws - WebSocket connection
 * @param {string} clientId - Client identifier
 * @param {Object} data - Message data
 */
const handleClientMessage = (ws, clientId, data) => {
  switch (data.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
      
    case 'subscribe':
      // Client can subscribe to specific channels
      console.log(`Client ${clientId} subscribed to: ${data.channel}`);
      ws.send(JSON.stringify({
        type: 'subscribed',
        channel: data.channel
      }));
      break;
      
    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type'
      }));
  }
};

/**
 * Broadcast message to all connected users (buyers)
 * @param {Object} data - Data to broadcast
 */
export const broadcastToUsers = (data) => {
  if (!wss) {
    console.warn('WebSocket server not initialized');
    return;
  }
  
  let sentCount = 0;
  
  clients.forEach((ws, clientId) => {
    // Only send to users (buyers), not sellers or admins
    if (clientId.startsWith('user_') && ws.readyState === 1) {
      try {
        ws.send(JSON.stringify(data));
        sentCount++;
      } catch (err) {
        console.error(`Error sending to client ${clientId}:`, err);
      }
    }
  });
  
  console.log(`📢 Broadcast sent to ${sentCount} users`);
  return sentCount;
};

/**
 * Send message to specific user
 * @param {string} userId - User ID
 * @param {Object} data - Data to send
 */
export const sendToUser = (userId, data) => {
  const clientId = `user_${userId}`;
  const ws = clients.get(clientId);
  
  if (ws && ws.readyState === 1) {
    try {
      ws.send(JSON.stringify(data));
      return true;
    } catch (err) {
      console.error(`Error sending to user ${userId}:`, err);
      return false;
    }
  }
  
  return false;
};

/**
 * Send message to specific seller
 * @param {string} sellerId - Seller ID
 * @param {Object} data - Data to send
 */
export const sendToSeller = (sellerId, data) => {
  const clientId = `seller_${sellerId}`;
  const ws = clients.get(clientId);
  
  if (ws && ws.readyState === 1) {
    try {
      ws.send(JSON.stringify(data));
      return true;
    } catch (err) {
      console.error(`Error sending to seller ${sellerId}:`, err);
      return false;
    }
  }
  
  return false;
};

/**
 * Get connected clients count
 */
export const getConnectedClientsCount = () => {
  const counts = {
    users: 0,
    sellers: 0,
    admins: 0,
    total: clients.size
  };
  
  clients.forEach((_, clientId) => {
    if (clientId.startsWith('user_')) counts.users++;
    else if (clientId.startsWith('seller_')) counts.sellers++;
    else if (clientId.startsWith('admin_')) counts.admins++;
  });
  
  return counts;
};

/**
 * Broadcast to all connected clients
 * @param {Object} data - Data to broadcast
 */
export const broadcastToAll = (data) => {
  if (!wss) {
    console.warn('WebSocket server not initialized');
    return;
  }
  
  let sentCount = 0;
  
  clients.forEach((ws, clientId) => {
    if (ws.readyState === 1) {
      try {
        ws.send(JSON.stringify(data));
        sentCount++;
      } catch (err) {
        console.error(`Error broadcasting to client ${clientId}:`, err);
      }
    }
  });
  
  console.log(`📢 Broadcast sent to ${sentCount} clients`);
  return sentCount;
};

export default {
  initializeWebSocket,
  broadcastToUsers,
  sendToUser,
  sendToSeller,
  getConnectedClientsCount,
  broadcastToAll
};
