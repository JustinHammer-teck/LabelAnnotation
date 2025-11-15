import React from 'react';
import { Block, Elem } from '../../utils/bem';
import './file-status-badge.scss';

export type FileStatus = 'no_tasks' | 'not_started' | 'in_progress' | 'completed';

interface FileStatusBadgeProps {
  status: FileStatus;
}

const STATUS_CONFIG: Record<FileStatus, { label: string; mod: string }> = {
  no_tasks: { label: 'No Tasks', mod: 'no-tasks' },
  not_started: { label: 'Not Started', mod: 'not-started' },
  in_progress: { label: 'In Progress', mod: 'in-progress' },
  completed: { label: 'Completed', mod: 'completed' },
};

export const FileStatusBadge: React.FC<FileStatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.no_tasks;

  return (
    <Block name="file-status-badge" mod={{ [config.mod]: true }}>
      <Elem name="label">{config.label}</Elem>
    </Block>
  );
};
