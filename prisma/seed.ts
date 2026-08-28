import { ensureDefaultCategories } from "../lib/categories";
import { prisma } from "../lib/prisma";

async function main() {
  await ensureDefaultCategories();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
