import React, { useState, useRef, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { annotationDataAtom, updateFieldAtom } from '../../stores/aviation-annotation.store';
import { useDropdownOptions } from '../../hooks/use-dropdown-options.hook';
import { DropdownOption, HierarchicalSelection } from '../../types/aviation.types';
import { MultiSelectDropdown } from '../MultiSelectDropdown/MultiSelectDropdown';
import { TreeSelectorModal } from '../HierarchicalDropdown/TreeSelectorModal';
import styles from './RecognitionSection.module.scss';

interface RecognitionSectionProps {
  type: 'threat' | 'error' | 'uas';
  backgroundColor: string;
}

export const RecognitionSection: React.FC<RecognitionSectionProps> = ({ type, backgroundColor }) => {
  const { t } = useTranslation();
  const data = useAtomValue(annotationDataAtom);
  const updateField = useSetAtom(updateFieldAtom);
  const { options } = useDropdownOptions();
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [showOutcome, setShowOutcome] = useState(false);
  const managementRef = useRef<HTMLDivElement>(null);
  const outcomeRef = useRef<HTMLDivElement>(null);

  const typeField = `${type}_type` as keyof typeof data;
  const relevancyField = `${type}_relevancy` as keyof typeof data;
  const managementField = `${type}_management` as keyof typeof data;
  const outcomeField = type === 'uas' ? undefined : `${type}_outcome` as keyof typeof data;
  const descriptionField = `${type}_description` as keyof typeof data;
  const capabilityField = `${type}_capability` as keyof typeof data;
  const trainingTopicsField = `${type}_training_topics` as keyof typeof data;

  const typeValue = data[typeField] as HierarchicalSelection;
  const relevancyValue = (type !== 'threat' ? data[relevancyField] : '') as string;
  const managementValue = data[managementField] as string;
  const outcomeValue = (outcomeField ? data[outcomeField] : '') as string;
  const descriptionValue = data[descriptionField] as string;
  const capabilityValue = (data[capabilityField] || []) as string[];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (managementRef.current && !managementRef.current.contains(event.target as Node)) {
        setShowManagement(false);
      }
      if (outcomeRef.current && !outcomeRef.current.contains(event.target as Node)) {
        setShowOutcome(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFieldUpdate = <K extends keyof typeof data>(field: K, value: typeof data[K]) => {
    updateField({ field, value });
  };

  const getCategoryOptions = () => {
    return options?.[type === 'error' ? 'error_type' : type] || [];
  };

  const getOptionByCode = (code: string): DropdownOption | undefined => {
    return getCategoryOptions().find(opt => opt.code === code);
  };

  const getFullPath = (): string => {
    const selectedLevel1 = typeValue?.level1 ? getOptionByCode(typeValue.level1) : undefined;
    const selectedLevel2 = typeValue?.level2 ? getOptionByCode(typeValue.level2) : undefined;
    const selectedLevel3 = typeValue?.level3 ? getOptionByCode(typeValue.level3) : undefined;
    return [selectedLevel1, selectedLevel2, selectedLevel3]
      .filter(Boolean)
      .map(opt => opt!.label)
      .join(' > ');
  };

  const fullPath = getFullPath();

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
                  onChange={(e) => handleFieldUpdate(relevancyField, e.target.value)}
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
              <button
                className={styles.hierarchyButton}
                onClick={() => setTypeModalOpen(true)}
                type="button"
              >
                {fullPath || 'Select Type'}
                <span className={styles.dropdownIcon}>▼</span>
              </button>
              <TreeSelectorModal
                isOpen={typeModalOpen}
                onClose={() => setTypeModalOpen(false)}
                category={type}
                value={typeValue}
                onConfirm={(selection, trainingTopics) => {
                  handleFieldUpdate(typeField, selection);
                  handleFieldUpdate(trainingTopicsField, trainingTopics);
                  setTypeModalOpen(false);
                }}
              />
            </td>
            <td>
              <div className={styles.dropdownWrapper} ref={managementRef}>
                <button
                  className={styles.optionButton}
                  onClick={() => setShowManagement(!showManagement)}
                  type="button"
                >
                  {managementValue ? options?.[`${type}_management` as keyof typeof options]?.find((opt: DropdownOption) => opt.code === managementValue)?.label || managementValue : t('aviation.recognition.select_option')}
                  <span className={styles.dropdownIcon}>▼</span>
                </button>
                {showManagement && (
                  <div className={styles.simpleDropdownMenu}>
                    {options?.[`${type}_management` as keyof typeof options]?.map((opt: DropdownOption) => (
                      <div
                        key={opt.id}
                        className={`${styles.dropdownItem} ${managementValue === opt.code ? styles.selected : ''}`}
                        onClick={() => {
                          handleFieldUpdate(managementField, opt.code);
                          setShowManagement(false);
                        }}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.desc}>{t('aviation.results.level_1_menu')}<br/>{t('aviation.results.dropdown_single_desc')}</div>
            </td>
            {type !== 'uas' && (
              <td>
                <div className={styles.dropdownWrapper} ref={outcomeRef}>
                  <button
                    className={styles.optionButton}
                    onClick={() => setShowOutcome(!showOutcome)}
                    type="button"
                  >
                    {outcomeValue ? options?.[`${type}_outcome` as keyof typeof options]?.find((opt: DropdownOption) => opt.code === outcomeValue)?.label || outcomeValue : t('aviation.recognition.select_option')}
                    <span className={styles.dropdownIcon}>▼</span>
                  </button>
                  {showOutcome && outcomeField && (
                    <div className={styles.simpleDropdownMenu}>
                      {options?.[`${type}_outcome` as keyof typeof options]?.map((opt: DropdownOption) => (
                        <div
                          key={opt.id}
                          className={`${styles.dropdownItem} ${outcomeValue === opt.code ? styles.selected : ''}`}
                          onClick={() => {
                            handleFieldUpdate(outcomeField, opt.code);
                            setShowOutcome(false);
                          }}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.desc}>{t('aviation.results.level_1_menu')}<br/>{t('aviation.results.dropdown_single_desc')}</div>
              </td>
            )}
            <td>
              <MultiSelectDropdown
                options={options?.competency || []}
                value={capabilityValue}
                onChange={(selected) => handleFieldUpdate(capabilityField, selected)}
                placeholder={t('aviation.recognition.select_option')}
                maxChipsDisplay={2}
              />
              <div className={styles.desc}>一级菜单<br/>下拉多选&描述</div>
            </td>
          </tr>
          <tr>
            <td colSpan={type === 'uas' ? 3 : 4}>
              <textarea
                value={descriptionValue}
                onChange={(e) => handleFieldUpdate(descriptionField, e.target.value)}
                placeholder={t('aviation.recognition.description_placeholder')}
                className={styles.descriptionTextarea}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
