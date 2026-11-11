import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import { v2 as cloudinary } from "cloudinary";
import { validationResult } from "express-validator";

export async function getLoginPage(req, res) {
  try {
    res.render("login");
  } catch (e) {
    console.error("Error retrieving log in page: ", e);
  }
}

export async function getRegistrationPage(req, res) {
  try {
    res.render("register", {
      errors: [],
      formData: [],
    });
  } catch (e) {
    console.error("Error retrieving registration page: ", e);
  }
}

export async function postRegistration(req, res) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).render("register", {
        errors: errors.array(),
        formData: req.body,
      });
    }

    const hash = bcrypt.hashSync(req.body.password, 10);

    const user = await prisma.user.create({
      data: {
        username: req.body.username,
        password: hash,
      },
    });

    await prisma.folders.create({
      data: {
        contents: [],
        home: true,
        userId: user.id,
      },
    });

    res.redirect("/");
  } catch (e) {
    console.error("Cannot post registration information", e);
    res.redirect("/register");
  }
}

export async function displayHomeDirectory(req, res) {
  let homeFolder = {};

  try {
    homeFolder = await prisma.folders.findFirst({
      where: {
        userId: req.user.id,
        home: true,
      },
    });
  } catch (e) {
    console.error("Error retrieving files: ", e);
    res.render("errorPage", {
      error: "Uh. Error retrieving your files... Please try again later",
    });
  }

  let folders = [];
  let files = [];
  let content = {};

  for (let i = 0; i < homeFolder.contents.length; i++) {
    if (homeFolder.contents[i].type === "folder") {
      content = await prisma.folders.findFirst({
        where: {
          id: homeFolder.contents[i].id,
        },
      });

      folders.push(content);
    }
    if (homeFolder.contents[i].type === "file") {
      content = await prisma.file.findFirst({
        where: {
          id: homeFolder.contents[i].id,
        },
      });

      files.push(content);
    }
  }

  res.render("fileViewer", {
    user: req.user,
    folders: folders,
    files: files,
  });
}

export async function prismaFileUpload(req, res) {
  let uploadUrl;
  let folder;
  let publicId;

  try {
    // Upload file to cloudinary
    await cloudinary.uploader.upload(req.file.path).then((result) => {
      uploadUrl = result.url;
      publicId = result.public_id;
    });

    if (req.params.folder === "home") {
      folder = await prisma.folders.findFirst({
        where: {
          userId: req.user.id,
          name: "home",
        },
      });
    } else {
      folder = await prisma.folders.findFirst({
        where: {
          userId: req.user.id,
          id: req.params.folder,
        },
      });
    }

    // Add prisma upload entry
    const prismaUploadData = await prisma.file.create({
      data: {
        name: req.file.originalname,
        publicId: publicId,
        url: uploadUrl,
        userId: req.user.id,
        folderId: folder.id,
      },
    });

    folder.contents.push({ id: prismaUploadData.id, type: "file" });

    await prisma.folders.update({
      where: {
        id: folder.id,
      },
      data: {
        contents: folder.contents,
      },
    });

    await prisma.file.update({
      where: {
        id: prismaUploadData.id,
      },
      data: {
        folderId: folder.id,
      },
    });
  } catch (e) {
    console.error("Error updating prisma/upload to cloudinary: ", e);
    res.render("errorPage", {
      error: "Oops! Something went wrong uploading your file!",
    });
  } finally {
    const filePath = req.file.path;

    try {
      // Check if file exists
      await fs.access(filePath);

      // Delete file
      await fs.unlink(filePath);

      if (req.params.folder === "home") {
        res.redirect("/home");
      } else {
        res.redirect("/folder/" + req.params.folder);
      }
    } catch (err) {
      if (err.code === "ENOENT") {
        console.log("File does not exist");
        res.render("errorPage", {
          error: "Something went wrong when uploading the file!",
        });
      } else {
        console.error("Error deleting file: ", err);
        res.render("errorPage", {
          error: "Something went wrong when uploading the file!",
        });
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

    res.render("details", { file: file });
  } catch (err) {
    console.error("Error retrieving file details: ", err);
    res.render("errorPage", {
      error: "Oops! There was an error retrieving file details!",
    });
  }
}

export async function createFolder(req, res) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.redirect("/home");
    }

    const folderName = req.body.folder;
    const currentFolder = req.params.current_folder;
    let currFolderData = {};

    if (currentFolder === "home") {
      currFolderData = await prisma.folders.findFirst({
        where: {
          userId: req.user.id,
          home: true,
        },
      });
    } else {
      currFolderData = await prisma.folders.findFirst({
        where: {
          id: currentFolder,
        },
      });
    }

    let contents = currFolderData.contents;

    const newFolder = await prisma.folders.create({
      data: {
        name: folderName,
        contents: [],
        containingFolderId: currFolderData.id,
        userId: req.user.id,
      },
    });

    contents.push({ id: newFolder.id, type: "folder" });

    const results = await prisma.folders.update({
      where: {
        id: currFolderData.id,
      },
      data: {
        contents: contents,
      },
    });

    if (currFolderData.name === "home") {
      res.redirect("/home");
    } else {
      res.redirect(`/folder/ + ${currFolderData.id}`);
    }
  } catch (err) {
    console.error("Error creating folder: ", err);
    res.render("errorPage", {
      error: "Oops! Something went wrong when creating the folder",
    });
  }
}

