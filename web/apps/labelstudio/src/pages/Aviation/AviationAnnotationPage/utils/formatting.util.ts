export class FormattingUtil {
  /**
   * Format date to display format
   */
  static formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  /**
   * Format time to display format
   */
  static formatTime(time: string): string {
    if (!time) return '';
    // Assuming time is in HH:MM format
    return time;
  }

  /**
   * Format save status message
   */
  static formatSaveStatus(state: string, lastSaved: Date | null): string {
    switch (state) {
      case 'saved':
        if (lastSaved) {
          const minutes = Math.floor((Date.now() - lastSaved.getTime()) / 60000);
          if (minutes < 1) return 'All changes saved';
          if (minutes === 1) return 'Saved 1 minute ago';
          return `Saved ${minutes} minutes ago`;
        }
        return 'All changes saved';
      case 'saving':
        return 'Saving...';
      case 'unsaved':
        return 'Unsaved changes';
      case 'error':
        return 'Failed to save';
      default:
        return '';
    }
  }

  /**
   * Format hierarchical path for display
   */
  static formatHierarchicalPath(path: string): string {
    if (!path) return '';
    // Add spaces around separators for better readability
    return path.replace(/>/g, ' > ');
  }

  /**
   * Truncate text with ellipsis
   */
  static truncateText(text: string, maxLength: number = 50): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Format array as comma-separated list
   */
  static formatList(items: string[], maxDisplay: number = 3): string {
    if (items.length === 0) return '';
    if (items.length <= maxDisplay) {
      return items.join(', ');
    }
    const displayed = items.slice(0, maxDisplay);
    const remaining = items.length - maxDisplay;
    return `${displayed.join(', ')} (+${remaining} more)`;
  }

  /**
   * Format percentage
   */
  static formatPercentage(value: number): string {
    return `${Math.round(value)}%`;
  }

  /**
   * Format field label with required indicator
   */
  static formatLabel(label: string, required: boolean = false): string {
    return required ? `${label} *` : label;
  }

  /**
   * Get severity color class
   */
  static getSeverityClass(severity: string): string {
    const severityMap: Record<string, string> = {
      'Catastrophic': 'severity-catastrophic',
      'Major': 'severity-major',
      'Moderate': 'severity-moderate',
      'Minor': 'severity-minor',
      'Negligible': 'severity-negligible',
    };
    return severityMap[severity] || '';
  }

  /**
   * Get likelihood color class
   */
  static getLikelihoodClass(likelihood: string): string {
    const likelihoodMap: Record<string, string> = {
      'Very Likely': 'likelihood-very-likely',
      'Likely': 'likelihood-likely',
      'Possible': 'likelihood-possible',
      'Unlikely': 'likelihood-unlikely',
      'Very Unlikely': 'likelihood-very-unlikely',
    };
    return likelihoodMap[likelihood] || '';
  }

  /**
   * Format training priority for display
   */
  static formatTrainingPriority(priority: string): string {
    const priorityMap: Record<string, string> = {
      'critical': 'Critical Priority',
      'high': 'High Priority',
      'medium': 'Medium Priority',
      'low': 'Low Priority',
    };
    return priorityMap[priority] || priority;
  }

  /**
   * Get priority badge class
   */
  static getPriorityBadgeClass(priority: string): string {
    return `priority-${priority}`;
  }

  /**
   * Format file size
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format error message for display
   */
  static formatErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.response?.data?.message) return error.response.data.message;
    return 'An unexpected error occurred';
  }

  /**
   * Generate unique ID for form elements
   */
  static generateFieldId(prefix: string, fieldName: string): string {
    return `${prefix}-${fieldName}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }

  /**
   * Convert camelCase to readable label
   */
  static camelToLabel(text: string): string {
    return text
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}