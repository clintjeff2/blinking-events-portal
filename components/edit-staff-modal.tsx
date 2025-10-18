"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { Upload, AlertCircle, Plus, X } from "lucide-react";
import { uploadFileClient, CloudinaryPaths } from "@/lib/cloudinary/upload";
import {
  validateFiles,
  CLOUDINARY_LIMITS_READABLE,
} from "@/lib/cloudinary/config";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import type {
  StaffProfile,
  PortfolioItem,
  AvailabilitySlot,
} from "@/lib/redux/api/staffApi";

interface EditStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  staff: StaffProfile | null;
}

export function EditStaffModal({
  open,
  onOpenChange,
  onSubmit,
  staff,
}: EditStaffModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    photoUrl: "",
    bio: "",
    skills: [] as string[],
    qualifications: [] as string[],
    languages: [] as string[],
    categories: [] as string[],
    portfolio: [] as PortfolioItem[],
    availability: [] as AvailabilitySlot[],
    contact: { phone: "", email: "" },
    isActive: true,
  });

  // Portfolio form states
  const [portfolioForm, setPortfolioForm] = useState({
    eventName: "",
    description: "",
    media: [] as string[],
  });
  const [portfolioMediaFiles, setPortfolioMediaFiles] = useState<File[]>([]);
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const [portfolioUploadProgress, setPortfolioUploadProgress] = useState(0);

  // Availability form states
  const [availabilityForm, setAvailabilityForm] = useState({
    from: "",
    to: "",
  });

  // Photo Upload states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (staff) {
      setFormData({
        fullName: staff.fullName,
        photoUrl: staff.photoUrl,
        bio: staff.bio,
        skills: staff.skills,
        qualifications: staff.qualifications,
        languages: staff.languages,
        categories: staff.categories,
        portfolio: staff.portfolio || [],
        availability: staff.availability || [],
        contact: staff.contact,
        isActive: staff.isActive,
      });
      // Reset upload states when staff changes
      setSelectedFile(null);
      setPreviewUrl("");
      setUploadProgress(0);
      setUploadError("");
      setPortfolioForm({ eventName: "", description: "", media: [] });
      setPortfolioMediaFiles([]);
      setAvailabilityForm({ from: "", to: "" });
    }
  }, [staff]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setUploadError("");
    setUploadProgress(0);

    // Validate file
    const validation = validateFiles([file]);
    if (!validation.isValid) {
      setUploadError(validation.errors.join(". "));
      toast.error(validation.errors[0]);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setSelectedFile(file);
  };

  // No longer needed - upload is integrated with form submission

  // Remove uploaded photo
  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setUploadProgress(0);
    setUploadError("");
  };

  // Portfolio handlers
  const handlePortfolioMediaSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate files
    const validation = validateFiles(files);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    setPortfolioMediaFiles(files);
  };

  // No longer needed - upload is integrated with portfolio item creation

  const handleAddPortfolio = async () => {
    if (!portfolioForm.description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    // Upload media if files are selected but not uploaded
    if (portfolioMediaFiles.length > 0 && portfolioForm.media.length === 0) {
      setPortfolioUploading(true);
      setPortfolioUploadProgress(0);

      try {
        const uploadedUrls: string[] = [];

        for (let i = 0; i < portfolioMediaFiles.length; i++) {
          const file = portfolioMediaFiles[i];
          const result = await uploadFileClient(
            file,
            CloudinaryPaths.staff(staff?.id || "temp"),
            (progress) => {
              const overallProgress = Math.round(
                ((i + progress / 100) / portfolioMediaFiles.length) * 100
              );
              setPortfolioUploadProgress(overallProgress);
            }
          );
          // Use secureUrl for HTTPS
          uploadedUrls.push(result.secureUrl || result.url);
        }

        // Create the portfolio item with uploaded media
        const newPortfolio: PortfolioItem = {
          eventName: portfolioForm.eventName || "",
          description: portfolioForm.description,
          media: uploadedUrls,
        };

        setFormData({
          ...formData,
          portfolio: [...formData.portfolio, newPortfolio],
        });

        // Reset portfolio form
        setPortfolioForm({ eventName: "", description: "", media: [] });
        setPortfolioMediaFiles([]);
        setPortfolioUploadProgress(0);
        toast.success("Portfolio item added with uploaded media");
      } catch (error: any) {
        console.error("Portfolio upload error:", error);
        toast.error(error.message || "Failed to upload files");
      } finally {
        setPortfolioUploading(false);
      }
    } else {
      // No files to upload, just add the portfolio item
      const newPortfolio: PortfolioItem = {
        eventName: portfolioForm.eventName || "",
        description: portfolioForm.description,
        media: portfolioForm.media,
      };

      setFormData({
        ...formData,
        portfolio: [...formData.portfolio, newPortfolio],
      });

      // Reset portfolio form
      setPortfolioForm({ eventName: "", description: "", media: [] });
      setPortfolioMediaFiles([]);
      setPortfolioUploadProgress(0);
      toast.success("Portfolio item added");
    }
  };

  const handleRemovePortfolio = (index: number) => {
    setFormData({
      ...formData,
      portfolio: formData.portfolio.filter((_, i) => i !== index),
    });
  };

  // Availability handlers
  const handleAddAvailability = () => {
    if (!availabilityForm.from || !availabilityForm.to) {
      toast.error("Please select both start and end dates");
      return;
    }

    const fromDate = new Date(availabilityForm.from);
    const toDate = new Date(availabilityForm.to);

    if (toDate < fromDate) {
      toast.error("End date must be after start date");
      return;
    }

    const newSlot: AvailabilitySlot = {
      from: fromDate,
      to: toDate,
    };

    setFormData({
      ...formData,
      availability: [...formData.availability, newSlot],
    });

    setAvailabilityForm({ from: "", to: "" });
    toast.success("Availability slot added");
  };

  const handleRemoveAvailability = (index: number) => {
    setFormData({
      ...formData,
      availability: formData.availability.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.fullName.trim()) {
      toast.error("Please enter staff member's full name");
      return;
    }

    if (formData.categories.length === 0) {
      toast.error("Please select at least one category");
      return;
    }

    if (!formData.contact.phone.trim() || !formData.contact.email.trim()) {
      toast.error("Please provide contact phone and email");
      return;
    }

    // Handle photo upload if needed
    if (selectedFile && !formData.photoUrl) {
      setIsUploading(true);
      setUploadProgress(0);

      try {
        const result = await uploadFileClient(
          selectedFile,
          CloudinaryPaths.staff(staff?.id || "temp"),
          (progress) => {
            setUploadProgress(Math.round(progress));
          }
        );

        // Update form data with uploaded URL
        formData.photoUrl = result.secureUrl || result.url;
      } catch (error: any) {
        console.error("Upload error:", error);
        toast.error(error.message || "Failed to upload photo");
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    // Submit form data
    onSubmit({
      ...staff,
      ...formData,
      updatedAt: new Date(),
    });

    // Reset upload states
    setSelectedFile(null);
    setPreviewUrl("");
    setUploadProgress(0);
    setUploadError("");
  };

  const categoryOptions = [
    "MC",
    "Hostess",
    "Security",
    "Photographer",
    "Videographer",
    "Decorator",
    "Caterer",
    "DJ",
    "Other",
  ];

  const handleCategoryToggle = (category: string) => {
    if (formData.categories.includes(category)) {
      setFormData({
        ...formData,
        categories: formData.categories.filter((c) => c !== category),
      });
    } else {
      setFormData({
        ...formData,
        categories: [...formData.categories, category],
      });
    }
  };

  if (!staff) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
          <DialogDescription>Update staff member information</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="space-y-2">
              <Label>Profile Photo</Label>

              {/* Display size limits */}
              <p className="text-xs text-muted-foreground">
                Maximum size: {CLOUDINARY_LIMITS_READABLE.MAX_IMAGE_SIZE}.
                Allowed formats: JPG, PNG, WebP
              </p>

              {/* Upload Error Alert */}
              {uploadError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Upload Error</p>
                    <p className="text-sm">{uploadError}</p>
                  </div>
                </Alert>
              )}

              {/* Photo Preview and Controls */}
              <div className="flex items-center gap-4">
                {/* Preview Avatar */}
                <Avatar className="h-24 w-24">
                  {previewUrl || formData.photoUrl ? (
                    <img
                      src={previewUrl || formData.photoUrl}
                      alt="Preview"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-muted">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </Avatar>

                {/* Upload Controls */}
                <div className="flex-1 space-y-2">
                  {!selectedFile ? (
                    <>
                      {/* File Input */}
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          disabled={isUploading}
                          className="flex-1"
                        />
                      </div>

                      {/* Current photo indicator */}
                      {formData.photoUrl && !previewUrl && (
                        <p className="text-xs text-muted-foreground">
                          Current photo displayed. Select a new file to change.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Upload Progress */}
                      {isUploading && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Uploading...
                            </span>
                            <span className="font-medium">
                              {uploadProgress}%
                            </span>
                          </div>
                          <Progress value={uploadProgress} className="h-2" />
                        </div>
                      )}

                      {/* Preview and Change Button */}
                      {selectedFile && !isUploading && (
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            Photo will be uploaded when saving the form
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemovePhoto}
                          >
                            Change
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio *</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={4}
                required
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Categories *</h3>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((category) => (
                  <Badge
                    key={category}
                    variant={
                      formData.categories.includes(category)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => handleCategoryToggle(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Portfolio */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Portfolio</h3>

              {/* Display existing portfolio items */}
              {formData.portfolio.length > 0 && (
                <div className="space-y-2">
                  {formData.portfolio.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-lg space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {item.eventName && (
                            <p className="text-xs text-muted-foreground font-medium">
                              {item.eventName}
                            </p>
                          )}
                          <p className="text-sm">{item.description}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePortfolio(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {item.media.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                          {item.media.map((url, idx) => (
                            <div
                              key={idx}
                              className="relative aspect-video border rounded overflow-hidden"
                            >
                              <img
                                src={url}
                                alt={`Media ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add new portfolio item */}
              <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
                <p className="text-sm font-medium">Add Portfolio Item</p>

                <div className="space-y-2">
                  <Label htmlFor="eventName">Event Name (Optional)</Label>
                  <Input
                    id="eventName"
                    value={portfolioForm.eventName}
                    onChange={(e) =>
                      setPortfolioForm({
                        ...portfolioForm,
                        eventName: e.target.value,
                      })
                    }
                    placeholder="e.g., Sarah & John's Wedding"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portfolioDesc">Description *</Label>
                  <Textarea
                    id="portfolioDesc"
                    value={portfolioForm.description}
                    onChange={(e) =>
                      setPortfolioForm({
                        ...portfolioForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe this portfolio item..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Media Files</Label>
                  <p className="text-xs text-muted-foreground">
                    Max {CLOUDINARY_LIMITS_READABLE.MAX_IMAGE_SIZE} for images,{" "}
                    {CLOUDINARY_LIMITS_READABLE.MAX_VIDEO_SIZE} for videos
                  </p>

                  {portfolioForm.media.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        {portfolioForm.media.map((url, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-video border rounded-lg overflow-hidden"
                          >
                            <img
                              src={url}
                              alt={`Portfolio media ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPortfolioForm({ ...portfolioForm, media: [] });
                          setPortfolioMediaFiles([]);
                        }}
                      >
                        Clear All
                      </Button>
                    </div>
                  ) : (
                    <>
                      {portfolioMediaFiles.length > 0 &&
                        !portfolioUploading && (
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            {portfolioMediaFiles.map((file, idx) => (
                              <div
                                key={idx}
                                className="relative aspect-video border rounded-lg overflow-hidden bg-muted"
                              >
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                                  {file.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          onChange={handlePortfolioMediaSelect}
                          disabled={portfolioUploading}
                        />
                        {portfolioMediaFiles.length > 0 &&
                          !portfolioUploading && (
                            <p className="text-xs text-muted-foreground">
                              Files will be uploaded when adding the portfolio
                              item
                            </p>
                          )}
                      </div>

                      {portfolioUploading && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Uploading...
                            </span>
                            <span className="font-medium">
                              {Math.round(portfolioUploadProgress)}%
                            </span>
                          </div>
                          <Progress
                            value={portfolioUploadProgress}
                            className="h-2"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleAddPortfolio}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Portfolio Item
                </Button>
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Availability</h3>

              {/* Display existing slots */}
              {formData.availability.length > 0 && (
                <div className="space-y-2">
                  {formData.availability.map((slot, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-lg flex justify-between items-center"
                    >
                      <div className="text-sm">
                        <span className="font-medium">From:</span>{" "}
                        {slot.from instanceof Date
                          ? slot.from.toLocaleDateString()
                          : slot.from.toDate().toLocaleDateString()}{" "}
                        <span className="font-medium">To:</span>{" "}
                        {slot.to instanceof Date
                          ? slot.to.toLocaleDateString()
                          : slot.to.toDate().toLocaleDateString()}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAvailability(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new availability slot */}
              <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
                <p className="text-sm font-medium">Add Availability Slot</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="availFrom">From Date</Label>
                    <Input
                      id="availFrom"
                      type="date"
                      value={availabilityForm.from}
                      onChange={(e) =>
                        setAvailabilityForm({
                          ...availabilityForm,
                          from: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="availTo">To Date</Label>
                    <Input
                      id="availTo"
                      type="date"
                      value={availabilityForm.to}
                      onChange={(e) =>
                        setAvailabilityForm({
                          ...availabilityForm,
                          to: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleAddAvailability}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Availability Slot
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.contact.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact: { ...formData.contact, phone: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.contact.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact: { ...formData.contact, email: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">
                  Make this staff member available
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
