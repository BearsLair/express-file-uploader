import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import { v2 as cloudinary } from "cloudinary";

export async function getLoginPage(req, res) {
  try {
    res.render("login");
  } catch (e) {
    console.error("Error retrieving log in page: ", e);
  }
}

export async function getRegistrationPage(req, res) {
  try {
    res.render("register");
  } catch (e) {
    console.error("Error retrieving registration page: ", e);
  }
}

// Todo: add encryption with bcryptjs
export async function postRegistration(req, res) {
  try {
    const hash = bcrypt.hashSync(req.body.password, 10);

    const user = await prisma.user.create({
      data: {
        username: req.body.username,
        password: hash,
      },
    });

    console.log("user data: ", user);

    await prisma.folders.create({
      data: {
        contents: [],
        userId: user.id,
      },
    });

    console.log(`Added user '${req.body.username}' to database.`);

    res.redirect("/");
  } catch (e) {
    console.error("Cannot post registration information", e);
    res.redirect("/register");
  }
}

export async function displayFiles(req, res) {
  try {
    const files = await prisma.file.findMany({
      where: {
        userId: req.user.id,
      },
    });

    res.render("fileViewer", { user: req.user, files: files });
  } catch (e) {
    console.error("Error retrieving files: ", e);

    // TODO: Add need to login page
  }
}

export async function prismaFileUpload(req, res) {
  let uploadUrl;

  try {
    // Upload file to cloudinary
    await cloudinary.uploader
      .upload(req.file.path)
      .then((result) => (uploadUrl = result.url));

    // Add prisma upload entry
    await prisma.file.create({
      data: {
        name: req.file.originalname,
        url: uploadUrl,
        userId: req.user.id,
      },
    });
  } catch (e) {
    console.error("Error updating prisma/upload to cloudinary: ", e);
  } finally {
    const filePath = req.file.path;

    try {
      // Check if file exists
      await fs.access(filePath);

      // Delete file
      await fs.unlink(filePath);

      res.redirect("/file_viewer");
    } catch (err) {
      if (err.code === "ENOENT") {
        console.log("File does not exist");
      } else {
        console.error("Error deleting file: ", err);
      }
    }
  }
}

export async function fileDetails(req, res) {
  const fileId = req.params.id;

  try {
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
      },
    });

    console.log("File retrieved: ", file);

    res.render("details", { file: file });
  } catch (err) {
    console.error("Error retrieving file details: ", err);
  }
}
