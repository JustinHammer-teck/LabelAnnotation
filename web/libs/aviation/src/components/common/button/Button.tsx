import { type FC, type ReactNode, type ButtonHTMLAttributes } from 'react';
import styles from './button.module.scss';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  children: ReactNode;
}

export const Button: FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'medium',
  disabled = false,
  children,
  className,
  type = 'button',
  ...rest
}) => {
  return (
    <button
      type={type}
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className || ''}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};
