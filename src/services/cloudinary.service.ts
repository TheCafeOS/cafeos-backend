import { Readable } from "stream";

import cloudinary from "../config/cloudinary.js";

/**
 * Upload an image buffer to Cloudinary.
 *
 * @param buffer - Image buffer from Multer memory storage.
 * @param folder - Cloudinary folder path.
 */
export const uploadImage = (
  buffer: Buffer,
  folder: string,
): Promise<{
  secureUrl: string;
  publicId: string;
}> =>
  new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error);
        }

        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    Readable.from(buffer).pipe(upload);
  });

/**
 * Delete an image from Cloudinary.
 *
 * @param publicId - Cloudinary public ID.
 */
export const deleteImage = async (
  publicId: string,
): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};