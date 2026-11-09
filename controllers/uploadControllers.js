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

export async function postRegistration(req, res) {
  try {
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

    res.render("details", { file: file });
  } catch (err) {
    console.error("Error retrieving file details: ", err);
  }
}
// TODO: MUST POINT BACK TO CONTAINING FOLDER
// SO IT DELETES IT FROM CONTAINTING FOLDER'S CONTENTS
export async function createFolder(req, res) {
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
}

export async function viewFolder(req, res) {
  const folderId = req.params.folder;

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
  }

  const folderContents = data.contents;

  let content = {};

  for (let i = 0; i < folderContents.length; i++) {
    if (folderContents[i].type === "folder") {
      content = await prisma.file.findFirst({
        where: {
          id: folderContents[i].id,
        },
      });

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
  }
}

// TODO: MUST POINT BACK TO CONTAINING FOLDER
// SO IT DELETES IT FROM CONTAINTING FOLDER'S CONTENTS
export async function deleteFolder(req, res) {
  try {
    const folder = await prisma.folders.findFirst({
      where: {
        id: req.params.id,
      },
    });

    console.log("folder: ", folder);

    // prisma.folders.delete({
    //   where: {
    //     id: req.params.id,
    //   },
    // });

    res.redirect("/home");
  } catch (err) {
    console.error("Error deleting folder: ", err);
  }
}
