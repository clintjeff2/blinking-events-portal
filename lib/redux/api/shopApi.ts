"use client";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  firebaseApi,
  convertFirestoreData,
  withTimestamp,
} from "./firebaseApi";

// Product interfaces
export interface ProductImage {
  url: string;
  publicId?: string;
  alt?: string;
  isThumbnail?: boolean;
}

export interface ShopProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency?: string; // Currency code: 'XAF' | 'FCFA' | 'USD' | 'EUR' - defaults to 'XAF'
  quantity: number;
  images: ProductImage[];
  thumbnailUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProductInput = Omit<
  ShopProduct,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateProductInput = Partial<
  Omit<ShopProduct, "id" | "createdAt" | "updatedAt">
>;

// Order interfaces
export interface ShopOrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface ShopOrder {
  id: string;
  orderId: string; // Human-readable order ID like "SO-001"
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  items: ShopOrderItem[];
  totalAmount: number;
  currency?: string; // Currency code: 'XAF' | 'FCFA' | 'USD' | 'EUR' - defaults to 'XAF'
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
}

export type CreateShopOrderInput = Omit<
  ShopOrder,
  | "id"
  | "orderId"
  | "createdAt"
  | "updatedAt"
  | "completedAt"
  | "confirmedAt"
  | "cancelledAt"
>;
export type UpdateShopOrderInput = Partial<Pick<ShopOrder, "status" | "notes">>;

