import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.company.update({
    where: { slug: "pudins-da-ana" },
    data: {
      name: "O! Pudim",
      logoUrl: "/uploads/seed/logo.png",
      faviconUrl: "/uploads/seed/favicon.png",
    },
  });
  console.log("logo aplicada");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
