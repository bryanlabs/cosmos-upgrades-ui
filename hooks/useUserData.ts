import { useState, useEffect } from "react";
import { useAccount } from "graz";
import { User } from "@/types/user";
import { getUserData as fetchUserDataUtil } from "@/utils/chain-detail";

export const useUserData = () => {
  const { data: account } = useAccount();
  const userAddress = account?.bech32Address;
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userAddress) {
        setUserData(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchUserDataUtil(userAddress);
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
  }, [userAddress]); // Re-fetch when userAddress changes

  return { userData, userAddress, isLoading, error };
};
