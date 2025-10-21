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
import { useUpdateOfferMutation, Offer } from "@/lib/redux/api/marketingApi";

interface EditOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: () => void;
  offer: Offer | null;
}

export function EditOfferModal({
  open,
  onOpenChange,
  onSubmit,
  offer,
}: EditOfferModalProps) {
  const { toast } = useToast();
  const [updateOffer, { isLoading: isUpdating }] = useUpdateOfferMutation();

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

  // Populate form when offer changes
  useEffect(() => {
    if (offer) {
      const formatDate = (date: any) => {
        if (!date) return "";
        const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
        return d.toISOString().split("T")[0];
      };

      setFormData({
        title: offer.title,
        description: offer.description,
        discount: offer.discount,
        validFrom: formatDate(offer.validFrom),
        validTo: formatDate(offer.validTo),
        isActive: offer.isActive,
        category: offer.category || "",
        terms: offer.terms || "",
      });
    }
  }, [offer]);

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

    if (!offer) {
      toast({
        title: "Error",
        description: "No offer selected for editing",
        variant: "destructive",
      });
      return;
    }

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
      console.log("[Edit Offer Modal] Updating offer:", offer.id, formData);

      const offerData = {
        id: offer.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        discount: formData.discount.trim(),
        validFrom: new Date(formData.validFrom),
        validTo: new Date(formData.validTo),
        isActive: formData.isActive,
        ...(formData.category && { category: formData.category }),
        ...(formData.terms.trim() && { terms: formData.terms.trim() }),
      };

      await updateOffer(offerData).unwrap();

      toast({
        title: "Success",
        description: "Offer updated successfully",
      });

      onOpenChange(false);
      onSubmit?.();
    } catch (error: any) {
      console.error("[Edit Offer Modal] Error updating offer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update offer",
        variant: "destructive",
      });
    }
  };

  if (!offer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Offer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-offer-title">Offer Title *</Label>
                <Input
                  id="edit-offer-title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g., Summer Wedding Special"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-offer-discount">Discount *</Label>
                <Input
                  id="edit-offer-discount"
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
              <Label htmlFor="edit-offer-description">Description *</Label>
              <Textarea
                id="edit-offer-description"
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
                <Label htmlFor="edit-offer-valid-from">Valid From *</Label>
                <Input
                  id="edit-offer-valid-from"
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
                <Label htmlFor="edit-offer-valid-to">Valid To *</Label>
                <Input
                  id="edit-offer-valid-to"
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
              <Label htmlFor="edit-offer-category">Category</Label>
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
                  <SelectItem value="">No Category</SelectItem>
                  <SelectItem value="wedding">Wedding</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="cultural">Cultural</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-offer-terms">Terms & Conditions</Label>
              <Textarea
                id="edit-offer-terms"
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
                id="edit-offer-is-active"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
              <Label htmlFor="edit-offer-is-active">
                Activate offer (make it available to customers)
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
              {isUpdating ? "Updating..." : "Update Offer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
