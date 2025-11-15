import React, { useEffect, useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useAtom } from 'jotai';
import { Block, Elem } from '../../utils/bem';
import { activeTabAtom, type ActiveTab } from './files-atoms';
import './tabs-container.scss';

interface Tab {
  key: ActiveTab;
  label: string;
}

interface TabsContainerProps {
  tabs: Tab[];
  children: React.ReactNode;
}

export const TabsContainer: React.FC<TabsContainerProps> = ({ tabs, children }) => {
  const history = useHistory();
  const location = useLocation();
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabFromUrl = searchParams.get('tab') as ActiveTab | null;

    if (tabFromUrl && (tabFromUrl === 'projects' || tabFromUrl === 'files')) {
      setActiveTab(tabFromUrl);
    }
  }, [location.search, setActiveTab]);

  const handleTabChange = useCallback(
    (newTab: ActiveTab) => {
      setActiveTab(newTab);

      const searchParams = new URLSearchParams(location.search);
      searchParams.set('tab', newTab);

      history.push({
        pathname: location.pathname,
        search: searchParams.toString(),
      });
    },
    [setActiveTab, history, location.pathname, location.search]
  );

  return (
    <Block name="tabs-container">
      <Elem name="tabs-header">
        {tabs.map((tab) => (
          <Elem
            key={tab.key}
            name="tab"
            mod={{ active: activeTab === tab.key }}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
          </Elem>
        ))}
      </Elem>
      <Elem name="tabs-content">{children}</Elem>
    </Block>
  );
};
