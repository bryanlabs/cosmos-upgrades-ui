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
async function getChainLinksByUserAndChain(userId: number, chainId: string) {
  if (!userId || !chainId) {
    throw new Error(
      "userId and chainId are required to fetch specific chain links."
    );
  }
  // Basic validation for userId type
  if (typeof userId !== "number" || isNaN(userId)) {
    throw new Error("Invalid userId provided. Must be a number.");
  }

  try {
    const links = await prisma.chainLink.findMany({
      where: {
        userId: userId,
        chainId: String(chainId),
      },
      orderBy: {
        // Optional: order by creation time or ID
        id: "desc",
      },
    });
    return links;
  } catch (error) {
    console.error(
      `Error fetching chain links for userId ${userId} and chainId ${chainId}:`,
      error
    );
    // Re-throw the error to be handled by the calling API route or function
    throw new Error(
      `Failed to fetch chain links for user/chain. Reason: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Function to get chain links for a specific chainId (Re-added)
async function getChainLinksByChainId(chainId: string) {
  if (!chainId) {
    throw new Error("chainId is required to fetch chain links.");
  }

  try {
    const links = await prisma.chainLink.findMany({
      where: {
        chainId: String(chainId),
      },
      include: {
        user: {
          // Include related user data
          select: {
            wallet: true, // Select only the wallet address
          },
        },
      },
      orderBy: {
        // Optional: order by creation time or ID
        id: "desc",
      },
    });
    return links;
  } catch (error) {
    console.error(`Error fetching chain links for chainId ${chainId}:`, error);
    throw new Error(
      `Failed to fetch chain links. Reason: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Function to add a new chain link
async function addChainLink(
  userId: number,
  chainId: string,
  label: string,
  url: string
) {
  if (!userId || !chainId || !url) {
    throw new Error(
      "userId, chainId, and url are required to add a chain link."
    );
  }
  // Basic type validation
  if (typeof userId !== "number" || isNaN(userId)) {
    throw new Error("Invalid userId provided. Must be a number.");
  }
  if (typeof chainId !== "string") {
    throw new Error("Invalid chainId provided. Must be a string.");
  }
  if (typeof url !== "string") {
    throw new Error("Invalid url provided. Must be a string.");
  }
  // Basic URL format validation (can be enhanced if needed)
  try {
    new URL(url);
  } catch (urlValidationError) {
    console.error("URL validation failed for:", url, urlValidationError);
    throw new Error("Invalid URL format provided.");
  }

  try {
    const newLink = await prisma.chainLink.create({
      data: {
        userId: userId,
        chainId: chainId,
        url: url,
        label: label,
      },
    });
    return newLink;
  } catch (error) {
    console.error(
      `Error adding chain link for userId ${userId}, chainId ${chainId}:`,
      error
    );
    // Check for specific Prisma errors if needed, e.g., P2003 for foreign key violation
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      // Provide a more specific error message based on the constraint violation
      const fieldName = error.meta?.target;
      const fieldNameString = Array.isArray(fieldName)
        ? fieldName.join(", ")
        : String(fieldName);
      throw new Error(
        `Database constraint violation: The referenced ${fieldNameString} does not exist.`
      );
    }
    // Re-throw other errors to be handled by the calling API route
    throw new Error(
      `Failed to add chain link. Reason: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Function to update an existing chain link
async function updateChainLink(
  linkId: number,
  data: { label?: string; url?: string }
) {
  if (!linkId) {
    throw new Error("linkId is required to update a chain link.");
  }
  if (!data || (data.label === undefined && data.url === undefined)) {
    throw new Error("No update data provided (label or url).");
  }
  // Validate data types if present
  if (data.label !== undefined && typeof data.label !== "string") {
    throw new Error("Invalid label provided. Must be a string.");
  }
  if (data.url !== undefined) {
    if (typeof data.url !== "string") {
      throw new Error("Invalid url provided. Must be a string.");
    }
    try {
      new URL(data.url); // Validate URL format if URL is being updated
    } catch (urlValidationError) {
      console.error(
        "URL validation failed during update:",
        data.url,
        urlValidationError
      ); // Log error
      throw new Error("Invalid URL format provided.");
    }
  }

  try {
    const updatedLink = await prisma.chainLink.update({
      where: { id: linkId },
      data: {
        // Prisma will only update fields that are present in the data object
        label: data.label,
        url: data.url,
      },
    });
    return updatedLink;
  } catch (error) {
    console.error(`Error updating chain link with id ${linkId}:`, error);
    // Check for specific Prisma errors, e.g., P2025 for record not found
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error(`Chain link with ID ${linkId} not found.`);
    }
    // Re-throw other errors
    throw new Error(
      `Failed to update chain link. Reason: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Function to remove a chain link
async function removeChainLink(linkId: number) {
  if (!linkId) {
    throw new Error("linkId is required to remove a chain link.");
  }
  if (typeof linkId !== "number" || isNaN(linkId)) {
    throw new Error("Invalid linkId provided. Must be a number.");
  }

  try {
    // delete returns the deleted record, useful for confirmation sometimes
    const deletedLink = await prisma.chainLink.delete({
      where: { id: linkId },
    });
    // Return some confirmation, perhaps the deleted record or just success status
    // For simplicity, let's return the deleted record
    return deletedLink;
  } catch (error) {
    console.error(`Error removing chain link with id ${linkId}:`, error);
    // Check for specific Prisma errors, e.g., P2025 for record not found
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      // Optionally, consider this not an "error" if the goal is just ensuring it's gone
      // throw new Error(`Chain link with ID ${linkId} not found.`);
      console.warn(
        `Attempted to remove non-existent chain link with ID ${linkId}.`
      );
      // Return null or indicate not found, depending on desired API behavior
      return null;
    }
    // Re-throw other errors
    throw new Error(
      `Failed to remove chain link. Reason: ${
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
  getChainLinksByUserAndChain,
  getChainLinksByChainId,
  addChainLink,
  updateChainLink,
  removeChainLink,
};
