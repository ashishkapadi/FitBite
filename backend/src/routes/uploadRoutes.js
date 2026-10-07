import express from 'express';
import multer from 'multer';
import path from 'path';
import { storageService } from '../services/storageService.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Memory storage for inspection and routing to S3 or local volume
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// 1. Upload Public Food / Meal Image
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedMime.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file format. Only JPEG, PNG, and WebP images are allowed.' });
    }

    const result = await storageService.savePublicImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    return res.status(201).json({
      message: 'Image uploaded successfully.',
      ...result
    });
  } catch (err) {
    console.error('[Upload Image Error]', err);
    res.status(500).json({ error: 'Failed to process image upload.' });
  }
});

// 2. Upload Private Seller Verification Document (FSSAI, GSTIN, PAN)
router.post('/document', requireAuth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file uploaded.' });
    }

    const allowedMime = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMime.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file format. Only PDF, JPEG, and PNG verification documents are accepted.' });
    }

    const sellerId = req.user.role === 'seller' ? req.user.id : (req.body.seller_id || req.user.id);

    const result = await storageService.savePrivateDocument(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      sellerId
    );

    return res.status(201).json({
      message: 'Seller verification document uploaded successfully.',
      ...result
    });
  } catch (err) {
    console.error('[Upload Document Error]', err);
    res.status(500).json({ error: 'Failed to process document upload.' });
  }
});

// 3. Securely Access / Download Private Verification Document (Guarded)
router.get('/documents/:filename', requireAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    const user = req.user;

    // Verify authorization: Admin can view all; Seller can only view their own
    if (user.role !== 'admin') {
      const sanitizedUserId = user.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      if (!filename.includes(sanitizedUserId)) {
        return res.status(403).json({ error: 'Unauthorized: You do not have permission to view this compliance document.' });
      }
    }

    const filePath = await storageService.getPrivateDocumentPath(filename);
    if (!filePath) {
      return res.status(404).json({ error: 'Requested document not found.' });
    }

    res.sendFile(filePath);
  } catch (err) {
    console.error('[Document Access Error]', err);
    res.status(500).json({ error: 'Error retrieving verification document.' });
  }
});

export default router;
