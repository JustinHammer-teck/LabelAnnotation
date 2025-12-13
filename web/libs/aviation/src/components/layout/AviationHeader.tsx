import { type FC, type ReactNode, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { StatusIndicator } from '../common';
import { saveStatusAtom } from '../../stores';
import styles from './AviationHeader.module.scss';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface AviationHeaderProps {
  breadcrumb: BreadcrumbItem[];
  actions?: ReactNode;
}

export const AviationHeader: FC<AviationHeaderProps> = ({ breadcrumb, actions }) => {
  const saveStatus = useAtomValue(saveStatusAtom);
  const showStatus = saveStatus.state !== 'idle';

  return (
    <header className={styles.header}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <ol className={styles.breadcrumbList}>
          {breadcrumb.map((item, index) => (
            <Fragment key={item.href ?? item.label}>
              {index > 0 && (
                <li className={styles.separator} aria-hidden="true">/</li>
              )}
              <li className={styles.breadcrumbItem}>
                {item.href ? (
                  <Link to={item.href} className={styles.breadcrumbLink}>
                    {item.label}
                  </Link>
                ) : (
                  <span className={styles.breadcrumbCurrent} aria-current="page">
                    {item.label}
                  </span>
                )}
              </li>
            </Fragment>
          ))}
        </ol>
      </nav>
      <div className={styles.right}>
        {showStatus && (
          <StatusIndicator
            status={saveStatus.state === 'idle' ? 'saved' : saveStatus.state}
            className={styles.status}
          />
        )}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
};
