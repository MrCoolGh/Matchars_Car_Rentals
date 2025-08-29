const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

/* ================= IMAGE UPLOAD (existing) ================= */
const chatUploadDir = path.join(__dirname, '..', 'uploads', 'chat');
if (!fs.existsSync(chatUploadDir)) {
    fs.mkdirSync(chatUploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, chatUploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = 'chat-' + Date.now() + '-' + Math.round(Math.random()*1e9) + ext;
        cb(null, name);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'));
        cb(null, true);
    }
});

/* Upload endpoint */
router.post('/upload-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'NO_FILE' });
        const url = `/uploads/chat/${req.file.filename}`;
        return res.json({ success: true, url });
    } catch (e) {
        console.error('Upload image error:', e);
        res.status(500).json({ error: 'SERVER_ERROR' });
    }
});

/* ============ HELPERS ============ */
async function getOrCreateConversation(userA, userB) {
    const a = Math.min(userA, userB);
    const b = Math.max(userA, userB);
    const [rows] = await pool.query(
        'SELECT id FROM chat_conversations WHERE participant_a=? AND participant_b=? LIMIT 1',
        [a, b]
    );
    if (rows.length) return rows[0].id;
    const [ins] = await pool.query(
        'INSERT INTO chat_conversations (participant_a, participant_b) VALUES (?,?)',
        [a, b]
    );
    return ins.insertId;
}

/* ============ GET MESSAGES WITH PAGINATION (ADDED) ============ */
/*
  Two pagination styles supported:
    1) beforeId: pass ?beforeId=<messageId>&limit=30 to load older messages with id < beforeId
    2) page / pageSize: pass ?page=1&pageSize=30 (fallback if beforeId not provided)
  Always returns messages in ascending order for UI.
*/
router.get('/messages/:otherUserId', async (req, res) => {
    try {
        const currentUserId = Number(req.query.currentUserId);
        const otherUserId = Number(req.params.otherUserId);
        if (!currentUserId || !otherUserId)
            return res.status(400).json({ error: 'MISSING_USER_ID' });

        const conversationId = await getOrCreateConversation(currentUserId, otherUserId);

        const beforeId = req.query.beforeId ? Number(req.query.beforeId) : null;
        const page = req.query.page ? Number(req.query.page) : 1;
        const pageSize = req.query.pageSize ? Math.min(Number(req.query.pageSize), 100) : 30;

        let messages = [];
        let hasMore = false;

        if (beforeId) {
            const [rows] = await pool.query(
                `SELECT id, conversation_id, sender_id, receiver_id, type, content, image_url, created_at, read_at
           FROM chat_messages
          WHERE conversation_id=? AND id < ?
          ORDER BY id DESC
          LIMIT ?`,
                [conversationId, beforeId, pageSize + 1] // fetch one extra to know hasMore
            );
            hasMore = rows.length > pageSize;
            messages = rows.slice(0, pageSize).reverse();
        } else {
            const offset = (page - 1) * pageSize;
            // For large tables this is less optimal than keyset, but we support the dual mode.
            const [rows] = await pool.query(
                `SELECT id, conversation_id, sender_id, receiver_id, type, content, image_url, created_at, read_at
           FROM chat_messages
          WHERE conversation_id=?
          ORDER BY id DESC
          LIMIT ? OFFSET ?`,
                [conversationId, pageSize + 1, offset]
            );
            hasMore = rows.length > pageSize;
            messages = rows.slice(0, pageSize).reverse();
        }

        res.json({
            conversationId,
            messages,
            hasMore,
            pagination: {
                mode: beforeId ? 'cursor' : 'page',
                page,
                pageSize,
                beforeIdNext: messages.length ? messages[0].id : null
            }
        });
    } catch (e) {
        console.error('GET messages error:', e);
        res.status(500).json({ error: 'SERVER_ERROR' });
    }
});

