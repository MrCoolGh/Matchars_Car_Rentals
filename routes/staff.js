const express = require('express');
const { pool } = require('../config/db');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'staff');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'staff-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Get all staff (admin view - includes visibility status)
router.get('/api/staff', async (req, res) => {
    try {
        const [staff] = await pool.query(`
            SELECT id, fullName, email, phone, role, avatar, is_visible, created_at, updated_at
            FROM staff
            ORDER BY fullName ASC
        `);

        // Transform database records to match frontend format
        const staffFormatted = staff.map(member => ({
            id: member.id,
            fullName: member.fullName,
            phone: member.phone,
            email: member.email,
            role: member.role,
            avatar: member.avatar,
            showActive: !member.is_visible, // If not visible, "Show" button is active
            hideActive: member.is_visible    // If visible, "Hide" button is active
        }));

        res.json(staffFormatted);
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({ success: false, message: 'Database error: ' + error.message });
    }
});

// Get only visible staff (public view)
router.get('/api/public/staff', async (req, res) => {
    try {
        const [staff] = await pool.query(`
            SELECT id, fullName, email, phone, role, avatar
            FROM staff
            WHERE is_visible = TRUE
            ORDER BY fullName ASC
        `);

        res.json(staff);
    } catch (error) {
        console.error('Error fetching public staff:', error);
        res.status(500).json({ success: false, message: 'Database error: ' + error.message });
    }
});

// Upload staff avatar
router.post('/api/staff/upload-avatar', upload.single('avatar'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        // Return the path to the uploaded file
        const avatarPath = `/uploads/staff/${req.file.filename}`;

        res.json({
            success: true,
            message: 'Avatar uploaded successfully',
            avatarPath: avatarPath
        });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during avatar upload: ' + error.message
        });
    }
});

// Add new staff
router.post('/api/staff', async (req, res) => {
    try {
        const { fullName, email, phone, role, avatar } = req.body;

        // Validate required fields
        if (!fullName || !email || !phone || !role) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Insert staff into database
        const [result] = await pool.query(`
            INSERT INTO staff (fullName, email, phone, role, avatar)
            VALUES (?, ?, ?, ?, ?)
        `, [fullName, email, phone, role, avatar || '/images/avatar/default.jpg']);

        // Get the newly added staff with all fields
        const [newStaff] = await pool.query(`
            SELECT id, fullName, email, phone, role, avatar, is_visible
            FROM staff
            WHERE id = ?
        `, [result.insertId]);

        const staffFormatted = {
            id: newStaff[0].id,
            fullName: newStaff[0].fullName,
            phone: newStaff[0].phone,
            email: newStaff[0].email,
            role: newStaff[0].role,
            avatar: newStaff[0].avatar,
            showActive: !newStaff[0].is_visible,
            hideActive: newStaff[0].is_visible
        };

        res.status(201).json({
            success: true,
            message: 'Staff added successfully',
            staff: staffFormatted
        });
    } catch (error) {
        console.error('Error adding staff:', error);
        res.status(500).json({
            success: false,
            message: 'Database error: ' + error.message
        });
    }
});

// Update staff
router.put('/api/staff/:id', async (req, res) => {
    try {
        const staffId = req.params.id;
        const { fullName, email, phone, role, avatar } = req.body;

        // Validate required fields
        if (!fullName || !email || !phone || !role) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Update staff in database
        const [result] = await pool.query(`
            UPDATE staff 
            SET fullName = ?, email = ?, phone = ?, role = ?, avatar = ?
            WHERE id = ?
        `, [fullName, email, phone, role, avatar, staffId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }

        res.json({
            success: true,
            message: 'Staff updated successfully'
        });
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(500).json({
            success: false,
            message: 'Database error: ' + error.message
        });
    }
});

// Toggle staff visibility
router.put('/api/staff/:id/visibility', async (req, res) => {
    try {
        const staffId = req.params.id;
        const { isVisible } = req.body;

        // Update visibility in database
        const [result] = await pool.query(`
            UPDATE staff 
            SET is_visible = ?
            WHERE id = ?
        `, [isVisible, staffId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }

        res.json({
            success: true,
            message: `Staff is now ${isVisible ? 'visible' : 'hidden'}`
        });
    } catch (error) {
        console.error('Error updating staff visibility:', error);
        res.status(500).json({
            success: false,
            message: 'Database error: ' + error.message
        });
    }
});

// Delete staff
router.delete('/api/staff/:id', async (req, res) => {
    try {
        const staffId = req.params.id;

        // Delete staff from database
        const [result] = await pool.query('DELETE FROM staff WHERE id = ?', [staffId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }

        res.json({
            success: true,
            message: 'Staff deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).json({
            success: false,
            message: 'Database error: ' + error.message
        });
    }
});

module.exports = router;