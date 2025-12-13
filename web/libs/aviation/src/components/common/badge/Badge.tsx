import { type FC, type ReactNode } from 'react';
import styles from './badge.module.scss';

export interface BadgeProps {
  type: 'success' | 'warning' | 'error' | 'info';
  children: ReactNode;
  className?: string;
}

export const Badge: FC<BadgeProps> = ({ type, children, className }) => {
  return (
    <span className={`${styles.badge} ${styles[type]} ${className || ''}`}>
      {children}
    </span>
  );
};
