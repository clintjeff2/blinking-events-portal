"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Star } from "lucide-react"

interface AddTestimonialModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
}

export function AddTestimonialModal({ open, onOpenChange, onSubmit }: AddTestimonialModalProps) {
  const [formData, setFormData] = useState({
    clientId: "",
    eventId: "",
    text: "",
    rating: 5,
    media: [] as string[],
    isPublished: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      createdAt: new Date(),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Testimonial</DialogTitle>
          <DialogDescription>Add a client testimonial</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID *</Label>
                <Input
                  id="clientId"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  placeholder="user123"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventId">Event ID (Optional)</Label>
                <Input
                  id="eventId"
                  value={formData.eventId}
                  onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                  placeholder="event123"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text">Testimonial *</Label>
              <Textarea
                id="text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Share the client's feedback..."
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Rating *</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 ${star <= formData.rating ? "fill-gold text-gold" : "text-muted-foreground"}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="media">Media IDs (Optional)</Label>
              <Input
                id="media"
                value={formData.media.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    media: e.target.value
                      .split(",")
                      .map((id) => id.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="media1, media2, media3"
              />
              <p className="text-xs text-muted-foreground">Comma-separated media IDs</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Published</Label>
                <p className="text-sm text-muted-foreground">Make this testimonial visible</p>
              </div>
              <Switch
                checked={formData.isPublished}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Testimonial</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
