/**
 * Send Notification Form Component
 * Form for composing and sending push notifications
 *
 * @created January 10, 2026
 * @version 1.0.0
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Send,
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  useSendNotificationMutation,
  useSendBroadcastNotificationMutation,
} from "@/lib/redux/api/notificationsApi";
import type {
  NotificationType,
  NotificationPriority,
  TargetAudience,
  NotificationChannel,
} from "@/types/notifications";

// Form validation schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  body: z.string().min(1, "Message is required").max(500, "Message too long"),
  type: z.enum([
    "order",
    "message",
    "promo",
    "reminder",
    "info",
    "system",
    "payment",
    "staff",
  ]),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  targetAudience: z.enum([
    "all",
    "clients",
    "active_clients",
    "vip_clients",
    "new_users",
    "staff",
    "admins",
    "custom",
  ]),
  imageUrl: z.string().url().optional().or(z.literal("")),
  linkUrl: z.string().optional(),
  channels: z.object({
    push: z.boolean(),
    in_app: z.boolean(),
    email: z.boolean(),
  }),
  scheduleEnabled: z.boolean(),
  scheduledDate: z.date().optional(),
  scheduledTime: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SendNotificationFormProps {
  onSuccess?: () => void;
  initialRecipientId?: string;
}

export function SendNotificationForm({
  onSuccess,
  initialRecipientId,
}: SendNotificationFormProps) {
  const { toast } = useToast();
  const [sendNotification, { isLoading: isSendingSingle }] =
    useSendNotificationMutation();
  const [sendBroadcast, { isLoading: isSendingBroadcast }] =
    useSendBroadcastNotificationMutation();

  const isSending = isSendingSingle || isSendingBroadcast;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      body: "",
      type: "info",
      priority: "normal",
      targetAudience: initialRecipientId ? "custom" : "all",
      imageUrl: "",
      linkUrl: "",
      channels: {
        push: true,
        in_app: true,
        email: false,
      },
      scheduleEnabled: false,
    },
  });

  const watchType = form.watch("type");
  const watchScheduleEnabled = form.watch("scheduleEnabled");
  const watchTargetAudience = form.watch("targetAudience");

  async function onSubmit(values: FormValues) {
    console.log("[SendNotificationForm] Submitting:", values);

    try {
      // Build channels array
      const channels: NotificationChannel[] = [];
      if (values.channels.push) channels.push("push");
      if (values.channels.in_app) channels.push("in_app");
      if (values.channels.email) channels.push("email");

      // Build scheduled date
      let scheduledFor: Date | undefined;
      if (values.scheduleEnabled && values.scheduledDate) {
        scheduledFor = values.scheduledDate;
        if (values.scheduledTime) {
          const [hours, minutes] = values.scheduledTime.split(":").map(Number);
          scheduledFor.setHours(hours, minutes, 0, 0);
        }
      }

      // Build reference if link provided
      const reference = values.linkUrl
        ? { type: "url" as const, url: values.linkUrl }
        : undefined;

      // Send to single recipient or broadcast
      if (initialRecipientId) {
        await sendNotification({
          title: values.title,
          body: values.body,
          type: values.type as NotificationType,
          priority: values.priority as NotificationPriority,
          recipientId: initialRecipientId,
          imageUrl: values.imageUrl || undefined,
          reference,
          channels,
          scheduledFor,
        }).unwrap();
      } else {
        await sendBroadcast({
          title: values.title,
          body: values.body,
          type: values.type as NotificationType,
          priority: values.priority as NotificationPriority,
          targetAudience: values.targetAudience as TargetAudience,
          imageUrl: values.imageUrl || undefined,
          reference,
          channels,
          scheduledFor,
        }).unwrap();
      }

      toast({
        title: scheduledFor ? "Notification Scheduled" : "Notification Sent",
        description: scheduledFor
          ? `Notification scheduled for ${format(scheduledFor, "PPp")}`
          : "Your notification has been sent successfully.",
      });

      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error("[SendNotificationForm] Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send notification",
        variant: "destructive",
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Push Notification</CardTitle>
        <CardDescription>
          {initialRecipientId
            ? "Send a notification to this user"
            : "Send a notification to your app users"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notification Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., New Service Available"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Body */}
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message Body</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your notification message..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/500 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type and Priority */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notification Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="order">Order Update</SelectItem>
                        <SelectItem value="message">Message</SelectItem>
                        <SelectItem value="promo">Promotion</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                        <SelectItem value="info">Information</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Target Audience (only for broadcasts) */}
            {!initialRecipientId && (
              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select audience" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="clients">All Clients</SelectItem>
                        <SelectItem value="active_clients">
                          Active Clients
                        </SelectItem>
                        <SelectItem value="vip_clients">VIP Clients</SelectItem>
                        <SelectItem value="new_users">New Users</SelectItem>
                        <SelectItem value="staff">Staff Members</SelectItem>
                        <SelectItem value="admins">Administrators</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Image URL */}
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (Optional)</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input placeholder="https://..." {...field} />
                      <Button type="button" variant="outline" size="icon">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Add an image to make your notification more engaging
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Link URL */}
            <FormField
              control={form.control}
              name="linkUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., /services/wedding" {...field} />
                  </FormControl>
                  <FormDescription>
                    Where should users go when they tap the notification?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Channels */}
            <div className="space-y-4">
              <Label>Delivery Channels</Label>
              <div className="flex flex-wrap gap-4">
                <FormField
                  control={form.control}
                  name="channels.push"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Push Notification
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="channels.in_app"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        In-App Notification
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="channels.email"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Email</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="scheduleEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Schedule for later
                    </FormLabel>
                  </FormItem>
                )}
              />

              {watchScheduleEnabled && (
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduledTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <Input type="time" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-2">
              <Button type="submit" disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : watchScheduleEnabled ? (
                  <>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Schedule
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Now
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
