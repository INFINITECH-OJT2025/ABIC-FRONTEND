/**
 * Compress image file before upload to reduce size and improve upload speed
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.85
): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Skip compression for non-image files
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        // Create canvas and compress
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Draw image with better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }

            // Create new File object with original name
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });

            // Only use compressed file if it's actually smaller
            if (compressedFile.size < file.size) {
              resolve(compressedFile);
            } else {
              // If compression didn't reduce size, use original
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        // If image fails to load, use original file
        resolve(file);
      };

      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        resolve(file);
      }
    };

    reader.onerror = () => {
      // If read fails, use original file
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Compress multiple image files
 */
export const compressImages = async (files: File[]): Promise<File[]> => {
  const compressedFiles = await Promise.all(
    files.map((file) => compressImage(file))
  );
  return compressedFiles;
};
