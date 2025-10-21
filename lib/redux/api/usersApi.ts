import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  firebaseApi,
  convertFirestoreData,
  withTimestamp,
} from "./firebaseApi";

export interface User {
  id: string;
  uid: string;
  role: "client" | "admin" | "staff";
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
  favorites?: Array<{ type: string; refId: string }>;
  notificationTokens?: string[];
  isActive: boolean;
  // Staff specific
  staffProfileId?: string;
  // Admin specific
  permissions?: string[];
}

export const usersApi = firebaseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all users
    getUsers: builder.query<User[], { role?: string; isActive?: boolean }>({
      async queryFn({ role, isActive }) {
        try {
          const usersRef = collection(db, "users");
          let q = query(usersRef, orderBy("createdAt", "desc"));

          if (role) {
            q = query(
              usersRef,
              where("role", "==", role),
              orderBy("createdAt", "desc")
            );
          }
          if (isActive !== undefined) {
            q = query(
              usersRef,
              where("isActive", "==", isActive),
              orderBy("createdAt", "desc")
            );
          }

          const snapshot = await getDocs(q);
          const users = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...convertFirestoreData(doc.data()),
          })) as User[];

          return { data: users };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Users" as const, id })),
              { type: "Users", id: "LIST" },
            ]
          : [{ type: "Users", id: "LIST" }],
    }),

    // Get user by ID
    getUserById: builder.query<User, string>({
      async queryFn(userId) {
        try {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (!userDoc.exists()) {
            return { error: "User not found" };
          }
          const user = {
            id: userDoc.id,
            ...convertFirestoreData(userDoc.data()),
          } as User;
          return { data: user };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      providesTags: (result, error, id) => [{ type: "Users", id }],
    }),

    // Get user by UID (Firebase Auth UID)
    getUserByUid: builder.query<User, string>({
      async queryFn(uid) {
        try {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("uid", "==", uid));
          const snapshot = await getDocs(q);

          if (snapshot.empty) {
            return { error: "User not found" };
          }

          const userDoc = snapshot.docs[0];
          const user = {
            id: userDoc.id,
            ...convertFirestoreData(userDoc.data()),
          } as User;

          return { data: user };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      providesTags: (result) =>
        result ? [{ type: "Users", id: result.id }] : [],
    }),

    // Create user
    createUser: builder.mutation<
      User,
      Omit<User, "id" | "createdAt" | "updatedAt">
    >({
      async queryFn(userData) {
        try {
          const usersRef = collection(db, "users");
          const docRef = await addDoc(usersRef, withTimestamp(userData));
          const newDoc = await getDoc(docRef);
          const user = {
            id: newDoc.id,
            ...convertFirestoreData(newDoc.data()),
          } as User;
          return { data: user };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      invalidatesTags: [{ type: "Users", id: "LIST" }],
    }),

    // Update user
    updateUser: builder.mutation<User, { id: string; data: Partial<User> }>({
      async queryFn({ id, data }) {
        try {
          const userRef = doc(db, "users", id);
          await updateDoc(userRef, withTimestamp(data, true));
          const updatedDoc = await getDoc(userRef);
          if (!updatedDoc.exists()) {
            return { error: "User not found after update" };
          }
          const user = {
            id: updatedDoc.id,
            ...convertFirestoreData(updatedDoc.data()),
          } as User;
          return { data: user };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Users", id },
        { type: "Users", id: "LIST" },
      ],
    }),

    // Delete user (soft delete)
    deleteUser: builder.mutation<void, string>({
      async queryFn(userId) {
        try {
          const userRef = doc(db, "users", userId);
          await updateDoc(userRef, {
            isActive: false,
            updatedAt: withTimestamp({}, true).updatedAt,
          });
          return { data: undefined };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      invalidatesTags: (result, error, id) => [
        { type: "Users", id },
        { type: "Users", id: "LIST" },
      ],
    }),

    // Hard delete user
    hardDeleteUser: builder.mutation<void, string>({
      async queryFn(userId) {
        try {
          await deleteDoc(doc(db, "users", userId));
          return { data: undefined };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      invalidatesTags: [{ type: "Users", id: "LIST" }],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useGetUserByUidQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useHardDeleteUserMutation,
} = usersApi;
