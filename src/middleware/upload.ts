import multer from "multer";
import { AppError } from "../utils/AppError.js";

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/**
 * Generic image upload middleware.
 *
 * Supports:
 * - Restaurant logos
 * - Restaurant covers
 * - Menu item images
 * - Category images
 * - Employee avatars
 */
export const uploadImage = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(
        new AppError(
          "Only JPEG, PNG and WebP images are allowed.",
          400,
        ),
      );
    }

    cb(null, true);
  },
});