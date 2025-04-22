import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getUserFavoriteChains(wallet: string) {
  const user = await prisma.user.findUnique({
    where: { wallet },
  });

  if (!user || !user.favoriteChains) return [];

  // Split the comma-separated string into an array
  const favoriteChains = user.favoriteChains
    .split(",")
    .map((chain) => chain.trim())
    .filter(Boolean); // Remove empty strings

  return favoriteChains;
}

async function createUser(wallet: string) {
  const user = await prisma.user.create({
    data: {
      wallet,
      favoriteChains: "",
    },
  });

  return user;
}

async function addFavoriteChain(wallet: string, newChain: string) {
  const user = await prisma.user.findUnique({
    where: { wallet },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Parse current favorites
  const currentChains = user.favoriteChains
    ? user.favoriteChains.split(",").map((chain) => chain.trim())
    : [];

  // Prevent duplicates
  if (!currentChains.includes(newChain)) {
    currentChains.push(newChain);

    await prisma.user.update({
      where: { wallet },
      data: {
        favoriteChains: currentChains.join(","),
      },
    });
  }

  return currentChains;
}

// Function to remove a favorite chain
async function removeFavoriteChain(wallet: string, chainToRemove: string) {
  const user = await prisma.user.findUnique({
    where: { wallet },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.favoriteChains) {
    return []; // Nothing to remove
  }

  const currentChains = user.favoriteChains
    .split(",")
    .map((chain) => chain.trim())
    .filter(Boolean); // Remove empty strings

  const updatedChains = currentChains.filter(
    (chain) => chain !== chainToRemove
  );

  // Only update if the list actually changed
  if (updatedChains.length !== currentChains.length) {
    await prisma.user.update({
      where: { wallet },
      data: {
        favoriteChains: updatedChains.join(","),
      },
    });
  }

  return updatedChains;
}

async function userExists(wallet: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { wallet },
  });

  return !!user;
}

async function getAllUsers() {
  const users = await prisma.user.findMany();
  return users;
}

export {
  getUserFavoriteChains,
  createUser,
  addFavoriteChain,
  removeFavoriteChain,
  userExists,
  getAllUsers,
};
