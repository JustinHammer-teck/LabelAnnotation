import { type FC, useCallback, useMemo, useEffect } from 'react';
import type { DropdownOption, HierarchicalSelection } from '../../../types/dropdown.types';
import type { LabelingItem } from '../../../types/annotation.types';
import { RecognitionTypeSelector } from '../../common/recognition-type-selector';
import { Select } from '../../common/select';
import { MultiSelect } from '../../common/multi-select';
import { TextArea } from '../../common/text-area';
import { CompetencySummary } from '../competency-summary';
import {
  useImpactOptions,
  THREAT_IMPACT_CONFIG,
  ERROR_IMPACT_CONFIG,
} from '../../../hooks/use-impact-options.hook';
import { useCopingAbilities } from '../../../hooks/use-coping-abilities.hook';
import { useAviationTranslation } from '../../../i18n';
import styles from './recognition-section.module.scss';

export interface RecognitionSectionProps {
  category: 'threat' | 'error' | 'uas';
  title: string;
  item: LabelingItem;
  options: DropdownOption[];
  onUpdate: (updates: Partial<LabelingItem>) => void;
  disabled?: boolean;
  uasDisabled?: boolean;
  uasDisabledMessage?: string;
}

export const RecognitionSection: FC<RecognitionSectionProps> = ({
  category,
  title,
  item,
  options,
  onUpdate,
  disabled = false,
  uasDisabled = false,
  uasDisabledMessage,
}) => {
  const { t } = useAviationTranslation();
  const isFieldDisabled = disabled || (category === 'uas' && uasDisabled);
  const {
    groups: copingGroups,
    flatOptions: copingOptions,
    loading: copingLoading,
    error: copingError,
  } = useCopingAbilities();

  const managementOptions = useMemo(() => [
    { value: 'managed', label: t('management_state.managed') },
    { value: 'unmanaged', label: t('management_state.unmanaged') },
    { value: 'ineffective', label: t('management_state.ineffective') },
    { value: 'unobserved', label: t('management_state.unobserved') },
  ], [t]);

  const getField = <T,>(suffix: string): T => {
    return item[`${category}_${suffix}` as keyof LabelingItem] as T;
  };

  const management = getField<Record<string, unknown> | null>('management');
  const impact = getField<Record<string, unknown> | null>('impact');
  const copingAbilities = getField<Record<string, unknown> | null>('coping_abilities');

  useEffect(() => {
    const isInvalid = (obj: unknown) => Array.isArray(obj) || obj === null || obj === undefined;

    if (isInvalid(management) || isInvalid(impact) || isInvalid(copingAbilities)) {
      onUpdate({
        [`${category}_management`]: {},
        [`${category}_impact`]: {},
        [`${category}_coping_abilities`]: { values: [] },
      });
    }
  }, [management, impact, copingAbilities, category, onUpdate]);

  const typeSelection = useMemo((): HierarchicalSelection | null => {
    const l1 = getField<LabelingItem['threat_type_l1_detail']>('type_l1_detail');
    const l2 = getField<LabelingItem['threat_type_l2_detail']>('type_l2_detail');
    const l3 = getField<LabelingItem['threat_type_l3_detail']>('type_l3_detail');

    if (!l1) return null;
    return {
      level1: l1.code,
      level2: l2?.code ?? null,
      level3: l3?.code ?? null,
    };
  }, [item, category]);

  const managementValue = useMemo(() => {
    return (management?.value as string) ?? null;
  }, [management]);

  const { impactOptions, isImpactDisabled } = useImpactOptions(category, managementValue);

  const impactValue = useMemo(() => {
    return (impact?.value as string) ?? null;
  }, [impact]);

  const copingValue = useMemo(() => {
    if (Array.isArray(copingAbilities) || copingAbilities === null || copingAbilities === undefined) {
      return [];
    }
    return (copingAbilities.values as string[]) ?? [];
  }, [copingAbilities]);

  const description = getField<string>('description') ?? '';

  const calculatedTopics = useMemo(() => {
    return item[`calculated_${category}_topics` as keyof LabelingItem] as string[] ?? [];
  }, [item, category]);

  const handleTypeChange = useCallback(
    (value: HierarchicalSelection | null) => {
      const findOptionByCode = (opts: DropdownOption[], code: string): DropdownOption | null => {
        for (const opt of opts) {
          if (opt.code === code) return opt;
          if (opt.children) {
            const found = findOptionByCode(opt.children, code);
            if (found) return found;
          }
        }
        return null;
      };

      if (!value) {
        onUpdate({
          [`${category}_type_l1`]: null,
          [`${category}_type_l2`]: null,
          [`${category}_type_l3`]: null,
        });
        return;
      }

      const l1Option = value.level1 ? findOptionByCode(options, value.level1) : null;
      const l2Option = value.level2 ? findOptionByCode(options, value.level2) : null;
      const l3Option = value.level3 ? findOptionByCode(options, value.level3) : null;

      onUpdate({
        [`${category}_type_l1`]: l1Option?.id ?? null,
        [`${category}_type_l2`]: l2Option?.id ?? null,
        [`${category}_type_l3`]: l3Option?.id ?? null,
      });
    },
    [onUpdate, options, category],
  );

  const handleManagementChange = useCallback(
    (value: string | null) => {
      const updates: Partial<LabelingItem> = {
        [`${category}_management`]: value ? { value } : {},
      };

      if (category !== 'uas' && value) {
        const config = category === 'threat'
          ? THREAT_IMPACT_CONFIG[value]
          : ERROR_IMPACT_CONFIG[value];
        if (config?.autoSelect) {
          updates[`${category}_impact`] = { value: config.autoSelect };
        } else {
          updates[`${category}_impact`] = {};
        }
      }

      onUpdate(updates);
    },
    [onUpdate, category],
  );

  const handleImpactChange = useCallback(
    (value: string | null) => {
      onUpdate({
        [`${category}_impact`]: value ? { value } : {},
      });
    },
    [onUpdate, category],
  );

  const handleCopingChange = useCallback(
    (values: string[]) => {
      onUpdate({
        [`${category}_coping_abilities`]: { values },
      });
    },
    [onUpdate, category],
  );

  const handleDescriptionChange = useCallback(
    (value: string) => {
      onUpdate({
        [`${category}_description`]: value,
      });
    },
    [onUpdate, category],
  );

  return (
    <div className={styles.section}>
      <h4 className={styles.title}>{title}</h4>

      <div className={styles.content}>
        {category === 'uas' && uasDisabled && uasDisabledMessage && (
          <div className={styles.disabledMessage}>{uasDisabledMessage}</div>
        )}

        <RecognitionTypeSelector
          category={category}
          label={t(`recognition.${category}.type`)}
          typeSelection={typeSelection}
          onTypeChange={handleTypeChange}
          options={options}
          disabled={isFieldDisabled}
        />

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor={`${category}-management`} className={styles.fieldLabel}>{t('recognition.management')}</label>
            <Select
              id={`${category}-management`}
              value={managementValue}
              onChange={handleManagementChange}
              options={managementOptions}
              placeholder={t('recognition.select_management')}
              disabled={isFieldDisabled}
              aria-label={t('recognition.management')}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor={`${category}-impact`} className={styles.fieldLabel}>{t('recognition.impact')}</label>
            <Select
              id={`${category}-impact`}
              value={impactValue}
              onChange={handleImpactChange}
              options={impactOptions}
              placeholder={t('recognition.select_impact')}
              disabled={isFieldDisabled || isImpactDisabled}
              aria-label={t('recognition.impact')}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor={`${category}-coping`} className={styles.fieldLabel}>{t('recognition.coping_ability')}</label>
          {copingError && (
            <div className={styles.errorMessage}>{t('error.load_failed', { message: copingError })}</div>
          )}
          <MultiSelect
            id={`${category}-coping`}
            value={copingValue}
            onChange={handleCopingChange}
            options={copingOptions}
            groups={copingGroups}
            placeholder={t('recognition.select_coping')}
            disabled={isFieldDisabled || copingLoading}
            aria-label={t('recognition.coping_ability')}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor={`${category}-description`} className={styles.fieldLabel}>{t('recognition.description')}</label>
          <TextArea
            id={`${category}-description`}
            value={description}
            onChange={handleDescriptionChange}
            placeholder={t(`recognition.enter_${category}_description`)}
            rows={3}
            disabled={isFieldDisabled}
            autoResize
          />
        </div>

        {calculatedTopics.length > 0 && (
          <div className={styles.topics}>
            <span className={styles.topicsLabel}>{t('training_topics.title')}:</span>
            <div className={styles.topicsList}>
              {calculatedTopics.map((topic) => (
                <span key={topic} className={styles.topicBadge}>
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        <CompetencySummary category={category} item={item} />
      </div>
    </div>
  );
};
