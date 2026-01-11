/**
 * Orders Dashboard Page
 * Main page for managing all orders with real-time data
 */

"use client";

import { useState } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Search, Plus, ArrowUpDown } from "lucide-react";
import { useGetOrdersQuery } from "@/lib/redux/api/ordersApi";
import { OrderCard } from "@/components/orders/order-card";
import {
  OrderFilters,
  type OrderFiltersState,
} from "@/components/orders/order-filters";
import { OrdersEmptyState } from "@/components/orders/orders-empty-state";
import { OrdersLoadingSkeleton } from "@/components/orders/orders-loading-skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/types/orders";
import { Timestamp } from "firebase/firestore";

export default function OrdersPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest");
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all");
  const [filters, setFilters] = useState<OrderFiltersState>({
    orderType: "all",
    status: "all",
  });

  // Combine tab filter with other filters
  const combinedFilters = {
    ...filters,
    status: activeTab !== "all" ? activeTab : filters.status,
  };

  // Convert dates to proper format for API
  const apiFilters = {
    orderType:
      combinedFilters.orderType !== "all"
        ? combinedFilters.orderType
        : undefined,
    status:
      combinedFilters.status !== "all" ? combinedFilters.status : undefined,
    dateFrom: combinedFilters.startDate,
    dateTo: combinedFilters.endDate,
    searchQuery: searchQuery || undefined,
  };

  // Fetch orders
  const { data, isLoading, error } = useGetOrdersQuery({
    filters: apiFilters,
    limit: 100, // Fetch more for client-side pagination
  });

  // Count orders by status
  const allOrdersQuery = useGetOrdersQuery({ filters: {}, limit: 1000 });
  const statusCounts = {
    all: allOrdersQuery.data?.total || 0,
    pending:
      allOrdersQuery.data?.orders.filter((o) => o.status === "pending")
        .length || 0,
    quoted:
      allOrdersQuery.data?.orders.filter((o) => o.status === "quoted").length ||
      0,
    confirmed:
      allOrdersQuery.data?.orders.filter((o) => o.status === "confirmed")
        .length || 0,
    completed:
      allOrdersQuery.data?.orders.filter((o) => o.status === "completed")
        .length || 0,
    cancelled:
      allOrdersQuery.data?.orders.filter((o) => o.status === "cancelled")
        .length || 0,
  };

  // Handlers
  const handleCreateOrder = () => {
    // TODO: Open create order modal
    toast({
      title: "Feature Coming Soon",
      description: "Order creation modals will be available in the next phase.",
    });
  };

  const handleViewDetails = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  const handleEdit = (orderId: string) => {
    toast({
      title: "Feature Coming Soon",
      description: "Order editing will be available in the next phase.",
    });
  };

  const handleDelete = (orderId: string) => {
    toast({
      title: "Feature Coming Soon",
      description: "Order deletion will be available in the next phase.",
    });
  };

  const handleResetFilters = () => {
    setFilters({ orderType: "all", status: "all" });
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Sort and paginate orders client-side
  const sortedOrders = data?.orders
    ? [...data.orders].sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return b.createdAt.toMillis() - a.createdAt.toMillis();
          case "oldest":
            return a.createdAt.toMillis() - b.createdAt.toMillis();
          case "amount-high":
            return (b.quote?.finalAmount || 0) - (a.quote?.finalAmount || 0);
          case "amount-low":
            return (a.quote?.finalAmount || 0) - (b.quote?.finalAmount || 0);
          default:
            return 0;
        }
      })
    : [];

  // Client-side pagination
  const pageSize = 20;
  const totalPages = Math.ceil(sortedOrders.length / pageSize);
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold">Orders</h2>
            <Button onClick={handleCreateOrder}>
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          <PageHeader
            title="Order Management"
            description="Manage client requests, quotes, payments, and communications"
          />

          {/* Search and Sort */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Card className="flex-1">
              <CardContent className="py-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by order number, client name, or email..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="amount-high">Highest Amount</SelectItem>
                  <SelectItem value="amount-low">Lowest Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filters */}
          <OrderFilters
            filters={filters}
            onFiltersChange={setFilters}
            onReset={handleResetFilters}
          />

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as OrderStatus | "all")
            }
          >
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({statusCounts.pending})
              </TabsTrigger>
              <TabsTrigger value="quoted">
                Quoted ({statusCounts.quoted})
              </TabsTrigger>
              <TabsTrigger value="confirmed">
                Confirmed ({statusCounts.confirmed})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({statusCounts.completed})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled ({statusCounts.cancelled})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6 space-y-4">
              {/* Loading State */}
              {isLoading && <OrdersLoadingSkeleton />}

              {/* Error State */}
              {error && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <p className="text-destructive">
                      Failed to load orders. Please try again.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {!isLoading && !error && paginatedOrders.length === 0 && (
                <OrdersEmptyState
                  message={
                    searchQuery ||
                    filters.orderType !== "all" ||
                    filters.status !== "all"
                      ? "No orders match your search or filters"
                      : "No orders yet"
                  }
                  onCreateOrder={
                    data?.total === 0 ? handleCreateOrder : undefined
                  }
                />
              )}

              {/* Orders List */}
              {!isLoading && !error && paginatedOrders.length > 0 && (
                <>
                  <div className="space-y-4">
                    {paginatedOrders.map((order) => (
                      <OrderCard
                        key={order.orderId}
                        order={order}
                        onViewDetails={handleViewDetails}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * pageSize + 1} to{" "}
                        {Math.min(currentPage * pageSize, sortedOrders.length)}{" "}
                        of {sortedOrders.length} orders
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                        >
                          Previous
                        </Button>
                        <span className="text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(currentPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
