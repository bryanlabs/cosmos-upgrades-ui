import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Attempting to create a new user...");
  try {
    const newUser = await prisma.user.create({
      data: {
        name: "Alice",
        email: `alice-${Date.now()}@example.com`, // Ensure unique email
        // walletAddress is optional based on schema
        // favoriteChains are managed via relation, add them separately if needed
      },
    });
    console.log("Successfully created user:", newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    // Don't proceed if user creation failed
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log("\nFetching all users...");
  try {
    const allUsers = await prisma.user.findMany({
      // You can include relations if you want to see them
      // include: {
      //   favoriteChains: true,
      //   accounts: true,
      //   sessions: true,
      // },
    });
    console.log("All users:", allUsers);
    console.log(`\nFound ${allUsers.length} user(s).`);
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

main()
  .catch((e) => {
    console.error("An unexpected error occurred:", e);
    process.exit(1);
  })
  .finally(async () => {
    console.log("Disconnecting Prisma Client...");
    await prisma.$disconnect();
  });
