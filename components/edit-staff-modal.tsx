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
import {
  uploadFileClient,
  CloudinaryPaths,
  deleteFile,
} from "@/lib/cloudinary/upload";
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
import { MediaPreview } from "@/components/media-preview";
import { getMediaType, getFileMediaType } from "@/lib/utils/media";

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
    // Admin-editable metrics
    rating: 0,
    totalEvents: 0,
    yearsExperience: 0,
    successRate: 100,
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
  const [editingPortfolioIndex, setEditingPortfolioIndex] = useState<
    number | null
  >(null);

  // Track portfolio items with pending file uploads
  // Map: portfolio index -> files to upload
  const [portfolioPendingUploads, setPortfolioPendingUploads] = useState<
    Map<number, File[]>
  >(new Map());

  // Track media URLs to delete from Cloudinary
  const [mediaToDelete, setMediaToDelete] = useState<string[]>([]);

  // Availability form states
  const [availabilityForm, setAvailabilityForm] = useState({
    from: "",
    to: "",
  });

  // Input states for skills, qualifications, languages
  const [skillInput, setSkillInput] = useState("");
  const [qualificationInput, setQualificationInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");

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
        // Admin-editable metrics (default values if not set)
        rating: (staff as any).rating || 0,
        totalEvents: (staff as any).totalEvents || staff.portfolio?.length || 0,
        yearsExperience: (staff as any).yearsExperience || 0,
        successRate: (staff as any).successRate || 100,
      });
      // Reset upload states when staff changes
      setSelectedFile(null);
      setPreviewUrl("");
      setUploadProgress(0);
      setUploadError("");
      setPortfolioForm({ eventName: "", description: "", media: [] });
      setPortfolioMediaFiles([]);
      setAvailabilityForm({ from: "", to: "" });
      setSkillInput("");
      setQualificationInput("");
      setLanguageInput("");
      setEditingPortfolioIndex(null);
      setPortfolioPendingUploads(new Map());
      setMediaToDelete([]);
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
        CloudinaryPaths.staff(staff?.id || "temp"),
        (progress) => {
          setUploadProgress(Math.round(progress));
        }
      );

      // Update form data with uploaded URL
      setFormData({ ...formData, photoUrl: result.url });
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

  const handleAddPortfolio = () => {
    if (!portfolioForm.description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    if (editingPortfolioIndex !== null) {
      // Update existing portfolio item
      const updatedPortfolio = [...formData.portfolio];
      updatedPortfolio[editingPortfolioIndex] = {
        eventName: portfolioForm.eventName || "",
        description: portfolioForm.description,
        media: portfolioForm.media, // Existing URLs
      };

      setFormData({
        ...formData,
        portfolio: updatedPortfolio,
      });

      // Track files to upload for this portfolio item
      if (portfolioMediaFiles.length > 0) {
        const newPendingUploads = new Map(portfolioPendingUploads);
        newPendingUploads.set(editingPortfolioIndex, portfolioMediaFiles);
        setPortfolioPendingUploads(newPendingUploads);
      }

      setEditingPortfolioIndex(null);
      toast.success("Portfolio item updated (files will be uploaded on save)");
    } else {
      // Create a new portfolio item
      const newPortfolio: PortfolioItem = {
        eventName: portfolioForm.eventName || "",
        description: portfolioForm.description,
        media: portfolioForm.media, // Existing media URLs (empty for new items)
      };

      const newIndex = formData.portfolio.length;

      setFormData({
        ...formData,
        portfolio: [...formData.portfolio, newPortfolio],
      });

      // Track files to upload for this new portfolio item
      if (portfolioMediaFiles.length > 0) {
        const newPendingUploads = new Map(portfolioPendingUploads);
        newPendingUploads.set(newIndex, portfolioMediaFiles);
        setPortfolioPendingUploads(newPendingUploads);
      }

      toast.success("Portfolio item added (files will be uploaded on save)");
    }

    // Reset portfolio form
    setPortfolioForm({ eventName: "", description: "", media: [] });
    setPortfolioMediaFiles([]);
    setPortfolioUploadProgress(0);
  };

  const handleEditPortfolio = (index: number) => {
    const item = formData.portfolio[index];
    setPortfolioForm({
      eventName: item.eventName || "",
      description: item.description,
      media: item.media,
    });
    setEditingPortfolioIndex(index);
    toast.info("Editing portfolio item");
  };

  const handleCancelEditPortfolio = () => {
    setPortfolioForm({ eventName: "", description: "", media: [] });
    setPortfolioMediaFiles([]);
    setEditingPortfolioIndex(null);
  };

  const handleRemovePortfolio = (index: number) => {
    const portfolioItem = formData.portfolio[index];

    // Track all media URLs from this portfolio item for deletion
    if (portfolioItem.media && portfolioItem.media.length > 0) {
      setMediaToDelete([...mediaToDelete, ...portfolioItem.media]);
    }

    // Remove from pending uploads if it was there
    const newPendingUploads = new Map(portfolioPendingUploads);
    newPendingUploads.delete(index);

    // Adjust indices for items after the deleted one
    const adjustedPendingUploads = new Map<number, File[]>();
    newPendingUploads.forEach((files, idx) => {
      if (idx > index) {
        adjustedPendingUploads.set(idx - 1, files);
      } else {
        adjustedPendingUploads.set(idx, files);
      }
    });
    setPortfolioPendingUploads(adjustedPendingUploads);

    setFormData({
      ...formData,
      portfolio: formData.portfolio.filter((_, i) => i !== index),
    });

    // If we're editing this item, cancel the edit
    if (editingPortfolioIndex === index) {
      handleCancelEditPortfolio();
    } else if (
      editingPortfolioIndex !== null &&
      editingPortfolioIndex > index
    ) {
      // Adjust editing index if needed
      setEditingPortfolioIndex(editingPortfolioIndex - 1);
    }
  };

  const handleRemovePortfolioMedia = (mediaUrl: string) => {
    // Remove from current form
    setPortfolioForm({
      ...portfolioForm,
      media: portfolioForm.media.filter((url) => url !== mediaUrl),
    });

    // Track for deletion from Cloudinary (only if it's an existing URL, not a local preview)
    if (mediaUrl.startsWith("http")) {
      setMediaToDelete([...mediaToDelete, mediaUrl]);
    }
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

  // Skills, Qualifications, Languages handlers
  const handleAddSkill = () => {
    if (!skillInput.trim()) {
      toast.error("Please enter a skill");
      return;
    }
    if (formData.skills.includes(skillInput.trim())) {
      toast.error("Skill already exists");
      return;
    }
    setFormData({
      ...formData,
      skills: [...formData.skills, skillInput.trim()],
    });
    setSkillInput("");
    toast.success("Skill added");
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const handleAddQualification = () => {
    if (!qualificationInput.trim()) {
      toast.error("Please enter a qualification");
      return;
    }
    if (formData.qualifications.includes(qualificationInput.trim())) {
      toast.error("Qualification already exists");
      return;
    }
    setFormData({
      ...formData,
      qualifications: [...formData.qualifications, qualificationInput.trim()],
    });
    setQualificationInput("");
    toast.success("Qualification added");
  };

  const handleRemoveQualification = (qualification: string) => {
    setFormData({
      ...formData,
      qualifications: formData.qualifications.filter(
        (q) => q !== qualification
      ),
    });
  };

  const handleAddLanguage = () => {
    if (!languageInput.trim()) {
      toast.error("Please enter a language");
      return;
    }
    if (formData.languages.includes(languageInput.trim())) {
      toast.error("Language already exists");
      return;
    }
    setFormData({
      ...formData,
      languages: [...formData.languages, languageInput.trim()],
    });
    setLanguageInput("");
    toast.success("Language added");
  };

  const handleRemoveLanguage = (language: string) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter((l) => l !== language),
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

    try {
      setIsUploading(true);

      // Handle photo upload if new file is selected
      if (selectedFile) {
        const oldPhotoUrl = staff?.photoUrl;

        // Upload new photo
        const result = await uploadFileClient(
          selectedFile,
          CloudinaryPaths.staff(staff?.id || "temp"),
          (progress) => {
            setUploadProgress(Math.round(progress));
          }
        );

        // Update form data with new URL
        formData.photoUrl = result.secureUrl || result.url;

        // Delete old photo from Cloudinary if it exists
        if (oldPhotoUrl && oldPhotoUrl !== formData.photoUrl) {
          try {
            const regex = /\/upload\/(?:v\d+\/)?(.+)$/;
            const match = oldPhotoUrl.match(regex);
            if (match && match[1]) {
              const publicId = match[1].replace(/\.\w+$/, "");
              await deleteFile(publicId);
            }
          } catch (error) {
            console.error("Failed to delete old photo:", error);
          }
        }
      }

      // Handle portfolio media uploads
      if (portfolioPendingUploads.size > 0) {
        setPortfolioUploading(true);
        toast.info("Uploading portfolio media...");

        try {
          // Calculate total files to upload
          let totalFiles = 0;
          portfolioPendingUploads.forEach((files) => {
            totalFiles += files.length;
          });

          let uploadedCount = 0;
          const updatedPortfolio = [...formData.portfolio];

          // Process each portfolio item that has pending uploads
          for (const [
            portfolioIndex,
            files,
          ] of portfolioPendingUploads.entries()) {
            const uploadedUrls: string[] = [];

            for (const file of files) {
              const result = await uploadFileClient(
                file,
                CloudinaryPaths.staff(staff?.id || "temp"),
                (progress) => {
                  const totalProgress =
                    ((uploadedCount + progress / 100) / totalFiles) * 100;
                  setPortfolioUploadProgress(Math.round(totalProgress));
                }
              );
              uploadedUrls.push(result.secureUrl || result.url);
              uploadedCount++;
            }

            // Add uploaded URLs to the portfolio item's media array
            if (updatedPortfolio[portfolioIndex]) {
              updatedPortfolio[portfolioIndex] = {
                ...updatedPortfolio[portfolioIndex],
                media: [
                  ...updatedPortfolio[portfolioIndex].media,
                  ...uploadedUrls,
                ],
              };
            }
          }

          // Update formData with all uploaded media URLs
          formData.portfolio = updatedPortfolio;

          toast.success("Portfolio media uploaded successfully");
        } catch (error: any) {
          console.error("Portfolio upload error:", error);
          toast.error(error.message || "Failed to upload portfolio media");
          setPortfolioUploading(false);
          setIsUploading(false);
          return;
        } finally {
          setPortfolioUploading(false);
        }
      }

      // Delete removed media from Cloudinary
      if (mediaToDelete.length > 0) {
        toast.info("Cleaning up old media...");

        for (const mediaUrl of mediaToDelete) {
          try {
            const regex = /\/upload\/(?:v\d+\/)?(.+)$/;
            const match = mediaUrl.match(regex);
            if (match && match[1]) {
              const publicId = match[1].replace(/\.\w+$/, "");
              await deleteFile(publicId);
            }
          } catch (error) {
            console.error("Failed to delete media:", error);
            // Continue with other deletions even if one fails
          }
        }
      }

      // Submit form data
      await onSubmit({
        ...formData,
      });

      // Reset upload states
      setSelectedFile(null);
      setPreviewUrl("");
      setUploadProgress(0);
      setUploadError("");
      setPortfolioMediaFiles([]);
      setPortfolioUploadProgress(0);
      setPortfolioPendingUploads(new Map());
      setMediaToDelete([]);
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update staff profile");
    } finally {
      setIsUploading(false);
    }
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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
                      {/* Upload or Replace Button */}
                      {!isUploading && !formData.photoUrl && (
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            onClick={handleUploadPhoto}
                            size="sm"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemovePhoto}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}

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

                      {/* Success Message */}
                      {formData.photoUrl && !isUploading && selectedFile && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 text-sm text-green-600 dark:text-green-400">
                            ✓ Photo uploaded successfully
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemovePhoto}
                          >
                            Change Again
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

            {/* Skills Section */}
            <div className="space-y-3">
              <Label>Skills</Label>

              {/* Display existing skills */}
              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add new skill */}
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="e.g., Event Coordination"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddSkill} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Qualifications Section */}
            <div className="space-y-3">
              <Label>Qualifications & Certifications</Label>

              {/* Display existing qualifications */}
              {formData.qualifications.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.qualifications.map((qualification, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {qualification}
                      <button
                        type="button"
                        onClick={() => handleRemoveQualification(qualification)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add new qualification */}
              <div className="flex gap-2">
                <Input
                  value={qualificationInput}
                  onChange={(e) => setQualificationInput(e.target.value)}
                  placeholder="e.g., Certified Event Planner"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddQualification();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddQualification}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Languages Section */}
            <div className="space-y-3">
              <Label>Languages</Label>

              {/* Display existing languages */}
              {formData.languages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.languages.map((language, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {language}
                      <button
                        type="button"
                        onClick={() => handleRemoveLanguage(language)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add new language */}
              <div className="flex gap-2">
                <Input
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  placeholder="e.g., English, French"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddLanguage();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddLanguage} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
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
                      className={`p-3 border rounded-lg space-y-2 ${
                        editingPortfolioIndex === index
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {item.eventName && (
                            <p className="text-xs text-muted-foreground font-medium">
                              {item.eventName}
                            </p>
                          )}
                          <p className="text-sm">{item.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground">
                              {item.media.length} media file(s)
                            </p>
                            {portfolioPendingUploads.has(index) && (
                              <Badge variant="secondary" className="text-xs">
                                +{portfolioPendingUploads.get(index)?.length}{" "}
                                pending upload
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPortfolio(index)}
                            disabled={
                              editingPortfolioIndex !== null &&
                              editingPortfolioIndex !== index
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePortfolio(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
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

              {/* Add/Edit portfolio item form */}
              <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">
                    {editingPortfolioIndex !== null
                      ? "Edit Portfolio Item"
                      : "Add Portfolio Item"}
                  </p>
                  {editingPortfolioIndex !== null && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEditPortfolio}
                    >
                      Cancel Edit
                    </Button>
                  )}
                </div>

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

                  {/* Display existing media URLs */}
                  {portfolioForm.media.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium">Current Media:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {portfolioForm.media.map((url, idx) => {
                          const mediaType = getMediaType(url);
                          return (
                            <div
                              key={idx}
                              className="relative aspect-video border rounded-lg overflow-hidden group"
                            >
                              <MediaPreview
                                src={url}
                                alt={`Portfolio media ${idx + 1}`}
                                className="w-full h-full"
                                showControls={mediaType === "video"}
                                muted={false}
                                loop={false}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemovePortfolioMedia(url)}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Preview selected files */}
                  {portfolioMediaFiles.length > 0 && !portfolioUploading && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium">
                        New Files to Upload:
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {portfolioMediaFiles.map((file, idx) => {
                          const fileMediaType = getFileMediaType(file);
                          const previewUrl = URL.createObjectURL(file);

                          return (
                            <div
                              key={idx}
                              className="relative aspect-video border rounded-lg overflow-hidden bg-muted"
                            >
                              <MediaPreview
                                src={previewUrl}
                                alt={file.name}
                                className="w-full h-full"
                                showControls={fileMediaType === "video"}
                                muted={false}
                                loop={false}
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate z-10">
                                {file.name}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* File input */}
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handlePortfolioMediaSelect}
                      disabled={portfolioUploading}
                    />
                  </div>
                  {portfolioMediaFiles.length > 0 && !portfolioUploading && (
                    <p className="text-xs text-muted-foreground">
                      Files will be uploaded when saving the profile
                    </p>
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
                  {editingPortfolioIndex !== null
                    ? "Update Portfolio Item"
                    : "Add Portfolio Item"}
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

            {/* Admin-Only: Staff Metrics Section */}
            <div className="space-y-4 p-4 border rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-200">
                  📊 Admin Controls - Staff Metrics
                </h3>
                <Badge variant="secondary" className="text-xs">
                  Admin Only
                </Badge>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                These metrics are only editable by administrators and displayed
                to clients.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (0-5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rating: Math.min(
                          5,
                          Math.max(0, parseFloat(e.target.value) || 0)
                        ),
                      })
                    }
                    className="bg-white dark:bg-gray-800"
                  />
                  <p className="text-xs text-muted-foreground">
                    Average rating shown to clients (e.g., 4.8)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalEvents">Total Events Completed</Label>
                  <Input
                    id="totalEvents"
                    type="number"
                    min="0"
                    value={formData.totalEvents}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalEvents: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="bg-white dark:bg-gray-800"
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of events they have worked on
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearsExperience">Years of Experience</Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    min="0"
                    max="50"
                    value={formData.yearsExperience}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        yearsExperience: Math.max(
                          0,
                          parseInt(e.target.value) || 0
                        ),
                      })
                    }
                    className="bg-white dark:bg-gray-800"
                  />
                  <p className="text-xs text-muted-foreground">
                    Professional experience in years
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="successRate">Success Rate (%)</Label>
                  <Input
                    id="successRate"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.successRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        successRate: Math.min(
                          100,
                          Math.max(0, parseInt(e.target.value) || 0)
                        ),
                      })
                    }
                    className="bg-white dark:bg-gray-800"
                  />
                  <p className="text-xs text-muted-foreground">
                    Client satisfaction/success percentage
                  </p>
                </div>
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