// Product categories
export const PRODUCT_CATEGORIES = [
  "Wedding Dresses",
  "Suits & Tuxedos",
  "Accessories",
  "Decorations",
  "Vehicles",
  "Furniture",
  "Lighting",
  "Flowers",
  "Catering Equipment",
  "Audio/Visual",
  "Other",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

// Order statuses
export const ORDER_STATUSES = [
  {
    value: "pending",
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "confirmed",
    label: "Confirmed",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "completed",
    label: "Completed",
    color: "bg-green-100 text-green-800",
  },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["value"];

// Helper to generate order ID
const generateOrderId = async (): Promise<string> => {
  const ordersRef = collection(db, "shopOrders");
  const q = query(ordersRef, orderBy("createdAt", "desc"), limit(1));
  const snapshot = await getDocs(q);

  let nextNumber = 1;
  if (!snapshot.empty) {
    const lastOrder = snapshot.docs[0].data();
    const lastOrderId = lastOrder.orderId || "SO-000";
    const lastNumber = parseInt(lastOrderId.split("-")[1]) || 0;
    nextNumber = lastNumber + 1;
  }

  return `SO-${String(nextNumber).padStart(3, "0")}`;
};

export const shopApi = firebaseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ==================== PRODUCTS ====================

    // Get all products
    getProducts: builder.query<
      ShopProduct[],
      { category?: string; isActive?: boolean; isFeatured?: boolean } | void
    >({
      async queryFn(params) {
        try {
          const productsRef = collection(db, "shopProducts");
          const constraints: any[] = [];

          if (params?.category) {
            constraints.push(where("category", "==", params.category));
          }
          if (params?.isActive !== undefined) {
            constraints.push(where("isActive", "==", params.isActive));
          }
          if (params?.isFeatured !== undefined) {
            constraints.push(where("isFeatured", "==", params.isFeatured));
          }

          // Only add orderBy if we're sure the field exists, otherwise use updatedAt or no ordering
          // This handles documents that may not have createdAt field
          constraints.push(orderBy("updatedAt", "desc"));

          const q = query(productsRef, ...constraints);
          const snapshot = await getDocs(q);

          const products = snapshot.docs.map(
            (doc) =>
              convertFirestoreData({ id: doc.id, ...doc.data() }) as ShopProduct
          );

          return { data: products };
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "ShopProducts" as const,
                id,
              })),
              { type: "ShopProducts", id: "LIST" },
            ]
          : [{ type: "ShopProducts", id: "LIST" }],
    }),

    // Get single product
    getProduct: builder.query<ShopProduct, string>({
      async queryFn(productId) {
        try {
          const productRef = doc(db, "shopProducts", productId);
          const snapshot = await getDoc(productRef);

          if (!snapshot.exists()) {
            return {
              error: { status: "CUSTOM_ERROR", error: "Product not found" },
            };
          }

          const product = convertFirestoreData({
            id: snapshot.id,
            ...snapshot.data(),
          }) as ShopProduct;

          return { data: product };
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: (result, error, id) => [{ type: "ShopProducts", id }],
    }),

    // Create product
    createProduct: builder.mutation<ShopProduct, CreateProductInput>({
      async queryFn(productData) {
        try {
          const productsRef = collection(db, "shopProducts");
          const dataWithTimestamp = withTimestamp(productData, true);

          const docRef = await addDoc(productsRef, dataWithTimestamp);

          const product: ShopProduct = {
            id: docRef.id,
            ...productData,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          return { data: product };
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: [{ type: "ShopProducts", id: "LIST" }],
    }),

    // Update product
    updateProduct: builder.mutation<
      ShopProduct,
      { id: string; data: UpdateProductInput }
    >({
      async queryFn({ id, data }) {
        try {
          const productRef = doc(db, "shopProducts", id);
          const updateData = withTimestamp(data, false);

          await updateDoc(productRef, updateData);

          // Fetch updated product
          const snapshot = await getDoc(productRef);
          const product = convertFirestoreData({
            id: snapshot.id,
            ...snapshot.data(),
          }) as ShopProduct;

          return { data: product };
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "ShopProducts", id },
        { type: "ShopProducts", id: "LIST" },
      ],
    }),

    // Delete product (soft delete)
    deleteProduct: builder.mutation<void, string>({
      async queryFn(productId) {
        try {
          const productRef = doc(db, "shopProducts", productId);
          await updateDoc(productRef, {
            isActive: false,
            updatedAt: Timestamp.now(),
          });

          return { data: null as unknown as void };
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: (result, error, id) => [
        { type: "ShopProducts", id },
        { type: "ShopProducts", id: "LIST" },
      ],
    }),

    // Hard delete product
    permanentlyDeleteProduct: builder.mutation<void, string>({
      async queryFn(productId) {
        try {
          const productRef = doc(db, "shopProducts", productId);
          await deleteDoc(productRef);

          return { data: null as unknown as void };
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: [{ type: "ShopProducts", id: "LIST" }],
    }),

    // ==================== ORDERS ====================

    // Get all shop orders
    getShopOrders: builder.query<
      ShopOrder[],
      { status?: OrderStatus; clientId?: string } | void
    >({
      async queryFn(params) {
        try {
          const ordersRef = collection(db, "shopOrders");
          const constraints: any[] = [orderBy("createdAt", "desc")];

          if (params?.status) {
            constraints.unshift(where("status", "==", params.status));
          }
          if (params?.clientId) {
            constraints.unshift(where("clientId", "==", params.clientId));
          }

          const q = query(ordersRef, ...constraints);
          const snapshot = await getDocs(q);

          const orders = snapshot.docs.map(
            (doc) =>
              convertFirestoreData({ id: doc.id, ...doc.data() }) as ShopOrder
          );

          return { data: orders };
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "ShopOrders" as const, id })),
              { type: "ShopOrders", id: "LIST" },
            ]
          : [{ type: "ShopOrders", id: "LIST" }],
    }),

    // Get single shop order
    getShopOrder: builder.query<ShopOrder, string>({
      async queryFn(orderId) {
        try {
          const orderRef = doc(db, "shopOrders", orderId);
          const snapshot = await getDoc(orderRef);

          if (!snapshot.exists()) {
            return {
              error: { status: "CUSTOM_ERROR", error: "Order not found" },
            };
          }

          const order = convertFirestoreData({
            id: snapshot.id,
            ...snapshot.data(),
          }) as ShopOrder;

          return { data: order };
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: (result, error, id) => [{ type: "ShopOrders", id }],
    }),

    // Create shop order
    createShopOrder: builder.mutation<ShopOrder, CreateShopOrderInput>({
      async queryFn(orderData) {
        try {
          const ordersRef = collection(db, "shopOrders");
          const orderId = await generateOrderId();

          const dataWithTimestamp = withTimestamp(
            { ...orderData, orderId },
            true
          );

          const docRef = await addDoc(ordersRef, dataWithTimestamp);

          const order: ShopOrder = {
            id: docRef.id,
            orderId,
            ...orderData,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          return { data: order };
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: [{ type: "ShopOrders", id: "LIST" }],
    }),

    // Update shop order status
    updateShopOrder: builder.mutation<
      ShopOrder,
      { id: string; data: UpdateShopOrderInput }
    >({
      async queryFn({ id, data }) {
        try {
          const orderRef = doc(db, "shopOrders", id);
          const updateData: any = withTimestamp(data, false);

          // Add timestamp for status changes
          if (data.status === "completed") {
            updateData.completedAt = Timestamp.now();
          } else if (data.status === "confirmed") {
            updateData.confirmedAt = Timestamp.now();
          } else if (data.status === "cancelled") {
            updateData.cancelledAt = Timestamp.now();
          }

          await updateDoc(orderRef, updateData);

          // Fetch updated order
          const snapshot = await getDoc(orderRef);
          const order = convertFirestoreData({
            id: snapshot.id,
            ...snapshot.data(),
          }) as ShopOrder;

          return { data: order };
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "ShopOrders", id },
        { type: "ShopOrders", id: "LIST" },
      ],
    }),

    // Delete shop order
    deleteShopOrder: builder.mutation<void, string>({
      async queryFn(orderId) {
        try {
          const orderRef = doc(db, "shopOrders", orderId);
          await deleteDoc(orderRef);

          return { data: null as unknown as void };
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: [{ type: "ShopOrders", id: "LIST" }],
    }),

    // ==================== STATS ====================

    // Get shop statistics
    getShopStats: builder.query<
      {
        totalProducts: number;
        activeProducts: number;
        totalOrders: number;
        pendingOrders: number;
        completedOrders: number;
        totalRevenue: number;
      },
      void
    >({
      async queryFn() {
        try {
          // Get products stats
          const productsRef = collection(db, "shopProducts");
          const allProductsSnapshot = await getDocs(productsRef);
          const activeProductsQuery = query(
            productsRef,
            where("isActive", "==", true)
          );
          const activeProductsSnapshot = await getDocs(activeProductsQuery);

          // Get orders stats
          const ordersRef = collection(db, "shopOrders");
          const allOrdersSnapshot = await getDocs(ordersRef);

          let pendingOrders = 0;
          let completedOrders = 0;
          let totalRevenue = 0;

          allOrdersSnapshot.docs.forEach((doc) => {
            const order = doc.data();
            if (order.status === "pending") pendingOrders++;
            if (order.status === "completed") {
              completedOrders++;
              totalRevenue += order.totalAmount || 0;
            }
          });

          return {
            data: {
              totalProducts: allProductsSnapshot.size,
              activeProducts: activeProductsSnapshot.size,
              totalOrders: allOrdersSnapshot.size,
              pendingOrders,
              completedOrders,
              totalRevenue,
            },
          };
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: ["ShopProducts", "ShopOrders"],
    }),
  }),
});

export const {
  // Products
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  usePermanentlyDeleteProductMutation,
  // Orders
  useGetShopOrdersQuery,
  useGetShopOrderQuery,
  useCreateShopOrderMutation,
  useUpdateShopOrderMutation,
  useDeleteShopOrderMutation,
  // Stats
  useGetShopStatsQuery,
} = shopApi;
