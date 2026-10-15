import { prisma } from "../lib/prisma.js";
import passport from "passport";
import LocalStrategy from "passport-local";

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await prisma.user.findFirst({
        where: {
          username: username,
        },
      });

      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }

      if (user.password !== password) {
        return done(null, false, { message: "Incorrect password" });
      }

      return done(null, user);
    } catch (e) {
      console.log("Error creating session with local strategy: ", e);
    }
  }),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: id,
      },
    });

    done(null, user);
  } catch (e) {
    done(e);
  }
});
