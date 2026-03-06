'use client';

import { useEffect, useState } from 'react';
import { Bell, X, Check, AlertTriangle } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  createdAt: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=10');
      const result = await res.json();
      if (res.ok) {
        setNotifications(result.data);
        setUnreadCount(result.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Auto-fetch on mount and every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Mark notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id, status: 'READ' }),
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, status: 'READ' } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Delete notification
  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
      setNotifications(notifications.filter(n => n.id !== id));
      if (notifications.find(n => n.id === id)?.status === 'UNREAD') {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await fetch('/api/notifications?all=true', { method: 'DELETE' });
      setNotifications(notifications.map(n => ({ ...n, status: 'READ' })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationColor = (type: string) => {
    if (type.includes('CREATED') || type.includes('DEPLOYED')) return 'text-blue-400';
    if (type.includes('CRITICAL') || type.includes('SEVERITY_CHANGED') || type.includes('HIGH_RISK')) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('RISK') || type.includes('HIGH_RISK')) return <AlertTriangle className="w-4 h-4" />;
    return <Bell className="w-4 h-4" />;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-surface rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border flex justify-between items-center bg-surface-light">
            <h3 className="text-sm font-semibold text-white">
              Notifications {unreadCount > 0 && <span className="text-red-400 text-xs ml-2">({unreadCount})</span>}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-surface rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-surface-light transition-colors cursor-pointer ${
                      notif.status === 'UNREAD' ? 'bg-surface-light/50' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`flex-shrink-0 mt-1 ${getNotificationColor(notif.type)}`}>
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{notif.title}</p>
                        {notif.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{notif.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">{formatTime(notif.createdAt)}</p>
                      </div>
                      {notif.status === 'UNREAD' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notif.id);
                          }}
                          className="flex-shrink-0 p-1 hover:bg-surface rounded transition-colors"
                          aria-label="Mark as read"
                        >
                          <Check className="w-4 h-4 text-blue-400" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notif.id);
                        }}
                        className="flex-shrink-0 p-1 hover:bg-surface rounded transition-colors"
                        aria-label="Delete"
                      >
                        <X className="w-4 h-4 text-gray-500 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-border bg-surface-light text-center">
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Marking...' : 'Mark all as read'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
