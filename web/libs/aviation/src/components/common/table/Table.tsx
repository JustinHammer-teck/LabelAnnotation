import { type ReactNode, useCallback } from 'react';
import styles from './table.module.scss';

export interface TableColumn<T> {
  key: string;
  title: string;
  render?: (value: T[keyof T], record: T, index: number) => ReactNode;
  width?: string | number;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: keyof T | ((record: T) => string);
  onRowClick?: (record: T, index: number) => void;
  loading?: boolean;
  emptyText?: string;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  loading = false,
  emptyText = 'No data',
  className,
}: TableProps<T>) {
  const getRowKey = useCallback(
    (record: T, index: number): string => {
      if (typeof rowKey === 'function') {
        return rowKey(record);
      }
      return String(record[rowKey] ?? index);
    },
    [rowKey],
  );

  const handleRowClick = useCallback(
    (record: T, index: number) => {
      if (onRowClick) {
        onRowClick(record, index);
      }
    },
    [onRowClick],
  );

  if (loading) {
    return (
      <div className={`${styles.tableWrapper} ${className || ''}`}>
        <div className={styles.loading} role="status" aria-label="Loading">
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.tableWrapper} ${className || ''}`}>
      <table className={`${styles.table} ${onRowClick ? styles.clickable : ''}`}>
        <thead className={styles.thead}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={styles.th}
                style={{ width: column.width }}
                scope="col"
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={styles.tbody}>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((record, index) => (
              <tr
                key={getRowKey(record, index)}
                onClick={() => handleRowClick(record, index)}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleRowClick(record, index);
                        }
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'button' : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key} className={styles.td}>
                    {column.render
                      ? column.render(record[column.key as keyof T], record, index)
                      : String(record[column.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
