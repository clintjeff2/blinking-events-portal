"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

interface Staff {
  id: string
  fullName: string
  photoUrl: string
  bio: string
  skills: string[]
  qualifications: string[]
  languages: string[]
  categories: string[]
  contact: { phone: string; email: string }
  isActive: boolean
}

interface EditStaffModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  staff: Staff | null
}

export function EditStaffModal({ open, onOpenChange, onSubmit, staff }: EditStaffModalProps) {
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
        contact: staff.contact,
        isActive: staff.isActive,
      })
    }
  }, [staff])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...staff,
      ...formData,
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

  const handleCategoryToggle = (category: string) => {
    if (formData.categories.includes(category)) {
      setFormData({ ...formData, categories: formData.categories.filter((c) => c !== category) })
    } else {
      setFormData({ ...formData, categories: [...formData.categories, category] })
    }
  }

  if (!staff) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photoUrl">Photo URL</Label>
                <Input
                  id="photoUrl"
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio *</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
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
                    variant={formData.categories.includes(category) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleCategoryToggle(category)}
                  >
                    {category}
                  </Badge>
                ))}
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
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
