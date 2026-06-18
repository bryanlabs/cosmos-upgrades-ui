import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User } from "@/types/user";
import { getCurrentUserData } from "@/utils/chain-detail";

export const useUserData = () => {
  const { data: session, status } = useSession();
  const userAddress = session?.user?.identityKey;
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (status === "loading") {
        setIsLoading(true);
        return;
      }

      if (status !== "authenticated") {
        setUserData(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await getCurrentUserData();
        setUserData(data);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch user data")
        );
        setUserData(null); // Clear data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [status, session?.user?.id]);

  return {
    userData,
    userAddress,
    isLoading,
    error,
    isAuthenticated: status === "authenticated",
    session,
  };
};
