import { type FC, useCallback } from 'react';
import type { DropdownOption } from '../../../types/dropdown.types';
import type { LabelingItem } from '../../../types/annotation.types';
import { useUasApplicable } from '../../../hooks/use-uas-applicable.hook';
import { useAviationTranslation } from '../../../i18n';
import { Button } from '../../common/button';
import { RecognitionSection } from '../recognition-section';
import styles from './labeling-item-card.module.scss';

const getImpactValue = (impact: Record<string, unknown> | null): string | null => {
  return (impact?.value as string) ?? null;
};

export interface LabelingItemCardProps {
  item: LabelingItem;
  index: number;
  options: {
    threat: DropdownOption[];
    error: DropdownOption[];
    uas: DropdownOption[];
  };
  onUpdate: (id: number, updates: Partial<LabelingItem>) => void;
  onDelete: (id: number) => void;
  disabled?: boolean;
}

export const LabelingItemCard: FC<LabelingItemCardProps> = ({
  item,
  index,
  options,
  onUpdate,
  onDelete,
  disabled = false,
}) => {
  const { t } = useAviationTranslation();
  const { isUasApplicable, uasDisabledMessage } = useUasApplicable(item);
  const threatImpact = getImpactValue(item.threat_impact);
  const errorImpact = getImpactValue(item.error_impact);

  const clearUasFields = (): Partial<LabelingItem> => ({
    uas_applicable: false,
    uas_relevance: '',
    uas_type_l1: null,
    uas_type_l2: null,
    uas_type_l3: null,
    uas_management: {},
    uas_impact: {},
    uas_coping_abilities: {},
    uas_description: '',
  });

  const handleUpdate = useCallback(
    (updates: Partial<LabelingItem>) => {
      const enhancedUpdates = { ...updates };

      if ('threat_impact' in updates) {
        const newThreatImpact = getImpactValue(updates.threat_impact as Record<string, unknown>);
        if (newThreatImpact === 'leads_to_error') {
          enhancedUpdates.error_relevance = t('relevance.from_threat');
        } else if (newThreatImpact === 'leads_to_uas_t') {
          enhancedUpdates.uas_relevance = t('relevance.from_threat');
          enhancedUpdates.uas_applicable = true;
        } else {
          if (item.error_relevance === t('relevance.from_threat')) {
            enhancedUpdates.error_relevance = '';
          }
          if (!errorImpact || errorImpact !== 'leads_to_uas_e') {
            Object.assign(enhancedUpdates, clearUasFields());
          }
        }
      }

      if ('error_impact' in updates) {
        const newErrorImpact = getImpactValue(updates.error_impact as Record<string, unknown>);
        if (newErrorImpact === 'leads_to_uas_e') {
          enhancedUpdates.uas_relevance = t('relevance.from_error');
          enhancedUpdates.uas_applicable = true;
        } else {
          if (!threatImpact || threatImpact !== 'leads_to_uas_t') {
            Object.assign(enhancedUpdates, clearUasFields());
          }
        }
      }

      onUpdate(item.id, enhancedUpdates);
    },
    [item.id, item.error_relevance, threatImpact, errorImpact, onUpdate, t],
  );

  const handleDelete = useCallback(() => {
    onDelete(item.id);
  }, [item.id, onDelete]);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.index}>#{index + 1}</span>
          <span className={styles.status} data-status={item.status}>
            {item.status}
          </span>
        </div>
        <div className={styles.headerRight}>
          <Button
            variant="danger"
            size="small"
            onClick={handleDelete}
            disabled={disabled}
            aria-label={`Delete labeling item ${index + 1}`}
          >
            {t('common.delete')}
          </Button>
        </div>
      </div>

      <div className={styles.sections}>
        <RecognitionSection
          category="threat"
          title={t('recognition.threat.title')}
          item={item}
          options={options.threat}
          onUpdate={handleUpdate}
          disabled={disabled}
        />

        <RecognitionSection
          category="error"
          title={t('recognition.error.title')}
          item={item}
          options={options.error}
          onUpdate={handleUpdate}
          disabled={disabled}
        />

        <RecognitionSection
          category="uas"
          title={t('recognition.uas.title')}
          item={item}
          options={options.uas}
          onUpdate={handleUpdate}
          disabled={disabled}
          uasDisabled={!isUasApplicable}
          uasDisabledMessage={uasDisabledMessage ?? undefined}
        />
      </div>

      {item.notes && (
        <div className={styles.notes}>
          <span className={styles.notesLabel}>{t('basic_info.remarks')}:</span>
          <span className={styles.notesContent}>{item.notes}</span>
        </div>
      )}
    </div>
  );
};
