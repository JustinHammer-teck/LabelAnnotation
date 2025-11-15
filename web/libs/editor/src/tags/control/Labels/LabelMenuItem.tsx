import { inject, observer } from 'mobx-react';
import React, { FC } from 'react';
import { Menu } from 'antd';
import styles from './LabelMenuItem.module.scss';

interface LabelMenuItemProps {
  label: any;
  onClick: () => void;
  store?: any;
}

export const LabelMenuItem: FC<LabelMenuItemProps> = inject('store')(
  observer(({ label, onClick, store }) => {
    const showHotkey =
      store?.settings?.enableTooltips &&
      store?.settings?.enableHotkeys &&
      label.hotkey;

    return (
      <Menu.Item key={label.id} onClick={onClick}>
        <div className={styles.content}>
          {label.background && (
            <div
              className={styles['color-indicator']}
              style={{ backgroundColor: label.background }}
            />
          )}
          <span className={styles['label-text']}>{label._value || label.value}</span>
          {showHotkey && <span className={styles.hotkey}>{label.hotkey}</span>}
        </div>
      </Menu.Item>
    );
  })
);
