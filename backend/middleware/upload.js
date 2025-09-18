import multer from 'multer';
import path from 'path';
import fs from 'fs';

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };
const uploadRoot = path.resolve(process.cwd(), 'uploads');
const avatarDir = path.join(uploadRoot, 'avatars');
ensureDir(avatarDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user?.id || 'anon'}_${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (/^image\/(png|jpe?g|gif|webp)$/i.test(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed'));
};

export const avatarUpload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });
