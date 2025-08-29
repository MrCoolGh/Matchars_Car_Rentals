const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const bcrypt = require('bcrypt');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');

// Get user profile
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, first_name as firstName, last_name as lastName, email, phone, dob, address, role, avatar, username FROM users WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Update user profile
router.put('/:id', async (req, res) => {
    const { firstName, lastName, email, phone, dob, address, role, avatar, username } = req.body;

    console.log('Received update request for user ID:', req.params.id);
    console.log('Update data:', req.body);

    try {
        const [result] = await pool.query(
            'UPDATE users SET first_name=?, last_name=?, email=?, phone=?, dob=?, address=?, role=?, avatar=?, username=? WHERE id=?',
            [firstName, lastName, email, phone, dob, address, role || 'customer', avatar, username || `${firstName.toLowerCase()}-${lastName.toLowerCase()}`, req.params.id]
        );

        console.log('Update result:', result);

        if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error: ' + error.message });
    }
});

// Change password
router.put('/:id/password', async (req, res) => {
    const { current, new: newPassword } = req.body;
    try {
        const [rows] = await pool.query('SELECT password FROM users WHERE id=?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

        // Compare the passwords
        const crypto = require('crypto');
        const hashedCurrentPassword = crypto.createHash('sha256').update(current).digest('hex');

        if (rows[0].password !== hashedCurrentPassword) {
            return res.status(400).json({ error: 'Current password incorrect' });
        }

        // Hash the new password
        const hashedNewPassword = crypto.createHash('sha256').update(newPassword).digest('hex');

        await pool.query('UPDATE users SET password=? WHERE id=?', [hashedNewPassword, req.params.id]);
        res.json({ message: 'Password changed' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM users WHERE id=?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});



// Setup SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ----- REQUEST PASSWORD RESET -----
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'No user with that email' });
        }
        const user = rows[0];

        // Generate token and expiry
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 40 * 40 * 1000); // 40 minutes expiry

        await pool.query('UPDATE users SET reset_token=?, reset_token_expiry=? WHERE id=?', [token, expiry, user.id]);

        // Send email with SendGrid Dynamic Template
        const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/auth/new_password.html?token=${token}`;
        const msg = {
            to: email,
            from: 'pdwamena007@st.ug.edu.gh', // This must be a verified sender in SendGrid!
            templateId: 'd-83815eafc2704d8093c9e5b947244a27', // Your SendGrid template ID
            dynamic_template_data: {
                username: user.username || user.first_name || email, // use username, name, or email if username not available
                resetUrl: resetUrl,
                year: new Date().getFullYear()
                // Add more variables if your template expects them
            }
        };

        await sgMail.send(msg);

        res.json({ message: 'Password reset link sent. Please check your email (including your spam folder).' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ----- RESET PASSWORD -----
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE reset_token=?', [token]);
        if (rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired token.' });
        }
        const user = rows[0];

        // Check if token is expired
        if (!user.reset_token_expiry || new Date(user.reset_token_expiry) < new Date()) {
            return res.status(400).json({ error: 'Token has expired.' });
        }

        // Hash new password
        const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');

        await pool.query('UPDATE users SET password=?, reset_token=NULL, reset_token_expiry=NULL WHERE id=?', [hashedPassword, user.id]);

        res.json({ message: 'Password has been reset. You can now sign in with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;