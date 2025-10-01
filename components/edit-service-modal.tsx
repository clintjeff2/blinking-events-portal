"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface Package {
  name: string
  features: string[]
  price: number
  description: string
  image: string
}

interface Service {
  id: string
  name: string
  category: string
  description: string
  priceRange: { min: number; max: number }
  packages: Package[]
  images: string[]
  featured: boolean
  isActive: boolean
}

interface EditServiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  service: Service | null
}

export function EditServiceModal({ open, onOpenChange, onSubmit, service }: EditServiceModalProps) {
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

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        category: service.category,
        description: service.description,
        priceRange: service.priceRange,
        images: service.images,
        featured: service.featured,
        isActive: service.isActive,
      })
      setPackages(service.packages)
    }
  }, [service])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...service,
      ...formData,
      packages,
      updatedAt: new Date(),
    })
    onOpenChange(false)
  }

  if (!service) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
          <DialogDescription>Update service information and packages</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    <SelectValue />
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
                  required
                />
              </div>
            </div>

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
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
