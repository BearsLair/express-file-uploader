import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";

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

    await prisma.user.create({
      data: {
        username: req.body.username,
        password: hash,
      },
    });

    console.log(`Added user '${req.body.username}' to database.`);

    res.redirect("/");
  } catch (e) {
    console.error("Cannot post registration information", e);
    res.redirect("/register");
  }
}
