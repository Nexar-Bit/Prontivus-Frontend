"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Bell, 
  Search, 
  Filter, 
  Check, 
  X, 
  Clock, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  XCircle,
  Settings,
  Mail,
  Smartphone,
  Volume2,
  VolumeX
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'appointment' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  timestamp: string;
  source: string;
  actionUrl?: string;
  actionText?: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  systemUpdates: boolean;
  securityAlerts: boolean;
  marketingEmails: boolean;
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
}

const NOTIFICATION_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'appointment', label: 'Appointments' },
  { value: 'system', label: 'System' },
  { value: 'info', label: 'Information' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warnings' },
  { value: 'error', label: 'Errors' },
];

const PRIORITY_LEVELS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export default function NotificationsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    systemUpdates: true,
    securityAlerts: true,
    marketingEmails: false,
    quietHours: false,
    quietStart: "22:00",
    quietEnd: "08:00",
  });
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showSettings, setShowSettings] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await notificationsApi.getNotifications();
      // setNotifications(response);
      
      // Mock data for now
      const mockNotifications: Notification[] = [
        {
          id: "1",
          title: "Appointment Reminder",
          message: "You have an appointment with Dr. Smith at 2:00 PM today",
          type: "appointment",
          priority: "high",
          read: false,
          timestamp: new Date().toISOString(),
          source: "Appointment System",
          actionUrl: "/appointments",
          actionText: "View Appointment"
        },
        {
          id: "2",
          title: "System Maintenance",
          message: "Scheduled maintenance will occur tonight from 11 PM to 1 AM",
          type: "system",
          priority: "medium",
          read: false,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          source: "System Admin",
          actionUrl: "/admin/settings",
          actionText: "View Details"
        },
        {
          id: "3",
          title: "New Patient Registration",
          message: "A new patient has been registered in your clinic",
          type: "info",
          priority: "low",
          read: true,
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          source: "Patient Management",
          actionUrl: "/secretaria/pacientes",
          actionText: "View Patient"
        },
        {
          id: "4",
          title: "Security Alert",
          message: "Unusual login activity detected from a new device",
          type: "error",
          priority: "urgent",
          read: false,
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          source: "Security System",
          actionUrl: "/security",
          actionText: "Review Activity"
        },
        {
          id: "5",
          title: "Backup Completed",
          message: "Daily backup completed successfully",
          type: "success",
          priority: "low",
          read: true,
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          source: "System Admin"
        },
        {
          id: "6",
          title: "Prescription Ready",
          message: "Prescription for John Doe is ready for pickup",
          type: "info",
          priority: "medium",
          read: false,
          timestamp: new Date(Date.now() - 18000000).toISOString(),
          source: "Pharmacy",
          actionUrl: "/pharmacy",
          actionText: "View Prescription"
        }
      ];
      
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // TODO: Replace with actual API call
      // await notificationsApi.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      // TODO: Replace with actual API call
      // await notificationsApi.markAllAsRead();
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // TODO: Replace with actual API call
      // await notificationsApi.deleteNotification(notificationId);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.read ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'system':
        return <Settings className="h-4 w-4 text-gray-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'default';
      case 'low':
        return 'outline';
      default:
        return 'default';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = !searchTerm || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || notification.priority === priorityFilter;
    
    return matchesSearch && matchesType && matchesPriority;
  });

  const handleSettingChange = (key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-2">
            Stay updated with important notifications and alerts
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={markAllAsRead}
            >
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Notification Settings */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Notification Channels</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <Label htmlFor="emailNotifications">Email Notifications</Label>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4" />
                      <Label htmlFor="pushNotifications">Push Notifications</Label>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => handleSettingChange("pushNotifications", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4" />
                      <Label htmlFor="smsNotifications">SMS Notifications</Label>
                    </div>
                    <Switch
                      id="smsNotifications"
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) => handleSettingChange("smsNotifications", checked)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Notification Types</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="appointmentReminders">Appointment Reminders</Label>
                    <Switch
                      id="appointmentReminders"
                      checked={settings.appointmentReminders}
                      onCheckedChange={(checked) => handleSettingChange("appointmentReminders", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="systemUpdates">System Updates</Label>
                    <Switch
                      id="systemUpdates"
                      checked={settings.systemUpdates}
                      onCheckedChange={(checked) => handleSettingChange("systemUpdates", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="securityAlerts">Security Alerts</Label>
                    <Switch
                      id="securityAlerts"
                      checked={settings.securityAlerts}
                      onCheckedChange={(checked) => handleSettingChange("securityAlerts", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="marketingEmails">Marketing Emails</Label>
                    <Switch
                      id="marketingEmails"
                      checked={settings.marketingEmails}
                      onCheckedChange={(checked) => handleSettingChange("marketingEmails", checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quiet Hours</h3>
              <div className="flex items-center justify-between">
                <Label htmlFor="quietHours">Enable Quiet Hours</Label>
                <Switch
                  id="quietHours"
                  checked={settings.quietHours}
                  onCheckedChange={(checked) => handleSettingChange("quietHours", checked)}
                />
              </div>
              {settings.quietHours && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quietStart">Start Time</Label>
                    <Input
                      id="quietStart"
                      type="time"
                      value={settings.quietStart}
                      onChange={(e) => handleSettingChange("quietStart", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quietEnd">End Time</Label>
                    <Input
                      id="quietEnd"
                      type="time"
                      value={settings.quietEnd}
                      onChange={(e) => handleSettingChange("quietEnd", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_LEVELS.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications ({filteredNotifications.length})</CardTitle>
          <CardDescription>
            Recent notifications and alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded-lg p-4 transition-colors ${
                  notification.read 
                    ? 'bg-muted/30 hover:bg-muted/50' 
                    : 'bg-background hover:bg-muted/50 border-l-4 border-l-primary'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getTypeIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </h3>
                        <Badge variant={getPriorityColor(notification.priority) as any}>
                          {notification.priority}
                        </Badge>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>{notification.source}</span>
                        <span>{new Date(notification.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {notification.actionUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Navigate to action URL
                          console.log('Navigate to:', notification.actionUrl);
                        }}
                      >
                        {notification.actionText}
                      </Button>
                    )}
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filteredNotifications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
