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
import { useCreateOfferMutation } from "@/lib/redux/api/marketingApi";

interface AddOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: () => void;
}

export function AddOfferModal({
  open,
  onOpenChange,
  onSubmit,
}: AddOfferModalProps) {
  const { toast } = useToast();
  const [createOffer, { isLoading: isCreating }] = useCreateOfferMutation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount: "",
    validFrom: "",
    validTo: "",
    isActive: true,
    category: "",
    terms: "",
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        title: "",
        description: "",
        discount: "",
        validFrom: "",
        validTo: "",
        isActive: true,
        category: "",
        terms: "",
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Offer title is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Offer description is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.discount.trim()) {
      toast({
        title: "Validation Error",
        description: "Discount value is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.validFrom || !formData.validTo) {
      toast({
        title: "Validation Error",
        description: "Valid from and valid to dates are required",
        variant: "destructive",
      });
      return;
    }

    // Check that validTo is after validFrom
    if (new Date(formData.validTo) <= new Date(formData.validFrom)) {
      toast({
        title: "Validation Error",
        description: "Valid to date must be after valid from date",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("[Add Offer Modal] Submitting offer:", formData);

      const offerData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        discount: formData.discount.trim(),
        validFrom: new Date(formData.validFrom),
        validTo: new Date(formData.validTo),
        isActive: formData.isActive,
        ...(formData.category && { category: formData.category }),
        ...(formData.terms.trim() && { terms: formData.terms.trim() }),
      };

      await createOffer(offerData).unwrap();

      toast({
        title: "Success",
        description: "Offer created successfully",
      });

      onOpenChange(false);
      onSubmit?.();
    } catch (error: any) {
      console.error("[Add Offer Modal] Error creating offer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create offer",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Offer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="offer-title">Offer Title *</Label>
                <Input
                  id="offer-title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g., Summer Wedding Special"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offer-discount">Discount *</Label>
                <Input
                  id="offer-discount"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      discount: e.target.value,
                    }))
                  }
                  placeholder="e.g., 20% or 50,000 XAF"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer-description">Description *</Label>
              <Textarea
                id="offer-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe the offer details..."
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="offer-valid-from">Valid From *</Label>
                <Input
                  id="offer-valid-from"
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      validFrom: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offer-valid-to">Valid To *</Label>
                <Input
                  id="offer-valid-to"
                  type="date"
                  value={formData.validTo}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      validTo: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wedding">Wedding</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="cultural">Cultural</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer-terms">Terms & Conditions</Label>
              <Textarea
                id="offer-terms"
                value={formData.terms}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, terms: e.target.value }))
                }
                placeholder="Enter terms and conditions (optional)..."
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="offer-is-active"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
              <Label htmlFor="offer-is-active">
                Activate offer (make it available to customers)
              </Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Offer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
