import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { firebaseApi } from "./api/firebaseApi";
import authReducer from "./slices/authSlice";

export const store = configureStore({
  reducer: {
    // Add the RTK Query API reducer
    [firebaseApi.reducerPath]: firebaseApi.reducer,
    // Add other reducers
    auth: authReducer,
  },
  // Adding the api middleware enables caching, invalidation, polling, and other features of RTK Query
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types from Firebase (Timestamps, etc.)
        ignoredActions: [
          "firebaseApi/executeQuery/fulfilled",
          "firebaseApi/executeMutation/fulfilled",
        ],
        // Ignore these paths in the state
        ignoredPaths: ["firebaseApi.queries", "firebaseApi.mutations"],
      },
    }).concat(firebaseApi.middleware),
});

// Optional: Set up listeners for refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
