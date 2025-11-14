import multer from "multer";
import MediaService from "../providers/media.provider.js";
import ServiceError from "../exceptions/service.error.js";

/** @info Store file in memory before upload */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  try {
    console.log("File Filter");
    const mediaType = req.media?.type; // Extract fileType from request
    if (!mediaType) {
      return cb(new Error("Media type is required."), false);
    }
    // Validate file type & size using MediaService
    MediaService.validateFile(file, mediaType);
    cb(null, true);
  } catch (error) {
    console.log(error);
    cb(error, false);
  }
};


const mediaGuard = async (req, res, next) => {
  console.log("called");
  const { size, displaySize } = req.media;
  const mediaManager = multer({ storage, fileFilter, limits: { fileSize: size } }).single('file'); // Adjust as per your field name
  try {
    mediaManager(req, res, (error) => {
      if (error) {
        console.log(error);
        console.log("file check:", error.code);
        if (error.code && error.code === "LIMIT_FILE_SIZE") {
          console.log("error throw");
          error = new ServiceError({ serviceName: "Multer", message: `File size is too large. Allowed size: ${displaySize}`, code: "FILE_TOO_LARGE", forClient: true });
        }
        next(error);
      }
      next();
    });

  } catch (error) {
    console.log("error catch");
    next(error);
  }

}

export default mediaGuard;
