export async function uploadToCloudinary(
  file,
  { resourceType, folder, onProgress }
) {
  const cloud = import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME;
  const preset = import.meta.env.VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET;

  if (!cloud)
    throw new Error("Thiếu VITE_REACT_APP_CLOUDINARY_CLOUD_NAME trong .env");
  if (!preset)
    throw new Error("Thiếu VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET trong .env");
  if (!resourceType || !["image", "video"].includes(resourceType)) {
    throw new Error('resourceType phải là "image" hoặc "video"');
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloud}/${resourceType}/upload`;

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", preset);
  if (folder) form.append("folder", folder);

  const xhr = new XMLHttpRequest();
  const promise = new Promise((resolve, reject) => {
    xhr.open("POST", endpoint);
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(res);
        } else {
          reject(
            new Error(res?.error?.message || `Cloudinary error (${xhr.status})`)
          );
        }
      } catch (e) {
        reject(new Error(`Cloudinary parse error: ${e.message}`));
      }
    };
    xhr.onerror = () => reject(new Error("Cloudinary network error"));
    if (xhr.upload && typeof onProgress === "function") {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable)
          onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }
    xhr.send(form);
  });

  return promise;
}
