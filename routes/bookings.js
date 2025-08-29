const express = require('express');
const { pool } = require('../config/db');
const router = express.Router();

// Get all bookings (admin view)
router.get('/api/bookings', async (req, res) => {
    try {
        const [bookings] = await pool.query(`
            SELECT b.*, 
                   u.first_name, u.last_name, u.email, u.phone,
                   c.name AS car_name, c.image AS car_image, c.price AS price_per_day,
                   c.year AS car_year, c.transmission
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN cars c ON b.car_id = c.id
            ORDER BY b.created_at DESC
        `);

        // Transform data to match frontend expectations
        const formattedBookings = bookings.map(booking => ({
            id: booking.id,
            customerName: `${booking.first_name} ${booking.last_name}`,
            customerPhone: booking.phone || 'N/A',
            customerEmail: booking.email,
            carName: booking.car_name,
            carImage: booking.car_image,
            pricePerDay: parseFloat(booking.price_per_day),
            pickupDate: booking.pickup_date.toISOString().split('T')[0],
            pickupTime: booking.pickup_time.slice(0, 5),
            dropoffDate: booking.dropoff_date.toISOString().split('T')[0],
            dropoffTime: booking.dropoff_time.slice(0, 5),
            pickupLocationType: booking.pickup_location_type,
            pickupLocation: booking.pickup_location || '',
            dropoffLocationType: booking.dropoff_location_type,
            dropoffLocation: booking.dropoff_location || '',
            status: booking.status,
            customerNote: booking.customer_note || '',
            managerNote: booking.manager_note || '',
            createdAt: booking.created_at,
            updatedAt: booking.updated_at,
            userId: booking.user_id,
            carId: booking.car_id
        }));

        res.json(formattedBookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
});

// Get bookings for a specific user
router.get('/api/user/bookings', async (req, res) => {
    try {
        const userId = req.query.userId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const [bookings] = await pool.query(`
            SELECT b.*, 
                   c.name AS car_name, c.image AS car_image, c.price AS price_per_day,
                   c.year AS car_year, c.transmission
            FROM bookings b
            JOIN cars c ON b.car_id = c.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        `, [userId]);

        // Transform data to match frontend expectations
        const formattedBookings = bookings.map(booking => ({
            id: booking.id,
            carName: booking.car_name,
            carImage: booking.car_image,
            pricePerDay: parseFloat(booking.price_per_day),
            pickupDate: booking.pickup_date.toISOString().split('T')[0],
            pickupTime: booking.pickup_time.slice(0, 5),
            dropoffDate: booking.dropoff_date.toISOString().split('T')[0],
            dropoffTime: booking.dropoff_time.slice(0, 5),
            pickupLocationType: booking.pickup_location_type,
            pickupLocation: booking.pickup_location || '',
            dropoffLocationType: booking.dropoff_location_type,
            dropoffLocation: booking.dropoff_location || '',
            status: booking.status,
            customerNote: booking.customer_note || '',
            managerNote: booking.manager_note || '',
            createdAt: booking.created_at
        }));

        res.json(formattedBookings);
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
});

// Create a new booking
router.post('/api/bookings', async (req, res) => {
    try {
        const {
            car_id,
            user_id,
            pickup_location_type,
            dropoff_location_type,
            pickup_location,
            dropoff_location,
            pickup_date,
            pickup_time,
            dropoff_date,
            dropoff_time,
            customer_note
        } = req.body;

        // Validate required fields
        if (!car_id || !user_id || !pickup_date || !pickup_time || !dropoff_date || !dropoff_time) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Check if the car exists
        const [carCheck] = await pool.query('SELECT id, price FROM cars WHERE id = ?', [car_id]);
        if (carCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }

        // Check if the user exists
        const [userCheck] = await pool.query('SELECT id FROM users WHERE id = ?', [user_id]);
        if (userCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if there are overlapping bookings for this car
        //const [overlappingBookings] = await pool.query(`
        //  SELECT id FROM bookings
        //   WHERE car_id = ? AND status IN ('Pending', 'Approved')
        //    AND (
        //        (pickup_date <= ? AND dropoff_date >= ?) OR
        //        (pickup_date <= ? AND dropoff_date >= ?) OR
        //        (pickup_date >= ? AND dropoff_date <= ?)
        //    )
        // `, [
        //     car_id,
        //     dropoff_date, pickup_date,
        //     pickup_date, pickup_date,
        //     pickup_date, dropoff_date
        // ]);

        // if (overlappingBookings.length > 0) {
        //     return res.status(409).json({
        //         success: false,
        //         message: 'Car is already booked for the selected dates'
        //     });
//}

        // Insert the booking
        const [result] = await pool.query(`
            INSERT INTO bookings 
            (car_id, user_id, pickup_location_type, dropoff_location_type, 
             pickup_location, dropoff_location, 
             pickup_date, pickup_time, dropoff_date, dropoff_time, 
             customer_note, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
        `, [
            car_id, user_id, pickup_location_type, dropoff_location_type,
            pickup_location || null, dropoff_location || null,
            pickup_date, pickup_time, dropoff_date, dropoff_time,
            customer_note || null
        ]);

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            bookingId: result.insertId
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
});

// Update booking (for customer edits)
router.put('/api/user/bookings/:id', async (req, res) => {
    try {
        const bookingId = req.params.id;
        const userId = req.body.user_id;
        const {
            pickup_location_type,
            dropoff_location_type,
            pickup_location,
            dropoff_location,
            pickup_date,
            pickup_time,
            dropoff_date,
            dropoff_time,
            customer_note
        } = req.body;

        // Validate user ownership
        const [bookingCheck] = await pool.query(
            'SELECT user_id, status, car_id FROM bookings WHERE id = ?',
            [bookingId]
        );

        if (bookingCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (bookingCheck[0].user_id != userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this booking'
            });
        }

        if (bookingCheck[0].status === 'Approved') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update an approved booking'
            });
        }

        // Check for overlapping bookings
        // const [overlappingBookings] = await pool.query(`
        //   SELECT id FROM bookings
        //   WHERE car_id = ? AND id != ? AND status IN ('Pending', 'Approved')
        //   AND (
        //       (pickup_date <= ? AND dropoff_date >= ?) OR
        //       (pickup_date <= ? AND dropoff_date >= ?) OR
        //       (pickup_date >= ? AND dropoff_date <= ?)
        //      )
        //  `, [
        //      bookingCheck[0].car_id, bookingId,
        //      dropoff_date, pickup_date,
        //      pickup_date, pickup_date,
        //   pickup_date, dropoff_date
        //   ]);

        //  if (overlappingBookings.length > 0) {
        //    return res.status(409).json({
        //        success: false,
        //        message: 'Car is already booked for the selected dates'
        //    });
        // }

        // Update the booking
        await pool.query(`
            UPDATE bookings 
            SET pickup_location_type = ?, dropoff_location_type = ?,
                pickup_location = ?, dropoff_location = ?,
                pickup_date = ?, pickup_time = ?,
                dropoff_date = ?, dropoff_time = ?,
                customer_note = ?,
                status = 'Pending'
            WHERE id = ?
        `, [
            pickup_location_type, dropoff_location_type,
            pickup_location || null, dropoff_location || null,
            pickup_date, pickup_time,
            dropoff_date, dropoff_time,
            customer_note || null,
            bookingId
        ]);

        res.json({
            success: true,
            message: 'Booking updated successfully'
        });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
});

// Update booking status (for admin)
router.put('/api/admin/bookings/:id/status', async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { status, manager_note } = req.body;

        if (!status || !manager_note) {
            return res.status(400).json({
                success: false,
                message: 'Status and manager note are required'
            });
        }

        // Check if booking exists
        const [bookingCheck] = await pool.query('SELECT id FROM bookings WHERE id = ?', [bookingId]);
        if (bookingCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Update the booking status
        await pool.query(`
            UPDATE bookings 
            SET status = ?, manager_note = ?
            WHERE id = ?
        `, [status, manager_note, bookingId]);

        res.json({
            success: true,
            message: 'Booking status updated successfully'
        });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
});

// Cancel booking (for customer)
router.put('/api/user/bookings/:id/cancel', async (req, res) => {
    try {
        const bookingId = req.params.id;
        const userId = req.body.user_id;

        // Validate user ownership
        const [bookingCheck] = await pool.query(
            'SELECT user_id, status FROM bookings WHERE id = ?',
            [bookingId]
        );

        if (bookingCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (bookingCheck[0].user_id != userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this booking'
            });
        }

        if (bookingCheck[0].status === 'Approved') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel an approved booking'
            });
        }

        // Update the booking status to Cancelled
        await pool.query(`
            UPDATE bookings 
            SET status = 'Cancelled'
            WHERE id = ?
        `, [bookingId]);

        res.json({
            success: true,
            message: 'Booking cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
});

// Delete booking (admin only)
router.delete('/api/admin/bookings/:id', async (req, res) => {
    try {
        const bookingId = req.params.id;

        // Check if booking exists
        const [bookingCheck] = await pool.query('SELECT id, status FROM bookings WHERE id = ?', [bookingId]);
        if (bookingCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (bookingCheck[0].status === 'Approved') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete an approved booking'
            });
        }

        // Delete the booking
        await pool.query('DELETE FROM bookings WHERE id = ?', [bookingId]);

        res.json({
            success: true,
            message: 'Booking deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
});



module.exports = router;