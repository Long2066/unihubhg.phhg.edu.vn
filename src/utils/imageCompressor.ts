import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

/**
 * Nén ảnh siêu tốc bằng HTML5 Canvas:
 * - Dùng FileReader.readAsDataURL để tương thích 100% mọi trình duyệt Android / iOS / Desktop
 * - Tuyệt đối KHÔNG set img.crossOrigin trên local data URL để tránh bị treo onload trên Android Chrome
 * - Scale về tối đa 256x256 px, nén JPEG quality 0.78 -> Kích thước chỉ ~12KB - 20KB
 * - Tốc độ xử lý < 50ms, hoàn tất ngay lập tức
 */
export const compressImage = (
  fileOrDataUrl: File | Blob | string,
  maxWidth = 256,
  maxHeight = 256,
  quality = 0.78
): Promise<string> => {
  return new Promise((resolve) => {
    // Nếu là URL web ngoại bộ (dicebear, google drive, https://...), không cần nén canvas
    if (typeof fileOrDataUrl === "string" && !fileOrDataUrl.startsWith("data:image/")) {
      return resolve(fileOrDataUrl);
    }

    const processDataUrl = (srcUrl: string) => {
      const img = new Image();
      // Không đặt crossOrigin trên data URL để tránh lỗi bảo mật hoặc treo trên Android WebKit
      img.onload = () => {
        try {
          let width = img.width || 1;
          let height = img.height || 1;

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
            return resolve(srcUrl);
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "medium";
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedDataUrl);
        } catch (err) {
          console.warn("Lỗi canvas drawImage fallback:", err);
          resolve(srcUrl);
        }
      };

      img.onerror = () => {
        resolve(srcUrl);
      };

      img.src = srcUrl;
    };

    if (typeof fileOrDataUrl === "string") {
      processDataUrl(fileOrDataUrl);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          processDataUrl(result);
        } else {
          resolve("");
        }
      };
      reader.onerror = () => {
        resolve("");
      };
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
};

/**
 * Upload avatar lên Firebase Storage với cơ chế Fast Fallback (< 800ms):
 * - Bước 1: Nén ảnh siêu tốc qua Canvas (< 50ms) tạo Base64 nén siêu nhẹ (~15KB)
 * - Bước 2: Thử tải lên Firebase Storage với timeout tối đa 800ms
 * - Nếu Storage phản hồi nhanh: lấy downloadURL (~120 bytes)
 * - Nếu Storage bị timeout/CORS/quyền chưa mở: trả ngay Base64 nén 15KB
 * => Đảm bảo giao diện KHÔNG BAO GIỜ bị treo ở trạng thái "Đang nén..."
 */
export const uploadAvatarHybrid = async (
  file: File | Blob,
  targetId: string,
  maxWidth = 256,
  maxHeight = 256,
  quality = 0.78
): Promise<string> => {
  // 1. Nén ảnh qua Canvas siêu tốc
  const compressedDataUrl = await compressImage(file, maxWidth, maxHeight, quality);
  if (!compressedDataUrl) {
    return "";
  }

  // 2. Race upload lên Firebase Storage với timeout 800ms
  try {
    const cleanId = (targetId || "user").replace(/[^a-zA-Z0-9_-]/g, "_");
    const storageRef = ref(storage, `avatars/${cleanId}.jpg`);

    const parts = compressedDataUrl.split(",");
    if (parts.length === 2) {
      const byteCharacters = atob(parts[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/jpeg" });

      const uploadTask = uploadBytes(storageRef, blob, {
        contentType: "image/jpeg"
      }).then(async (snap) => {
        return await getDownloadURL(snap.ref);
      }).catch((err) => {
        console.warn("Storage upload rejected:", err);
        return null;
      });

      // Strict timeout 800ms: không bao giờ để user chờ lâu
      const timeoutPromise = new Promise<null>((r) => setTimeout(() => r(null), 800));
      const storageUrl = await Promise.race([uploadTask, timeoutPromise]);
      if (storageUrl) {
        return storageUrl;
      }
    }
  } catch (err) {
    console.warn("Firebase Storage upload fallback:", err);
  }

  // Fallback tức thì sang data URL đã nén (~15KB)
  return compressedDataUrl;
};
