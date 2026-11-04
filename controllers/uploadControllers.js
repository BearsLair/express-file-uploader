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
    const folders = await prisma.folders.findMany({
      where: {
        userId: req.user.id,
      },
    });

    const files = await prisma.file.findMany({
      where: {
        userId: req.user.id,
      },
    });

    res.render("fileViewer", {
      user: req.user,
      folders: folders,
      files: files,
    });
  } catch (e) {
    console.error("Error retrieving files: ", e);

    // TODO: Add need to login page
  }
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

    if (req.params.folder === "null") {
      folder = await prisma.folders.findFirst({
        where: {
          userId: req.user.id,
          name: "null",
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

    // TODO: userId not right....need id.
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

export async function createFolder(req, res) {
  const folderName = req.body.folder;

  console.log("folder name: ", folderName);

  try {
    console.log("trying to post new folder");
    await prisma.folders.create({
      data: { name: req.body.folder, contents: [], userId: req.user.id },
    });

    res.redirect("/file_viewer");
  } catch (err) {
    console.error("Error creating folder", err);
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

  //     console.log("data sent to browser: ", folderContents);

  //     let content = [];

  //     if (data.contents.length > 0) {
  //       data.contents.map(async (item) => {
  //         if (item.type === "folder") {
  //           folders.push(item);
  //         }
  //         if (item.type === "file") {
  //           await prisma.file
  //             .findFirst({
  //               where: {
  //                 id: item.id,
  //               },
  //             })
  //             .then((result) => {
  //               console.log("result of current item: ", result);
  //               files.push(result);
  //             });
  //           console.log("content to add: ", content);
  //           files.push(content);
  //         }
  //       });
  //     }

  //     console.log("folder array: ", folders);
  //     console.log("files array: ", files);
  //   } catch (err) {
  //     console.error("Error retrieving folder content: ", err);
  //   } finally {
  //     res.render("folder", {
  //       id: data.id,
  //       name: data.name,
  //       folders: folders,
  //       files: files,
  //     });
  //   }
}
