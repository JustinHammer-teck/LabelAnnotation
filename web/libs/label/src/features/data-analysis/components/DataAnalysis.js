import React from 'react';
import { Spin, Alert, Button } from 'antd';
import FilterPanel from './FilterPanel';
import VisualizationDashboard from './VisualizationDashboard';
import EventList from './EventList';
import {
    useEventsAnalytics,
    useFilterOptions,
    useAnalyticsFilters,
} from '@heartex/aviation';

/**
 * DataAnalysis component for aviation event analysis.
 *
 * Uses server-side filtering via API hooks.
 * When projectId is provided, fetches data for that specific project.
 * When projectId is not provided, fetches all events across the organization.
 *
 * @param {Object} props
 * @param {number} [props.projectId] - Optional Aviation project ID. If not provided, fetches all events.
 * @param {Object} [props.labHieStru] - Label hierarchy structure for filter options
 */
const DataAnalysis = ({ projectId, labHieStru }) => {
    const { filters, updateFilter, clearFilters } = useAnalyticsFilters();
    const { options: filterOptions, isLoading: optionsLoading } = useFilterOptions(projectId);
    const {
        events,
        totalCount,
        isLoading,
        isError,
        error,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        refetch,
    } = useEventsAnalytics(projectId);

    // Show loading spinner during initial load
    if (optionsLoading || (isLoading && events.length === 0)) {
        return (
            <div style={{ padding: '16px', background: '#f0f2f5', minHeight: '100%' }}>
                <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />
            </div>
        );
    }

    // Show error state with retry option
    if (isError) {
        return (
            <div style={{ padding: '16px', background: '#f0f2f5', minHeight: '100%' }}>
                <Alert
                    type="error"
                    message="Failed to load data"
                    description={error?.message || 'An unexpected error occurred'}
                    showIcon
                    action={
                        <Button size="small" type="primary" onClick={() => refetch()}>
                            Retry
                        </Button>
                    }
                />
            </div>
        );
    }

    const handleFilterChange = (changedValues) => {
        Object.entries(changedValues).forEach(([key, value]) => {
            updateFilter(key, value);
        });
    };

    return (
        <div style={{ padding: '16px', background: '#f0f2f5', minHeight: '100%' }}>
            <FilterPanel
                labHieStru={labHieStru}
                filterOptions={filterOptions}
                onFilterChange={handleFilterChange}
                onReset={clearFilters}
                totalCount={totalCount}
            />

            <VisualizationDashboard filteredEvents={events} />

            <EventList
                filteredEvents={events}
                hasMore={hasNextPage}
                loadMore={fetchNextPage}
                loading={isFetchingNextPage}
            />
        </div>
    );
};

export default DataAnalysis;
