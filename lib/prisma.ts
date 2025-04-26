import { PrismaClient, Prisma } from "@prisma/client";

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

// Function to get chain links for a specific user and chainId
async function getWebHooksByUserAndChain(userId: number, chainId: string) {
  if (!userId || !chainId) {
    throw new Error("userId and chainId are required to fetch webhooks.");
  }
  if (typeof userId !== "number" || isNaN(userId)) {
    throw new Error("Invalid userId provided. Must be a number.");
  }

  try {
    return await prisma.webHook.findMany({
      where: { userId, chainId },
      orderBy: { id: "desc" },
    });
  } catch (error) {
    console.error(
      `Error fetching webhooks for userId ${userId}, chainId ${chainId}:`,
      error
    );
    throw new Error(
      `Failed to fetch webhooks. Reason: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// ✅ Get WebHooks by chainId
async function getWebHooksByChainId(chainId: string) {
  if (!chainId) throw new Error("chainId is required to fetch webhooks.");

  try {
    return await prisma.webHook.findMany({
      where: { chainId },
      include: {
        user: { select: { wallet: true } },
      },
      orderBy: { id: "desc" },
    });
  } catch (error) {
    console.error(`Error fetching webhooks for chainId ${chainId}:`, error);
    throw new Error(
      `Failed to fetch webhooks. Reason: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// ✅ Add WebHook
async function addWebHook(
  userId: number,
  chainId: string,
  label: string,
  url: string,
  notificationType: string,
  notifyBeforeUpgrade?: string
) {
  try {
    return await prisma.webHook.create({
      data: {
        userId,
        chainId,
        label,
        url,
        notificationType,
        notifyBeforeUpgrade,
      },
    });
  } catch (error) {
    console.error(
      `Error adding webhook for userId ${userId}, chainId ${chainId}:`,
      error
    );
    throw new Error(
      `Failed to add webhook. Reason: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// ✅ Update WebHook
async function updateWebHook(
  id: number,
  data: { label?: string; url?: string }
) {
  if (!id) throw new Error("id is required to update a webhook.");
  if (!data.label && !data.url)
    throw new Error("No update data provided (label or url).");

  if (data.label && typeof data.label !== "string") {
    throw new Error("Invalid label. Must be a string.");
  }

  if (data.url) {
    if (typeof data.url !== "string")
      throw new Error("Invalid url. Must be a string.");
    try {
      new URL(data.url);
    } catch (e) {
      console.error("Invalid URL format:", data.url, e);
      throw new Error("Invalid URL format.");
    }
  }

  try {
    return await prisma.webHook.update({
      where: { id },
      data: {
        label: data.label,
        url: data.url,
      },
    });
  } catch (error) {
    console.error(`Error updating webhook id ${id}:`, error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error(`Webhook with ID ${id} not found.`);
    }
    throw new Error(
      `Failed to update webhook. Reason: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// ✅ Remove WebHook
async function removeWebHook(id: number) {
  if (!id) throw new Error("id is required to remove a webhook.");
  if (typeof id !== "number" || isNaN(id)) {
    throw new Error("Invalid id provided. Must be a number.");
  }

  try {
    return await prisma.webHook.delete({ where: { id } });
  } catch (error) {
    console.error(`Error removing webhook id ${id}:`, error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      console.warn(`Webhook with ID ${id} not found.`);
      return null;
    }
    throw new Error(
      `Failed to remove webhook. Reason: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

async function getUserByWallet(wallet: string) {
  if (!wallet) {
    throw new Error("Wallet address is required.");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { wallet },
    });
    return user; // Returns the user object or null if not found
  } catch (error) {
    console.error(`Error fetching user data for wallet ${wallet}:`, error);
    throw new Error(
      `Failed to fetch user data. Reason: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export {
  getUserFavoriteChains,
  createUser,
  addFavoriteChain,
  removeFavoriteChain,
  userExists,
  getAllUsers,
  getUserByWallet,
  getWebHooksByUserAndChain,
  getWebHooksByChainId,
  addWebHook,
  updateWebHook,
  removeWebHook,
};
