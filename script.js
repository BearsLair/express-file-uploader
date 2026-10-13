import { prisma } from "./lib/prisma.js";

async function main() {
  const user = await prisma.user.create({
    data: {
      username: "pattywack",
      password: "boopy",
      files: {
        create: {
          name: "example.txt",
          url: "http://mysite/example.txt",
        },
      },
    },
    include: {
      files: true,
    },
  });

  console.log("Created user:", user);

  const allUsers = await prisma.user.findMany({
    include: {
      files: true,
    },
  });
  console.log("All users:", JSON.stringify(allUsers, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
