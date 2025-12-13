import { type FC, type ReactNode } from 'react';
import styles from './AviationShell.module.scss';

export interface AviationShellProps {
  children: ReactNode;
}

export const AviationShell: FC<AviationShellProps> = ({ children }) => {
  return (
    <div className={styles.shell}>
      <main id="main-content" className={styles.content}>
        {children}
      </main>
    </div>
  );
};
