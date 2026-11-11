import { body } from "express-validator";

const folderValidation = [
  body("folder")
    .trim()
    .notEmpty()
    .withMessage("Folder name cannot be empty.")
    .isLength({ max: 30 })
    .withMessage("Folder must be less than 30 characters"),
];

export default folderValidation;
