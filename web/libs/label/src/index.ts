/**
 * @heartex/label - Event Annotation System
 *
 * Data analysis and event labeling components for Label Studio.
 *
 * @example
 * // Named import
 * import { DataAnalysis } from '@heartex/label';
 * <DataAnalysis labHieStru={data} />
 *
 * @example
 * // Default import
 * import DataAnalysis from '@heartex/label';
 * <DataAnalysis labHieStru={data} />
 *
 * @example
 * // Subcomponent import
 * import { EventList, FilterPanel, VisualizationDashboard } from '@heartex/label';
 */

// Re-export main components from data-analysis feature
export { DataAnalysis } from './features/data-analysis';

// Re-export subcomponents for tree-shaking and direct access
export { default as EventList } from './features/data-analysis/components/EventList';
export { default as FilterPanel } from './features/data-analysis/components/FilterPanel';
export { default as VisualizationDashboard } from './features/data-analysis/components/VisualizationDashboard';

// Default export: DataAnalysis component (primary export)
export { DataAnalysis as default } from './features/data-analysis';

// Note: mockEvents is internal test data and should NOT be exported
