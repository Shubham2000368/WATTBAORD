const { S3Client } = require('@aws-sdk/client-s3');

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'wattboard-uploads';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

let s3Client = null;

if (ACCOUNT_ID && ACCESS_KEY_ID && SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  });
  console.log('✅ Cloudflare R2 client initialized');
} else {
  console.warn('⚠️  R2 credentials not set — file uploads will be stored as base64 in MongoDB (not recommended for production)');
}

module.exports = { s3Client, BUCKET_NAME, PUBLIC_URL };
