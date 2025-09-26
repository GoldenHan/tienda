
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase/client";
import { v4 as uuidv4 } from "uuid";

/**
 * Uploads a file to a specified path in Firebase Storage.
 * @param file The file to upload.
 * @param path The path in Firebase Storage where the file will be stored (e.g., `companies/companyId/logos`).
 * @returns A promise that resolves with the public download URL of the uploaded file.
 */
export const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
    if (!storage) {
        throw new Error("Firebase Storage is not initialized. Check your Firebase config.");
    }

    // Create a unique file name to avoid overwrites
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const storageRef = ref(storage, `${path}/${fileName}`);

    try {
        // Upload the file
        const snapshot = await uploadBytes(storageRef, file);
        
        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        return downloadURL;
    } catch (error) {
        console.error(`Error uploading file to ${path}:`, error);
        throw new Error("Failed to upload file.");
    }
};

/**
 * Uploads an image file to Firebase Storage under a company-specific folder for products.
 * This is a specific implementation of uploadFileToStorage.
 * @param file The image file to upload.
 * @param companyId The ID of the company to associate the image with.
 * @returns A promise that resolves with the public download URL of the uploaded image.
 */
export const uploadImage = async (file: File, companyId: string): Promise<string> => {
    const path = `companies/${companyId}/products`;
    return uploadFileToStorage(file, path);
};
