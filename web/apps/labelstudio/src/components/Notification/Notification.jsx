import { useState, useEffect, useCallback } from 'react';
import { Dropdown } from '../Dropdown/Dropdown'; // Adjust path if needed
import { Menu } from '../Menu/Menu'; // Adjust path if needed
import { IconBell } from '@humansignal/icons'; // Using the icon from your library
import './Notification.scss';

export const NotificationBell = () => {
  // State to hold the array of notification objects
  const [notifications, setNotifications] = useState([]);

  // Effect to connect to the Server-Sent Events stream
  useEffect(() => {
    const sse = new EventSource('http://localhost:8080/events/toasts');

    // Handle incoming messages
    sse.onmessage = event => {
      console.log('SSE received');
      // Assuming the backend sends a valid JSON string
      const newNotification = JSON.parse(event.data);

      // Assign a unique client-side ID for the key prop if backend doesn't provide one
      if (!newNotification.id) {
        newNotification.id = new Date().getTime();
      }

      // Add the new notification to the top of the list, preventing duplicates
      setNotifications(prev => {
        if (prev.some(n => n.id === newNotification.id)) return prev;
        return [newNotification, ...prev];
      });
    };

    // Handle any errors with the connection
    sse.onerror = error => {
      console.error('Notification SSE failed:', error);
      sse.close();
    };

    // Cleanup: Close the connection when the component unmounts
    return () => sse.close();
  }, []); // The empty dependency array ensures this runs only once

  // Handler for when a user clicks on a notification item
  const handleNotificationClick = useCallback((id, path) => {
    // Mark the clicked notification as read
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );

    if (path) {
      console.log(`Navigating to: ${path}`);
      // In a real app with react-router: history.push(path);
      // For now, simple navigation for demonstration
      window.location.href = path;
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // The content of the dropdown menu
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
            // The Dropdown will handle closing the menu on item click
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
    </Menu>
  );
  return (
    <Dropdown.Trigger align="right" content={notificationMenu}>
      <button
        className="notification-bell relative mx-5"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <IconBell />
        {unreadCount > 0 && (
          <span
            className="
            notification-bell__badge
            absolute inline-flex
            items-center justify-center
            w-6 h-6 text-xs font-bold
            text-white bg-red-500 rounded-full
            -top-0.5 -end-3"
          >
            {unreadCount}
          </span>
        )}
      </button>
    </Dropdown.Trigger>
  );
};
