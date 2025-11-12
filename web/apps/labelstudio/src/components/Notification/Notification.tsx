import { useState, useCallback } from 'react';
import { Dropdown } from '../Dropdown/Dropdown';
import { Menu } from '../Menu/Menu';
import { IconBell, IconSettings } from '@humansignal/icons';
import './Notification.scss';
import { useTranslation } from 'react-i18next';
import { useNotificationStream } from '../../hooks/useNotificationStream';

const isBrowserNotificationSupported = () => {
  return 'Notification' in window;
};

export const NotificationBell = () => {
  const { t } = useTranslation();
  const { notifications, unreadCount, markAsRead } = useNotificationStream();

  const [permission, setPermission] = useState(
    isBrowserNotificationSupported() ? Notification.permission : 'unsupported'
  );

  const showBrowserNotification = useCallback((subject: string, message: string, path?: string, id?: number | string) => {
    const notification = new Notification(subject, {
      body: message,
      icon: '/favicon.ico',
    });

    notification.onclick = () => {
      window.focus();
      if (id) {
        handleNotificationClick(id, path);
      }
      notification.close();
    };
  }, []);

  const handleNotificationClick = useCallback(
    async (id: number | string, path?: string) => {
      await markAsRead(id);

      if (path) {
        window.location.href = path;
      }
    },
    [markAsRead]
  );

  const requestNotificationPermission = async () => {
    if (!isBrowserNotificationSupported()) return;

    const newPermission = await Notification.requestPermission();
    setPermission(newPermission);
  };

  const permissionMenuItem = () => {
    if (permission === 'granted') {
      return (
        <Menu disabled className="bg-green-200">
          <div className="notification-permission-status">
            <span>Browser notifications enabled</span>
          </div>
        </Menu>
      );
    }

    if (permission === 'denied') {
      return (
        <Menu disabled className="bg-red-100">
          <div className="notification-permission-status">
            <span>Browser notifications are blocked</span>
            <small>You must enable them in your browser settings.</small>
          </div>
        </Menu>
      );
    }

    if (permission === 'default') {
      return (
        <Menu onClick={requestNotificationPermission} className="bg-gray-200">
          <IconSettings style={{ marginRight: '8px' }} />
          {t('notification.menu_bar.enable_browser_notification')}
        </Menu>
      );
    }

    return null;
  };

  const notificationMenu = (
    <Menu className="notification-menu">
      <div className="notification-menu__header">
        <h3>{t('notification.menu_bar.notification_title')}</h3>
      </div>
      <Menu.Divider />

      {notifications.length > 0 ? (
        notifications.map((notification) => (
          <Menu.Item
            key={notification.id}
            className={!notification.read ? 'notification-item--unread' : 'notification-item'}
            onClick={() => handleNotificationClick(notification.id, notification.path)}
          >
            <div className="notification-item__content">
              <strong className="notification-item__subject">{notification.subject}</strong>
              <p className="notification-item__message">{notification.message}</p>
            </div>
          </Menu.Item>
        ))
      ) : (
        <Menu.Item>
          <div className="notification-item__content">
            <p className="notification-item__message">You have no new notifications.</p>
          </div>
        </Menu.Item>
      )}

      <Menu.Divider />
      {permissionMenuItem()}
    </Menu>
  );

  return (
    <Dropdown.Trigger align="right" content={notificationMenu}>
      <button className="notification-bell relative mx-2" aria-label={`Notifications (${unreadCount} unread)`}>
        <IconBell />
        {unreadCount > 0 && (
          <span
            className="notification-bell__badge
            absolute inline-flex items-center justify-center
            w-6 h-6 text-xs font-bold text-white
            bg-red-500 border-2 border-black rounded-full
            -top-0.5 -end-2
            "
          >
            {unreadCount}
          </span>
        )}
      </button>
    </Dropdown.Trigger>
  );
};
