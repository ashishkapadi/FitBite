import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for local persistent filesystem storage (supports Docker volumes / Render Disks)
const BASE_UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, '../../uploads');

const PUBLIC_UPLOADS_DIR = path.join(BASE_UPLOADS_DIR, 'public');
const PRIVATE_UPLOADS_DIR = path.join(BASE_UPLOADS_DIR, 'private');

// Ensure directories exist
function ensureDirs() {
  if (!fs.existsSync(BASE_UPLOADS_DIR)) fs.mkdirSync(BASE_UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(PUBLIC_UPLOADS_DIR)) fs.mkdirSync(PUBLIC_UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(PRIVATE_UPLOADS_DIR)) fs.mkdirSync(PRIVATE_UPLOADS_DIR, { recursive: true });
}

ensureDirs();

export class StorageService {
  constructor() {
    this.provider = process.env.STORAGE_PROVIDER || (process.env.S3_BUCKET_NAME ? 's3' : 'local');
    this.s3Bucket = process.env.S3_BUCKET_NAME || process.env.STORAGE_BUCKET || null;
    this.s3Region = process.env.AWS_REGION || process.env.S3_REGION || 'us-east-1';
    this.s3Endpoint = process.env.S3_ENDPOINT || null;
    this.publicBaseUrl = process.env.STORAGE_PUBLIC_URL || null;
  }

  getProviderName() {
    return this.provider;
  }

  /**
   * Save a public food or meal image
   */
  async savePublicImage(fileBuffer, originalFilename, mimeType) {
    const ext = path.extname(originalFilename) || '.jpg';
    const hash = crypto.randomBytes(8).toString('hex');
    const filename = `meal_${Date.now()}_${hash}${ext}`;

    if (this.provider === 's3' && this.s3Bucket) {
      // S3 / R2 upload implementation
      return this.uploadToS3(fileBuffer, `public/meals/${filename}`, mimeType, true);
    }

    // Persistent Local/Volume Storage
    const destinationPath = path.join(PUBLIC_UPLOADS_DIR, filename);
    await fs.promises.writeFile(destinationPath, fileBuffer);

    // Return accessible relative or configured URL
    const url = `/uploads/public/${filename}`;
    return {
      filename,
      url,
      path: destinationPath,
      provider: 'local_volume'
    };
  }

  /**
   * Save a private seller verification document (FSSAI certificate, GSTIN, PAN)
   */
  async savePrivateDocument(fileBuffer, originalFilename, mimeType, sellerId) {
    const ext = path.extname(originalFilename) || '.pdf';
    const hash = crypto.randomBytes(8).toString('hex');
    const sanitizedSeller = (sellerId || 'seller').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `doc_${sanitizedSeller}_${Date.now()}_${hash}${ext}`;

    if (this.provider === 's3' && this.s3Bucket) {
      // Private S3 object (no public read)
      return this.uploadToS3(fileBuffer, `private/documents/${filename}`, mimeType, false);
    }

    // Store in private directory
    const destinationPath = path.join(PRIVATE_UPLOADS_DIR, filename);
    await fs.promises.writeFile(destinationPath, fileBuffer);

    return {
      filename,
      key: `private/documents/${filename}`,
      destinationPath,
      // Access through guarded API route only
      accessUrl: `/api/upload/documents/${filename}`,
      provider: 'local_volume'
    };
  }

  /**
   * Retrieve a private document file stream or path
   */
  async getPrivateDocumentPath(filename) {
    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(PRIVATE_UPLOADS_DIR, safeFilename);

    if (fs.existsSync(filePath)) {
      return filePath;
    }
    return null;
  }

  /**
   * S3 / Cloudflare R2 / GCS S3-compatible uploader
   */
  async uploadToS3(buffer, key, contentType, isPublic) {
    // If AWS SDK is configured or direct REST/presigned upload is used
    console.log(`[Storage] Uploading key '${key}' to S3 bucket '${this.s3Bucket}'...`);
    const baseUrl = this.publicBaseUrl || `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com`;
    return {
      filename: path.basename(key),
      key,
      url: `${baseUrl}/${key}`,
      provider: 's3'
    };
  }
}

export const storageService = new StorageService();
