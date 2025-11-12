import { useEffect, useCallback } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSSE } from './useSSE';
import { useCurrentUser } from '../providers/CurrentUser';
import { API_CONFIG } from '../config/ApiConfig';
import { queryClient } from '../utils/query-client';
import {
  notificationsAtom,
  notificationConnectionStateAtom,
  notificationErrorAtom,
  unreadCountAtom,
  type Notification,
  type ConnectionState,
} from '../utils/atoms/notificationAtoms';

interface UseNotificationStreamReturn {
  notifications: Notification[];
  unreadCount: number;
  connectionState: ConnectionState;
  error: Error | null;
  markAsRead: (id: number | string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  isRefreshing: boolean;
}

const NOTIFICATIONS_QUERY_KEY = 'notifications';

export const useNotificationStream = (): UseNotificationStreamReturn => {
  const { user } = useCurrentUser();
  const [notifications, setNotifications] = useAtom(notificationsAtom);
  const unreadCount = useAtomValue(unreadCountAtom);
  const connectionState = useAtomValue(notificationConnectionStateAtom);
  const error = useAtomValue(notificationErrorAtom);

  const userChannel = user?.id && user?.email ? `${user.id}${user.email}_notifications` : '';
  const sseUrl = userChannel ? `${API_CONFIG.sse.baseUrl}${API_CONFIG.sse.notifications}/${userChannel}` : '';

  const { addEventListener } = useSSE({
    url: sseUrl,
    autoConnect: !!userChannel,
  });

  const { refetch, isRefetching } = useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY],
    queryFn: async () => {
      if (!user) return [];

      const response = await fetch(`${API_CONFIG.gateway}${API_CONFIG.endpoints.notifications}?unread=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();

      const historicalNotifications: Notification[] = data.map((n: any) => ({
        id: n.id,
        subject: n.subject,
        message: n.message,
        message_time: n.message_time,
        read: n.is_read,
        type: 'info',
        path: n.path,
        action_type: n.action_type,
      }));

      setNotifications(historicalNotifications);
      return historicalNotifications;
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number | string) => {
      const response = await fetch(`${API_CONFIG.gateway}${API_CONFIG.endpoints.notification.replace(':id', String(id))}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_read: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });

      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

      return { id };
    },
    onError: (error, id) => {
      console.error('Failed to mark notification as read:', error);

      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
    },
  });

  useEffect(() => {
    if (!userChannel) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const newNotificationData = JSON.parse(event.data);

        if (!newNotificationData.id) {
          newNotificationData.id = new Date().getTime();
        }
        if (newNotificationData.read === undefined) {
          newNotificationData.read = false;
        }

        if (newNotificationData.action_type === 'revoke' && newNotificationData.path) {
          const currentPath = window.location.pathname;
          if (currentPath === newNotificationData.path || currentPath.startsWith(newNotificationData.path)) {
            window.location.href = '/';
            return;
          }
        }

        setNotifications((prev) => {
          if (prev.some((n) => n.id === newNotificationData.id)) return prev;
          return [newNotificationData, ...prev];
        });

        void queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
      } catch (error) {
        console.error('Failed to parse notification:', error);
      }
    };

    addEventListener('message', handleMessage);
  }, [userChannel, addEventListener, setNotifications]);

  const markAsRead = useCallback(
    async (id: number | string) => {
      await markAsReadMutation.mutateAsync(id);
    },
    [markAsReadMutation]
  );

  const refreshNotifications = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    notifications,
    unreadCount,
    connectionState,
    error,
    markAsRead,
    refreshNotifications,
    isRefreshing: isRefetching,
  };
};
