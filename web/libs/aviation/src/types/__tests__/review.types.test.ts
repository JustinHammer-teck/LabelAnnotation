/**
 * Tests for ReviewableFieldName type extension.
 * Validates that all required field names are included in the type for
 * threat, error, UAS, event panel, and result performance fields.
 *
 * @module types/__tests__/review.types.test
 */
import type { ReviewableFieldName } from '../review.types';

describe('ReviewableFieldName type', () => {
  describe('Existing threat fields', () => {
    it('should include threat_type_l1 field', () => {
      const field: ReviewableFieldName = 'threat_type_l1';
      expect(field).toBe('threat_type_l1');
    });

    it('should include threat_type_l2 field', () => {
      const field: ReviewableFieldName = 'threat_type_l2';
      expect(field).toBe('threat_type_l2');
    });

    it('should include threat_type_l3 field', () => {
      const field: ReviewableFieldName = 'threat_type_l3';
      expect(field).toBe('threat_type_l3');
    });

    it('should include threat_management field', () => {
      const field: ReviewableFieldName = 'threat_management';
      expect(field).toBe('threat_management');
    });

    it('should include threat_impact field', () => {
      const field: ReviewableFieldName = 'threat_impact';
      expect(field).toBe('threat_impact');
    });

    it('should include threat_coping_abilities field', () => {
      const field: ReviewableFieldName = 'threat_coping_abilities';
      expect(field).toBe('threat_coping_abilities');
    });

    it('should include threat_description field', () => {
      const field: ReviewableFieldName = 'threat_description';
      expect(field).toBe('threat_description');
    });
  });

  describe('Existing error fields', () => {
    it('should include error_type_l1 field', () => {
      const field: ReviewableFieldName = 'error_type_l1';
      expect(field).toBe('error_type_l1');
    });

    it('should include error_type_l2 field', () => {
      const field: ReviewableFieldName = 'error_type_l2';
      expect(field).toBe('error_type_l2');
    });

    it('should include error_type_l3 field', () => {
      const field: ReviewableFieldName = 'error_type_l3';
      expect(field).toBe('error_type_l3');
    });

    it('should include error_relevance field', () => {
      const field: ReviewableFieldName = 'error_relevance';
      expect(field).toBe('error_relevance');
    });

    it('should include error_management field', () => {
      const field: ReviewableFieldName = 'error_management';
      expect(field).toBe('error_management');
    });

    it('should include error_impact field', () => {
      const field: ReviewableFieldName = 'error_impact';
      expect(field).toBe('error_impact');
    });

    it('should include error_coping_abilities field', () => {
      const field: ReviewableFieldName = 'error_coping_abilities';
      expect(field).toBe('error_coping_abilities');
    });

    it('should include error_description field', () => {
      const field: ReviewableFieldName = 'error_description';
      expect(field).toBe('error_description');
    });
  });

  describe('Existing UAS fields', () => {
    it('should include uas_type_l1 field', () => {
      const field: ReviewableFieldName = 'uas_type_l1';
      expect(field).toBe('uas_type_l1');
    });

    it('should include uas_type_l2 field', () => {
      const field: ReviewableFieldName = 'uas_type_l2';
      expect(field).toBe('uas_type_l2');
    });

    it('should include uas_type_l3 field', () => {
      const field: ReviewableFieldName = 'uas_type_l3';
      expect(field).toBe('uas_type_l3');
    });

    it('should include uas_relevance field', () => {
      const field: ReviewableFieldName = 'uas_relevance';
      expect(field).toBe('uas_relevance');
    });

    it('should include uas_management field', () => {
      const field: ReviewableFieldName = 'uas_management';
      expect(field).toBe('uas_management');
    });

    it('should include uas_impact field', () => {
      const field: ReviewableFieldName = 'uas_impact';
      expect(field).toBe('uas_impact');
    });

    it('should include uas_coping_abilities field', () => {
      const field: ReviewableFieldName = 'uas_coping_abilities';
      expect(field).toBe('uas_coping_abilities');
    });

    it('should include uas_description field', () => {
      const field: ReviewableFieldName = 'uas_description';
      expect(field).toBe('uas_description');
    });
  });

  describe('Event panel fields', () => {
    it('should include event_description field', () => {
      const field: ReviewableFieldName = 'event_description';
      expect(field).toBe('event_description');
    });

    it('should include event_date field', () => {
      const field: ReviewableFieldName = 'event_date';
      expect(field).toBe('event_date');
    });

    it('should include event_time field', () => {
      const field: ReviewableFieldName = 'event_time';
      expect(field).toBe('event_time');
    });

    it('should include aircraft_type field', () => {
      const field: ReviewableFieldName = 'aircraft_type';
      expect(field).toBe('aircraft_type');
    });

    it('should include departure_airport field', () => {
      const field: ReviewableFieldName = 'departure_airport';
      expect(field).toBe('departure_airport');
    });

    it('should include arrival_airport field', () => {
      const field: ReviewableFieldName = 'arrival_airport';
      expect(field).toBe('arrival_airport');
    });

    it('should include actual_landing_airport field', () => {
      const field: ReviewableFieldName = 'actual_landing_airport';
      expect(field).toBe('actual_landing_airport');
    });

    it('should include event_remarks field', () => {
      const field: ReviewableFieldName = 'event_remarks';
      expect(field).toBe('event_remarks');
    });
  });

  describe('Result performance fields', () => {
    it('should include result_event_type field', () => {
      const field: ReviewableFieldName = 'result_event_type';
      expect(field).toBe('result_event_type');
    });

    it('should include result_flight_phase field', () => {
      const field: ReviewableFieldName = 'result_flight_phase';
      expect(field).toBe('result_flight_phase');
    });

    it('should include result_likelihood field', () => {
      const field: ReviewableFieldName = 'result_likelihood';
      expect(field).toBe('result_likelihood');
    });

    it('should include result_severity field', () => {
      const field: ReviewableFieldName = 'result_severity';
      expect(field).toBe('result_severity');
    });

    it('should include result_training_effect field', () => {
      const field: ReviewableFieldName = 'result_training_effect';
      expect(field).toBe('result_training_effect');
    });

    it('should include result_training_plan field', () => {
      const field: ReviewableFieldName = 'result_training_plan';
      expect(field).toBe('result_training_plan');
    });

    it('should include result_training_topics field', () => {
      const field: ReviewableFieldName = 'result_training_topics';
      expect(field).toBe('result_training_topics');
    });

    it('should include result_objectives field', () => {
      const field: ReviewableFieldName = 'result_objectives';
      expect(field).toBe('result_objectives');
    });
  });
});
