const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { testConnection, pool } = require('./config/db');
require('dotenv').config();

// Import routes
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const managerRoutes = require('./routes/manager');
const bookingRoutes = require('./routes/bookings');
const staffRoutes = require('./routes/staff');
const carRoutes = require('./routes/cars');
const formRoutes = require('./routes/form');
const userRoutes = require('./routes/user');

// ===== CHAT INTEGRATION START (existing) =====
const http = require('http');
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET','POST'] }
});
app.set('io', io);
// ===== CHAT INTEGRATION END (existing) =====

// ===== PRESENCE TRACKING STATE START =====
const presenceMap = new Map();
// ===== PRESENCE TRACKING STATE END =====

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static
app.use('/', express.static(path.join(__dirname)));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/customer', customerRoutes);
app.use('/manager', managerRoutes);
app.use(carRoutes);
app.use('/forms', formRoutes);
app.use('/user', userRoutes);
app.use(bookingRoutes);
app.use(staffRoutes);
app.use('/forms', formRoutes);

// ===== CHAT INTEGRATION START (existing + new) =====
const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

io.use((socket, next) => {
    const { userId } = socket.handshake.auth || {};
    if (!userId) return next(new Error('NO_USER_ID'));
    socket.userId = Number(userId);
    next();
});

io.on('connection', (socket) => {
    const uid = socket.userId;
    socket.join(`user_${uid}`);

    // ===== PRESENCE: ON CONNECT START =====
    let entry = presenceMap.get(uid);
    if (!entry) {
        entry = { sockets: new Set(), status: 'offline', last_seen: null };
        presenceMap.set(uid, entry);
    }
    entry.sockets.add(socket.id);
    entry.status = 'online';
    entry.last_seen = new Date();
    io.emit('chat:presence', { userId: uid, status: 'online', last_seen: entry.last_seen });
    // ===== PRESENCE: ON CONNECT END =====

    // ===== TYPING HANDLERS START =====
    socket.on('chat:typing', ({ to }) => {
        if (!to) return;
        io.to(`user_${to}`).emit('chat:typing', { from: uid });
    });
    socket.on('chat:stop_typing', ({ to }) => {
        if (!to) return;
        io.to(`user_${to}`).emit('chat:stop_typing', { from: uid });
    });
    // ===== TYPING HANDLERS END =====

    socket.on('disconnect', async () => {
        const ent = presenceMap.get(uid);
        if (ent) {
            ent.sockets.delete(socket.id);
            if (ent.sockets.size === 0) {
                ent.status = 'offline';
                ent.last_seen = new Date();
                // Persist last_seen to DB
                try {
                    await pool.query('UPDATE users SET last_seen=? WHERE id=?', [ent.last_seen, uid]);
                } catch(e) { console.warn('Failed to update last_seen DB:', e.message); }
                io.emit('chat:presence', { userId: uid, status: 'offline', last_seen: ent.last_seen });
            }
        }
    });
});
// ===== CHAT INTEGRATION END (existing + new) =====

// Root HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Auth HTML
app.get('/sign_in', (req, res) => {
    res.sendFile(path.join(__dirname, 'auth', 'sign_in.html'));
});
app.get('/sign_up', (req, res) => {
    res.sendFile(path.join(__dirname, 'auth', 'sign_up.html'));
});
app.get('/forgot_password', (req, res) => {
    res.sendFile(path.join(__dirname, 'auth', 'forgot_password.html'));
});

// 404 handler
app.use((req, res, next) => {
    if (
        req.path.startsWith('/api') ||
        req.path.startsWith('/auth') ||
        req.path.startsWith('/user') ||
        req.path.startsWith('/admin') ||
        req.path.startsWith('/customer') ||
        req.path.startsWith('/manager') ||
        req.path.startsWith('/forms')
    ) {
        console.log(`404 API: ${req.path}`);
        return res.status(404).json({ error: 'Endpoint not found' });
    }
    console.log(`404 Page: ${req.path}`);
    res.status(404).send('Page not found');
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (
        req.path.startsWith('/api') ||
        req.path.startsWith('/auth') ||
        req.path.startsWith('/user') ||
        req.path.startsWith('/admin') ||
        req.path.startsWith('/customer') ||
        req.path.startsWith('/manager') ||
        req.path.startsWith('/forms')
    ) {
        return res.status(500).json({ error: 'Server error', message: err.message });
    }
    res.status(500).send('Something broke!');
});

// Start
async function startServer() {
    const dbConnected = await testConnection();
    if (dbConnected) {
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Visit http://localhost:${PORT}`);
        });
    } else {
        console.error('Failed to connect to database. Server not started.');
        process.exit(1);
    }
}

startServer();