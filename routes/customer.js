const express = require('express');
const path = require('path');
const router = express.Router();

// Serve customer HTML pages
router.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'customer', 'customer_dashboard.html'));
});

router.get('/bookings', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'customer', 'customer_bookings.html'));
});



// API endpoints for customer
router.post('/api/bookings', (req, res) => {
    // Implementation for creating bookings
    res.status(501).json({ message: 'Not implemented yet' });
});

module.exports = router;