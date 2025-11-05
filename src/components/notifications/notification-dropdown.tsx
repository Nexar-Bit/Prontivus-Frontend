"use client";

import * as React from "react";
import { Bell, Check, CheckCheck, X, AlertCircle, Info, CheckCircle, AlertTriangle, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { notificationsApi, NotificationItem } from "@/lib/notifications-api";

type Notification = NotificationItem;

export function NotificationDropdown() {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      try {
        const data = await notificationsApi.getAll();
        setNotifications(data);
      } catch (e) {
        // fail silently in header
        console.warn('Failed to load notifications');
      }
    };
    load();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'system':
        return <Settings className="h-4 w-4 text-gray-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string, type: string) => {
    if (type === 'critical') return 'bg-red-100 border-red-300 hover:bg-red-50';
    if (priority === 'urgent') return 'bg-orange-100 border-orange-300 hover:bg-orange-50';
    if (priority === 'high') return 'bg-yellow-100 border-yellow-300 hover:bg-yellow-50';
    return 'bg-white border-gray-200 hover:bg-gray-50';
  };

  const markAsRead = async (id: string) => {
    const n = notifications.find(x => x.id === id);
    if (n?.kind && typeof n.source_id === 'number') {
      try { await notificationsApi.markRead(n.kind, n.source_id); } catch {}
    }
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    const n = notifications.find(x => x.id === id);
    if (n?.kind && typeof n.source_id === 'number') {
      try { await notificationsApi.delete(n.kind, n.source_id); } catch {}
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return 'agora';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-[#0F4C75] focus-visible:ring-offset-2"
        >
          <Bell className="h-5 w-5 text-gray-700" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-semibold bg-red-600 border-2 border-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 sm:w-96 p-0 bg-white shadow-xl border border-gray-200"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-700" />
            <h3 className="font-semibold text-gray-900">Notificações</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-[#0F4C75]/10 text-[#0F4C75] border-[#0F4C75]/20">
                {unreadCount} não lidas
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-8 text-xs text-[#0F4C75] hover:text-[#0F4C75] hover:bg-[#0F4C75]/5"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "group relative p-4 transition-colors",
                    getPriorityColor(notification.priority, notification.type),
                    !notification.read && "bg-blue-50/50"
                  )}
                >
                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0F4C75]" />
                  )}

                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getTypeIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-transparent"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <X className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {notification.source && (
                            <>
                              <span className="font-medium">{notification.source}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>{formatTime(notification.timestamp)}</span>
                        </div>

                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-6 text-xs text-[#0F4C75] hover:text-[#0F4C75] hover:bg-[#0F4C75]/5"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Marcar como lida
                          </Button>
                        )}
                      </div>

                      {notification.actionUrl && notification.actionText && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs w-full border-[#0F4C75]/30 text-[#0F4C75] hover:bg-[#0F4C75]/5 hover:border-[#0F4C75]/50"
                            onClick={() => {
                              window.location.href = notification.actionUrl!;
                              setOpen(false);
                            }}
                          >
                            {notification.actionText}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="border-t border-gray-200 p-3">
            <Button
              variant="ghost"
              className="w-full text-sm text-[#0F4C75] hover:text-[#0F4C75] hover:bg-[#0F4C75]/5"
              onClick={() => {
                window.location.href = '/notificacoes';
                setOpen(false);
              }}
            >
              Ver todas as notificações
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

