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

const MANAGEMENT_OPTIONS = [
  { value: 'managed', label: '管理的' },
  { value: 'unmanaged', label: '未管理' },
  { value: 'ineffective', label: '无效管理' },
  { value: 'unobserved', label: '未观察到' },
];

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
  const isFieldDisabled = disabled || (category === 'uas' && uasDisabled);
  const {
    groups: copingGroups,
    flatOptions: copingOptions,
    loading: copingLoading,
    error: copingError,
  } = useCopingAbilities();

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
          label="类型选择"
          typeSelection={typeSelection}
          onTypeChange={handleTypeChange}
          options={options}
          disabled={isFieldDisabled}
        />

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor={`${category}-management`} className={styles.fieldLabel}>管理</label>
            <Select
              id={`${category}-management`}
              value={managementValue}
              onChange={handleManagementChange}
              options={MANAGEMENT_OPTIONS}
              placeholder="选择管理状态..."
              disabled={isFieldDisabled}
              aria-label="管理状态选择"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor={`${category}-impact`} className={styles.fieldLabel}>影响</label>
            <Select
              id={`${category}-impact`}
              value={impactValue}
              onChange={handleImpactChange}
              options={impactOptions}
              placeholder="选择影响..."
              disabled={isFieldDisabled || isImpactDisabled}
              aria-label="影响选择"
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor={`${category}-coping`} className={styles.fieldLabel}>应对能力</label>
          {copingError && (
            <div className={styles.errorMessage}>Failed to load: {copingError}</div>
          )}
          <MultiSelect
            id={`${category}-coping`}
            value={copingValue}
            onChange={handleCopingChange}
            options={copingOptions}
            groups={copingGroups}
            placeholder="选择应对能力..."
            disabled={isFieldDisabled || copingLoading}
            aria-label="应对能力选择"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor={`${category}-description`} className={styles.fieldLabel}>描述</label>
          <TextArea
            id={`${category}-description`}
            value={description}
            onChange={handleDescriptionChange}
            placeholder="输入描述..."
            rows={3}
            disabled={isFieldDisabled}
            autoResize
          />
        </div>

        {calculatedTopics.length > 0 && (
          <div className={styles.topics}>
            <span className={styles.topicsLabel}>相关训练主题:</span>
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
