import { atom } from 'jotai';

export type NotificationActionType = 'revoke' | 'info' | 'warning' | 'success';

export interface Notification {
  id: number | string;
  subject: string;
  message: string;
  message_time?: string;
  read: boolean;
  type: string;
  path?: string;
  action_type?: NotificationActionType;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

const MAX_NOTIFICATIONS = 50;

const baseNotificationsAtom = atom<Notification[]>([]);

export const notificationsAtom = atom(
  (get) => get(baseNotificationsAtom),
  (get, set, notifications: Notification[] | ((prev: Notification[]) => Notification[])) => {
    const newNotifications = typeof notifications === 'function'
      ? notifications(get(baseNotificationsAtom))
      : notifications;

    const limitedNotifications = newNotifications.slice(0, MAX_NOTIFICATIONS);
    set(baseNotificationsAtom, limitedNotifications);
  }
);

export const notificationConnectionStateAtom = atom<ConnectionState>('disconnected');

export const notificationErrorAtom = atom<Error | null>(null);

export const unreadCountAtom = atom((get) => {
  const notifications = get(notificationsAtom);
  return notifications.filter((n) => !n.read).length;
});
