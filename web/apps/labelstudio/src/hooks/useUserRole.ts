import { useMemo } from 'react';
import { useCurrentUser } from '../providers/CurrentUser';

export const useUserRole = () => {
  const { user } = useCurrentUser();

  const isManager = useMemo(() => user?.role === 'Manager', [user?.role]);
  const isResearcher = useMemo(() => user?.role === 'Researcher', [user?.role]);
  const isAnnotator = useMemo(() => user?.role === 'Annotator', [user?.role]);
  const isManagerOrResearcher = useMemo(() => isManager || isResearcher, [isManager, isResearcher]);

  return {
    role: user?.role,
    isManager,
    isResearcher,
    isAnnotator,
    isManagerOrResearcher,
  };
};