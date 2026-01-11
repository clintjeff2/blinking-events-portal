/**
 * Orders Dashboard Page
 * Main page for managing all orders with real-time data
 * Tabular layout for efficient space usage
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
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  ArrowUpDown,
  Eye,
  MessageSquare,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  Briefcase,
  Users,
  Gift,
} from "lucide-react";
import { useGetOrdersQuery } from "@/lib/redux/api/ordersApi";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Order, OrderStatus } from "@/types/orders";
import { ORDER_TYPE_LABELS } from "@/types/orders";
import { Timestamp } from "firebase/firestore";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderTypeBadge } from "@/components/orders/order-type-badge";

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

  const handleMessage = (order: Order) => {
    const params = new URLSearchParams({
      clientName: order.clientInfo.fullName,
      clientEmail: order.clientInfo.email,
      orderId: order.orderId,
      orderNumber: order.orderNumber,
    });
    router.push(`/messages?${params.toString()}`);
  };

  const getOrderTypeIcon = (orderType: string) => {
    switch (orderType) {
      case "event":
        return <Calendar className="h-4 w-4" />;
      case "service":
        return <Briefcase className="h-4 w-4" />;
      case "staff":
        return <Users className="h-4 w-4" />;
      case "offer":
        return <Gift className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number | undefined) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
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
              {isLoading ? <OrdersLoadingSkeleton /> : null}

              {/* Error State */}
              {error ? (
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
              ) : null}

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

              {/* Orders Table */}
              {!isLoading && !error && paginatedOrders.length > 0 && (
                <>
                  <Card>
                    <TooltipProvider>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[120px]">Order #</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead className="w-[100px]">Type</TableHead>
                            <TableHead className="w-[110px]">Status</TableHead>
                            <TableHead className="w-[100px]">Date</TableHead>
                            <TableHead className="w-[110px] text-right">
                              Amount
                            </TableHead>
                            <TableHead className="w-[120px] text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedOrders.map((order) => (
                            <TableRow
                              key={order.orderId}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleViewDetails(order.orderId)}
                            >
                              <TableCell className="font-medium">
                                {order.orderNumber}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {order.clientInfo.fullName}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {order.clientInfo.email}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2">
                                      {getOrderTypeIcon(order.orderType)}
                                      <span className="hidden sm:inline capitalize">
                                        {order.orderType}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {ORDER_TYPE_LABELS[order.orderType]}
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <OrderStatusBadge status={order.status} />
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDate(order.createdAt)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatAmount(order.quote?.finalAmount)}
                              </TableCell>
                              <TableCell
                                className="text-right"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-end gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() =>
                                          handleViewDetails(order.orderId)
                                        }
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      View Details
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleMessage(order)}
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Send Message
                                    </TooltipContent>
                                  </Tooltip>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleViewDetails(order.orderId)
                                        }
                                      >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleMessage(order)}
                                      >
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Send Message
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleEdit(order.orderId)
                                        }
                                      >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Order
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleDelete(order.orderId)
                                        }
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Order
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TooltipProvider>
                  </Card>

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
