import { LabelPage as LabelPageComponent } from './LabelPage';
import type { Page } from '../types/Page';

/**
 * LabelPage - Data Analysis Page Configuration
 *
 * Integrates @heartex/label library into Label Studio application.
 * Available at /label route.
 *
 * Displays analytics for ALL aviation project tasks across all projects.
 */
export const LabelPage: Page = Object.assign(LabelPageComponent, {
  title: 'Data Analysis',
  path: '/label',
});
