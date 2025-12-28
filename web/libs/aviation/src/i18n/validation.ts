/**
 * Translation validation utilities for aviation i18n
 *
 * These utilities help ensure translation consistency between locales
 * and validate translation key structures.
 */

/**
 * Validates that all translation keys exist in both locales
 *
 * @param en - English translation object
 * @param zh - Chinese translation object
 * @param path - Current path in the translation tree (used for recursion)
 * @returns Array of error messages for missing keys
 *
 * @example
 * ```typescript
 * import en from './locales/en.json';
 * import zh from './locales/zh.json';
 *
 * const errors = validateTranslationKeys(en, zh);
 * if (errors.length > 0) {
 *   console.error('Translation mismatches:', errors);
 * }
 * ```
 */
export function validateTranslationKeys(
  en: Record<string, unknown>,
  zh: Record<string, unknown>,
  path: string = ''
): string[] {
  const errors: string[] = [];

  const enKeys = Object.keys(en);
  const zhKeys = Object.keys(zh);

  // Check for missing keys in zh
  enKeys.forEach(key => {
    const currentPath = path ? `${path}.${key}` : key;
    if (!zhKeys.includes(key)) {
      errors.push(`Missing key in zh: ${currentPath}`);
    }
  });

  // Check for missing keys in en
  zhKeys.forEach(key => {
    const currentPath = path ? `${path}.${key}` : key;
    if (!enKeys.includes(key)) {
      errors.push(`Missing key in en: ${currentPath}`);
    }
  });

  // Recurse for nested objects
  enKeys.forEach(key => {
    const enValue = en[key];
    const zhValue = zh[key];
    const currentPath = path ? `${path}.${key}` : key;

    if (
      typeof enValue === 'object' &&
      enValue !== null &&
      !Array.isArray(enValue)
    ) {
      if (
        typeof zhValue === 'object' &&
        zhValue !== null &&
        !Array.isArray(zhValue)
      ) {
        errors.push(
          ...validateTranslationKeys(
            enValue as Record<string, unknown>,
            zhValue as Record<string, unknown>,
            currentPath
          )
        );
      } else if (zhValue !== undefined) {
        errors.push(
          `Type mismatch at ${currentPath}: en has object, zh has ${typeof zhValue}`
        );
      }
    }
  });

  return errors;
}

/**
 * Check if a key follows i18next plural conventions
 *
 * @param key - Translation key to check
 * @returns true if the key is a plural form key
 *
 * @example
 * ```typescript
 * hasPluralForm('pending_feedback_count_plural') // true
 * hasPluralForm('pending_feedback_count') // true (count key)
 * hasPluralForm('title') // false
 * ```
 */
export function hasPluralForm(key: string): boolean {
  return key.endsWith('_plural') || key.includes('_count');
}

/**
 * Validates that interpolation syntax is correct in translation values
 *
 * @param value - Translation string to validate
 * @returns true if interpolation syntax is valid (or no interpolation present)
 *
 * @example
 * ```typescript
 * validateInterpolation('{{count}} items') // true
 * validateInterpolation('{{count} items') // false (missing closing brace)
 * validateInterpolation('Hello world') // true (no interpolation)
 * ```
 */
export function validateInterpolation(value: string): boolean {
  // Check for properly closed interpolation braces
  const openBraces = (value.match(/\{\{/g) || []).length;
  const closeBraces = (value.match(/\}\}/g) || []).length;

  if (openBraces !== closeBraces) {
    return false;
  }

  // Check for valid interpolation variable names (alphanumeric and underscore only)
  const interpolationPattern = /\{\{([^}]+)\}\}/g;
  const validNamePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

  let match;
  while ((match = interpolationPattern.exec(value)) !== null) {
    const variableName = match[1].trim();
    if (!validNamePattern.test(variableName)) {
      return false;
    }
  }

  return true;
}

/**
 * Extracts all interpolation variable names from a translation string
 *
 * @param value - Translation string to analyze
 * @returns Array of variable names found in the string
 *
 * @example
 * ```typescript
 * extractInterpolationVariables('Hello {{name}}, you have {{count}} messages')
 * // Returns: ['name', 'count']
 * ```
 */
export function extractInterpolationVariables(value: string): string[] {
  const pattern = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = pattern.exec(value)) !== null) {
    variables.push(match[1]);
  }

  return variables;
}

/**
 * Validates that corresponding translations have matching interpolation variables
 *
 * @param enValue - English translation string
 * @param zhValue - Chinese translation string
 * @returns Object with isValid flag and any mismatched variables
 *
 * @example
 * ```typescript
 * validateMatchingInterpolation(
 *   '{{count}} pending feedback',
 *   '{{count}} 个待处理反馈'
 * )
 * // Returns: { isValid: true, missingInZh: [], missingInEn: [] }
 * ```
 */
export function validateMatchingInterpolation(
  enValue: string,
  zhValue: string
): {
  isValid: boolean;
  missingInZh: string[];
  missingInEn: string[];
} {
  const enVars = extractInterpolationVariables(enValue);
  const zhVars = extractInterpolationVariables(zhValue);

  const missingInZh = enVars.filter(v => !zhVars.includes(v));
  const missingInEn = zhVars.filter(v => !enVars.includes(v));

  return {
    isValid: missingInZh.length === 0 && missingInEn.length === 0,
    missingInZh,
    missingInEn,
  };
}

/**
 * Validates an entire translation section for common issues
 * Handles nested objects recursively
 *
 * @param section - Translation section object (can contain nested objects)
 * @param sectionName - Name of the section for error messages
 * @returns Array of validation error messages
 */
export function validateTranslationSection(
  section: Record<string, unknown>,
  sectionName: string
): string[] {
  const errors: string[] = [];

  Object.entries(section).forEach(([key, value]) => {
    const currentPath = `${sectionName}.${key}`;

    // Handle nested objects recursively
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      errors.push(
        ...validateTranslationSection(
          value as Record<string, unknown>,
          currentPath
        )
      );
      return;
    }

    // For string values, validate content
    if (typeof value === 'string') {
      // Check for empty values
      if (!value || value.trim().length === 0) {
        errors.push(`Empty value at ${currentPath}`);
      }

      // Check for invalid interpolation
      if (!validateInterpolation(value)) {
        errors.push(`Invalid interpolation at ${currentPath}: "${value}"`);
      }
    } else if (value === null || value === undefined) {
      errors.push(`Empty value at ${currentPath}`);
    }
  });

  return errors;
}
