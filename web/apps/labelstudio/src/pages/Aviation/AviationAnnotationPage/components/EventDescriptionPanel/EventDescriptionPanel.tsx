import type { FC } from 'react';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { currentIncidentAtom } from '../../stores/aviation-annotation.store';
import styles from './EventDescriptionPanel.module.scss';

export const EventDescriptionPanel: FC = () => {
  const { t } = useTranslation();
  const incident = useAtomValue(currentIncidentAtom);

  const eventNumber = incident?.event_number || '';
  const eventDescription = incident?.event_description || '';

  const descriptionHeaderId = 'event-description-header';

  return (
    <div className={styles.panel}>
      <dl className={styles.topRow}>
        <div className={styles.infoBox}>
          <dt className={styles.label}>{t('aviation.event_description.event_number')}</dt>
          <dd className={styles.value}>{eventNumber}</dd>
        </div>
      </dl>
      <section className={styles.descriptionBox} aria-labelledby={descriptionHeaderId}>
        <h3 id={descriptionHeaderId} className={styles.descriptionHeader}>
          {t('aviation.event_description.title')}
        </h3>
        <div
          className={styles.descriptionContent}
          role="region"
          aria-labelledby={descriptionHeaderId}
          tabIndex={0}
        >
          {eventDescription || (
            <span className={styles.emptyState}>
              {t('aviation.event_description.no_description')}
            </span>
          )}
        </div>
      </section>
    </div>
  );
};
