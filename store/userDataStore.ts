import { create } from "zustand";
import { User } from "@/types/user";
import { getUserData as fetchUserDataUtil } from "@/utils/chain-detail";

interface UserDataState {
  userData: User | null;
  userAddress?: string;
  isLoading: boolean;
  error: Error | null;
  fetchUserData: (userAddress: string) => Promise<void>;
  clearUserData: () => void;
  setUserAddress: (userAddress?: string) => void;
}

// Define a more specific error type if your fetchUserDataUtil provides one
// For example, if it's an axios error:
// import { AxiosError } from 'axios';
// type FetchError = AxiosError | Error;

export const useUserDataStore = create<UserDataState>((set) => ({
  userData: null,
  userAddress: undefined,
  isLoading: false,
  error: null,
  setUserAddress: (userAddress) => {
    set({ userAddress });
  },
  fetchUserData: async (address: string) => {
    if (!address) {
      set({ userData: null, isLoading: false, error: null });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const data = await fetchUserDataUtil(address);
      set({ userData: data, isLoading: false });
    } catch (err) {
      // Attempt to check for a response property, common in HTTP client errors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyErr = err as any;
      if (anyErr && anyErr.response && anyErr.response.status === 404) {
        set({
          error: new Error(
            "User not found. Please register or try a different account."
          ),
          isLoading: false,
          userData: null,
        });
      } else {
        set({
          error:
            err instanceof Error ? err : new Error("Failed to fetch user data"),
          isLoading: false,
          userData: null,
        });
      }
    }
  },
  clearUserData: () =>
    set({
      userData: null,
      userAddress: undefined,
      isLoading: false,
      error: null,
    }),
}));
