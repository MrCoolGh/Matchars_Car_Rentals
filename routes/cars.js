const express = require('express');
const { pool } = require('../config/db');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'cars');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'car-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Get all cars with their gallery images
router.get('/api/cars', async (req, res) => {
    try {
        // Get all cars
        const [cars] = await pool.query(`
            SELECT * FROM cars
            ORDER BY created_at DESC
        `);

        // For each car, get its gallery images
        for (const car of cars) {
            const [gallery] = await pool.query(`
                SELECT image_path FROM car_gallery
                WHERE car_id = ?
            `, [car.id]);

            // Add main image to gallery for frontend compatibility
            car.gallery = gallery.map(img => img.image_path);
            if (car.image && !car.gallery.includes(car.image)) {
                car.gallery.unshift(car.image);
            }
        }

        res.json(cars);
    } catch (error) {
        console.error('Error fetching cars:', error);
        res.status(500).json({ success: false, message: 'Database error: ' + error.message });
    }
});

// Upload image endpoint (can be used for both main image and gallery)
router.post('/api/cars/upload-image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        // Return the path to the uploaded file
        const imagePath = `/uploads/cars/${req.file.filename}`;

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            imagePath: imagePath
        });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during image upload'
        });
    }
});

// Upload multiple images for gallery
router.post('/api/cars/upload-gallery', upload.array('gallery', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No image files provided'
            });
        }

        // Return the paths to the uploaded files
        const imagePaths = req.files.map(file => `/uploads/cars/${file.filename}`);

        res.json({
            success: true,
            message: 'Gallery images uploaded successfully',
            imagePaths: imagePaths
        });
    } catch (error) {
        console.error('Gallery upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during gallery upload'
        });
    }
});

// Add a new car
router.post('/api/cars', async (req, res) => {
    try {
        const {
            name,
            price,
            year,
            transmission,
            fuel,
            seats,
            mileage,
            description,
            image,
            gallery
        } = req.body;

        // Validate required fields
        if (!name || !price) {
            return res.status(400).json({
                success: false,
                message: 'Car name and price are required'
            });
        }

        // Insert car into database
        const [result] = await pool.query(`
            INSERT INTO cars 
            (name, price, year, transmission, fuel, seats, mileage, description, image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, price, year, transmission, fuel, seats, mileage, description, image]);

        const carId = result.insertId;

        // Insert gallery images if any
        if (gallery && gallery.length > 0) {
            // Filter out the main image if it's also in the gallery
            const uniqueGallery = gallery.filter(img => img !== image);

            if (uniqueGallery.length > 0) {
                const galleryValues = uniqueGallery.map(imagePath => [carId, imagePath]);

                await pool.query(`
                    INSERT INTO car_gallery (car_id, image_path)
                    VALUES ?
                `, [galleryValues]);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Car added successfully',
            carId: carId
        });
    } catch (error) {
        console.error('Error adding car:', error);
        res.status(500).json({
            success: false,
            message: 'Database error: ' + error.message
        });
    }
});

// Update an existing car
router.put('/api/cars/:id', async (req, res) => {
    try {
        const carId = req.params.id;
        const {
            name,
            price,
            year,
            transmission,
            fuel,
            seats,
            mileage,
            description,
            image,
            gallery
        } = req.body;

        // Validate required fields
        if (!name || !price) {
            return res.status(400).json({
                success: false,
                message: 'Car name and price are required'
            });
        }

        // Update car in database
        const [result] = await pool.query(`
            UPDATE cars 
            SET name = ?, price = ?, year = ?, transmission = ?, 
                fuel = ?, seats = ?, mileage = ?, description = ?, image = ?
            WHERE id = ?
        `, [name, price, year, transmission, fuel, seats, mileage, description, image, carId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }

        // Handle gallery images
        if (gallery && Array.isArray(gallery)) {
            // First, remove all existing gallery images
            await pool.query('DELETE FROM car_gallery WHERE car_id = ?', [carId]);

            // Filter out the main image if it's also in the gallery
            const uniqueGallery = gallery.filter(img => img !== image);

            // Then insert new ones if any
            if (uniqueGallery.length > 0) {
                const galleryValues = uniqueGallery.map(imagePath => [carId, imagePath]);

                await pool.query(`
                    INSERT INTO car_gallery (car_id, image_path)
                    VALUES ?
                `, [galleryValues]);
            }
        }

        res.json({
            success: true,
            message: 'Car updated successfully'
        });
    } catch (error) {
        console.error('Error updating car:', error);
        res.status(500).json({
            success: false,
            message: 'Database error: ' + error.message
        });
    }
});

// Delete a car
router.delete('/api/cars/:id', async (req, res) => {
    try {
        const carId = req.params.id;

        // Get the car to check if it exists and to get image paths
        const [car] = await pool.query('SELECT image FROM cars WHERE id = ?', [carId]);

        if (car.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }

        // Get gallery images
        const [gallery] = await pool.query('SELECT image_path FROM car_gallery WHERE car_id = ?', [carId]);

        // Delete the car (gallery entries will be deleted due to foreign key constraint)
        await pool.query('DELETE FROM cars WHERE id = ?', [carId]);

        // Clean up image files (optional - can be done by a separate cleanup job)
        const imagesToDelete = [...gallery.map(img => img.image_path)];
        if (car[0].image) {
            imagesToDelete.push(car[0].image);
        }

        // Attempt to delete the files from the file system
        for (const imagePath of imagesToDelete) {
            try {
                const filePath = path.join(__dirname, '..', imagePath.replace(/^\//, ''));
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (err) {
                console.error(`Failed to delete file ${imagePath}:`, err);
            }
        }

        res.json({
            success: true,
            message: 'Car deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting car:', error);
        res.status(500).json({
            success: false,
            message: 'Database error: ' + error.message
        });
    }
});

module.exports = router;