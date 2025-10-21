import { firebaseApi } from "./firebaseApi";
import {
  doc,
  updateDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";

// Types
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  photoURL?: string;
  createdAt: any;
  updatedAt: any;
}

export interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  photoURL?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface CompanyInfo {
  id: string;
  name: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  updatedAt: any;
}

export interface EmergencyContact {
  id: string;
  phone: string;
  whatsapp: string;
  email: string;
  updatedAt: any;
}

export const profileApi = firebaseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get user profile
    getUserProfile: builder.query<UserProfile, string>({
      async queryFn(userId) {
        try {
          const userRef = doc(db, "users", userId);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            return {
              error: { status: "FETCH_ERROR", error: "User not found" },
            };
          }

          return {
            data: {
              id: userSnap.id,
              ...userSnap.data(),
            } as UserProfile,
          };
        } catch (error: any) {
          return { error: { status: "FETCH_ERROR", error: error.message } };
        }
      },
      providesTags: ["Users"],
    }),

    // Update user profile
    updateUserProfile: builder.mutation<
      UserProfile,
      { userId: string; data: UpdateProfileData }
    >({
      async queryFn({ userId, data }) {
        try {
          const userRef = doc(db, "users", userId);
          const updateData = {
            ...data,
            updatedAt: new Date(),
          };

          await updateDoc(userRef, updateData);

          // Update Firebase Auth profile if displayName is being changed
          if (data.fullName && auth.currentUser) {
            await updateProfile(auth.currentUser, {
              displayName: data.fullName,
              photoURL: data.photoURL || auth.currentUser.photoURL,
            });
          }

          // Get updated user data
          const updatedSnap = await getDoc(userRef);
          return {
            data: {
              id: updatedSnap.id,
              ...updatedSnap.data(),
            } as UserProfile,
          };
        } catch (error: any) {
          return { error: { status: "FETCH_ERROR", error: error.message } };
        }
      },
      invalidatesTags: ["Users"],
    }),

    // Change password
    changePassword: builder.mutation<{ success: boolean }, ChangePasswordData>({
      async queryFn({ currentPassword, newPassword }) {
        try {
          const user = auth.currentUser;
          if (!user || !user.email) {
            return {
              error: { status: "FETCH_ERROR", error: "No authenticated user" },
            };
          }

          // Reauthenticate user
          const credential = EmailAuthProvider.credential(
            user.email,
            currentPassword
          );
          await reauthenticateWithCredential(user, credential);

          // Update password
          await updatePassword(user, newPassword);

          return { data: { success: true } };
        } catch (error: any) {
          let errorMessage = "Failed to change password";

          if (error.code === "auth/wrong-password") {
            errorMessage = "Current password is incorrect";
          } else if (error.code === "auth/weak-password") {
            errorMessage = "New password is too weak";
          } else if (error.code === "auth/requires-recent-login") {
            errorMessage =
              "Please log out and log in again before changing your password";
          }

          return { error: { status: "FETCH_ERROR", error: errorMessage } };
        }
      },
    }),
  }),
});

export const {
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useChangePasswordMutation,
} = profileApi;
