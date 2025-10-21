"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useUpdateFAQMutation, FAQ } from "@/lib/redux/api/faqsApi";

interface EditFaqModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: () => void;
  faq: FAQ | null;
}

export function EditFaqModal({
  open,
  onOpenChange,
  onSubmit,
  faq,
}: EditFaqModalProps) {
  const { toast } = useToast();
  const [updateFAQ, { isLoading: isUpdating }] = useUpdateFAQMutation();

  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "",
    isActive: true,
  });

  // Populate form when FAQ changes
  useEffect(() => {
    if (faq) {
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        isActive: faq.isActive,
      });
    }
  }, [faq]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        question: "",
        answer: "",
        category: "",
        isActive: true,
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!faq) {
      toast({
        title: "Error",
        description: "No FAQ selected for editing",
        variant: "destructive",
      });
      return;
    }

    // Validation
    if (!formData.question.trim()) {
      toast({
        title: "Validation Error",
        description: "Question is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.answer.trim()) {
      toast({
        title: "Validation Error",
        description: "Answer is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Validation Error",
        description: "Category is required",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("[Edit FAQ Modal] Updating FAQ:", faq.id, formData);

      await updateFAQ({
        id: faq.id,
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        category: formData.category,
        isActive: formData.isActive,
      }).unwrap();

      toast({
        title: "Success",
        description: "FAQ updated successfully",
      });

      onOpenChange(false);
      onSubmit?.();
    } catch (error: any) {
      console.error("[Edit FAQ Modal] Error updating FAQ:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update FAQ",
        variant: "destructive",
      });
    }
  };

  const categories = [
    { value: "booking", label: "Booking" },
    { value: "payment", label: "Payment" },
    { value: "services", label: "Services" },
    { value: "policy", label: "Policy" },
    { value: "general", label: "General" },
  ];

  if (!faq) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit FAQ</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-question">Question *</Label>
              <Input
                id="edit-question"
                value={formData.question}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, question: e.target.value }))
                }
                placeholder="Enter the frequently asked question"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-answer">Answer *</Label>
              <Textarea
                id="edit-answer"
                value={formData.answer}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, answer: e.target.value }))
                }
                placeholder="Enter the detailed answer"
                rows={6}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
              <Label htmlFor="edit-isActive">
                Active (make this FAQ visible to users)
              </Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update FAQ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
