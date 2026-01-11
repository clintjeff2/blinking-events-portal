"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { observeAuthState, getUserData } from "@/lib/auth/authService";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setUser, setLoading, logout } from "@/lib/redux/slices/authSlice";
import { requestNotificationPermission, removeToken } from "@/lib/firebase/fcm";

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

  // Track if we've already registered FCM for this session
  const fcmRegisteredRef = useRef<string | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

          console.log(
            "[AuthProvider] User authenticated successfully:",
            firebaseUser.uid
          );

          // Auto-request notification permission after login
          // Only if not already registered for this user
          if (fcmRegisteredRef.current !== firebaseUser.uid) {
            // Wait 2 seconds after login to ensure user interaction context
            notificationTimeoutRef.current = setTimeout(async () => {
              try {
                console.log(
                  "[AuthProvider] Auto-requesting notification permission..."
                );
                await requestNotificationPermission(firebaseUser.uid);
                fcmRegisteredRef.current = firebaseUser.uid;
                console.log(
                  "[AuthProvider] ✅ Notification registration successful"
                );
              } catch (error) {
                console.error(
                  "[AuthProvider] Notification registration failed:",
                  error
                );
                // Don't block app if notification fails
              }
            }, 2000);
          }

          // Redirect to dashboard if on public route
          if (PUBLIC_ROUTES.includes(pathname)) {
            router.push("/");
          }
        } else {
          // Not an admin or inactive account
          dispatch(logout());
          fcmRegisteredRef.current = null;
          if (!PUBLIC_ROUTES.includes(pathname)) {
            router.push("/login");
          }
        }
      } else {
        // User is signed out - remove FCM token
        if (fcmRegisteredRef.current) {
          console.log("[AuthProvider] Removing FCM token for logged out user");
          removeToken(fcmRegisteredRef.current).catch((error) => {
            console.error("[AuthProvider] Error removing FCM token:", error);
          });
          fcmRegisteredRef.current = null;
        }

        // Clear notification timeout if user logs out before it triggers
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
          notificationTimeoutRef.current = null;
        }

        dispatch(setUser(null));
        if (!PUBLIC_ROUTES.includes(pathname)) {
          router.push("/login");
        }
      }

      dispatch(setLoading(false));
    });

    return () => {
      unsubscribe();
      // Cleanup timeout on unmount
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
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
