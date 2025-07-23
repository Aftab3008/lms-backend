import imagekit from "../config/imagekit.js";

export function deleteMedia(
  mediaId: string
): Promise<{ success: boolean; error?: any }> {
  return new Promise((resolve, reject) => {
    imagekit.deleteFile(mediaId, function (error, result) {
      if (error) {
        console.log("Error deleting media from ImageKit:", error);
        return resolve({ success: false, error });
      } else {
        console.log("Media deleted from ImageKit:", result);
        return resolve({ success: true });
      }
    });
  });
}

export async function deleteMultipleMedia(
  mediaIds: string[]
): Promise<{ success: boolean; error?: any }> {
  return new Promise((resolve, reject) => {
    imagekit.bulkDeleteFiles(mediaIds, function (error, result) {
      if (error) {
        console.error("Error deleting multiple media from ImageKit:", error);
        return resolve({ success: false, error });
      } else {
        console.log("Multiple media deleted from ImageKit:", result);
        return resolve({ success: true });
      }
    });
  });
}
