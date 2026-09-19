import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

export interface CompressedImageResult {
  dataUrl: string;
  blob: Blob;
}

/**
 * Nén ảnh bằng HTML5 Canvas:
 * Giới hạn kích thước tối đa (mặc định 320x320) và nén định dạng JPEG chất lượng 0.82
 * Chuỗi Base64 giảm từ vài MB xuống còn ~15KB - 30KB.
 */
export const compressImage = (
  fileOrDataUrl: File | Blob | string,
  maxWidth = 320,
  maxHeight = 320,
  quality = 0.82
): Promise<CompressedImageResult> => {
  return new Promise((resolve, reject) => {
    // Nếu là URL web thông thường (dicebear, google drive, https://...), không cần nén canvas
    if (typeof fileOrDataUrl === "string" && !fileOrDataUrl.startsWith("data:image/")) {
      const emptyBlob = new Blob([], { type: "image/jpeg" });
      return resolve({ dataUrl: fileOrDataUrl, blob: emptyBlob });
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    let objectUrl = "";
    if (typeof fileOrDataUrl === "string") {
      img.src = fileOrDataUrl;
    } else {
      objectUrl = URL.createObjectURL(fileOrDataUrl);
      img.src = objectUrl;
    }

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        const fallbackStr = typeof fileOrDataUrl === "string" ? fileOrDataUrl : "";
        return resolve({ dataUrl: fallbackStr, blob: new Blob() });
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg", quality);

      canvas.toBlob(
        (blob) => {
          resolve({
            dataUrl,
            blob: blob || new Blob([], { type: "image/jpeg" })
          });
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      const fallbackStr = typeof fileOrDataUrl === "string" ? fileOrDataUrl : "";
      resolve({ dataUrl: fallbackStr, blob: new Blob() });
    };
  });
};

/**
 * Upload avatar lên Firebase Storage theo đường dẫn `avatars/{cleanId}.jpg`
 * - Nếu thành công: trả về downloadURL (chỉ ~120 bytes, siêu nhẹ cho 5000 SV)
 * - Nếu thất bại (quyền storage chưa mở hoặc offline): fallback về dataUrl nén (<30KB)
 */
export const uploadAvatarHybrid = async (
  file: File | Blob,
  targetId: string,
  maxWidth = 320,
  maxHeight = 320,
  quality = 0.82
): Promise<string> => {
  const cleanId = (targetId || "user").replace(/[^a-zA-Z0-9_-]/g, "_");
  const { dataUrl, blob } = await compressImage(file, maxWidth, maxHeight, quality);

  // Thử đẩy lên Firebase Storage
  try {
    const storageRef = ref(storage, `avatars/${cleanId}.jpg`);
    await uploadBytes(storageRef, blob, {
      contentType: "image/jpeg",
      customMetadata: {
        targetId: cleanId,
        uploadedAt: new Date().toISOString()
      }
    });
    const downloadUrl = await getDownloadURL(storageRef);
    if (downloadUrl) {
      return downloadUrl;
    }
  } catch (err) {
    console.warn("Firebase Storage upload fallback sang base64 nén:", err);
  }

  // Fallback sang data URL đã nén siêu nhẹ
  return dataUrl;
};
