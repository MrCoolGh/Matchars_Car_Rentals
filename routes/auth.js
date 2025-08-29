const express = require('express');
const path = require('path');
const { pool } = require('../config/db');
const router = express.Router();
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'avatar-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'auth', 'sign_in.html'));
});

router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'auth', 'sign_up.html'));
});

router.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'auth', 'forgot_password.html'));
});

// Helper function to hash passwords
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// API endpoint for user login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Hash the password for comparison
        const hashedPassword = hashPassword(password);

        // Query the database for the user
        const [users] = await pool.query(
            'SELECT id, first_name, last_name, email, phone, avatar, role, address, dob FROM users WHERE email = ? AND password = ?',
            [email, hashedPassword]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        const redirectUrl = '../all_users/homepage.html';

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                role: user.role,
                address: user.address || '',
                dob: user.dob || '',
                username: `${user.first_name.toLowerCase()}-${user.last_name.toLowerCase()}`
            },
            redirectUrl
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// Register user endpoint
router.post('/register', upload.single('avatar'), async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password, address, dob } = req.body;

        // Validate inputs
        if (!firstName || !lastName || !email || !phone || !password) {
            // Remove uploaded file if validation fails
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                success: false,
                message: 'First name, last name, email, phone, and password are required'
            });
        }

        // Check if email already exists
        const [existingUsers] = await pool.query(
            'SELECT * FROM users WHERE email = ? LIMIT 1',
            [email]
        );

        if (existingUsers.length > 0) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const hashedPassword = hashPassword(password);

        // Get avatar path if uploaded
        const avatarPath = req.file
            ? `/uploads/avatars/${req.file.filename}`
            : '/images/avatar/default.jpg';

        // Insert new user with 'customer' as default role
        const [result] = await pool.query(
            `INSERT INTO users
             (first_name, last_name, email, phone, password, avatar, role, address, dob, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 'customer', ?, ?, NOW())`,
            [firstName, lastName, email, phone, hashedPassword, avatarPath, address || null, dob || null]
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            userId: result.insertId,
            redirectUrl: '../auth/sign_in.html'
        });

    } catch (error) {
        // Remove uploaded file if any error occurs
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// New endpoint for avatar upload
router.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No avatar file provided'
            });
        }

        // Return the path to the uploaded file
        const avatarPath = `/uploads/avatars/${req.file.filename}`;

        res.json({
            success: true,
            message: 'Avatar uploaded successfully',
            avatarPath: avatarPath
        });
    } catch (error) {
        // Clean up on error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        console.error('Avatar upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during avatar upload'
        });
    }
});

// New endpoint for password change
router.post('/change-password', async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'User ID, current password and new password are required'
            });
        }

        // Hash passwords
        const hashedCurrentPassword = hashPassword(currentPassword);
        const hashedNewPassword = hashPassword(newPassword);

        // Verify current password
        const [users] = await pool.query(
            'SELECT id FROM users WHERE id = ? AND password = ?',
            [userId, hashedCurrentPassword]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        await pool.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedNewPassword, userId]
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during password change'
        });
    }
});

// New endpoint for account deletion
router.post('/delete-account', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Delete user
        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Account deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during account deletion'
        });
    }
});

// New endpoint for profile update
router.post('/update-profile', async (req, res) => {
    try {
        const { userId, userData } = req.body;

        if (!userId || !userData) {
            return res.status(400).json({
                success: false,
                message: 'User ID and user data are required'
            });
        }

        // Validate required fields
        if (!userData.first_name || !userData.last_name || !userData.email) {
            return res.status(400).json({
                success: false,
                message: 'First name, last name, and email are required'
            });
        }

        console.log('Updating profile for user ID:', userId);
        console.log('Update data:', userData);

        // Update user in database - REMOVED username field from the query
        const [result] = await pool.query(
            `UPDATE users SET 
             first_name = ?, 
             last_name = ?, 
             email = ?, 
             phone = ?, 
             dob = ?, 
             address = ?, 
             role = ?, 
             avatar = ?
             WHERE id = ?`,
            [
                userData.first_name,
                userData.last_name,
                userData.email,
                userData.phone || null,
                userData.dob || null,
                userData.address || null,
                userData.role || 'customer',
                userData.avatar || null,
                userId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during profile update: ' + error.message
        });
    }
});

module.exports = router;