import { useState, useEffect, useCallback } from 'react';
import { Dropdown } from '../Dropdown/Dropdown';
import { Menu } from '../Menu/Menu';
import { IconBell, IconSettings } from '@humansignal/icons'; // Assuming IconSettings is available
import './Notification.scss';

// NEW: A helper function to check if the Notification API is supported.
const isBrowserNotificationSupported = () => {
  return 'Notification' in window;
};

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);

  // NEW: State to track the browser notification permission status.
  // We initialize it with the current permission state.
  const [permission, setPermission] = useState(
    isBrowserNotificationSupported() ? Notification.permission : 'unsupported'
  );

  // NEW: This function will be called to show the actual browser notification.
  const showBrowserNotification = useCallback(notificationData => {
    const { id, subject, message, path } = notificationData;

    const notification = new Notification(subject, {
      body: message,
      // You should host a small icon for your notifications
      icon: '/favicon.ico'
    });

    // NEW: Handle clicks on the browser notification.
    notification.onclick = () => {
      // Bring the user back to our app's window/tab.
      window.focus();
      // Mark the corresponding in-app notification as read.
      handleNotificationClick(id, path);
      // Close the notification.
      notification.close();
    };
  }, []); // We'll define handleNotificationClick next.

  // The SSE connection logic remains the same.
  useEffect(() => {
    const sse = new EventSource('http://localhost:8080/events/notifications');

    sse.onmessage = event => {
      console.log('Received SSE');
      const newNotificationData = JSON.parse(event.data);
      if (!newNotificationData.id) {
        newNotificationData.id = new Date().getTime();
      }

      // Add to the in-app list
      setNotifications(prev => {
        if (prev.some(n => n.id === newNotificationData.id)) return prev;
        return [newNotificationData, ...prev];
      });

      // NEW: If permission is granted, also show a browser notification.
      if (
        isBrowserNotificationSupported() &&
        Notification.permission === 'granted'
      ) {
        showBrowserNotification(newNotificationData);
      }
    };

    sse.onerror = error => {
      console.error('Notification SSE failed:', error);
      sse.close();
    };

    return () => sse.close();
  }, [showBrowserNotification]); // Add the new dependency

  const handleNotificationClick = useCallback((id, path) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );

    if (path) {
      window.location.href = path;
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!isBrowserNotificationSupported()) return;

    const newPermission = await Notification.requestPermission();
    setPermission(newPermission);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const permissionMenuItem = () => {
    if (permission === 'granted') {
      return (
        <Menu.Item disabled className="bg-green-200">
          <div className="notification-permission-status">
            <span>Browser notifications enabled</span>
          </div>
        </Menu.Item>
      );
    }

    if (permission === 'denied') {
      return (
        <Menu.Item disabled className="bg-red-100">
          <div className="notification-permission-status">
            <span>Browser notifications are blocked</span>
            <small>You must enable them in your browser settings.</small>
          </div>
        </Menu.Item>
      );
    }

    if (permission === 'default') {
      return (
        <Menu.Item
          onClick={requestNotificationPermission}
          className="bg-gray-200"
        >
          <IconSettings style={{ marginRight: '8px' }} />
          Enable Browser Notifications
        </Menu.Item>
      );
    }

    return null;
  };

  const notificationMenu = (
    <Menu className="notification-menu">
      <div className="notification-menu__header">
        <h3>Notifications</h3>
      </div>
      <Menu.Divider />

      {notifications.length > 0 ? (
        notifications.map(notification => (
          <Menu.Item
            key={notification.id}
            className={
              !notification.read
                ? 'notification-item--unread'
                : 'notification-item'
            }
            onClick={() =>
              handleNotificationClick(notification.id, notification.path)
            }
          >
            <div className="notification-item__content">
              <strong className="notification-item__subject">
                {notification.subject}
              </strong>
              <p className="notification-item__message">
                {notification.message}
              </p>
            </div>
          </Menu.Item>
        ))
      ) : (
        <Menu.Item>
          <div className="notification-item__content">
            <p className="notification-item__message">
              You have no new notifications.
            </p>
          </div>
        </Menu.Item>
      )}

      <Menu.Divider />
      {permissionMenuItem()}
    </Menu>
  );

  return (
    <Dropdown.Trigger align="right" content={notificationMenu}>
      <button
        className="notification-bell relative mx-2"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
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
