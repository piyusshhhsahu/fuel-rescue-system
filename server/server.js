const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/agents', require('./routes/agentRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Socket.io Logic
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join room based on role/id (e.g., "pump_123", "user_456", "agent_789")
    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
    });

    // Handle new fuel request from user
    socket.on('new_request', (data) => {
        // Broadcast to all connected clients (pumps will pick it up)
        io.emit('incoming_request', data);
    });

    // Handle order status update (generic)
    socket.on('update_status', (data) => {
        // data: { orderId, status, userId }
        if (data.userId) {
            io.to(`user_${data.userId}`).emit('status_changed', data);
        }
        // Also broadcast to pumps
        io.emit('order_status_updated', data);
    });

    // Pump assigns an agent to an order
    socket.on('assign_agent', (data) => {
        // data: { orderId, agentId, agentName, orderDetails }
        console.log(`Assigning agent ${data.agentId} to order ${data.orderId}`);
        // Notify the specific agent
        io.to(`agent_${data.agentId}`).emit('new_assignment', data);
        // Notify the user that agent is assigned
        if (data.userId) {
            io.to(`user_${data.userId}`).emit('status_changed', {
                orderId: data.orderId,
                status: 'Assigned',
                agentName: data.agentName
            });
        }
    });

    // Agent accepts or declines the assignment
    socket.on('agent_response', (data) => {
        // data: { orderId, status, agentId, agentName, userId }
        console.log(`Agent ${data.agentId} responded with ${data.status} for order ${data.orderId}`);
        // Notify user
        if (data.userId) {
            io.to(`user_${data.userId}`).emit('status_changed', {
                orderId: data.orderId,
                status: data.status,
                agentName: data.agentName
            });
        }
        // Notify pumps
        io.emit('agent_responded', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
