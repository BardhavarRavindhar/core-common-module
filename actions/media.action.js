import { mediaStorageDatePath, getCurrentUTC } from "../utils/timer.util.js";
import { getMediaDisplaySize } from "../enums/media.enum.js";
import MediaModel from "../models/media.model.js";
import { generateUniqueCode } from "../utils/codegen.util.js";
import MediaService from "../providers/media.provider.js";

const mediaUploadImage = async (owner, file, payload) => {
  console.log(file);
  const mediaDatePath = mediaStorageDatePath();
  const originalName = file.originalname;
  const resource = payload.resource;
  const mediaStoragePath = `media/${owner}/${resource.toLowerCase()}/${mediaDatePath}/${originalName}`;
  const slug = generateUniqueCode(12);
  const ext = file.originalname.split(".").pop();
  const filename = `${resource}-${slug}.${ext}`.toLowerCase();
  const fileBuffer = file.buffer;
  const s3URL = await MediaService.uploadToS3(fileBuffer, filename, file.mimetype);

  const mediaData = {
    "user": owner,
    "filename": filename,
    "originalName": originalName,
    "mediaType": "IMAGE",
    "mimeType": file.mimetype,
    "url": s3URL,
    "resource": "PROFILE",
    "size": file.size,
    "displaySize": getMediaDisplaySize(file.size),
    "mediaPath": mediaStoragePath,
    "uploadedAt": getCurrentUTC(),
    "ext": ext,
  }

  const media = await MediaModel.create(mediaData);
  return media;
}

const MediaAction = {
  mediaUploadImage
}

export default MediaAction;