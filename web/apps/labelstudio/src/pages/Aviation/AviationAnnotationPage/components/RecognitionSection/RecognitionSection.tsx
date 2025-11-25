import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { annotationDataAtom } from '../../stores/aviation-annotation.store';
import { useDropdownOptions } from '../../hooks/use-dropdown-options.hook';
import { DropdownOption, HierarchicalSelection } from '../../types/aviation.types';
import styles from './RecognitionSection.module.scss';

interface RecognitionSectionProps {
  type: 'threat' | 'error' | 'uas';
  backgroundColor: string;
}

export const RecognitionSection: React.FC<RecognitionSectionProps> = ({ type, backgroundColor }) => {
  const { t } = useTranslation();
  const [data, setData] = useAtom(annotationDataAtom);
  const { options } = useDropdownOptions();
  const [showHierarchy, setShowHierarchy] = useState(false);

  const typeField = `${type}_type` as keyof typeof data;
  const relevancyField = `${type}_relevancy` as keyof typeof data;
  const managementField = `${type}_management` as keyof typeof data;
  const outcomeField = type === 'uas' ? undefined : `${type}_outcome` as keyof typeof data;
  const descriptionField = `${type}_description` as keyof typeof data;

  const typeValue = data[typeField] as HierarchicalSelection;
  const relevancyValue = (type !== 'threat' ? data[relevancyField] : '') as string;
  const managementValue = data[managementField] as string;
  const outcomeValue = (outcomeField ? data[outcomeField] : '') as string;
  const descriptionValue = data[descriptionField] as string;

  const updateField = (field: keyof typeof data, value: any) => {
    setData({ ...data, [field]: value });
  };

  const renderHierarchicalDropdown = () => {
    const categoryOptions = options?.[type] || [];

    return (
      <div className={styles.hierarchicalContainer}>
        <button
          className={styles.hierarchyButton}
          onClick={() => setShowHierarchy(!showHierarchy)}
        >
          {typeValue?.fullPath || 'Option 1'}
          <span className={styles.dropdownIcon}>▼</span>
        </button>
        <div className={styles.hierarchyDesc}>
          一级菜单<br/>下拉单选&描述
        </div>
        {typeValue?.level1 && (
          <div className={styles.hierarchyLevel}>
            <span className={styles.levelBadge}>二级菜单</span>
            <span>下拉单选&描述</span>
            <span className={styles.requiredStar}>★</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.recognitionSection} style={{ backgroundColor }}>
      <div className={styles.sectionHeader}>
        <h3>{t(`aviation.recognition.${type}.title`)}</h3>
        <div className={styles.helpIcon}>ℹ️</div>
      </div>

      <table className={styles.recognitionTable}>
        <thead>
          <tr>
            {type !== 'threat' && <th rowSpan={2}>{t('aviation.recognition.relevancy')}</th>}
            <th>{t(`aviation.recognition.${type}.type`)}</th>
            <th>{t(`aviation.recognition.${type}.management`)}</th>
            {type !== 'uas' && <th>{t(`aviation.recognition.${type}.outcome`)}</th>}
            <th>{t(`aviation.recognition.${type}.capability`)}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {type !== 'threat' && (
              <td rowSpan={2} className={styles.relevancyCell}>
                <div className={styles.relevancyLabel}>{t('aviation.recognition.relevancy_driver')}</div>
                <select
                  value={relevancyValue}
                  onChange={(e) => updateField(relevancyField, e.target.value)}
                  className={styles.select}
                >
                  <option value="">{t('aviation.recognition.dropdown_single')}</option>
                  {options?.[`${type}_relevancy` as keyof typeof options]?.map((opt: DropdownOption) => (
                    <option key={opt.id} value={opt.code}>{opt.label}</option>
                  ))}
                </select>
              </td>
            )}
            <td>
              {renderHierarchicalDropdown()}
            </td>
            <td>
              <button className={styles.optionButton}>
                Option 1 <span className={styles.dropdownIcon}>▼</span>
              </button>
              <div className={styles.desc}>{t('aviation.results.level_1_menu')}<br/>{t('aviation.results.dropdown_single_desc')}</div>
            </td>
            {type !== 'uas' && (
              <td>
                <button className={styles.optionButton}>
                  Option 1 <span className={styles.dropdownIcon}>▼</span>
                </button>
                <div className={styles.desc}>{t('aviation.results.level_1_menu')}<br/>{t('aviation.results.dropdown_single_desc')}</div>
              </td>
            )}
            <td>
              <button className={styles.addButton}>
                <span className={styles.plusIcon}>+</span> Option 1 <span className={styles.dropdownIcon}>▼</span>
              </button>
              <div className={styles.desc}>一级菜单<br/>下拉多选&描述</div>
            </td>
          </tr>
          <tr>
            <td colSpan={type === 'uas' ? 3 : 4}>
              <div className={styles.hierarchyLevel}>
                <span className={styles.levelBadge}>{t('aviation.recognition.dropdown_single')}</span>
                <span>{t('aviation.results.dropdown_single_desc')}</span>
                <span className={styles.requiredStar}>★</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
