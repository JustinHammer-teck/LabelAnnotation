import en from '../locales/en.json';
import zh from '../locales/zh.json';
import {
  validateTranslationKeys,
  hasPluralForm,
  validateInterpolation,
  extractInterpolationVariables,
  validateMatchingInterpolation,
  validateTranslationSection,
} from '../validation';

// Type assertions for nested access
type AviationTranslations = typeof en.aviation;
type NestedTranslation = string | Record<string, unknown>;
type ReviewSection = AviationTranslations & {
  review?: Record<string, NestedTranslation>;
  feedback_modal?: Record<string, string>;
};

/**
 * Helper to extract all string values from a potentially nested object
 */
function extractAllStrings(obj: Record<string, unknown>): string[] {
  const strings: string[] = [];

  function traverse(value: unknown): void {
    if (typeof value === 'string') {
      strings.push(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.values(value).forEach(traverse);
    }
  }

  Object.values(obj).forEach(traverse);
  return strings;
}

describe('Aviation i18n - Phase 1: Review Workflow', () => {
  describe('Schema validation', () => {
    test('review section exists in both locales', () => {
      expect((en.aviation as ReviewSection).review).toBeDefined();
      expect((zh.aviation as ReviewSection).review).toBeDefined();
    });

    test('feedback_modal section exists in both locales', () => {
      expect((en.aviation as ReviewSection).feedback_modal).toBeDefined();
      expect((zh.aviation as ReviewSection).feedback_modal).toBeDefined();
    });

    test('review section has all required keys', () => {
      const requiredKeys = [
        'title',
        'description',
        'approve_button',
        'approve_loading',
        'reject_button',
        'reject_loading',
        'revision_button',
        'revision_loading',
        'approved_status',
        'rejected_status',
        'revision_requested',
        'pending_feedback_count',
        'pending_feedback_count_plural',
        'no_pending_feedback',
        'approve_confirm',
        'reject_confirm',
        'revision_confirm',
        'action_success',
      ];

      const enReview = (en.aviation as ReviewSection).review;
      const zhReview = (zh.aviation as ReviewSection).review;

      requiredKeys.forEach(key => {
        expect(enReview).toHaveProperty(key);
        expect(zhReview).toHaveProperty(key);
      });
    });

    test('feedback_modal section has all required keys', () => {
      const requiredKeys = [
        'title',
        'message',
        'hint',
        'action_reject',
        'action_revision',
      ];

      const enModal = (en.aviation as ReviewSection).feedback_modal;
      const zhModal = (zh.aviation as ReviewSection).feedback_modal;

      requiredKeys.forEach(key => {
        expect(enModal).toHaveProperty(key);
        expect(zhModal).toHaveProperty(key);
      });
    });
  });

  describe('Content validation', () => {
    test('no empty values in review section', () => {
      const enReview = (en.aviation as ReviewSection).review;
      const zhReview = (zh.aviation as ReviewSection).review;

      expect(enReview).toBeDefined();
      expect(zhReview).toBeDefined();

      // Extract all string values from nested review object
      const enStrings = extractAllStrings(enReview as Record<string, unknown>);
      const zhStrings = extractAllStrings(zhReview as Record<string, unknown>);

      enStrings.forEach(value => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });

      zhStrings.forEach(value => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    test('no empty values in feedback_modal section', () => {
      const enModal = (en.aviation as ReviewSection).feedback_modal;
      const zhModal = (zh.aviation as ReviewSection).feedback_modal;

      expect(enModal).toBeDefined();
      expect(zhModal).toBeDefined();

      Object.values(enModal!).forEach(value => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });

      Object.values(zhModal!).forEach(value => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    test('interpolation syntax is valid in review section', () => {
      const interpolationPattern = /\{\{[a-zA-Z_]+\}\}/;
      const enReview = (en.aviation as ReviewSection).review!;
      const zhReview = (zh.aviation as ReviewSection).review!;

      // Check count interpolation in pending_feedback_count
      expect(enReview.pending_feedback_count).toMatch(interpolationPattern);
      expect(zhReview.pending_feedback_count).toMatch(interpolationPattern);
    });

    test('interpolation syntax is valid in feedback_modal', () => {
      const interpolationPattern = /\{\{[a-zA-Z_]+\}\}/;
      const enModal = (en.aviation as ReviewSection).feedback_modal!;
      const zhModal = (zh.aviation as ReviewSection).feedback_modal!;

      // Check action interpolation in feedback modal message
      expect(enModal.message).toMatch(interpolationPattern);
      expect(zhModal.message).toMatch(interpolationPattern);
    });

    test('plural forms are consistent', () => {
      const enReview = (en.aviation as ReviewSection).review!;
      const zhReview = (zh.aviation as ReviewSection).review!;

      expect(enReview.pending_feedback_count).toBeDefined();
      expect(enReview.pending_feedback_count_plural).toBeDefined();
      expect(zhReview.pending_feedback_count).toBeDefined();
      expect(zhReview.pending_feedback_count_plural).toBeDefined();
    });
  });

  describe('Structure consistency', () => {
    test('en and zh have matching review keys', () => {
      const enReview = (en.aviation as ReviewSection).review!;
      const zhReview = (zh.aviation as ReviewSection).review!;

      const enKeys = Object.keys(enReview).sort();
      const zhKeys = Object.keys(zhReview).sort();
      expect(enKeys).toEqual(zhKeys);
    });

    test('en and zh have matching feedback_modal keys', () => {
      const enModal = (en.aviation as ReviewSection).feedback_modal!;
      const zhModal = (zh.aviation as ReviewSection).feedback_modal!;

      const enKeys = Object.keys(enModal).sort();
      const zhKeys = Object.keys(zhModal).sort();
      expect(enKeys).toEqual(zhKeys);
    });
  });

  describe('Integration with components', () => {
    test('ReviewPanel can access review translations', () => {
      const enReview = (en.aviation as ReviewSection).review!;

      // These keys are used by ReviewPanel component
      const reviewPanelKeys = [
        'title',
        'description',
        'approve_button',
        'reject_button',
        'revision_button',
      ];

      reviewPanelKeys.forEach(key => {
        expect(enReview[key]).toBeDefined();
      });
    });

    test('FeedbackRequiredModal can access modal translations', () => {
      const enModal = (en.aviation as ReviewSection).feedback_modal!;

      // These keys are used by FeedbackRequiredModal component
      const modalKeys = ['title', 'message', 'hint'];

      modalKeys.forEach(key => {
        expect(enModal[key]).toBeDefined();
      });
    });
  });

  describe('Validation utility - validateTranslationKeys', () => {
    test('returns empty array for matching objects', () => {
      const en = { a: 'test', b: 'test2' };
      const zh = { a: 'test', b: 'test2' };
      expect(validateTranslationKeys(en, zh)).toEqual([]);
    });

    test('detects missing keys in zh', () => {
      const en = { a: 'test', b: 'test2' };
      const zh = { a: 'test' };
      const errors = validateTranslationKeys(en, zh);
      expect(errors).toContain('Missing key in zh: b');
    });

    test('detects missing keys in en', () => {
      const en = { a: 'test' };
      const zh = { a: 'test', b: 'test2' };
      const errors = validateTranslationKeys(en, zh);
      expect(errors).toContain('Missing key in en: b');
    });

    test('validates nested objects recursively', () => {
      const en = { section: { a: 'test', b: 'test2' } };
      const zh = { section: { a: 'test' } };
      const errors = validateTranslationKeys(en, zh);
      expect(errors).toContain('Missing key in zh: section.b');
    });

    test('validates review and feedback_modal sections have no missing keys', () => {
      const enReview = (en.aviation as ReviewSection).review!;
      const zhReview = (zh.aviation as ReviewSection).review!;
      const errors = validateTranslationKeys(enReview, zhReview, 'review');
      expect(errors).toEqual([]);
    });
  });

  describe('Validation utility - hasPluralForm', () => {
    test('returns true for plural keys', () => {
      expect(hasPluralForm('pending_feedback_count_plural')).toBe(true);
    });

    test('returns true for count keys', () => {
      expect(hasPluralForm('pending_feedback_count')).toBe(true);
    });

    test('returns false for regular keys', () => {
      expect(hasPluralForm('title')).toBe(false);
      expect(hasPluralForm('approve_button')).toBe(false);
    });
  });

  describe('Validation utility - validateInterpolation', () => {
    test('returns true for valid interpolation', () => {
      expect(validateInterpolation('{{count}} items')).toBe(true);
      expect(validateInterpolation('Hello {{name}}')).toBe(true);
      expect(validateInterpolation('{{a}} and {{b}}')).toBe(true);
    });

    test('returns true for strings without interpolation', () => {
      expect(validateInterpolation('Hello world')).toBe(true);
      expect(validateInterpolation('No variables here')).toBe(true);
    });

    test('returns false for mismatched braces', () => {
      expect(validateInterpolation('{{count} items')).toBe(false);
      expect(validateInterpolation('{count}} items')).toBe(false);
    });

    test('returns false for invalid variable names', () => {
      expect(validateInterpolation('{{123invalid}}')).toBe(false);
      expect(validateInterpolation('{{has-dash}}')).toBe(false);
    });

    test('all review section values have valid interpolation', () => {
      const enReview = (en.aviation as ReviewSection).review!;
      // Extract all string values from nested review object
      const enStrings = extractAllStrings(enReview as Record<string, unknown>);
      enStrings.forEach(value => {
        expect(validateInterpolation(value)).toBe(true);
      });
    });
  });

  describe('Validation utility - extractInterpolationVariables', () => {
    test('extracts single variable', () => {
      expect(extractInterpolationVariables('{{count}} items')).toEqual(['count']);
    });

    test('extracts multiple variables', () => {
      expect(extractInterpolationVariables('{{a}} and {{b}}')).toEqual(['a', 'b']);
    });

    test('returns empty array for no variables', () => {
      expect(extractInterpolationVariables('Hello world')).toEqual([]);
    });
  });

  describe('Validation utility - validateMatchingInterpolation', () => {
    test('returns valid for matching variables', () => {
      const result = validateMatchingInterpolation(
        '{{count}} pending feedback',
        '{{count}} 个待处理反馈'
      );
      expect(result.isValid).toBe(true);
      expect(result.missingInZh).toEqual([]);
      expect(result.missingInEn).toEqual([]);
    });

    test('detects missing variables in zh', () => {
      const result = validateMatchingInterpolation(
        '{{count}} items by {{user}}',
        '{{count}} 个项目'
      );
      expect(result.isValid).toBe(false);
      expect(result.missingInZh).toContain('user');
    });

    test('review interpolation variables match between en and zh', () => {
      const enReview = (en.aviation as ReviewSection).review!;
      const zhReview = (zh.aviation as ReviewSection).review!;

      Object.keys(enReview).forEach(key => {
        const result = validateMatchingInterpolation(enReview[key], zhReview[key]);
        expect(result.isValid).toBe(true);
      });
    });

    test('feedback_modal interpolation variables match between en and zh', () => {
      const enModal = (en.aviation as ReviewSection).feedback_modal!;
      const zhModal = (zh.aviation as ReviewSection).feedback_modal!;

      Object.keys(enModal).forEach(key => {
        const result = validateMatchingInterpolation(enModal[key], zhModal[key]);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Validation utility - validateTranslationSection', () => {
    test('returns empty array for valid section', () => {
      const section = { title: 'Title', description: 'Description' };
      expect(validateTranslationSection(section, 'test')).toEqual([]);
    });

    test('detects empty values', () => {
      const section = { title: '', description: 'Description' };
      const errors = validateTranslationSection(section, 'test');
      expect(errors).toContain('Empty value at test.title');
    });

    test('detects invalid interpolation', () => {
      const section = { title: '{{invalid' };
      const errors = validateTranslationSection(section, 'test');
      expect(errors.some(e => e.includes('Invalid interpolation'))).toBe(true);
    });

    test('review section passes validation', () => {
      const enReview = (en.aviation as ReviewSection).review!;
      expect(validateTranslationSection(enReview, 'review')).toEqual([]);
    });

    test('feedback_modal section passes validation', () => {
      const enModal = (en.aviation as ReviewSection).feedback_modal!;
      expect(validateTranslationSection(enModal, 'feedback_modal')).toEqual([]);
    });
  });
});

// Type extension for Phase 2 sections
type Phase2Section = AviationTranslations & {
  read_only?: Record<string, string>;
  error?: Record<string, string>;
  common?: Record<string, string>;
  review?: Record<string, string>;
};

describe('Aviation i18n - Phase 2: Read-Only & Errors', () => {
  describe('Read-only section', () => {
    test('read_only section exists in both locales', () => {
      expect((en.aviation as Phase2Section).read_only).toBeDefined();
      expect((zh.aviation as Phase2Section).read_only).toBeDefined();
    });

    test('read_only section has all required keys', () => {
      const requiredKeys = [
        'mode_enabled',
        'cannot_edit',
        'view_only',
        'changes_disabled',
        'contact_admin',
      ];

      const enReadOnly = (en.aviation as Phase2Section).read_only!;
      const zhReadOnly = (zh.aviation as Phase2Section).read_only!;

      requiredKeys.forEach(key => {
        expect(enReadOnly).toHaveProperty(key);
        expect(zhReadOnly).toHaveProperty(key);
        expect(enReadOnly[key]).toBeTruthy();
        expect(zhReadOnly[key]).toBeTruthy();
      });
    });

    test('en and zh have matching read_only keys', () => {
      const enReadOnly = (en.aviation as Phase2Section).read_only!;
      const zhReadOnly = (zh.aviation as Phase2Section).read_only!;

      const enKeys = Object.keys(enReadOnly).sort();
      const zhKeys = Object.keys(zhReadOnly).sort();
      expect(enKeys).toEqual(zhKeys);
    });
  });

  describe('Extended error messages', () => {
    test('error section is extended with new keys', () => {
      const newErrorKeys = [
        'save_failed',
        'network_error',
        'validation_failed',
        'permission_denied',
        'item_not_found',
        'concurrent_edit',
        'server_error',
      ];

      const enError = (en.aviation as Phase2Section).error!;
      const zhError = (zh.aviation as Phase2Section).error!;

      newErrorKeys.forEach(key => {
        expect(enError).toHaveProperty(key);
        expect(zhError).toHaveProperty(key);
        expect(enError[key]).toBeTruthy();
        expect(zhError[key]).toBeTruthy();
      });
    });

    test('existing error keys are preserved', () => {
      const enError = (en.aviation as Phase2Section).error!;
      const zhError = (zh.aviation as Phase2Section).error!;

      // Verify original keys still exist
      expect(enError.load_failed).toBeDefined();
      expect(enError.retry).toBeDefined();
      expect(zhError.load_failed).toBeDefined();
      expect(zhError.retry).toBeDefined();
    });

    test('error messages with interpolation are valid', () => {
      const interpolationPattern = /\{\{[a-zA-Z_]+\}\}/;
      const enError = (en.aviation as Phase2Section).error!;
      const zhError = (zh.aviation as Phase2Section).error!;

      // save_failed has {{message}}
      expect(enError.save_failed).toMatch(interpolationPattern);
      expect(zhError.save_failed).toMatch(interpolationPattern);

      // validation_failed has {{details}}
      expect(enError.validation_failed).toMatch(interpolationPattern);
      expect(zhError.validation_failed).toMatch(interpolationPattern);
    });

    test('en and zh have matching error keys', () => {
      const enError = (en.aviation as Phase2Section).error!;
      const zhError = (zh.aviation as Phase2Section).error!;

      const enKeys = Object.keys(enError).sort();
      const zhKeys = Object.keys(zhError).sort();
      expect(enKeys).toEqual(zhKeys);
    });
  });

  describe('Semantic consistency', () => {
    test('read-only messages follow consistent tone', () => {
      const enReadOnly = (en.aviation as Phase2Section).read_only!;
      const readOnlyValues = Object.values(enReadOnly);

      // Should not contain aggressive language
      readOnlyValues.forEach(value => {
        expect(value.toLowerCase()).not.toContain('forbidden');
        expect(value.toLowerCase()).not.toContain('prohibited');
      });
    });

    test('error messages are actionable', () => {
      const enError = (en.aviation as Phase2Section).error!;
      const errorMessages = [
        enError.network_error,
        enError.concurrent_edit,
        enError.server_error,
      ];

      // Each error should suggest an action or next step
      errorMessages.forEach(msg => {
        const hasAction =
          msg.includes('Please') ||
          msg.includes('try') ||
          msg.includes('check') ||
          msg.includes('refresh');
        expect(hasAction).toBe(true);
      });
    });
  });

  describe('Integration validation', () => {
    test('read-only keys are unique and non-overlapping', () => {
      const enReadOnly = (en.aviation as Phase2Section).read_only!;
      const enReview = (en.aviation as Phase2Section).review!;

      const readOnlyKeys = Object.keys(enReadOnly);
      const reviewKeys = Object.keys(enReview);

      // Ensure no key name conflicts
      const overlap = readOnlyKeys.filter(key => reviewKeys.includes(key));
      expect(overlap.length).toBe(0);
    });

    test('error keys do not conflict with other sections', () => {
      const enError = (en.aviation as Phase2Section).error!;
      const enCommon = (en.aviation as Phase2Section).common!;

      const errorKeySet = new Set(Object.keys(enError));
      const commonKeySet = new Set(Object.keys(enCommon));

      const intersection = [...errorKeySet].filter(key => commonKeySet.has(key));
      expect(intersection.length).toBe(0);
    });
  });

  describe('Content validation', () => {
    test('no empty values in read_only section', () => {
      const enReadOnly = (en.aviation as Phase2Section).read_only!;
      const zhReadOnly = (zh.aviation as Phase2Section).read_only!;

      Object.values(enReadOnly).forEach(value => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });

      Object.values(zhReadOnly).forEach(value => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    test('new error keys have non-empty values', () => {
      const enError = (en.aviation as Phase2Section).error!;
      const zhError = (zh.aviation as Phase2Section).error!;

      const newKeys = [
        'save_failed',
        'network_error',
        'validation_failed',
        'permission_denied',
        'item_not_found',
        'concurrent_edit',
        'server_error',
      ];

      newKeys.forEach(key => {
        expect(enError[key]).toBeTruthy();
        expect(enError[key].length).toBeGreaterThan(0);
        expect(zhError[key]).toBeTruthy();
        expect(zhError[key].length).toBeGreaterThan(0);
      });
    });

    test('read_only section passes validation', () => {
      const enReadOnly = (en.aviation as Phase2Section).read_only!;
      expect(validateTranslationSection(enReadOnly, 'read_only')).toEqual([]);
    });

    test('extended error section passes validation', () => {
      const enError = (en.aviation as Phase2Section).error!;
      expect(validateTranslationSection(enError, 'error')).toEqual([]);
    });
  });

  describe('Interpolation matching', () => {
    test('read_only interpolation variables match between en and zh', () => {
      const enReadOnly = (en.aviation as Phase2Section).read_only!;
      const zhReadOnly = (zh.aviation as Phase2Section).read_only!;

      Object.keys(enReadOnly).forEach(key => {
        const result = validateMatchingInterpolation(enReadOnly[key], zhReadOnly[key]);
        expect(result.isValid).toBe(true);
      });
    });

    test('error interpolation variables match between en and zh', () => {
      const enError = (en.aviation as Phase2Section).error!;
      const zhError = (zh.aviation as Phase2Section).error!;

      Object.keys(enError).forEach(key => {
        const result = validateMatchingInterpolation(enError[key], zhError[key]);
        expect(result.isValid).toBe(true);
      });
    });
  });
});

// Type for assignment section
type AssignmentSection = AviationTranslations & {
  assignment?: Record<string, string>;
};

describe('Aviation i18n - Phase 3: Assignment Settings', () => {
  describe('Assignment section', () => {
    test('assignment section exists in both locales', () => {
      expect((en.aviation as AssignmentSection).assignment).toBeDefined();
      expect((zh.aviation as AssignmentSection).assignment).toBeDefined();
    });

    test('assignment section has all required keys', () => {
      const requiredKeys = [
        'title',
        'mode',
        'mode_manual',
        'mode_auto',
        'mode_description',
        'assign_to',
        'assigned_users',
        'no_users_assigned',
        'assign_user',
        'remove_assignment',
        'assignment_rules',
        'max_assignments',
        'overlap_count',
        'overlap_description',
      ];

      const enAssignment = (en.aviation as AssignmentSection).assignment!;
      const zhAssignment = (zh.aviation as AssignmentSection).assignment!;

      requiredKeys.forEach(key => {
        expect(enAssignment).toHaveProperty(key);
        expect(zhAssignment).toHaveProperty(key);
        expect(enAssignment[key]).toBeTruthy();
        expect(zhAssignment[key]).toBeTruthy();
      });
    });

    test('en and zh have matching assignment keys', () => {
      const enAssignment = (en.aviation as AssignmentSection).assignment!;
      const zhAssignment = (zh.aviation as AssignmentSection).assignment!;

      const enKeys = Object.keys(enAssignment).sort();
      const zhKeys = Object.keys(zhAssignment).sort();
      expect(enKeys).toEqual(zhKeys);
    });

    test('no empty values in assignment section', () => {
      const enAssignment = (en.aviation as AssignmentSection).assignment!;
      const zhAssignment = (zh.aviation as AssignmentSection).assignment!;

      Object.values(enAssignment).forEach(value => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });

      Object.values(zhAssignment).forEach(value => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Assignment mode consistency', () => {
    test('mode options follow consistent naming pattern', () => {
      const enAssignment = (en.aviation as AssignmentSection).assignment!;
      const zhAssignment = (zh.aviation as AssignmentSection).assignment!;

      // mode_manual and mode_auto should follow "mode_*" pattern
      expect(enAssignment.mode_manual).toBeDefined();
      expect(enAssignment.mode_auto).toBeDefined();
      expect(zhAssignment.mode_manual).toBeDefined();
      expect(zhAssignment.mode_auto).toBeDefined();
    });

    test('mode descriptions provide context', () => {
      const enAssignment = (en.aviation as AssignmentSection).assignment!;
      const description = enAssignment.mode_description;
      expect(description.length).toBeGreaterThan(20); // Should be descriptive
      expect(description.toLowerCase()).toContain('assign'); // Should mention assignment
    });
  });

  describe('User assignment labels', () => {
    test('user assignment keys are action-oriented', () => {
      const enAssignment = (en.aviation as AssignmentSection).assignment!;
      const actionKeys = [
        'assign_user',
        'remove_assignment',
        'assigned_users',
      ];

      actionKeys.forEach(key => {
        expect(enAssignment[key]).toBeDefined();
        // Action labels should be concise
        expect(enAssignment[key].length).toBeLessThan(50);
      });
    });

    test('empty state message is user-friendly', () => {
      const enAssignment = (en.aviation as AssignmentSection).assignment!;
      const emptyMessage = enAssignment.no_users_assigned;
      expect(emptyMessage).toBeDefined();
      expect(emptyMessage.toLowerCase()).toContain('no');
    });
  });

  describe('Settings labels', () => {
    test('settings keys have corresponding descriptions', () => {
      const enAssignment = (en.aviation as AssignmentSection).assignment!;
      expect(enAssignment.overlap_count).toBeDefined();
      expect(enAssignment.overlap_description).toBeDefined();
    });

    test('numeric settings have clear labels', () => {
      const enAssignment = (en.aviation as AssignmentSection).assignment!;
      const numericSettings = [
        'max_assignments',
        'overlap_count',
      ];

      numericSettings.forEach(key => {
        const label = enAssignment[key];
        expect(label).toBeDefined();
        expect(label.length).toBeGreaterThan(3);
      });
    });
  });

  describe('Integration validation', () => {
    test('assignment section exists as a separate namespace', () => {
      // Note: Keys with the same name in different sections are valid since
      // they are in different namespaces (e.g., assignment.title vs review.title)
      const enAssignment = (en.aviation as AssignmentSection).assignment!;
      const assignmentKeys = Object.keys(enAssignment);

      // Verify assignment section has its own unique keys
      expect(assignmentKeys.length).toBeGreaterThan(10);

      // Verify no duplicate keys within assignment section itself
      const uniqueKeys = new Set(assignmentKeys);
      expect(uniqueKeys.size).toBe(assignmentKeys.length);
    });

    test('assignment section is semantically grouped', () => {
      const enAssignment = (en.aviation as AssignmentSection).assignment!;
      const keys = Object.keys(enAssignment);

      // Should have mode-related keys
      const modeKeys = keys.filter(k => k.includes('mode'));
      expect(modeKeys.length).toBeGreaterThan(1);

      // Should have user-related keys
      const userKeys = keys.filter(k => k.includes('user') || k.includes('assign'));
      expect(userKeys.length).toBeGreaterThan(3);
    });
  });

  describe('Assignment section validation', () => {
    test('assignment section passes validation utility', () => {
      const enAssignment = (en.aviation as AssignmentSection).assignment!;
      expect(validateTranslationSection(enAssignment, 'assignment')).toEqual([]);
    });

    test('assignment interpolation variables match between en and zh', () => {
      const enAssignment = (en.aviation as AssignmentSection).assignment!;
      const zhAssignment = (zh.aviation as AssignmentSection).assignment!;

      Object.keys(enAssignment).forEach(key => {
        const result = validateMatchingInterpolation(enAssignment[key], zhAssignment[key]);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Cumulative validation - All phases', () => {
    test('all required aviation sections exist', () => {
      const requiredSections = [
        'common',
        'status',
        'navigation',
        'toolbar',
        'event',
        'error',           // Phase 2 (extended)
        'read_only',       // Phase 2
        'review',          // Phase 1
        'feedback_modal',  // Phase 1
        'assignment',      // Phase 3
      ];

      requiredSections.forEach(section => {
        expect(en.aviation).toHaveProperty(section);
        expect(zh.aviation).toHaveProperty(section);
      });
    });

    test('total key count matches expected', () => {
      // This ensures we haven't accidentally removed keys
      const countKeys = (obj: Record<string, unknown>): number => {
        let count = 0;
        Object.values(obj).forEach(value => {
          if (typeof value === 'string') {
            count++;
          } else if (typeof value === 'object' && value !== null) {
            count += countKeys(value as Record<string, unknown>);
          }
        });
        return count;
      };

      const enCount = countKeys(en.aviation as Record<string, unknown>);
      const zhCount = countKeys(zh.aviation as Record<string, unknown>);

      expect(enCount).toBeGreaterThan(100); // Sanity check
      expect(enCount).toEqual(zhCount);
    });
  });
});

// Type extension for Phase 4 sections (i18n integration)
type Phase4Section = AviationTranslations & {
  feedback?: {
    type?: Record<string, string>;
    form?: Record<string, string>;
  };
  review?: {
    tooltip?: Record<string, string>;
    history?: Record<string, string>;
    badge?: Record<string, string>;
    revision?: Record<string, string>;
    [key: string]: string | Record<string, string> | undefined;
  };
};

describe('Aviation i18n - Phase 4: Full i18n Integration', () => {
  describe('Feedback section', () => {
    test('feedback.type section exists in both locales with all 6 keys', () => {
      const enFeedback = (en.aviation as Phase4Section).feedback;
      const zhFeedback = (zh.aviation as Phase4Section).feedback;

      expect(enFeedback).toBeDefined();
      expect(zhFeedback).toBeDefined();
      expect(enFeedback?.type).toBeDefined();
      expect(zhFeedback?.type).toBeDefined();

      const requiredKeys = [
        'partial',
        'full',
        'revision',
        'partial_desc',
        'full_desc',
        'revision_desc',
      ];

      requiredKeys.forEach(key => {
        expect(enFeedback?.type).toHaveProperty(key);
        expect(zhFeedback?.type).toHaveProperty(key);
        expect(enFeedback?.type?.[key]).toBeTruthy();
        expect(zhFeedback?.type?.[key]).toBeTruthy();
      });
    });

    test('feedback.form section exists in both locales with all 10 keys', () => {
      const enFeedback = (en.aviation as Phase4Section).feedback;
      const zhFeedback = (zh.aviation as Phase4Section).feedback;

      expect(enFeedback?.form).toBeDefined();
      expect(zhFeedback?.form).toBeDefined();

      const requiredKeys = [
        'title',
        'type_label',
        'type_placeholder',
        'comment_label',
        'comment_placeholder',
        'comment_hint',
        'required_type',
        'required_comment',
        'min_length_comment',
        'submit',
      ];

      requiredKeys.forEach(key => {
        expect(enFeedback?.form).toHaveProperty(key);
        expect(zhFeedback?.form).toHaveProperty(key);
        expect(enFeedback?.form?.[key]).toBeTruthy();
        expect(zhFeedback?.form?.[key]).toBeTruthy();
      });
    });

    test('en and zh have matching feedback keys', () => {
      const enFeedback = (en.aviation as Phase4Section).feedback!;
      const zhFeedback = (zh.aviation as Phase4Section).feedback!;

      const enTypeKeys = Object.keys(enFeedback.type!).sort();
      const zhTypeKeys = Object.keys(zhFeedback.type!).sort();
      expect(enTypeKeys).toEqual(zhTypeKeys);

      const enFormKeys = Object.keys(enFeedback.form!).sort();
      const zhFormKeys = Object.keys(zhFeedback.form!).sort();
      expect(enFormKeys).toEqual(zhFormKeys);
    });
  });

  describe('Review tooltip section', () => {
    test('review.tooltip section exists in both locales with all 9 keys', () => {
      const enReview = (en.aviation as Phase4Section).review;
      const zhReview = (zh.aviation as Phase4Section).review;

      expect(enReview?.tooltip).toBeDefined();
      expect(zhReview?.tooltip).toBeDefined();

      const requiredKeys = [
        'approve_title',
        'reject_title',
        'revision_title',
        'remove_status',
        'rejection_comment',
        'revision_comment',
        'optional',
        'explain_rejection',
        'explain_revision',
      ];

      requiredKeys.forEach(key => {
        expect(enReview?.tooltip).toHaveProperty(key);
        expect(zhReview?.tooltip).toHaveProperty(key);
        expect(enReview?.tooltip?.[key]).toBeTruthy();
        expect(zhReview?.tooltip?.[key]).toBeTruthy();
      });
    });
  });

  describe('Review history section', () => {
    test('review.history section exists in both locales with all 8 keys', () => {
      const enReview = (en.aviation as Phase4Section).review;
      const zhReview = (zh.aviation as Phase4Section).review;

      expect(enReview?.history).toBeDefined();
      expect(zhReview?.history).toBeDefined();

      const requiredKeys = [
        'title',
        'no_history',
        'loading',
        'decision_count',
        'partially_rejected',
        'fully_rejected',
        'reviewer',
        'requested',
      ];

      requiredKeys.forEach(key => {
        expect(enReview?.history).toHaveProperty(key);
        expect(zhReview?.history).toHaveProperty(key);
        expect(enReview?.history?.[key]).toBeTruthy();
        expect(zhReview?.history?.[key]).toBeTruthy();
      });
    });

    test('decision_count has valid interpolation', () => {
      const enReview = (en.aviation as Phase4Section).review;
      const zhReview = (zh.aviation as Phase4Section).review;

      const interpolationPattern = /\{\{count\}\}/;
      expect(enReview?.history?.decision_count).toMatch(interpolationPattern);
      expect(zhReview?.history?.decision_count).toMatch(interpolationPattern);
    });
  });

  describe('Review badge section', () => {
    test('review.badge section exists in both locales with all 4 keys', () => {
      const enReview = (en.aviation as Phase4Section).review;
      const zhReview = (zh.aviation as Phase4Section).review;

      expect(enReview?.badge).toBeDefined();
      expect(zhReview?.badge).toBeDefined();

      const requiredKeys = [
        'needs_revision',
        'reviewer',
        'requested',
        'mark_resolved',
      ];

      requiredKeys.forEach(key => {
        expect(enReview?.badge).toHaveProperty(key);
        expect(zhReview?.badge).toHaveProperty(key);
        expect(enReview?.badge?.[key]).toBeTruthy();
        expect(zhReview?.badge?.[key]).toBeTruthy();
      });
    });
  });

  describe('Review revision section', () => {
    test('review.revision section exists in both locales with all 3 keys', () => {
      const enReview = (en.aviation as Phase4Section).review;
      const zhReview = (zh.aviation as Phase4Section).review;

      expect(enReview?.revision).toBeDefined();
      expect(zhReview?.revision).toBeDefined();

      const requiredKeys = [
        'title',
        'mark_resolved',
        'resolve_hint',
      ];

      requiredKeys.forEach(key => {
        expect(enReview?.revision).toHaveProperty(key);
        expect(zhReview?.revision).toHaveProperty(key);
        expect(enReview?.revision?.[key]).toBeTruthy();
        expect(zhReview?.revision?.[key]).toBeTruthy();
      });
    });
  });

  describe('All new sections key matching', () => {
    test('en and zh have matching review.tooltip keys', () => {
      const enTooltip = (en.aviation as Phase4Section).review?.tooltip!;
      const zhTooltip = (zh.aviation as Phase4Section).review?.tooltip!;

      const enKeys = Object.keys(enTooltip).sort();
      const zhKeys = Object.keys(zhTooltip).sort();
      expect(enKeys).toEqual(zhKeys);
    });

    test('en and zh have matching review.history keys', () => {
      const enHistory = (en.aviation as Phase4Section).review?.history!;
      const zhHistory = (zh.aviation as Phase4Section).review?.history!;

      const enKeys = Object.keys(enHistory).sort();
      const zhKeys = Object.keys(zhHistory).sort();
      expect(enKeys).toEqual(zhKeys);
    });

    test('en and zh have matching review.badge keys', () => {
      const enBadge = (en.aviation as Phase4Section).review?.badge!;
      const zhBadge = (zh.aviation as Phase4Section).review?.badge!;

      const enKeys = Object.keys(enBadge).sort();
      const zhKeys = Object.keys(zhBadge).sort();
      expect(enKeys).toEqual(zhKeys);
    });

    test('en and zh have matching review.revision keys', () => {
      const enRevision = (en.aviation as Phase4Section).review?.revision!;
      const zhRevision = (zh.aviation as Phase4Section).review?.revision!;

      const enKeys = Object.keys(enRevision).sort();
      const zhKeys = Object.keys(zhRevision).sort();
      expect(enKeys).toEqual(zhKeys);
    });
  });

  describe('No empty values in new sections', () => {
    test('no empty values in feedback section', () => {
      const enFeedback = (en.aviation as Phase4Section).feedback!;
      const zhFeedback = (zh.aviation as Phase4Section).feedback!;

      Object.values(enFeedback.type!).forEach(value => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });

      Object.values(enFeedback.form!).forEach(value => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });

      Object.values(zhFeedback.type!).forEach(value => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });

      Object.values(zhFeedback.form!).forEach(value => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    test('no empty values in review nested sections', () => {
      const enReview = (en.aviation as Phase4Section).review!;
      const zhReview = (zh.aviation as Phase4Section).review!;

      const nestedSections = ['tooltip', 'history', 'badge', 'revision'] as const;

      nestedSections.forEach(section => {
        const enSection = enReview[section] as Record<string, string>;
        const zhSection = zhReview[section] as Record<string, string>;

        Object.values(enSection).forEach(value => {
          expect(value).toBeTruthy();
          expect(typeof value).toBe('string');
          expect(value.length).toBeGreaterThan(0);
        });

        Object.values(zhSection).forEach(value => {
          expect(value).toBeTruthy();
          expect(typeof value).toBe('string');
          expect(value.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Interpolation validation for new sections', () => {
    test('review.history interpolation variables match between en and zh', () => {
      const enHistory = (en.aviation as Phase4Section).review?.history!;
      const zhHistory = (zh.aviation as Phase4Section).review?.history!;

      Object.keys(enHistory).forEach(key => {
        const result = validateMatchingInterpolation(enHistory[key], zhHistory[key]);
        expect(result.isValid).toBe(true);
      });
    });

    test('feedback.form section passes validation', () => {
      const enForm = (en.aviation as Phase4Section).feedback?.form!;
      expect(validateTranslationSection(enForm, 'feedback.form')).toEqual([]);
    });

    test('review nested sections pass validation', () => {
      const enReview = (en.aviation as Phase4Section).review!;
      const nestedSections = ['tooltip', 'history', 'badge', 'revision'] as const;

      nestedSections.forEach(section => {
        const sectionData = enReview[section] as Record<string, string>;
        expect(validateTranslationSection(sectionData, `review.${section}`)).toEqual([]);
      });
    });
  });

  describe('Updated total key count', () => {
    test('total key count includes new Phase 4 keys', () => {
      const countKeys = (obj: Record<string, unknown>): number => {
        let count = 0;
        Object.values(obj).forEach(value => {
          if (typeof value === 'string') {
            count++;
          } else if (typeof value === 'object' && value !== null) {
            count += countKeys(value as Record<string, unknown>);
          }
        });
        return count;
      };

      const enCount = countKeys(en.aviation as Record<string, unknown>);
      const zhCount = countKeys(zh.aviation as Record<string, unknown>);

      // Phase 4 adds approximately 40 new keys
      // feedback.type: 6 keys
      // feedback.form: 10 keys
      // review.tooltip: 9 keys
      // review.history: 8 keys
      // review.badge: 4 keys
      // review.revision: 3 keys
      // Total: ~40 new keys
      expect(enCount).toBeGreaterThan(140);
      expect(enCount).toEqual(zhCount);
    });
  });
});
