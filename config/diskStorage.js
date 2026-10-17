import multer from "multer";
import path from "node:path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(import.meta.dirname, "..", "public", "Files"));
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString() + "_" + file.originalname);
  },
});

const upload = multer({ storage: storage });

export default upload;
