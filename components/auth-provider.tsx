"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { observeAuthState, getUserData } from "@/lib/auth/authService";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setUser, setLoading, logout } from "@/lib/redux/slices/authSlice";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/signup", "/forgot-password"];

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const unsubscribe = observeAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, get their data from Firestore
        const userData = await getUserData(firebaseUser.uid);

        if (userData && userData.role === "admin" && userData.isActive) {
          // Valid admin user
          dispatch(
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: userData.fullName,
              photoURL: userData.avatarUrl || null,
              role: userData.role,
            })
          );

          // Redirect to dashboard if on public route
          if (PUBLIC_ROUTES.includes(pathname)) {
            router.push("/");
          }
        } else {
          // Not an admin or inactive account
          dispatch(logout());
          if (!PUBLIC_ROUTES.includes(pathname)) {
            router.push("/login");
          }
        }
      } else {
        // User is signed out
        dispatch(setUser(null));
        if (!PUBLIC_ROUTES.includes(pathname)) {
          router.push("/login");
        }
      }

      dispatch(setLoading(false));
    });

    return () => unsubscribe();
  }, [dispatch, router, pathname]);

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Protect routes - don't render protected content if not authenticated
  if (!user && !PUBLIC_ROUTES.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
