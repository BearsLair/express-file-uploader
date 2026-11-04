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

    console.log("user data: ", user);

    await prisma.folders.create({
      data: {
        contents: [],
        home: true,
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

export async function displayHomeDirectory(req, res) {
  let homeFolder = {};

  console.log("req.user.id: ", req.user.id);
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

  console.log("homeFolder: ", homeFolder);

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
      console.log("content pushed: ", content);

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

  console.log("folders: ", folders);
  console.log("files: ", files);

  res.render("fileViewer", {
    user: req.user,
    folders: folders,
    files: files,
  });
}

export async function prismaFileUpload(req, res) {
  let uploadUrl;
  let folder;

  try {
    // Upload file to cloudinary
    await cloudinary.uploader
      .upload(req.file.path)
      .then((result) => (uploadUrl = result.url));

    // Add prisma upload entry
    const prismaUploadData = await prisma.file.create({
      data: {
        name: req.file.originalname,
        url: uploadUrl,
        userId: req.user.id,
      },
    });

    if (req.params.folder === "home") {
      folder = await prisma.folders.findFirst({
        where: {
          userId: req.user.id,
          name: "home",
        },
      });

      console.log(("folder data: ", folder));

      console.log("folder contents: ", folder.contents);

      folder.contents.push({ id: prismaUploadData.id, type: "file" });

      console.log("folder contents after addition: ", folder.contents);
    } else {
      folder = await prisma.folders.findFirst({
        where: {
          userId: req.user.id,
          id: req.params.folder,
        },
      });

      console.log(("folder data: ", folder));

      console.log("folder contents: ", folder.contents);

      folder.contents.push({ id: prismaUploadData.id, type: "file" });

      console.log("folder contents after addition: ", folder.contents);
    }

    await prisma.folders.update({
      where: {
        id: folder.id,
      },
      data: {
        contents: folder.contents,
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

    console.log("File retrieved: ", file);

    res.render("details", { file: file });
  } catch (err) {
    console.error("Error retrieving file details: ", err);
  }
}

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

  res.redirect("/home");
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
        console.log("result... ", result);
        data = result;
      });

    console.log("final data: ", data);
  } catch (err) {
    console.error("Error, retrieving folder", err);
  }

  const folderContents = data.contents;
  console.log(folderContents);

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

  console.log("folders array...", folders);
  console.log("files array...", files);

  res.render("folder", {
    id: data.id,
    name: data.name,
    folders: folders,
    files: files,
  });
}
