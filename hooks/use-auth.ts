import { useAppSelector } from "@/lib/redux/hooks";

/**
 * Hook to access authenticated user data from Redux store
 * This hook provides easy access to the current user state
 * and authentication status
 */
export function useAuth() {
  const { user, loading } = useAppSelector((state) => state.auth);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };
}
