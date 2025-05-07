"use client";

import { useEffect } from "react";
import { useAccount } from "graz";
import { useUserDataStore } from "@/store/userDataStore";

export const useUserData = () => {
  const { data: account } = useAccount();
  const connectedUserAddress = account?.bech32Address;

  // Get states and actions from the Zustand store
  const {
    userData,
    userAddress,
    isLoading,
    error,
    fetchUserData,
    clearUserData,
    setUserAddress,
  } = useUserDataStore();

  // Effect to update userAddress in store when account changes
  useEffect(() => {
    setUserAddress(connectedUserAddress);
  }, [connectedUserAddress, setUserAddress]);

  // Effect to fetch data when userAddress in store changes
  useEffect(() => {
    if (userAddress) {
      fetchUserData(userAddress);
    } else {
      // If there's no userAddress (e.g., after disconnect), clear existing data
      clearUserData();
    }
  }, [userAddress, fetchUserData, clearUserData]); // Dependencies include store actions

  // Return the relevant data from the store
  return { userData, userAddress, isLoading, error };
};
