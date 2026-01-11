/**
 * New Conversation Modal Component
 * Allows admin to start a new conversation with a client
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Mail, Phone, Check, Loader2, Users } from "lucide-react";
import { useSearchClientsQuery } from "@/lib/redux/api/messagingApi";
import { cn } from "@/lib/utils";

interface Client {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
}

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartConversation: (
    client: Client,
    priority?: "normal" | "high" | "urgent"
  ) => Promise<void>;
  isLoading?: boolean;
}

// Helper to get initials from name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function NewConversationModal({
  isOpen,
  onClose,
  onStartConversation,
  isLoading = false,
}: NewConversationModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [priority, setPriority] = useState<"normal" | "high" | "urgent">(
    "normal"
  );

  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Search clients with debounced query
  const {
    data: clients = [],
    isLoading: isLoadingClients,
    isFetching,
    error: searchError,
  } = useSearchClientsQuery(
    { searchQuery: debouncedSearchQuery },
    { skip: !isOpen || debouncedSearchQuery.length < 2 }
  );

  // Log search results for debugging
  useEffect(() => {
    if (debouncedSearchQuery.length >= 2) {
      console.log("[NewConversationModal] Search query:", debouncedSearchQuery);
      console.log("[NewConversationModal] Clients found:", clients.length);
      console.log("[NewConversationModal] Search error:", searchError);
      console.log("[NewConversationModal] Is loading:", isLoadingClients);
      console.log("[NewConversationModal] Is fetching:", isFetching);
    }
  }, [
    debouncedSearchQuery,
    clients,
    searchError,
    isLoadingClients,
    isFetching,
  ]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSelectedClient(null);
      setPriority("normal");
    }
  }, [isOpen]);

  const handleStartConversation = async () => {
    console.log("[NewConversationModal] handleStartConversation called");
    console.log("[NewConversationModal] Selected client:", selectedClient);
    console.log("[NewConversationModal] Priority:", priority);

    if (!selectedClient) {
      console.log("[NewConversationModal] No client selected, returning");
      return;
    }

    try {
      console.log("[NewConversationModal] Calling onStartConversation...");
      await onStartConversation(selectedClient, priority);
      console.log(
        "[NewConversationModal] onStartConversation completed successfully"
      );
    } catch (error) {
      console.error(
        "[NewConversationModal] Error in onStartConversation:",
        error
      );
    }
  };

  const showLoading = isLoadingClients || isFetching;
  const showEmptyState =
    !showLoading && debouncedSearchQuery.length >= 2 && clients.length === 0;
  const showInitialState = !showLoading && debouncedSearchQuery.length < 2;
  const showResults =
    !showLoading && debouncedSearchQuery.length >= 2 && clients.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Select a client to start a new conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search clients by name or email..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Priority selection */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clients list */}
          <div className="space-y-2">
            <Label>Select Client</Label>
            <ScrollArea className="h-[250px] rounded-md border">
              {showLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : showInitialState ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <Search className="h-12 w-12 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground text-center px-4">
                    Search for a client by name or email
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Type at least 2 characters to search
                  </p>
                </div>
              ) : showEmptyState ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <Users className="h-12 w-12 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No clients found for "{debouncedSearchQuery}"
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Try a different name or email
                  </p>
                </div>
              ) : showResults ? (
                <div className="p-2">
                  {clients.map((client) => {
                    const isSelected = selectedClient?.uid === client.uid;

                    return (
                      <button
                        key={client.uid}
                        onClick={() => setSelectedClient(client)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors",
                          "hover:bg-muted/50",
                          isSelected && "bg-muted ring-2 ring-primary"
                        )}
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            {client.avatarUrl && (
                              <AvatarImage src={client.avatarUrl} />
                            )}
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(client.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          {isSelected && (
                            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {client.fullName}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </span>
                            {client.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {client.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleStartConversation}
            disabled={!selectedClient || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              "Start Conversation"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
