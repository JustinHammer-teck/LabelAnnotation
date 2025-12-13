import { type FC } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styles from './AviationSidebar.module.scss';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Projects', path: '/aviation/projects', icon: 'folder' },
];

const iconMap: Record<string, JSX.Element> = {
  folder: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 4.5A1.5 1.5 0 013.5 3h4.586a1.5 1.5 0 011.06.44l1.415 1.414A1.5 1.5 0 0011.621 5H16.5A1.5 1.5 0 0118 6.5v9a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 15.5v-11z" />
    </svg>
  ),
  list: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
  ),
};

export const AviationSidebar: FC = () => {
  const location = useLocation();

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                >
                  <span className={styles.icon}>{iconMap[item.icon]}</span>
                  <span className={styles.label}>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};
