
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";
import { v4 as uuidv4 } from "uuid";

/**
 * Uploads an image file to Firebase Storage.
 * @param file The image file to upload.
 * @returns A promise that resolves with the public download URL of the uploaded image.
 */
export const uploadImage = async (file: File): Promise<string> => {
  if (!storage) {
    throw new Error("Firebase Storage is not initialized. Check your Firebase config.");
  }

  // Create a unique file name to avoid overwrites
  const fileExtension = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  const storageRef = ref(storage, `products/${fileName}`);

  try {
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image to Firebase Storage:", error);
    throw new Error("Failed to upload image.");
  }
};
