"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, X } from "lucide-react"

interface Package {
  name: string
  features: string[]
  price: number
  description: string
  image: string
}

interface AddServiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
}

export function AddServiceModal({ open, onOpenChange, onSubmit }: AddServiceModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    priceRange: { min: 0, max: 0 },
    images: [] as string[],
    featured: false,
    isActive: true,
  })

  const [packages, setPackages] = useState<Package[]>([])
  const [currentPackage, setCurrentPackage] = useState<Package>({
    name: "",
    features: [""],
    price: 0,
    description: "",
    image: "",
  })

  const handleAddPackage = () => {
    if (currentPackage.name && currentPackage.price > 0) {
      setPackages([...packages, currentPackage])
      setCurrentPackage({
        name: "",
        features: [""],
        price: 0,
        description: "",
        image: "",
      })
    }
  }

  const handleRemovePackage = (index: number) => {
    setPackages(packages.filter((_, i) => i !== index))
  }

  const handleAddFeature = () => {
    setCurrentPackage({
      ...currentPackage,
      features: [...currentPackage.features, ""],
    })
  }

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...currentPackage.features]
    newFeatures[index] = value
    setCurrentPackage({ ...currentPackage, features: newFeatures })
  }

  const handleRemoveFeature = (index: number) => {
    setCurrentPackage({
      ...currentPackage,
      features: currentPackage.features.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      packages,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Service</DialogTitle>
          <DialogDescription>Create a new service offering for Blinking Events</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Premium Wedding Package"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the service offering..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPrice">Minimum Price (₹) *</Label>
                <Input
                  id="minPrice"
                  type="number"
                  value={formData.priceRange.min}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priceRange: { ...formData.priceRange, min: Number(e.target.value) },
                    })
                  }
                  placeholder="50000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPrice">Maximum Price (₹) *</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  value={formData.priceRange.max}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priceRange: { ...formData.priceRange, max: Number(e.target.value) },
                    })
                  }
                  placeholder="500000"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="images">Service Images (URLs)</Label>
              <Input
                id="images"
                value={formData.images.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    images: e.target.value
                      .split(",")
                      .map((url) => url.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
              />
              <p className="text-xs text-muted-foreground">Comma-separated image URLs</p>
            </div>
          </div>

          {/* Packages */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Service Packages</h3>

            {packages.length > 0 && (
              <div className="space-y-2">
                {packages.map((pkg, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{pkg.name}</p>
                      <p className="text-sm text-muted-foreground">₹{pkg.price.toLocaleString()}</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemovePackage(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 border rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="packageName">Package Name</Label>
                  <Input
                    id="packageName"
                    value={currentPackage.name}
                    onChange={(e) => setCurrentPackage({ ...currentPackage, name: e.target.value })}
                    placeholder="e.g., Basic, Premium, Deluxe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="packagePrice">Price (₹)</Label>
                  <Input
                    id="packagePrice"
                    type="number"
                    value={currentPackage.price}
                    onChange={(e) => setCurrentPackage({ ...currentPackage, price: Number(e.target.value) })}
                    placeholder="100000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="packageDescription">Package Description</Label>
                <Textarea
                  id="packageDescription"
                  value={currentPackage.description}
                  onChange={(e) => setCurrentPackage({ ...currentPackage, description: e.target.value })}
                  placeholder="Describe what's included..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Features</Label>
                {currentPackage.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      placeholder="Feature description"
                    />
                    {currentPackage.features.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveFeature(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={handleAddFeature}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feature
                </Button>
              </div>

              <Button type="button" variant="secondary" onClick={handleAddPackage} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Package
              </Button>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Settings</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Featured Service</Label>
                <p className="text-sm text-muted-foreground">Show this service prominently</p>
              </div>
              <Switch
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">Make this service available to clients</p>
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
            <Button type="submit">Create Service</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
