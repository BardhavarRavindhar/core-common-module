import ApiError from "../exceptions/api.error.js";
import {
  S3Client,
  PutObjectCommand
} from "@aws-sdk/client-s3";
import MediaModel from "../models/media.model.js"; // Mongoose Media model
import CONFIG from "../../core/configs/api.config.js";
const { AWS } = CONFIG;

class MediaService {
  // AWS S3 Configuration (Static)
  static s3 = new S3Client({
    region: AWS.REGION, credentials: {
      accessKeyId: AWS.ACCESS_KEY,
      secretAccessKey: AWS.SECRET_KEY,
    }
  });
  static s3Bucket = AWS.BUCKET;
  static s3Region = AWS.REGION;
  static chunkSize = 5 * 1024 * 1024; // 5MB Chunk size for large files

  // Allowed file types, MIME types & size limits
  static mediaConfig = {
    image: {
      extensions: ["jpg", "jpeg", "png", "gif"],
      mimeTypes: ["image/jpeg", "image/png", "image/gif"],
      maxSize: 5 * 1024 * 1024, // 5MB
      displaySize: "5 MB"
    },
    video: {
      extensions: ["mp4"],
      mimeTypes: ["video/mp4"],
      maxSize: 100 * 1024 * 1024,// 100MB
      displaySize: "100 MB"
    },
    document: {
      extensions: ["pdf", "doc", "docx"],
      mimeTypes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      maxSize: 10 * 1024 * 1024, // 10MB
      displaySize: "10 MB"
    }
  };

  /**
   * Validate file based on media type.
   * @param {Object} file - File object { originalName, size, mimetype }.
   * @param {string} mediaType - Media type ('image', 'video', 'document').
   * @throws {ApiError} if validation fails.
   */
  static validateFile(file, mediaType) {

    const config = this.mediaConfig[mediaType];

    if (!config) {
      console.log("No config");
      throw new ApiError({
        message: "Invalid media type. Supported types: image, video, document.",
        code: "INVALID_MEDIA_TYPE"
      });
    }

    const ext = file.originalname.split(".").pop().toLowerCase();

    if (!config.extensions.includes(ext)) {
      throw new ApiError({
        message: `Invalid file extension: .${ext}. Allowed: ${config.extensions.join(", ")}`,
        code: "UNSUPPORTED_FILE_TYPE"
      });
    }

    if (!config.mimeTypes.includes(file.mimetype)) {
      throw new ApiError({
        message: `Invalid MIME type: ${file.mimetype}. Allowed: ${config.mimeTypes.join(", ")}`,
        code: "UNSUPPORTED_MEDIA_TYPE"
      });
    }

    return true;
  }

  /**
   * Get file size limit based on media type.
   * @param {string} mediaType - Media type ('image', 'video', 'document').
   * @returns {number} Maximum file size in bytes.
   */
  static getFileSizeLimit(mediaType) {
    return this.mediaConfig[mediaType].maxSize;
  }

  static getFileDisplaySize(mediaType) {
    return this.mediaConfig[mediaType].displaySize;
  }

  /**
   * Extracts the asset filename from a URL if it exists.
   * An asset filename is considered valid if it contains an extension.
   *
   * @param {string} url - The URL string to check.
   * @returns {string|null} - The asset filename (e.g., "profile-un6zlsnvzqfm.jpg") or null if not found.
   */
  static getAssetFilename(assetUrl) {
    if (typeof assetUrl !== 'string' || !assetUrl.trim()) {
      return null;
    }

    try {
      // Parse the provided URL
      const parsedUrl = new URL(assetUrl);
      const assetPath = parsedUrl.pathname; // e.g., "/profile-un6zlsnvzqfm.jpg"

      // Extract the filename from the assetPath by taking the substring after the last '/'
      const assetFilename = assetPath.substring(assetPath.lastIndexOf('/') + 1);

      // Validate that the assetFilename contains an extension (a dot followed by characters)
      if (assetFilename && /\.[^./\\]+$/.test(assetFilename)) {
        return assetFilename;
      }
      return null;
    } catch (error) {
      // If URL parsing fails, return null
      return null;
    }
  }


  /**
   * Upload a file to AWS S3.
   * @param {Buffer} fileBuffer - File data buffer.
   * @param {string} fileName - Unique file name for S3.
   * @param {string} mimeType - File MIME type.
   * @returns {Promise<string>} The S3 file URL.
   * @throws {ApiError} if upload fails.
   */
  static async uploadToS3(fileBuffer, fileName, mimeType) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.s3Bucket,
        Key: fileName,
        Body: fileBuffer,
        ContentType: mimeType
      });

      await this.s3.send(command);

      return `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${fileName}`;
    } catch (error) {
      throw new ApiError({
        message: `AWS S3 upload error: ${error.message}`,
        code: "FILE_UPLOAD_ERROR",
        forClient: false
      });
    }
  }// end fn {uploadToS3}

  /**
  * Validate that the provided file URL is valid and corresponds to an existing uploaded media file.
  * @param {string} owner - The owner/user identifier.
  * @param {string} file - The file URL to validate.
  * @param {string} mediaType - The media type (defaults to "IMAGE").
  * @returns {Promise<boolean>} Returns true if the media file is valid.
  * @throws {ApiError} if the file URL is invalid or if no corresponding media record is found.
  */
  static async validateMediaFile(owner, file, mediaType = "IMAGE") {
    // Retrieve the filename from the file URL.
    const filename = this.getAssetFilename(file);
    if (!filename) {
      throw new ApiError({ message: "Invalid file URL.", code: "BAD_REQUEST" });
    }

    // Search for an existing media entry for this owner with the same media type and filename.
    const media = await MediaModel.findOne({ user: owner, mediaType, filename });
    if (!media) {
      throw new ApiError({
        message: `Only uploaded ${mediaType.toLowerCase()} URLs are accepted.`,
        code: "BAD_REQUEST"
      });
    }
    return true;
  }//end fn  {validateMediaFile}

}// end class

export default MediaService;
