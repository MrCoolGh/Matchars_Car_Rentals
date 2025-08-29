const express = require('express');
const { pool } = require('../config/db');
const router = express.Router();
const crypto = require('crypto');

// Helper function to hash passwords
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Get all users (excluding the current logged-in user)
router.get('/api/users', async (req, res) => {
    try {
        // Get the current logged in user from the session or token
        const currentUser = req.session?.user || {};
        const currentUserId = currentUser.id;

        let query = `
            SELECT id, first_name, last_name, email, phone, role, avatar, address, dob, created_at
            FROM users
        `;

        const params = [];

        // Exclude the current user if we have their ID
        if (currentUserId) {
            query += ` WHERE id != ? `;
            params.push(currentUserId);
        }

        query += ` ORDER BY created_at DESC`;

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Database error: ' + error.message });
    }
});

// --- RECENT USERS API ---
router.get('/api/recent-users', async (req, res) => {
    try {
        // You can adjust the LIMIT for "recent" as needed (e.g. 10, 12, 20)
        const query = `
            SELECT id, first_name, last_name, phone, avatar, role, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 12
        `;
        const [rows] = await pool.query(query);

        // Optional: add online status if you have a way to track online users
        // For now, all users are set as offline in this example
        const users = rows.map(user => ({
            ...user,
            online: false // Set this to true if your system tracks online users
        }));

        res.json(users);
    } catch (error) {
        console.error('Error fetching recent users:', error);
        res.status(500).json({ success: false, message: 'Database error: ' + error.message });
    }
});

// Create a new user
router.post('/api/users', async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            phone,
            role,
            password,
            dob,
            address,
            avatar
        } = req.body;

        // Validate required fields
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'First name, last name, email, and password are required'
            });
        }

        // Check if email already exists
        const [existingUsers] = await pool.query(
            'SELECT * FROM users WHERE email = ? LIMIT 1',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash the password
        const hashedPassword = hashPassword(password);

        // Insert the new user into the database
        const [result] = await pool.query(
            `INSERT INTO users
             (first_name, last_name, email, phone, password, avatar, role, address, dob, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [first_name, last_name, email, phone || null, hashedPassword, avatar || null, role || 'Customer', address || null, dob || null]
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ success: false, message: 'Database error: ' + error.message });
    }
});

// Update a user
router.put('/api/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const {
            first_name,
            last_name,
            email,
            phone,
            role,
            password,
            dob,
            address,
            avatar
        } = req.body;

        // Validate required fields
        if (!first_name || !last_name || !email) {
            return res.status(400).json({
                success: false,
                message: 'First name, last name, and email are required'
            });
        }

        // Check if email is already in use by another user
        if (email) {
            const [existingUsers] = await pool.query(
                'SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1',
                [email, userId]
            );

            if (existingUsers.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already in use by another user'
                });
            }
        }

        // Build the update query dynamically
        let updateQuery = `
            UPDATE users
            SET first_name = ?, last_name = ?, email = ?, phone = ?, role = ?, address = ?, dob = ?
        `;

        let params = [first_name, last_name, email, phone || null, role || 'Customer', address || null, dob || null];

        // Add password to update if provided
        if (password) {
            updateQuery += ', password = ?';
            params.push(hashPassword(password));
        }

        // Add avatar to update if provided
        if (avatar) {
            updateQuery += ', avatar = ?';
            params.push(avatar);
        }

        // Add the WHERE clause
        updateQuery += ' WHERE id = ?';
        params.push(userId);

        // Execute the update query
        const [result] = await pool.query(updateQuery, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User updated successfully'
        });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Database error: ' + error.message });
    }
});

// Delete a user
router.delete('/api/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // Get current user to prevent self-deletion
        const currentUser = req.session?.user || {};
        const currentUserId = currentUser.id;

        // Prevent users from deleting themselves
        if (currentUserId && currentUserId.toString() === userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You cannot delete your own account from this interface'
            });
        }

        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: 'Database error: ' + error.message });
    }
});

module.exports = router;