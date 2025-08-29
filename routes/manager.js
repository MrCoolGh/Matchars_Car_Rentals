const express = require('express');
const path = require('path');
const router = express.Router();

// Serve admin HTML pages
router.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'manager', 'manager_dashboard.html'));
});

router.get('/bookings', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'manager', 'manager_bookings.html'));
});


// API endpoints for admin
router.get('/api/users', (req, res) => {
    // Implementation for getting all users
    res.status(501).json({ message: 'Not implemented yet' });
});

module.exports = router;