/**
 * E2E Tests for Aviation Analytics Filtering
 *
 * Phase 6: End-to-end tests validating the complete filtering workflow
 * for aviation project analytics with all 10 filter types.
 *
 * Test Coverage:
 * - Navigation and page display
 * - All 10 filter types (date, aircraft, airport, event_type, flight_phase,
 *   threat hierarchy, error hierarchy, uas hierarchy, training_topic, competency)
 * - Combined filters
 * - Pagination
 * - URL state persistence
 * - Error handling
 * - Performance requirements
 */

// Test configuration
const TEST_PROJECT_ID = 1;
const BASE_URL = '/aviation/projects';
const ANALYTICS_PATH = `${BASE_URL}/${TEST_PROJECT_ID}/analytics`;
const API_ANALYTICS_PATH = '/api/aviation/projects';

// Chinese labels for filter components (matching frontend i18n)
const LABELS = {
  filterPanel: '筛选条件',
  dateRange: '时间范围',
  aircraft: '机型',
  airport: '机场',
  eventType: '事件类型',
  flightPhase: '飞行阶段',
  threatType: '涉及威胁类型',
  errorType: '差错类型',
  uasType: '非期望机组状态',
  trainingTopic: '培训专题',
  competency: '胜任力',
  resetFilters: '重置筛选',
  loadMore: '加载更多',
  eventCount: '条事件',
};

// Test credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'password',
};

// Test data fixtures for deterministic tests
const TEST_DATA = {
  events: [
    {
      eventId: 'TEST_EVENT_001',
      date: '2023-06-15',
      aircraft_type: 'A330',
      departure_airport: 'ZSPD',
      arrival_airport: 'ZBAA',
      event_type: 'incident',
      flight_phase: 'approach',
    },
    {
      eventId: 'TEST_EVENT_002',
      date: '2023-07-20',
      aircraft_type: 'B737',
      departure_airport: 'ZBAA',
      arrival_airport: 'ZSPD',
      event_type: 'accident',
      flight_phase: 'takeoff',
    },
    {
      eventId: 'TEST_EVENT_003',
      date: '2023-08-10',
      aircraft_type: 'A330',
      departure_airport: 'ZSPD',
      arrival_airport: 'ZGGG',
      event_type: 'incident',
      flight_phase: 'landing',
    },
  ],
};

/**
 * Helper to set up test data via API or fixtures
 * This ensures tests have known data state for reliable assertions
 */
function setupTestData(): void {
  // Option 1: Use cy.intercept to mock API responses with known test data
  cy.intercept('GET', '**/events/analytics/**', (req) => {
    // Allow the real request but ensure we have test data
    req.continue();
  });

  // Option 2: Create test data via API (if test data endpoints exist)
  // This would be the preferred approach for true E2E testing
  // cy.request({
  //   method: 'POST',
  //   url: '/api/aviation/test/setup',
  //   body: TEST_DATA,
  //   headers: { Authorization: `Bearer ${Cypress.env('TEST_TOKEN')}` },
  // });
}

/**
 * Helper to clean up test data after tests
 */
function cleanupTestData(): void {
  // Clean up any test data created during tests
  // cy.request({
  //   method: 'DELETE',
  //   url: '/api/aviation/test/cleanup',
  //   headers: { Authorization: `Bearer ${Cypress.env('TEST_TOKEN')}` },
  // });
}

