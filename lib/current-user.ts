import { auth } from "@/auth";
import { getUserById } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isInteger(userId)) return null;
  return getUserById(userId);
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
