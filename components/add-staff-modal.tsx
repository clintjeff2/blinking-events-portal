"use client";

import type React from "react";

import { useState } from "react";
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
import { Plus, X, Upload, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadFileClient, CloudinaryPaths } from "@/lib/cloudinary/upload";
import {
  validateFiles,
  CLOUDINARY_LIMITS_READABLE,
} from "@/lib/cloudinary/config";
import { toast } from "sonner";

interface AddStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
}

interface PortfolioItem {
  eventName: string;
  description: string;
  media: string[];
}

interface AvailabilitySlot {
  from: Date;
  to: Date;
}

export function AddStaffModal({
  open,
  onOpenChange,
  onSubmit,
}: AddStaffModalProps) {
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

  const [currentSkill, setCurrentSkill] = useState("");
  const [currentQualification, setCurrentQualification] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("");

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

  const handleAddSkill = () => {
    if (currentSkill.trim()) {
      setFormData({
        ...formData,
        skills: [...formData.skills, currentSkill.trim()],
      });
      setCurrentSkill("");
    }
  };

  const handleRemoveSkill = (index: number) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index),
    });
  };

  const handleAddQualification = () => {
    if (currentQualification.trim()) {
      setFormData({
        ...formData,
        qualifications: [
          ...formData.qualifications,
          currentQualification.trim(),
        ],
      });
      setCurrentQualification("");
    }
  };

  const handleRemoveQualification = (index: number) => {
    setFormData({
      ...formData,
      qualifications: formData.qualifications.filter((_, i) => i !== index),
    });
  };

  const handleAddLanguage = () => {
    if (currentLanguage.trim()) {
      setFormData({
        ...formData,
        languages: [...formData.languages, currentLanguage.trim()],
      });
      setCurrentLanguage("");
    }
  };

  const handleRemoveLanguage = (index: number) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter((_, i) => i !== index),
    });
  };

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

  const handleUploadPortfolioMedia = async () => {
    if (portfolioMediaFiles.length === 0) return;

    setPortfolioUploading(true);
    setPortfolioUploadProgress(0);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < portfolioMediaFiles.length; i++) {
        const file = portfolioMediaFiles[i];
        const result = await uploadFileClient(
          file,
          CloudinaryPaths.staff("temp"),
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

      setPortfolioForm({ ...portfolioForm, media: uploadedUrls });
      toast.success(`${uploadedUrls.length} file(s) uploaded successfully`);
    } catch (error: any) {
      console.error("Portfolio upload error:", error);
      toast.error(error.message || "Failed to upload files");
    } finally {
      setPortfolioUploading(false);
    }
  };

  const handleAddPortfolio = async () => {
    if (!portfolioForm.description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    const newPortfolio: PortfolioItem = {
      eventName: portfolioForm.eventName || "",
      description: portfolioForm.description,
      media: portfolioForm.media,
    };

    // We'll keep the selected files for upload during form submission
    // But we'll show previews of the selected files immediately

    setFormData({
      ...formData,
      portfolio: [...formData.portfolio, newPortfolio],
    });

    // Reset portfolio form but keep media files for final submission
    setPortfolioForm({ eventName: "", description: "", media: [] });

    // Don't clear media files until final submission
    // This keeps them available for the actual upload
    // setPortfolioMediaFiles([]);

    setPortfolioUploadProgress(0);
    toast.success("Portfolio item added");
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

  // Upload photo to Cloudinary
  const handleUploadPhoto = async () => {
    if (!selectedFile) {
      toast.error("Please select a photo first");
      return;
    }

    setIsUploading(true);
    setUploadError("");
    setUploadProgress(0);

    try {
      // Upload to Cloudinary with progress tracking
      const result = await uploadFileClient(
        selectedFile,
        CloudinaryPaths.staff("temp"), // Use temp until staff is created
        (progress) => {
          setUploadProgress(Math.round(progress));
        }
      );

      // Update form data with uploaded URL (use secure URL)
      setFormData({ ...formData, photoUrl: result.secureUrl || result.url });
      toast.success("Photo uploaded successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadError(error.message || "Failed to upload photo");
      toast.error(error.message || "Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  // Remove uploaded photo
  const handleRemovePhoto = () => {
    setFormData({ ...formData, photoUrl: "" });
    setSelectedFile(null);
    setPreviewUrl("");
    setUploadProgress(0);
    setUploadError("");
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

    try {
      // Show loading toast
      const loadingToast = toast.loading("Creating staff profile...");

      // Upload photo if selected
      if (selectedFile && !formData.photoUrl) {
        setIsUploading(true);
        setUploadProgress(0);

        try {
          // Upload to Cloudinary with progress tracking
          const result = await uploadFileClient(
            selectedFile,
            CloudinaryPaths.staff("temp"),
            (progress) => {
              setUploadProgress(Math.round(progress));
            }
          );

          // Update form data with uploaded URL
          formData.photoUrl = result.secureUrl || result.url;
        } catch (error: any) {
          console.error("Upload error:", error);
          toast.dismiss(loadingToast);
          toast.error(
            `Failed to upload profile photo: ${
              error.message || "Unknown error"
            }`
          );
          return;
        } finally {
          setIsUploading(false);
        }
      }

      // Upload any pending portfolio media
      for (const portfolioItem of formData.portfolio) {
        if (
          portfolioItem.media.length === 0 &&
          portfolioMediaFiles.length > 0
        ) {
          setPortfolioUploading(true);

          try {
            const uploadedUrls: string[] = [];

            for (let i = 0; i < portfolioMediaFiles.length; i++) {
              const file = portfolioMediaFiles[i];
              const result = await uploadFileClient(
                file,
                CloudinaryPaths.staff("temp"),
                (progress) => {
                  const overallProgress = Math.round(
                    ((i + progress / 100) / portfolioMediaFiles.length) * 100
                  );
                  setPortfolioUploadProgress(overallProgress);
                }
              );
              uploadedUrls.push(result.secureUrl || result.url);
            }

            // Add the URLs to portfolio media
            portfolioItem.media = uploadedUrls;
          } catch (error: any) {
            console.error("Portfolio upload error:", error);
            toast.dismiss(loadingToast);
            toast.error(
              `Failed to upload portfolio media: ${
                error.message || "Unknown error"
              }`
            );
            return;
          } finally {
            setPortfolioUploading(false);
          }
        }
      }

      // Dismiss loading toast
      toast.dismiss(loadingToast);
    } catch (error: any) {
      toast.error(`Error processing uploads: ${error.message}`);
      return;
    }

    // Submit form data
    onSubmit({
      ...formData,
      rating: 0,
      reviews: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Reset form
    setFormData({
      fullName: "",
      photoUrl: "",
      bio: "",
      skills: [],
      qualifications: [],
      languages: [],
      categories: [],
      portfolio: [],
      availability: [],
      contact: { phone: "", email: "" },
      isActive: true,
    });
    setSelectedFile(null);
    setPreviewUrl("");
    setUploadProgress(0);
    setUploadError("");
    setPortfolioForm({ eventName: "", description: "", media: [] });
    setPortfolioMediaFiles([]);
    setAvailabilityForm({ from: "", to: "" });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
          <DialogDescription>
            Add a new staff member to your team
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Basic Information</h3>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                placeholder="John Doe"
                required
              />
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
                  {!formData.photoUrl ? (
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
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 text-sm text-green-600 dark:text-green-400">
                        ✓ Photo uploaded successfully
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemovePhoto}
                        disabled={isUploading}
                      >
                        Change Photo
                      </Button>
                    </div>
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
                placeholder="Tell us about this staff member..."
                rows={4}
                required
              />
            </div>
          </div>

          {/* Categories */}
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

          {/* Skills */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Skills</h3>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(index)}
                      className="ml-2"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                placeholder="Add a skill"
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddSkill())
                }
              />
              <Button type="button" onClick={handleAddSkill}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Qualifications */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Qualifications</h3>
            {formData.qualifications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.qualifications.map((qual, index) => (
                  <Badge key={index} variant="secondary">
                    {qual}
                    <button
                      type="button"
                      onClick={() => handleRemoveQualification(index)}
                      className="ml-2"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={currentQualification}
                onChange={(e) => setCurrentQualification(e.target.value)}
                placeholder="Add a qualification"
                onKeyPress={(e) =>
                  e.key === "Enter" &&
                  (e.preventDefault(), handleAddQualification())
                }
              />
              <Button type="button" onClick={handleAddQualification}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Languages */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Languages</h3>
            {formData.languages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.languages.map((lang, index) => (
                  <Badge key={index} variant="secondary">
                    {lang}
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(index)}
                      className="ml-2"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={currentLanguage}
                onChange={(e) => setCurrentLanguage(e.target.value)}
                placeholder="Add a language"
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddLanguage())
                }
              />
              <Button type="button" onClick={handleAddLanguage}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Portfolio */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Portfolio</h3>

            {/* Display existing portfolio items */}
            {formData.portfolio.length > 0 && (
              <div className="space-y-2">
                {formData.portfolio.map((item, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2">
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
                          className="relative aspect-video border rounded-lg overflow-hidden bg-muted"
                        >
                          <img
                            src={url}
                            alt={`Portfolio media ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error("Image load error:", url);
                              e.currentTarget.src = "/placeholder.jpg";
                            }}
                            onLoad={() => console.log("Image loaded:", url)}
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
                    {portfolioMediaFiles.length > 0 && !portfolioUploading && (
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
                      {slot.from.toLocaleDateString()}{" "}
                      <span className="font-medium">To:</span>{" "}
                      {slot.to.toLocaleDateString()}
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

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Contact Information</h3>
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
                  placeholder="+91 98765 43210"
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
                  placeholder="staff@blinkingevents.com"
                />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Settings</h3>
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
            <Button type="submit">Add Staff Member</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
