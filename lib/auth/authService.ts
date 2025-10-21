// Authentication Service
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

interface UserData {
  uid: string;
  email: string;
  fullName: string;
  phone: string;
  role: "admin";
  avatarUrl?: string;
  createdAt: any;
  isActive: boolean;
  permissions: string[];
}

/**
 * Sign up a new admin user
 * All accounts created through this portal are admin accounts
 */
export const signUp = async (data: SignUpData): Promise<UserData> => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    // Create Firestore user document with admin role
    const userData: UserData = {
      uid: userCredential.user.uid,
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      role: "admin", // Always admin for portal accounts
      createdAt: serverTimestamp(),
      isActive: true,
      permissions: [
        "service_management",
        "order_management",
        "staff_management",
        "analytics_view",
        "marketing_tools",
      ],
    };

    await setDoc(doc(db, "users", userCredential.user.uid), userData);

    return userData;
  } catch (error: any) {
    console.error("Sign up error:", error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Sign in existing user
 * Only allows admin users to log in
 */
export const signIn = async (
  email: string,
  password: string
): Promise<UserData> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

    if (!userDoc.exists()) {
      await signOut(auth);
      throw new Error("User account not found in database");
    }

    const userData = userDoc.data() as UserData;

    // Check if user is admin
    if (userData.role !== "admin") {
      await signOut(auth);
      throw new Error("Access denied. Admin accounts only.");
    }

    // Check if account is active
    if (!userData.isActive) {
      await signOut(auth);
      throw new Error("Your account has been deactivated. Contact support.");
    }

    return userData;
  } catch (error: any) {
    console.error("Sign in error:", error);
    throw new Error(getAuthErrorMessage(error.code) || error.message);
  }
};

/**
 * Sign out current user
 */
export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error("Sign out error:", error);
    throw new Error("Failed to sign out. Please try again.");
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error("Password reset error:", error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Get user data from Firestore
 */
export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error("Get user data error:", error);
    return null;
  }
};

/**
 * Auth state observer
 */
export const observeAuthState = (
  callback: (user: User | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Convert Firebase auth error codes to user-friendly messages
 */
function getAuthErrorMessage(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please sign in instead.";
    case "auth/invalid-email":
      return "Invalid email address format.";
    case "auth/operation-not-allowed":
      return "Email/password accounts are not enabled. Contact support.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact support.";
    case "auth/user-not-found":
      return "No account found with this email address.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-credential":
      return "Invalid email or password. Please try again.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your internet connection.";
    default:
      return "An error occurred. Please try again.";
  }
}
