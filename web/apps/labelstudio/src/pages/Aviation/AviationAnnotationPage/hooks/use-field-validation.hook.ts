import { useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  annotationDataAtom,
  validationErrorsAtom,
  clearFieldErrorAtom,
} from '../stores/aviation-annotation.store';
import { ValidationUtil } from '../utils/validation.util';
import { AviationAnnotationData } from '../types/aviation.types';

interface UseFieldValidationResult {
  errors: Record<string, string>;
  validateField: (fieldName: string, value: any) => string | null;
  validateForm: () => boolean;
  clearError: (fieldName: string) => void;
  setError: (fieldName: string, error: string) => void;
  getFieldError: (fieldName: string) => string | undefined;
}

export const useFieldValidation = (): UseFieldValidationResult => {
  const annotationData = useAtomValue(annotationDataAtom);
  const errors = useAtomValue(validationErrorsAtom);
  const setErrors = useSetAtom(validationErrorsAtom);
  const clearError = useSetAtom(clearFieldErrorAtom);

  const validateField = useCallback(
    (fieldName: string, value: any): string | null => {
      const error = ValidationUtil.validateField(fieldName, value, annotationData);

      if (error) {
        setErrors(prev => ({ ...prev, [fieldName]: error }));
      } else {
        clearError(fieldName);
      }

      return error;
    },
    [annotationData, setErrors, clearError]
  );

  const validateForm = useCallback((): boolean => {
    const validationErrors = ValidationUtil.validateAnnotationData(annotationData);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [annotationData, setErrors]);

  const setError = useCallback(
    (fieldName: string, error: string) => {
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    },
    [setErrors]
  );

  const getFieldError = useCallback(
    (fieldName: string): string | undefined => {
      return errors[fieldName];
    },
    [errors]
  );

  return {
    errors,
    validateField,
    validateForm,
    clearError,
    setError,
    getFieldError,
  };
};

// Hook for specific field validation on blur
export const useFieldBlurValidation = (
  fieldName: keyof AviationAnnotationData,
  required: boolean = false
) => {
  const { validateField, getFieldError, clearError } = useFieldValidation();
  const annotationData = useAtomValue(annotationDataAtom);

  const handleBlur = useCallback(() => {
    const value = annotationData[fieldName];

    if (required || value) {
      validateField(fieldName, value);
    }
  }, [fieldName, annotationData, required, validateField]);

  const handleFocus = useCallback(() => {
    clearError(fieldName);
  }, [fieldName, clearError]);

  return {
    error: getFieldError(fieldName),
    onBlur: handleBlur,
    onFocus: handleFocus,
  };
};