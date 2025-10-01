"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AddStaffModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
}

export function AddStaffModal({ open, onOpenChange, onSubmit }: AddStaffModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    photoUrl: "",
    bio: "",
    skills: [] as string[],
    qualifications: [] as string[],
    languages: [] as string[],
    categories: [] as string[],
    contact: { phone: "", email: "" },
    isActive: true,
  })

  const [currentSkill, setCurrentSkill] = useState("")
  const [currentQualification, setCurrentQualification] = useState("")
  const [currentLanguage, setCurrentLanguage] = useState("")

  const handleAddSkill = () => {
    if (currentSkill.trim()) {
      setFormData({ ...formData, skills: [...formData.skills, currentSkill.trim()] })
      setCurrentSkill("")
    }
  }

  const handleRemoveSkill = (index: number) => {
    setFormData({ ...formData, skills: formData.skills.filter((_, i) => i !== index) })
  }

  const handleAddQualification = () => {
    if (currentQualification.trim()) {
      setFormData({ ...formData, qualifications: [...formData.qualifications, currentQualification.trim()] })
      setCurrentQualification("")
    }
  }

  const handleRemoveQualification = (index: number) => {
    setFormData({ ...formData, qualifications: formData.qualifications.filter((_, i) => i !== index) })
  }

  const handleAddLanguage = () => {
    if (currentLanguage.trim()) {
      setFormData({ ...formData, languages: [...formData.languages, currentLanguage.trim()] })
      setCurrentLanguage("")
    }
  }

  const handleRemoveLanguage = (index: number) => {
    setFormData({ ...formData, languages: formData.languages.filter((_, i) => i !== index) })
  }

  const handleCategoryToggle = (category: string) => {
    if (formData.categories.includes(category)) {
      setFormData({ ...formData, categories: formData.categories.filter((c) => c !== category) })
    } else {
      setFormData({ ...formData, categories: [...formData.categories, category] })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      rating: 0,
      reviews: [],
      portfolio: [],
      availability: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    onOpenChange(false)
  }

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
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
          <DialogDescription>Add a new staff member to your team</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photoUrl">Photo URL</Label>
                <Input
                  id="photoUrl"
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio *</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
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
                  variant={formData.categories.includes(category) ? "default" : "outline"}
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
                    <button type="button" onClick={() => handleRemoveSkill(index)} className="ml-2">
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
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
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
                    <button type="button" onClick={() => handleRemoveQualification(index)} className="ml-2">
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
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddQualification())}
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
                    <button type="button" onClick={() => handleRemoveLanguage(index)} className="ml-2">
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
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddLanguage())}
              />
              <Button type="button" onClick={handleAddLanguage}>
                <Plus className="h-4 w-4" />
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
                <p className="text-sm text-muted-foreground">Make this staff member available</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Staff Member</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