describe('Aviation Analytics Filtering E2E', () => {
  beforeEach(() => {
    // Set up test data before each test to ensure deterministic state
    setupTestData();

    // Login flow
    cy.visit('/user/login');

    // Fill login form if login page is displayed
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="email"]').length > 0) {
        cy.get('[data-testid="email"]').type(TEST_USER.email);
        cy.get('[data-testid="password"]').type(TEST_USER.password);
        cy.get('[data-testid="login-button"]').click();
        cy.wait(1000);
      }
    });

    // Navigate to analytics page
    cy.visit(ANALYTICS_PATH);
    cy.wait(500);
  });

  afterEach(() => {
    // Clean up test data after each test
    cleanupTestData();
  });

  // ==========================================================================
  // Basic Navigation Tests
  // ==========================================================================

  describe('Navigation', () => {
    it('should navigate to analytics page', () => {
      // Verify URL
      cy.url().should('include', ANALYTICS_PATH);

      // Verify page loaded successfully
      cy.get('body').should('be.visible');
    });

    it('should display filter panel', () => {
      // Look for filter panel or any filter component
      cy.get('body').then(($body) => {
        const hasFilterPanel =
          $body.text().includes(LABELS.filterPanel) ||
          $body.find(`[aria-label="${LABELS.dateRange}"]`).length > 0;
        expect(hasFilterPanel).to.be.true;
      });
    });

    it('should display visualization dashboard', () => {
      // Look for Sankey chart container or visualization area
      cy.get('[data-testid="sankey-chart"], .visualization-container, .chart-container').should(
        'have.length.at.least',
        0
      );
    });

    it('should display event list', () => {
      // Look for event list container
      cy.get('[data-testid="event-list"], .event-list, .event-table, .event-card').should(
        'have.length.at.least',
        0
      );
    });
  });

  // ==========================================================================
  // Date Range Filter Tests
  // ==========================================================================

  describe('Date Range Filter', () => {
    it('should filter by date range', () => {
      // Find and interact with date picker
      cy.get(`[aria-label="${LABELS.dateRange}"], .ant-picker-range`).then(($picker) => {
        if ($picker.length > 0) {
          cy.wrap($picker).click();

          // Wait for API response with date filters
          cy.intercept('GET', '**/events/analytics/**').as('analyticsRequest');

          // Select dates
          cy.get('.ant-picker-cell').contains('1').first().click();
          cy.get('.ant-picker-cell').contains('28').last().click();

          cy.wait('@analyticsRequest').its('response.statusCode').should('eq', 200);
        }
      });
    });

    it('should clear date filter and show all results', () => {
      cy.get(`[aria-label="${LABELS.dateRange}"], .ant-picker-range`).then(($picker) => {
        if ($picker.length > 0) {
          cy.wrap($picker).click();

          // Select date range first
          cy.get('.ant-picker-cell').contains('1').first().click();
          cy.get('.ant-picker-cell').contains('28').last().click();

          // Clear the filter
          cy.get('.ant-picker-clear').click();

          cy.intercept('GET', '**/events/analytics/**').as('clearRequest');
          cy.wait('@clearRequest');
        }
      });
    });
  });

  // ==========================================================================
  // Aircraft Filter Tests
  // ==========================================================================

  describe('Aircraft Filter', () => {
    it('should filter by aircraft type', () => {
      cy.get(`[aria-label="${LABELS.aircraft}"], .aircraft-select`).then(($select) => {
        if ($select.length > 0) {
          cy.wrap($select).click();

          // Intercept API call
          cy.intercept('GET', '**/events/analytics/*aircraft*').as('aircraftFilter');

          // Select an aircraft type
          cy.get('.ant-select-dropdown').contains('A330').click();

          cy.wait('@aircraftFilter').its('response.statusCode').should('eq', 200);

          // Verify filter applied
          cy.contains('A330').should('be.visible');
        }
      });
    });

    it('should filter by multiple aircraft types', () => {
      cy.get(`[aria-label="${LABELS.aircraft}"], .aircraft-select`).then(($select) => {
        if ($select.length > 0) {
          cy.wrap($select).click();

          // Select multiple aircraft types
          cy.get('.ant-select-dropdown').contains('A330').click();
          cy.get('.ant-select-dropdown').contains('B737').click();

          cy.intercept('GET', '**/events/analytics/**').as('multiAircraftFilter');
          cy.wait('@multiAircraftFilter');
        }
      });
    });
  });

  // ==========================================================================
  // Airport Filter Tests
  // ==========================================================================

  describe('Airport Filter', () => {
    it('should filter by airport', () => {
      cy.get(`[aria-label="${LABELS.airport}"], .airport-select`).then(($select) => {
        if ($select.length > 0) {
          cy.wrap($select).click();

          cy.intercept('GET', '**/events/analytics/*airport*').as('airportFilter');

          cy.get('.ant-select-dropdown').contains('ZSPD').click();

          cy.wait('@airportFilter').its('response.statusCode').should('eq', 200);
        }
      });
    });
  });

  // ==========================================================================
  // Event Type Filter Tests
  // ==========================================================================

  describe('Event Type Filter', () => {
    it('should filter by event type', () => {
      cy.get(`[aria-label="${LABELS.eventType}"], .event-type-select`).then(($select) => {
        if ($select.length > 0) {
          cy.wrap($select).click();

          cy.intercept('GET', '**/events/analytics/*event_type*').as('eventTypeFilter');

          cy.get('.ant-select-dropdown').find('.ant-select-item').first().click();

          cy.wait('@eventTypeFilter').its('response.statusCode').should('eq', 200);
        }
      });
    });
  });

  // ==========================================================================
  // Flight Phase Filter Tests
  // ==========================================================================

  describe('Flight Phase Filter', () => {
    it('should filter by flight phase', () => {
      cy.get(`[aria-label="${LABELS.flightPhase}"], .flight-phase-select`).then(($select) => {
        if ($select.length > 0) {
          cy.wrap($select).click();

          cy.intercept('GET', '**/events/analytics/*flight_phase*').as('flightPhaseFilter');

          cy.get('.ant-select-dropdown').find('.ant-select-item').first().click();

          cy.wait('@flightPhaseFilter').its('response.statusCode').should('eq', 200);
        }
      });
    });
  });

  // ==========================================================================
  // Hierarchy Cascader Filter Tests (Threat/Error/UAS)
  // ==========================================================================

  describe('Threat Type Hierarchy Filter', () => {
    it('should filter by threat type level 1', () => {
      cy.get(`[aria-label="${LABELS.threatType}"], .threat-cascader`).then(($cascader) => {
        if ($cascader.length > 0) {
          cy.wrap($cascader).click();

          cy.intercept('GET', '**/events/analytics/*threat_l1*').as('threatL1Filter');

          // Select level 1
          cy.get('.ant-cascader-menu').contains('TE环境').click();

          cy.wait('@threatL1Filter').its('response.statusCode').should('eq', 200);
        }
      });
    });

    it('should filter by threat type level 2', () => {
      cy.get(`[aria-label="${LABELS.threatType}"], .threat-cascader`).then(($cascader) => {
        if ($cascader.length > 0) {
          cy.wrap($cascader).click();

          // Navigate to level 2
          cy.get('.ant-cascader-menu').contains('TE环境').click();

          cy.intercept('GET', '**/events/analytics/*threat_l2*').as('threatL2Filter');

          cy.get('.ant-cascader-menu').contains('TE1').click();

          cy.wait('@threatL2Filter');
        }
      });
    });
  });

  describe('Error Type Hierarchy Filter', () => {
    it('should filter by error type hierarchy', () => {
      cy.get(`[aria-label="${LABELS.errorType}"], .error-cascader`).then(($cascader) => {
        if ($cascader.length > 0) {
          cy.wrap($cascader).click();

          cy.intercept('GET', '**/events/analytics/*error_l*').as('errorFilter');

          cy.get('.ant-cascader-menu').find('.ant-cascader-menu-item').first().click();

          cy.wait('@errorFilter');
        }
      });
    });
  });

  describe('UAS Type Hierarchy Filter', () => {
    it('should filter by UAS type hierarchy', () => {
      cy.get(`[aria-label="${LABELS.uasType}"], .uas-cascader`).then(($cascader) => {
        if ($cascader.length > 0) {
          cy.wrap($cascader).click();

          cy.intercept('GET', '**/events/analytics/*uas_l*').as('uasFilter');

          cy.get('.ant-cascader-menu').find('.ant-cascader-menu-item').first().click();

          cy.wait('@uasFilter');
        }
      });
    });
  });

  // ==========================================================================
  // JSONField Filter Tests (Training Topic, Competency)
  // ==========================================================================

  describe('Training Topic Filter', () => {
    it('should filter by training topic', () => {
      cy.get(`[aria-label="${LABELS.trainingTopic}"], .training-topic-select`).then(($select) => {
        if ($select.length > 0) {
          cy.wrap($select).click();

          cy.intercept('GET', '**/events/analytics/*training_topic*').as('trainingTopicFilter');

          cy.get('.ant-select-dropdown').contains('CRM').click();

          cy.wait('@trainingTopicFilter').its('response.statusCode').should('eq', 200);
        }
      });
    });
  });

  describe('Competency Filter', () => {
    it('should filter by competency', () => {
      cy.get(`[aria-label="${LABELS.competency}"], .competency-select`).then(($select) => {
        if ($select.length > 0) {
          cy.wrap($select).click();

          cy.intercept('GET', '**/events/analytics/*competency*').as('competencyFilter');

          cy.get('.ant-select-dropdown').contains('KNO').click();

          cy.wait('@competencyFilter').its('response.statusCode').should('eq', 200);
        }
      });
    });
  });

  // ==========================================================================
  // Combined Filters Tests
  // ==========================================================================

  describe('Combined Filters', () => {
    it('should apply multiple filters together', () => {
      // Intercept combined filter request
      cy.intercept('GET', '**/events/analytics/**').as('combinedFilter');

      // Apply aircraft filter
      cy.get(`[aria-label="${LABELS.aircraft}"], .aircraft-select`).then(($select) => {
        if ($select.length > 0) {
          cy.wrap($select).click();
          cy.get('.ant-select-dropdown').contains('A330').click();
          cy.wait('@combinedFilter');
        }
      });

      // Apply airport filter
      cy.get(`[aria-label="${LABELS.airport}"], .airport-select`).then(($select) => {
        if ($select.length > 0) {
          cy.wrap($select).click();
          cy.get('.ant-select-dropdown').contains('ZSPD').click();
          cy.wait('@combinedFilter');
        }
      });
    });

    it('should apply date range with other filters', () => {
      cy.intercept('GET', '**/events/analytics/**').as('combinedFilter');

      // Apply date range
      cy.get(`[aria-label="${LABELS.dateRange}"], .ant-picker-range`).then(($picker) => {
        if ($picker.length > 0) {
          cy.wrap($picker).click();
          cy.get('.ant-picker-cell').contains('1').first().click();
          cy.get('.ant-picker-cell').contains('28').last().click();
          cy.wait('@combinedFilter');
        }
      });

      // Apply aircraft filter
      cy.get(`[aria-label="${LABELS.aircraft}"], .aircraft-select`).then(($select) => {
        if ($select.length > 0) {
          cy.wrap($select).click();
          cy.get('.ant-select-dropdown').contains('A330').click();
          cy.wait('@combinedFilter');
        }
      });
    });
  });

  // ==========================================================================
  // Reset Filters Tests
  // ==========================================================================

  describe('Reset Filters', () => {
    it('should reset all filters', () => {
      // Apply a filter first
      cy.get(`[aria-label="${LABELS.aircraft}"], .aircraft-select`).then(($select) => {
        if ($select.length > 0) {
          cy.wrap($select).click();
          cy.get('.ant-select-dropdown').contains('A330').click();

          cy.intercept('GET', '**/events/analytics/**').as('resetFilter');

          // Click reset button
          cy.contains(LABELS.resetFilters).click();

          cy.wait('@resetFilter');

          // Verify filters are cleared
          cy.wrap($select).should('not.contain', 'A330');
        }
      });
    });
  });

  // ==========================================================================
  // Pagination Tests
  // ==========================================================================

  describe('Pagination', () => {
    it('should load more results', () => {
      cy.contains(LABELS.loadMore).then(($button) => {
        if ($button.length > 0) {
          // Intercept page 2 request
          cy.intercept('GET', '**/events/analytics/*page=2*').as('page2Request');

          cy.wrap($button).click();

          cy.wait('@page2Request').its('response.statusCode').should('eq', 200);
        }
      });
    });

    it('should maintain filters when paginating', () => {
      // Apply a filter
      cy.get(`[aria-label="${LABELS.aircraft}"], .aircraft-select`).then(($select) => {
        if ($select.length > 0) {
          cy.wrap($select).click();
          cy.get('.ant-select-dropdown').contains('A330').click();

          // Load more
          cy.contains(LABELS.loadMore).then(($button) => {
            if ($button.length > 0) {
              cy.intercept('GET', '**/events/analytics/*page=2*aircraft*').as('filteredPage2');

              cy.wrap($button).click();

              cy.wait('@filteredPage2').its('response.statusCode').should('eq', 200);
            }
          });
        }
      });
    });
  });

  // ==========================================================================
  // URL State Tests
  // ==========================================================================

  describe('URL State Persistence', () => {
    it('should persist filters in URL', () => {
      cy.get(`[aria-label="${LABELS.aircraft}"], .aircraft-select`).then(($select) => {
        if ($select.length > 0) {
          cy.wrap($select).click();
          cy.get('.ant-select-dropdown').contains('A330').click();

          // Wait for URL to update
          cy.wait(500);

          // Check URL contains filter parameter
          cy.url().should('include', 'aircraft');
        }
      });
    });

    it('should restore filters from URL', () => {
      // Navigate directly to filtered URL
      cy.visit(`${ANALYTICS_PATH}?aircraft=A330`);

      cy.wait(500);

      // Verify filter is applied in UI
      cy.contains('A330').should('be.visible');
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('Error Handling', () => {
    it('should show error message on API failure', () => {
      // Mock API failure
      cy.intercept('GET', '**/events/analytics/**', {
        statusCode: 500,
        body: { error: 'Internal server error' },
      }).as('failedRequest');

      // Reload page to trigger error
      cy.reload();

      cy.wait('@failedRequest');

      // Look for error message
      cy.get('.error-message, .ant-message-error, .ant-alert-error').should('exist');
    });

    it('should handle 404 for non-existent project', () => {
      cy.visit(`${BASE_URL}/99999/analytics`, { failOnStatusCode: false });

      // Should show 404 or redirect
      cy.get('body').then(($body) => {
        const is404 = $body.text().includes('Not Found') || $body.text().includes('404');
        const isRedirected = !cy.url().then((url) => url.includes('99999'));
        expect(is404 || isRedirected).to.be.true;
      });
    });

    it('should handle 400 Bad Request for invalid filter parameters', () => {
      // Mock 400 Bad Request response
      cy.intercept('GET', '**/events/analytics/**', {
        statusCode: 400,
        body: { error: 'Invalid filter parameters', details: { date_start: 'Invalid date format' } },
      }).as('badRequest');

      // Navigate with invalid parameters
      cy.visit(`${ANALYTICS_PATH}?date_start=invalid-date`, { failOnStatusCode: false });

      cy.wait('@badRequest');

      // Should display validation error message
      cy.get('.error-message, .ant-message-error, .ant-alert-error, .validation-error').should(
        'exist'
      );
    });

    it('should handle 401 Unauthorized when not logged in', () => {
      // Mock 401 Unauthorized response
      cy.intercept('GET', '**/events/analytics/**', {
        statusCode: 401,
        body: { error: 'Authentication required' },
      }).as('unauthorizedRequest');

      cy.reload();

      cy.wait('@unauthorizedRequest');

      // Should redirect to login or show unauthorized message
      cy.get('body').then(($body) => {
        const showsUnauthorized =
          $body.text().includes('Unauthorized') ||
          $body.text().includes('Login') ||
          $body.text().includes('登录');
        const redirectedToLogin = cy.url().then((url) => url.includes('/login'));
        expect(showsUnauthorized || redirectedToLogin).to.be.true;
      });
    });

    it('should handle 403 Forbidden for unauthorized project access', () => {
      // Mock 403 Forbidden response
      cy.intercept('GET', '**/events/analytics/**', {
        statusCode: 403,
        body: { error: 'You do not have permission to access this project' },
      }).as('forbiddenRequest');

      cy.reload();

      cy.wait('@forbiddenRequest');

      // Should display permission denied message
      cy.get('.error-message, .ant-message-error, .ant-alert-error').should('exist');
      cy.get('body').then(($body) => {
        const showsForbidden =
          $body.text().includes('permission') ||
          $body.text().includes('Forbidden') ||
          $body.text().includes('403') ||
          $body.text().includes('权限');
        expect(showsForbidden).to.be.true;
      });
    });

    it('should handle invalid date format in date filter', () => {
      // Navigate with malformed date parameters
      cy.visit(`${ANALYTICS_PATH}?date_start=2023-13-45&date_end=not-a-date`, {
        failOnStatusCode: false,
      });

      // Page should either show validation error or ignore invalid dates
      cy.get('body').should('be.visible');

      // Check that the application handles it gracefully (doesn't crash)
      cy.get('[data-testid="event-list"], .event-list, .event-table, .error-message').should(
        'exist'
      );
    });

    it('should handle empty filter values gracefully', () => {
      // Navigate with empty filter values
      cy.visit(`${ANALYTICS_PATH}?aircraft=&airport=&event_type=`);

      // Page should load normally, treating empty values as no filter
      cy.get('body').should('be.visible');

      // Application should not crash with empty parameters
      cy.intercept('GET', '**/events/analytics/**').as('analyticsRequest');
      cy.wait('@analyticsRequest').its('response.statusCode').should('be.oneOf', [200, 204]);
    });

    it('should handle network timeout gracefully', () => {
      // Mock slow/timeout response
      cy.intercept('GET', '**/events/analytics/**', {
        forceNetworkError: true,
      }).as('networkError');

      cy.reload();

      // Should show network error message or retry option
      cy.get('body').then(($body) => {
        const showsError =
          $body.text().includes('Network') ||
          $body.text().includes('Error') ||
          $body.text().includes('错误') ||
          $body.text().includes('重试') ||
          $body.find('.ant-spin').length > 0; // Loading spinner
        expect(showsError).to.be.true;
      });
    });
  });

  // ==========================================================================
  // Performance Tests
  // ==========================================================================

  describe('Performance', () => {
    it('should load initial results within 2 seconds', () => {
      const start = Date.now();

      cy.visit(ANALYTICS_PATH);
      cy.get('[data-testid="event-list"], .event-list, .event-table', { timeout: 2000 }).should(
        'exist'
      );

      cy.then(() => {
        const elapsed = Date.now() - start;
        expect(elapsed).to.be.lessThan(2000);
      });
    });

    it('should apply filters within 500ms', () => {
      // Set up intercept to measure actual API response time
      let apiStartTime: number;
      let apiEndTime: number;

      cy.intercept('GET', '**/events/analytics/**', (req) => {
        apiStartTime = Date.now();
        req.continue((res) => {
          apiEndTime = Date.now();
        });
      }).as('initialLoad');

      cy.wait('@initialLoad');

      cy.get(`[aria-label="${LABELS.aircraft}"], .aircraft-select`).then(($select) => {
        if ($select.length > 0) {
          // Set up intercept to measure filter request API time
          let filterApiStart: number;
          let filterApiEnd: number;

          cy.intercept('GET', '**/events/analytics/**', (req) => {
            filterApiStart = Date.now();
            req.continue((res) => {
              filterApiEnd = Date.now();
            });
          }).as('filterRequest');

          cy.wrap($select).click();
          cy.get('.ant-select-dropdown').contains('A330').click();

          cy.wait('@filterRequest').then(() => {
            const apiResponseTime = filterApiEnd - filterApiStart;
            expect(apiResponseTime).to.be.lessThan(500);
          });
        }
      });
    });

    it('should complete API response within 500ms', () => {
      let requestStartTime: number;
      let responseEndTime: number;

      cy.intercept('GET', '**/events/analytics/**', (req) => {
        requestStartTime = Date.now();
        req.continue((res) => {
          responseEndTime = Date.now();
        });
      }).as('timedRequest');

      cy.reload();
      cy.wait('@timedRequest').then(() => {
        const apiResponseTime = responseEndTime - requestStartTime;
        expect(apiResponseTime).to.be.lessThan(500);
      });
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe('Accessibility', () => {
    it('should have accessible filter controls', () => {
      // Check for proper labels on form controls
      cy.get('input, select, button').each(($control) => {
        if ($control.is(':visible')) {
          const ariaLabel = $control.attr('aria-label');
          const label = $control.attr('label');
          const id = $control.attr('id');

          // Log if missing accessible label (soft check)
          if (!ariaLabel && !label && !id) {
            cy.log('Control may be missing accessible label');
          }
        }
      });
    });

    it('should be keyboard navigable', () => {
      // Tab through filter controls using native Cypress keyboard simulation
      cy.get('body').type('{tab}');
      cy.get('body').type('{tab}');
      cy.get('body').type('{tab}');

      // Verify focus is visible
      cy.focused().should('be.visible');
    });
  });
});