export async function viewFolder(req, res) {
  const folderId = req.params.folder;

  console.log("folderId: ", folderId);

  let data = {};
  let folders = [];
  let files = [];

  try {
    await prisma.folders
      .findFirst({
        where: {
          id: folderId,
        },
      })
      .then((result) => {
        data = result;
      });
  } catch (err) {
    console.error("Error, retrieving folder", err);
    res.render("errorPage", {
      error:
        "Oops! Something went wrong when attempting to retrieve the folder!",
    });
  }

  const folderContents = data.contents;

  console.log("folderContents: ", folderContents);

  let content = {};

  for (let i = 0; i < folderContents.length; i++) {
    if (folderContents[i].type === "folder") {
      content = await prisma.folders.findFirst({
        where: {
          id: folderContents[i].id,
        },
      });

      console.log("In For Loop, content: ", content);

      folders.push(content);
    }
    if (folderContents[i].type === "file") {
      content = await prisma.file.findFirst({
        where: {
          id: folderContents[i].id,
        },
      });

      files.push(content);
    }
  }

  console.log("folders: ", folders);
  console.log("files: ", files);

  res.render("folder", {
    id: data.id,
    name: data.name,
    folders: folders,
    files: files,
  });
}

export async function deleteFile(req, res) {
  try {
    // Find file to delete in Prisma File db
    const fileToDelete = await prisma.file.findFirst({
      where: {
        id: req.params.id,
      },
    });

    console.log("fileToDelete: ", fileToDelete);

    // Find the folder containing the file to delete
    // in Prisma Folders db
    let folder = await prisma.folders.findFirst({
      where: {
        id: fileToDelete.folderId,
      },
    });

    console.log("folder: ", folder);

    // Remove entry from folder
    const index = folder.contents.findIndex((file) => {
      return file.id === fileToDelete.id;
    });

    console.log("index to delete: ", index);

    folder.contents.splice(index, 1);

    console.log("Array after splice", folder.contents);
    console.log("folder id", folder.id);

    await prisma.folders.update({
      where: {
        id: folder.id,
      },
      data: {
        contents: folder.contents,
      },
    });

    // Remove file from Cloudinary storage
    cloudinary.uploader
      .destroy(fileToDelete.publicId)
      .then((result) => console.log("cloudinary deletion: ", result));

    // Remove file from Prisma File db
    await prisma.file.delete({
      where: {
        id: fileToDelete.id,
      },
    });

    res.redirect("/home");
  } catch (err) {
    console.error("Error deleting file: ", err);
    res.render("errorPage", {
      error: "Oops! Something went wrong when deleting the file!",
    });
  }
}

export async function deleteFolder(req, res) {
  let folder = {};
  let containingFolder = {};

  try {
    // Retrieve folder to be deleted with Prisma
    folder = await prisma.folders.findFirst({
      where: {
        id: req.params.id,
      },
    });

    // Retrieve the above folder's containing folder with Prisma,
    // to delete link to folder to be deleted from
    // the containing folder
    containingFolder = await prisma.folders.findFirst({
      where: {
        id: folder.containingFolderId,
      },
    });

    // Loop through files in folder to be deleted, to delete
    // files from Cloudinary (deleting a folder permanently removes
    // it's contents)

    let deleteFile = {};

    console.log("folder.contents: ", folder.contents);
    console.log("folder.contents length: ", folder.contents.length);

    console.log("For loop should initiate here...");
    if (folder.contents.length > 0) {
      console.log("Loop condition met...");
      for (let i = 0; i < folder.contents.length; i++) {
        // Find file to delete with Prisma
        deleteFile = await prisma.file.findFirst({
          where: {
            id: folder.contents[i].id,
          },
        });

        console.log("File to delete from cloudinary: ", deleteFile);

        // Delete file from cloudinary
        cloudinary.uploader
          .destroy(deleteFile.publicId)
          .then((result) => console.log("cloudinary file deleted: ", result));

        // Finally, delete file from database with Prisma
        await prisma.file.delete({
          where: {
            id: deleteFile.id,
          },
        });
        console.log("File deleted from database");
      }
    }

    const index = containingFolder.contents.findIndex((item) => {
      return item.id === folder.id;
    });

    console.log("index to delete in containing folder: ", index);

    containingFolder.contents.splice(index, 1);

    console.log("Link to folder in containing folder deleted");
  } catch (err) {
    console.error("Error deleting folder: ", err);
    res.render("errorPage", {
      error: "Oops! Something went wrong when deleting the folder!",
    });
  } finally {
    await prisma.folders.update({
      where: {
        id: containingFolder.id,
      },
      data: {
        contents: containingFolder.contents,
      },
    });

    await prisma.folders.delete({
      where: {
        id: folder.id,
      },
    });

    res.redirect("/home");
  }
}