/* ============ SEND MESSAGE ============ */
router.post('/messages', async (req, res) => {
    try {
        const { currentUserId, to, type = 'text', content = '', imageUrl = null } = req.body;
        if (!currentUserId || !to) return res.status(400).json({ error: 'MISSING_PARAMS' });
        if (type === 'text' && !content.trim()) return res.status(400).json({ error: 'EMPTY_CONTENT' });

        const conversationId = await getOrCreateConversation(Number(currentUserId), Number(to));

        const [result] = await pool.query(
            `INSERT INTO chat_messages (conversation_id, sender_id, receiver_id, type, content, image_url)
             VALUES (?,?,?,?,?,?)`,
            [conversationId, currentUserId, to, type, content, imageUrl]
        );

        await pool.query(
            'UPDATE chat_conversations SET last_message_id=?, updated_at=NOW() WHERE id=?',
            [result.insertId, conversationId]
        );

        const [rows] = await pool.query(
            `SELECT id, conversation_id, sender_id, receiver_id, type, content, image_url,
                    created_at, read_at
             FROM chat_messages WHERE id=? LIMIT 1`,
            [result.insertId]
        );
        const message = rows[0];

        // Emit real-time
        req.app.get('io')?.to(`user_${to}`).emit('chat:new_message', { conversationId, message });
        req.app.get('io')?.to(`user_${currentUserId}`).emit('chat:new_message', { conversationId, message });

        res.status(201).json({ conversationId, message });
    } catch (e) {
        console.error('POST message error:', e);
        res.status(500).json({ error: 'SERVER_ERROR' });
    }
});

/* ============ MARK MESSAGES AS READ ============ */
router.post('/messages/read', async (req, res) => {
    try {
        const { currentUserId, otherUserId } = req.body;
        if (!currentUserId || !otherUserId)
            return res.status(400).json({ error: 'MISSING_PARAMS' });

        await pool.query(
            `UPDATE chat_messages
             SET read_at = NOW()
             WHERE sender_id=? AND receiver_id=? AND read_at IS NULL`,
            [otherUserId, currentUserId]
        );
        res.json({ success: true });
    } catch (e) {
        console.error('READ messages error:', e);
        res.status(500).json({ error: 'SERVER_ERROR' });
    }
});

/* ============ UNREAD SUMMARY ============ */
router.get('/unread-summary', async (req, res) => {
    try {
        const currentUserId = Number(req.query.currentUserId);
        if (!currentUserId) return res.status(400).json({ error: 'MISSING_USER_ID' });

        const [unreads] = await pool.query(
            `SELECT sender_id AS otherUserId, COUNT(*) AS unreadCount
             FROM chat_messages
             WHERE receiver_id=? AND read_at IS NULL
             GROUP BY sender_id`,
            [currentUserId]
        );

        const [lasts] = await pool.query(
            `SELECT
                 (CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END) AS otherUserId,
                 content, image_url, type, created_at
             FROM chat_messages
             WHERE sender_id = ? OR receiver_id = ?
             ORDER BY id DESC`,
            [currentUserId, currentUserId, currentUserId]
        );

        const lastMap = {};
        for (const row of lasts) {
            if (!lastMap[row.otherUserId]) {
                lastMap[row.otherUserId] = {
                    lastMessage: row.type === 'image' ? '[Image]' : row.content,
                    lastTime: row.created_at
                };
            }
        }

        const result = unreads.map(u => ({
            otherUserId: u.otherUserId,
            unreadCount: Number(u.unreadCount),
            lastMessage: lastMap[u.otherUserId]?.lastMessage || '',
            lastTime: lastMap[u.otherUserId]?.lastTime || ''
        }));

        res.json(result);
    } catch (e) {
        console.error('UNREAD SUMMARY error:', e);
        res.status(500).json({ error: 'SERVER_ERROR' });
    }
});


router.get('/presence', async (req, res) => {
    try {
        const idsParam = req.query.userIds;
        if (!idsParam) return res.json([]);
        const userIds = idsParam.split(',').map(n => Number(n)).filter(Boolean);
        if (!userIds.length) return res.json([]);

        // Fetch last_seen from DB
        const [rows] = await pool.query(
            `SELECT id, last_seen FROM users WHERE id IN (${userIds.map(()=>'?').join(',')})`,
            userIds
        );

        const map = new Map(rows.map(r => [r.id, r.last_seen]));
        const result = userIds.map(id => {
            return {
                userId: id,
                status: 'offline', // default
                last_seen: map.get(id) || null
            };
        });

        // We'll rely on runtime presence delivered by socket events for 'online' overrides (client merges).
        res.json(result);
    } catch(e) {
        console.error('Presence endpoint error:', e);
        res.status(500).json({ error: 'SERVER_ERROR' });
    }
});

module.exports = router;