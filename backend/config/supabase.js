import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const rawSupabaseUrl = process.env.SUPABASE_URL || '';
// Clean up URL: remove /rest/v1, trailing slashes, or whitespace
const supabaseUrl = rawSupabaseUrl
  .trim()
  .replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/+$/, '');

const supabaseKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  ''
).trim();

const supabaseBucket = (process.env.SUPABASE_BUCKET || 'products').trim();

let supabaseClient = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    console.log(`Supabase client initialized for bucket: ${supabaseBucket}`);
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err.message);
  }
}

export const isSupabaseConfigured = () => {
  return Boolean(supabaseClient && supabaseUrl && supabaseKey);
};

export const getSupabaseClient = () => supabaseClient;

/**
 * Upload a multer file to Supabase Storage and return its public URL.
 * @param {Object} file - The multer file object containing path, originalname, mimetype
 * @returns {Promise<string>} - The public CDN URL of the uploaded image
 */
export const uploadImageToSupabase = async (file) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase credentials (SUPABASE_URL and SUPABASE_KEY) are not configured in environment variables.');
  }

  const fileBuffer = fs.readFileSync(file.path);
  const fileExt = path.extname(file.originalname) || '.jpg';
  const sanitizedBase = path.basename(file.originalname, fileExt).replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${sanitizedBase}${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const mimeType = file.mimetype || 'image/jpeg';

  const { data, error } = await supabaseClient.storage
    .from(supabaseBucket)
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: true
    });

  if (error) {
    throw new Error(`Supabase Storage Upload Error: ${error.message}`);
  }

  // Retrieve public URL
  const { data: publicUrlData } = supabaseClient.storage
    .from(supabaseBucket)
    .getPublicUrl(filePath);

  // Clean up local temp file
  try {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  } catch (_) {}

  return publicUrlData.publicUrl;
};

export default supabaseClient;
