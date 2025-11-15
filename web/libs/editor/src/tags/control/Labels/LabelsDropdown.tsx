import { observer } from 'mobx-react';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Dropdown, Menu } from 'antd';
import { Block } from '../../../utils/bem';
import { DropdownTriggerButton } from './DropdownTriggerButton';
import { LabelMenuItem } from './LabelMenuItem';
import styles from './LabelsDropdown.module.scss';

interface LabelsDropdownProps {
  item: any;
}

export const HtxLabelsDropdown: FC<LabelsDropdownProps> = observer(({ item }) => {
  const isReadOnly = item.annotation?.isReadOnly();
  const closeOnClick = item.choice === 'single';
  const [isOpen, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  const onClickOutside = useCallback((e: MouseEvent) => {
    if (!dropdownRef.current?.contains(e.target as Node)) {
      close();
    }
  }, [close]);

  useEffect(() => {
    document.body.addEventListener('click', onClickOutside, true);
    return () => {
      document.body.removeEventListener('click', onClickOutside, true);
    };
  }, [onClickOutside]);

  const handleLabelClick = useCallback((label: any) => {
    label.onClick();
    if (closeOnClick) {
      close();
    }
  }, [closeOnClick, close]);

  const menu = (
    <Menu>
      {item.tiedChildren?.map((label: any) => (
        <LabelMenuItem
          key={label.id}
          label={label}
          onClick={() => handleLabelClick(label)}
        />
      ))}
    </Menu>
  );

  return (
    <Block name="labels-dropdown" mod={{ hidden: !item.visible }}>
      <div className={styles.container} ref={dropdownRef}>
        <Dropdown
          overlay={menu}
          trigger={['click']}
          visible={isOpen && !isReadOnly}
          onVisibleChange={(visible) => !isReadOnly && setOpen(visible)}
        >
          <div onClick={() => !isReadOnly && setOpen(!isOpen)}>
            <DropdownTriggerButton
              selectedLabels={item.selectedLabels || []}
              placeholder="Select label..."
              disabled={isReadOnly}
            />
          </div>
        </Dropdown>
      </div>
    </Block>
  );
});
