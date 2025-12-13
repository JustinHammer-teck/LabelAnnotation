import { AviationAnnotationData, ValidationErrors } from '../types/aviation.types';

export class ValidationUtil {
  /**
   * Validate entire annotation form
   */
  static validateAnnotationData(data: AviationAnnotationData): ValidationErrors {
    const errors: ValidationErrors = {};

    // Basic Info validation
    if (!data.aircraft_type) {
      errors.aircraft_type = 'Aircraft type is required';
    }

    if (data.event_labels.length === 0) {
      errors.event_labels = 'At least one event label must be selected';
    }

    // Threat validation - only validate if any threat field is filled
    if (this.isSectionStarted('threat', data)) {
      if (!data.threat_type.level3) {
        errors.threat_type = 'Complete threat type selection is required';
      }
      if (!data.threat_management) {
        errors.threat_management = 'Threat management is required when threat is identified';
      }
      if (!data.threat_outcome) {
        errors.threat_outcome = 'Threat outcome is required when threat is identified';
      }
    }

    // Error validation - only validate if relevancy is YES
    if (data.error_relevancy === 'YES') {
      if (!data.error_type.level3) {
        errors.error_type = 'Error type is required when error is relevant';
      }
      if (!data.error_management) {
        errors.error_management = 'Error management is required when error is relevant';
      }
      if (!data.error_outcome) {
        errors.error_outcome = 'Error outcome is required when error is relevant';
      }
    }

    // UAS validation - only validate if relevancy is YES
    if (data.uas_relevancy === 'YES') {
      if (!data.uas_type.level3) {
        errors.uas_type = 'UAS type is required when UAS is relevant';
      }
      if (!data.uas_management) {
        errors.uas_management = 'UAS management is required when UAS is relevant';
      }
    }

    // Training evaluation validation
    if (!data.likelihood) {
      errors.likelihood = 'Likelihood assessment is required';
    }
    if (!data.severity) {
      errors.severity = 'Severity assessment is required';
    }
    if (!data.training_benefit) {
      errors.training_benefit = 'Training benefit assessment is required';
    }

    return errors;
  }

  /**
   * Check if a section has been started (any field filled)
   */
  static isSectionStarted(section: 'threat' | 'error' | 'uas', data: AviationAnnotationData): boolean {
    switch (section) {
      case 'threat':
        return !!(
          data.threat_type.level1 ||
          data.threat_management ||
          data.threat_outcome ||
          data.threat_description
        );
      case 'error':
        return !!(
          data.error_relevancy ||
          data.error_type.level1 ||
          data.error_management ||
          data.error_outcome ||
          data.error_description
        );
      case 'uas':
        return !!(
          data.uas_relevancy ||
          data.uas_type.level1 ||
          data.uas_management ||
          data.uas_description
        );
      default:
        return false;
    }
  }

  /**
   * Validate a single field
   */
  static validateField(fieldName: string, value: any, data: AviationAnnotationData): string | null {
    switch (fieldName) {
      case 'aircraft_type':
        return !value ? 'Aircraft type is required' : null;

      case 'event_labels':
        return value.length === 0 ? 'At least one event label must be selected' : null;

      case 'threat_type':
        if (this.isSectionStarted('threat', data) && !value.level3) {
          return 'Complete threat type selection is required';
        }
        return null;

      case 'threat_management':
        if (this.isSectionStarted('threat', data) && !value) {
          return 'Threat management is required when threat is identified';
        }
        return null;

      case 'error_type':
        if (data.error_relevancy === 'YES' && !value.level3) {
          return 'Error type is required when error is relevant';
        }
        return null;

      case 'uas_type':
        if (data.uas_relevancy === 'YES' && !value.level3) {
          return 'UAS type is required when UAS is relevant';
        }
        return null;

      case 'likelihood':
      case 'severity':
      case 'training_benefit':
        return !value ? `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required` : null;

      default:
        return null;
    }
  }

  /**
   * Check if form is valid for submission
   */
  static isFormValid(data: AviationAnnotationData): boolean {
    const errors = this.validateAnnotationData(data);
    return Object.keys(errors).length === 0;
  }

  /**
   * Get completion percentage
   */
  static getCompletionPercentage(data: AviationAnnotationData): number {
    const fields = [
      data.aircraft_type,
      data.event_labels.length > 0,
      data.threat_type.level3,
      data.threat_management,
      data.threat_outcome,
      data.error_relevancy,
      data.uas_relevancy,
      data.likelihood,
      data.severity,
      data.training_benefit,
    ];

    const filledFields = fields.filter(Boolean).length;
    return Math.round((filledFields / fields.length) * 100);
  }

  /**
   * Check if text exceeds maximum length
   */
  static validateTextLength(text: string, maxLength: number = 1000): string | null {
    if (text.length > maxLength) {
      return `Text exceeds maximum length of ${maxLength} characters`;
    }
    return null;
  }
}