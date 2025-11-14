/** 
  * @module media Middleware
  * 
  * This middleware checks if the HTTP method of the incoming request is allowed.
  * If the method is not allowed, it responds with a 405 Method Not Allowed error.
  */
import catchAsync from "../utils/catch-async.util.js";
import MediaService from "../providers/media.provider.js";

const manageMedia = (options = {}) => {
  return catchAsync(async (req, res, next) => {
    const { mediaType = "image" } = options;
    const mediaSize = MediaService.getFileSizeLimit(mediaType);
    const mediaDisplaySize = MediaService.getFileDisplaySize(mediaType);
    req.media = {
      type: mediaType,
      size: mediaSize,
      displaySize: mediaDisplaySize
    }
    next();
  });
}

export default manageMedia;
