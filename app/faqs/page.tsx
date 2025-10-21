"use client";

import { useState } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { AddFaqModal } from "@/components/add-faq-modal";
import { EditFaqModal } from "@/components/edit-faq-modal";
import {
  useGetFAQsQuery,
  useDeleteFAQMutation,
  FAQ,
} from "@/lib/redux/api/faqsApi";
import { useToast } from "@/hooks/use-toast";

export default function FAQsPage() {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editFaq, setEditFaq] = useState<FAQ | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch FAQs
  const {
    data: faqs = [],
    isLoading,
    refetch,
  } = useGetFAQsQuery({
    category: selectedCategory !== "All" ? selectedCategory : undefined,
  });

  const [deleteFAQ] = useDeleteFAQMutation();

  // Filter FAQs by search query
  const filteredFaqs = faqs.filter((faq) => {
    if (!searchQuery) return true;
    return (
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleDeleteClick = (faqId: string) => {
    setFaqToDelete(faqId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!faqToDelete) return;

    try {
      await deleteFAQ(faqToDelete).unwrap();
      toast({
        title: "Success",
        description: "FAQ deleted successfully",
      });
      setDeleteDialogOpen(false);
      setFaqToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete FAQ",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (faq: FAQ) => {
    setEditFaq(faq);
  };

  const categories = [
    "All",
    "booking",
    "payment",
    "services",
    "policy",
    "general",
  ];

  // Get unique categories from FAQs
  const availableCategories = [
    "All",
    ...Array.from(new Set(faqs.map((faq) => faq.category))),
  ];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold">FAQs</h2>
            <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add FAQ
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <PageHeader
            title="FAQs & Knowledge Base"
            description="Manage frequently asked questions and help articles"
          />

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1 md:max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search FAQs..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map((category) => (
                    <Button
                      key={category}
                      variant={
                        category === selectedCategory ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category === "All"
                        ? "All"
                        : category.charAt(0).toUpperCase() + category.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-20 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full" />
                    <div className="flex gap-2 mt-4">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredFaqs.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">
                  {searchQuery || selectedCategory !== "All"
                    ? "No FAQs found matching your criteria"
                    : "No FAQs yet. Add your first FAQ!"}
                </p>
                {!searchQuery && selectedCategory === "All" && (
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add FAQ
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* FAQs List */}
          {!isLoading && filteredFaqs.length > 0 && (
            <div className="space-y-4">
              {filteredFaqs.map((faq) => (
                <Card key={faq.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {faq.question}
                        </CardTitle>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {faq.answer}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {faq.category.charAt(0).toUpperCase() +
                            faq.category.slice(1)}
                        </Badge>
                        <Badge variant={faq.isActive ? "default" : "secondary"}>
                          {faq.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(faq)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDeleteClick(faq.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Add FAQ Modal */}
        <AddFaqModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onSubmit={refetch}
        />

        {/* Edit FAQ Modal */}
        <EditFaqModal
          open={!!editFaq}
          onOpenChange={(open) => !open && setEditFaq(null)}
          onSubmit={refetch}
          faq={editFaq}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this FAQ? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
