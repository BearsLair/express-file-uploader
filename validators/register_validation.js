import { body } from "express-validator";

export default validators = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("First name cannot be empty.")
    .isLength({ max: 30 })
    .withMessage("First name must be less than 30 characters"),
  body("password")
    .trim()
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Password must contain 8 characters: at least 1 uppercase, 1 lowercase, 1 number, and 1 symbol.",
    )
    .notEmpty()
    .withMessage("Password cannot be empty.")
    .isLength({ max: 30 })
    .withMessage("Password must be less than 30 characters"),
  body("confirmpass")
    .trim()
    .notEmpty()
    .withMessage("Confirmation password cannot be empty.")
    .isLength({ max: 30 })
    .withMessage("Confirmation password must be less than 30 characters")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Confirmation password does not match password.");
      }
      return true;
    }),
];
