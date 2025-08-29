const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * STORAGE + MULTER CONFIG (unchanged + reused)
 */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../uploads/verification_forms');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only JPG, PNG, PDF allowed.'), false);
};

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter
});

// Fields used in both submit & update
const formFields = upload.fields([
    { name: 'ghanaCardFront', maxCount: 1 },
    { name: 'ghanaCardBack', maxCount: 1 },
    { name: 'licenseFront', maxCount: 1 },
    { name: 'licenseBack', maxCount: 1 },
    { name: 'otherDocs', maxCount: 10 }
]);

/**
 * helper: delete files safely
 */
function deleteFilesSafely(paths = []) {
    paths
        .filter(Boolean)
        .forEach(p => {
            try {
                const full = path.join(__dirname, '..', p);
                if (fs.existsSync(full)) fs.unlinkSync(full);
            } catch (e) {
                console.error('File delete error:', e.message);
            }
        });
}

/**
 * SUBMIT NEW FORM
 * Accepts multipart. Uses user_id foreign key.
 * We keep backward compatibility: if front-end still sends names, we just ignore them here.
 */
router.post('/submit', formFields, async (req, res) => {
    let connection;
    try {
        const {
            userId,
            ghanaCardNumber,
            licenseNumber,
            bookingReason,
            emergencyName,
            emergencyPhone
        } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Validate user exists
        const [userRows] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ error: 'User not found for provided userId' });
        }

        // Required documents
        const ghanaCardFrontPath = req.files.ghanaCardFront ? `/uploads/verification_forms/${req.files.ghanaCardFront[0].filename}` : null;
        const ghanaCardBackPath = req.files.ghanaCardBack ? `/uploads/verification_forms/${req.files.ghanaCardBack[0].filename}` : null;
        const licenseFrontPath = req.files.licenseFront ? `/uploads/verification_forms/${req.files.licenseFront[0].filename}` : null;
        const licenseBackPath = req.files.licenseBack ? `/uploads/verification_forms/${req.files.licenseBack[0].filename}` : null;

        if (!ghanaCardFrontPath || !ghanaCardBackPath || !licenseFrontPath || !licenseBackPath) {
            return res.status(400).json({ error: 'All four required document images must be uploaded.' });
        }

        let otherDocsJSON = '[]';
        if (req.files.otherDocs && req.files.otherDocs.length > 0) {
            const paths = req.files.otherDocs.map(f => `/uploads/verification_forms/${f.filename}`);
            otherDocsJSON = JSON.stringify(paths);
        }

        if (!ghanaCardNumber || !licenseNumber) {
            return res.status(400).json({ error: 'ghanaCardNumber and licenseNumber are required.' });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.execute(
            `INSERT INTO verification_forms
             (user_id, ghana_card_number, license_number, booking_reason, emergency_name, emergency_phone,
              ghana_card_front, ghana_card_back, license_front, license_back, other_documents, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
            [
                userId,
                ghanaCardNumber,
                licenseNumber,
                bookingReason || null,
                emergencyName || null,
                emergencyPhone || null,
                ghanaCardFrontPath,
                ghanaCardBackPath,
                licenseFrontPath,
                licenseBackPath,
                otherDocsJSON
            ]
        );

        await connection.commit();
        res.status(201).json({ message: 'Form submitted successfully', formId: result.insertId });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error submitting form:', error);
        res.status(500).json({ error: 'Failed to submit form', details: error.message });
    } finally {
        if (connection) connection.release();
    }
});


router.put('/:id', formFields, async (req, res) => {
    let connection;
    try {
        const formId = req.params.id;
        const {
            ghanaCardNumber,
            licenseNumber,
            bookingReason,
            emergencyName,
            emergencyPhone,
            userRole // optional - if you pass 'admin' or 'manager' you can bypass status restriction
        } = req.body;

        connection = await pool.getConnection();

        const [rows] = await connection.query('SELECT * FROM verification_forms WHERE id = ?', [formId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Form not found' });
        }
        const existing = rows[0];

        // Restrict editing if not Pending (unless admin/manager)
        if (existing.status !== 'Pending' && !['admin', 'manager'].includes(userRole)) {
            return res.status(403).json({ error: 'Only pending forms can be edited.' });
        }

        // Build update
        let newOtherDocs = existing.other_documents || '[]';
        const replacingDocs = [];

        if (req.files.otherDocs && req.files.otherDocs.length > 0) {
            // Add new others (append or replace? Here we REPLACE existing set)
            const paths = req.files.otherDocs.map(f => `/uploads/verification_forms/${f.filename}`);
            // delete old group
            const old = JSON.parse(existing.other_documents || '[]');
            replacingDocs.push(...old);
            newOtherDocs = JSON.stringify(paths);
        }

        const updates = {
            ghana_card_number: ghanaCardNumber || existing.ghana_card_number,
            license_number: licenseNumber || existing.license_number,
            booking_reason: bookingReason || existing.booking_reason,
            emergency_name: emergencyName || existing.emergency_name,
            emergency_phone: emergencyPhone || existing.emergency_phone,
            ghana_card_front: existing.ghana_card_front,
            ghana_card_back: existing.ghana_card_back,
            license_front: existing.license_front,
            license_back: existing.license_back,
            other_documents: newOtherDocs
        };

        // Replace each doc if a new file is provided
        if (req.files.ghanaCardFront) {
            replacingDocs.push(existing.ghana_card_front);
            updates.ghana_card_front = `/uploads/verification_forms/${req.files.ghanaCardFront[0].filename}`;
        }
        if (req.files.ghanaCardBack) {
            replacingDocs.push(existing.ghana_card_back);
            updates.ghana_card_back = `/uploads/verification_forms/${req.files.ghanaCardBack[0].filename}`;
        }
        if (req.files.licenseFront) {
            replacingDocs.push(existing.license_front);
            updates.license_front = `/uploads/verification_forms/${req.files.licenseFront[0].filename}`;
        }
        if (req.files.licenseBack) {
            replacingDocs.push(existing.license_back);
            updates.license_back = `/uploads/verification_forms/${req.files.licenseBack[0].filename}`;
        }

        await connection.query(
            `UPDATE verification_forms SET 
              ghana_card_number=?, license_number=?, booking_reason=?, emergency_name=?, emergency_phone=?,
              ghana_card_front=?, ghana_card_back=?, license_front=?, license_back=?, other_documents=?, updated_at=NOW()
             WHERE id=?`,
            [
                updates.ghana_card_number,
                updates.license_number,
                updates.booking_reason,
                updates.emergency_name,
                updates.emergency_phone,
                updates.ghana_card_front,
                updates.ghana_card_back,
                updates.license_front,
                updates.license_back,
                updates.other_documents,
                formId
            ]
        );

        // Delete replaced files
        deleteFilesSafely(replacingDocs);

        res.json({ message: 'Form updated successfully' });
    } catch (error) {
        console.error('Error updating form:', error);
        res.status(500).json({ error: 'Failed to update form', details: error.message });
    } finally {
        if (connection) connection.release();
    }
});

/**
 * GET ALL (manager/admin)
 */
router.get('/all', async (_req, res) => {
    try {
        const [forms] = await pool.execute(`
            SELECT vf.*, u.first_name, u.last_name, u.email, u.phone, u.dob, u.avatar
            FROM verification_forms vf
                     JOIN users u ON vf.user_id = u.id
            ORDER BY vf.submitted_at DESC
        `);
        const processed = forms.map(f => ({
            id: f.id,
            userId: f.user_id,
            formId: f.id,
            avatar: f.avatar,
            firstName: f.first_name,
            lastName: f.last_name,
            fullName: `${f.first_name} ${f.last_name}`,
            email: f.email,
            phone: f.phone,
            dob: f.dob,
            submittedDate: f.submitted_at,
            status: f.status,
            ghanaCardNumber: f.ghana_card_number,
            licenseNumber: f.license_number,
            bookingReason: f.booking_reason,
            emergencyName: f.emergency_name,
            emergencyPhone: f.emergency_phone,
            ghanaCardFrontPreview: f.ghana_card_front,
            ghanaCardBackPreview: f.ghana_card_back,
            licenseFrontPreview: f.license_front,
            licenseBackPreview: f.license_back,
            otherDocsPreviews: JSON.parse(f.other_documents || '[]'),
            adminNotes: f.admin_notes
        }));
        res.json(processed);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch forms', details: e.message });
    }
});

/**
 * GET BY USER
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [forms] = await pool.execute(`
            SELECT vf.*, u.first_name, u.last_name, u.email, u.phone, u.dob, u.avatar
            FROM verification_forms vf
                     JOIN users u ON vf.user_id = u.id
            WHERE vf.user_id = ?
            ORDER BY vf.submitted_at DESC
        `, [userId]);

        const processed = forms.map(f => ({
            id: f.id,
            userId: f.user_id,
            formId: f.id,
            avatar: f.avatar,
            firstName: f.first_name,
            lastName: f.last_name,
            fullName: `${f.first_name} ${f.last_name}`,
            email: f.email,
            phone: f.phone,
            dob: f.dob,
            submittedDate: f.submitted_at,
            status: f.status,
            ghanaCardNumber: f.ghana_card_number,
            licenseNumber: f.license_number,
            bookingReason: f.booking_reason,
            emergencyName: f.emergency_name,
            emergencyPhone: f.emergency_phone,
            ghanaCardFrontPreview: f.ghana_card_front,
            ghanaCardBackPreview: f.ghana_card_back,
            licenseFrontPreview: f.license_front,
            licenseBackPreview: f.license_back,
            otherDocsPreviews: JSON.parse(f.other_documents || '[]'),
            adminNotes: f.admin_notes
        }));
        res.json(processed);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch user forms', details: e.message });
    }
});

/**
 * GET SINGLE FORM
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [forms] = await pool.execute(`
            SELECT vf.*, u.first_name, u.last_name, u.email, u.phone, u.dob, u.avatar
            FROM verification_forms vf
                     JOIN users u ON vf.user_id = u.id
            WHERE vf.id = ?
        `, [id]);
        if (forms.length === 0) return res.status(404).json({ error: 'Form not found' });
        const f = forms[0];
        const processed = {
            id: f.id,
            userId: f.user_id,
            formId: f.id,
            avatar: f.avatar,
            firstName: f.first_name,
            lastName: f.last_name,
            fullName: `${f.first_name} ${f.last_name}`,
            email: f.email,
            phone: f.phone,
            dob: f.dob,
            submittedDate: f.submitted_at,
            status: f.status,
            ghanaCardNumber: f.ghana_card_number,
            licenseNumber: f.license_number,
            bookingReason: f.booking_reason,
            emergencyName: f.emergency_name,
            emergencyPhone: f.emergency_phone,
            ghanaCardFrontPreview: f.ghana_card_front,
            ghanaCardBackPreview: f.ghana_card_back,
            licenseFrontPreview: f.license_front,
            licenseBackPreview: f.license_back,
            otherDocsPreviews: JSON.parse(f.other_documents || '[]'),
            adminNotes: f.admin_notes
        };
        res.json(processed);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch form', details: e.message });
    }
});

/**
 * UPDATE STATUS (admin / manager)
 */
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        await pool.execute('UPDATE verification_forms SET status=?, admin_notes=?, updated_at=NOW() WHERE id=?',
            [status, adminNotes || null, id]);
        res.json({ message: `Form ${status.toLowerCase()} successfully` });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to update status', details: e.message });
    }
});

/**
 * DELETE FORM
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [forms] = await pool.execute(
            'SELECT ghana_card_front, ghana_card_back, license_front, license_back, other_documents FROM verification_forms WHERE id=?',
            [id]
        );
        if (forms.length === 0) return res.status(404).json({ error: 'Form not found' });

        const f = forms[0];
        await pool.execute('DELETE FROM verification_forms WHERE id=?', [id]);

        const toDelete = [
            f.ghana_card_front,
            f.ghana_card_back,
            f.license_front,
            f.license_back,
            ...JSON.parse(f.other_documents || '[]')
        ];
        deleteFilesSafely(toDelete);

        res.json({ message: 'Form deleted successfully' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to delete form', details: e.message });
    }
});

module.exports = router;