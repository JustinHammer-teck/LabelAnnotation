import { type FC, useMemo } from 'react';
import { DataAnalysis } from '@heartex/label';
import { AviationApiProvider, createDefaultApiClient } from '@heartex/aviation';
import { useUserRole } from '../../hooks/useUserRole';

/**
 * Access Denied component for unauthorized users
 */
const AccessDenied: FC = () => (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <h2>Access Denied</h2>
    <p>You don't have permission to access this page. This feature is only available to Manager and Researcher roles.</p>
  </div>
);

/**
 * Label Studio - Data Analysis Page
 *
 * Integrates the DataAnalysis component from @heartex/label library.
 * Provides event labeling, visualization, and filtering capabilities.
 * Displays analytics for ALL aviation project tasks across all projects.
 * Access restricted to Manager and Researcher roles only.
 *
 * Route: /label
 */
export const LabelPage: FC = () => {
  const { isManagerOrResearcher } = useUserRole();
  const apiClient = useMemo(() => createDefaultApiClient(), []);

  // Check access control first
  if (!isManagerOrResearcher) {
    return <AccessDenied />;
  }

  // Mock hierarchy structure for label types
  // TODO: Replace with actual API data when backend integration is ready
  const labHieStru = {
    威胁列表: [
      {
        id: 1,
        level: 1,
        label: '环境威胁',
        children: [
          {
            id: 11,
            level: 2,
            label: '天气',
            children: [
              { id: 111, level: 3, label: '低能见度' },
              { id: 112, level: 3, label: '强风' },
            ],
          },
        ],
      },
    ],
    差错列表: [
      {
        id: 2,
        level: 1,
        label: '操作差错',
        children: [
          {
            id: 21,
            level: 2,
            label: '程序执行',
            children: [
              { id: 211, level: 3, label: '检查单遗漏' },
            ],
          },
        ],
      },
    ],
    UAS列表: [
      {
        id: 3,
        level: 1,
        label: '不安全状态',
        children: [
          {
            id: 31,
            level: 2,
            label: '飞行状态',
            children: [
              { id: 311, level: 3, label: '高度偏差' },
            ],
          },
        ],
      },
    ],
  };

  return (
    <AviationApiProvider value={apiClient}>
      <div style={{ height: '100%', overflow: 'auto' }}>
        <DataAnalysis labHieStru={labHieStru} />
      </div>
    </AviationApiProvider>
  );
};
