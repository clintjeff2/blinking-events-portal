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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

interface AddEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
}

export function AddEventModal({ open, onOpenChange, onSubmit }: AddEventModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    date: new Date(),
    venue: "",
    category: "",
    description: "",
    servicesUsed: [] as string[],
    staffInvolved: [] as string[],
    media: [] as string[],
    isPublished: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      testimonials: [],
      createdAt: new Date(),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>Add a past event to your portfolio</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sharma Wedding 2024"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData({ ...formData, date })}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue">Venue *</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="e.g., Grand Ballroom, Mumbai"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the event..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="servicesUsed">Services Used (IDs)</Label>
              <Input
                id="servicesUsed"
                value={formData.servicesUsed.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    servicesUsed: e.target.value
                      .split(",")
                      .map((id) => id.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="service1, service2, service3"
              />
              <p className="text-xs text-muted-foreground">Comma-separated service IDs</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staffInvolved">Staff Involved (IDs)</Label>
              <Input
                id="staffInvolved"
                value={formData.staffInvolved.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    staffInvolved: e.target.value
                      .split(",")
                      .map((id) => id.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="staff1, staff2, staff3"
              />
              <p className="text-xs text-muted-foreground">Comma-separated staff IDs</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="media">Media (IDs)</Label>
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
                <p className="text-sm text-muted-foreground">Make this event visible to clients</p>
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
            <Button type="submit">Add Event</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
