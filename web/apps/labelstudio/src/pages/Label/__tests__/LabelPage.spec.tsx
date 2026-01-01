import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the @heartex/label library
jest.mock('@heartex/label', () => ({
  DataAnalysis: jest.fn(() => (
    <div data-testid="data-analysis-mock">
      DataAnalysis Component
    </div>
  )),
}));

// Mock useUserRole hook
const mockUseUserRole = jest.fn();
jest.mock('../../../hooks/useUserRole', () => ({
  useUserRole: () => mockUseUserRole(),
}));

describe('LabelPage - Integration', () => {
  describe('Phase 5: App Integration', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Default to Manager/Researcher access
      mockUseUserRole.mockReturnValue({
        role: 'Manager',
        isManager: true,
        isResearcher: false,
        isAnnotator: false,
        isManagerOrResearcher: true,
      });
    });

    it('should render without crashing', async () => {
      const { LabelPage } = await import('../LabelPage');
      const { container } = render(<LabelPage />);
      expect(container).toBeInTheDocument();
    });

    it('should import and render DataAnalysis component', async () => {
      const { LabelPage } = await import('../LabelPage');
      render(<LabelPage />);

      const dataAnalysis = screen.getByTestId('data-analysis-mock');
      expect(dataAnalysis).toBeInTheDocument();
    });

    it('should pass labHieStru prop to DataAnalysis', async () => {
      const DataAnalysisMock = require('@heartex/label').DataAnalysis;
      const { LabelPage } = await import('../LabelPage');

      render(<LabelPage />);

      // Verify DataAnalysis was called with labHieStru prop
      expect(DataAnalysisMock).toHaveBeenCalledWith(
        expect.objectContaining({
          labHieStru: expect.any(Object),
        }),
        expect.anything()
      );
    });

    it('should have page configuration for routing', async () => {
      const { LabelPage: PageConfig } = await import('../index');

      expect(PageConfig).toBeDefined();
      expect(PageConfig.title).toBeDefined();
      expect(PageConfig.path).toBeDefined();
    });

    it('should be registered in main pages array', async () => {
      // Note: We can't dynamically import ../../index due to APP_SETTINGS dependency
      // in upstream components. Instead, we validate the static file content.
      const fs = require('fs');
      const path = require('path');

      const pagesIndexPath = path.resolve(__dirname, '../../index.js');
      const fileContent = fs.readFileSync(pagesIndexPath, 'utf-8');

      // Verify LabelPage is imported and added to Pages array
      expect(fileContent).toContain("import { LabelPage } from './Label'");
      expect(fileContent).toContain('LabelPage,');
    });

    it('should provide valid hierarchy structure', async () => {
      const DataAnalysisMock = require('@heartex/label').DataAnalysis;
      const { LabelPage } = await import('../LabelPage');

      render(<LabelPage />);

      const callArgs = DataAnalysisMock.mock.calls[0][0];
      const labHieStru = callArgs.labHieStru;

      // Should have required properties for aviation safety analysis
      expect(labHieStru).toHaveProperty('威胁列表');
      expect(labHieStru).toHaveProperty('差错列表');
      expect(labHieStru).toHaveProperty('UAS列表');
    });

    it('should have correct page path without projectId parameter', async () => {
      const { LabelPage: PageConfig } = await import('../index');
      expect(PageConfig.path).toBe('/label');
    });

    it('should have correct page title', async () => {
      const { LabelPage: PageConfig } = await import('../index');
      expect(PageConfig.title).toBe('Data Analysis');
    });

    it('should display all aviation project tasks without projectId', async () => {
      const DataAnalysisMock = require('@heartex/label').DataAnalysis;
      const { LabelPage } = await import('../LabelPage');

      render(<LabelPage />);

      // DataAnalysis should be called without projectId (fetches all tasks)
      expect(DataAnalysisMock).toHaveBeenCalledWith(
        expect.not.objectContaining({
          projectId: expect.anything(),
        }),
        expect.anything()
      );
    });
  });

  describe('Role-based Access Control', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should allow access for Manager role', async () => {
      mockUseUserRole.mockReturnValue({
        role: 'Manager',
        isManager: true,
        isResearcher: false,
        isAnnotator: false,
        isManagerOrResearcher: true,
      });

      const { LabelPage } = await import('../LabelPage');
      render(<LabelPage />);

      expect(screen.getByTestId('data-analysis-mock')).toBeInTheDocument();
      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });

    it('should allow access for Researcher role', async () => {
      mockUseUserRole.mockReturnValue({
        role: 'Researcher',
        isManager: false,
        isResearcher: true,
        isAnnotator: false,
        isManagerOrResearcher: true,
      });

      const { LabelPage } = await import('../LabelPage');
      render(<LabelPage />);

      expect(screen.getByTestId('data-analysis-mock')).toBeInTheDocument();
      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });

    it('should deny access for Annotator role', async () => {
      mockUseUserRole.mockReturnValue({
        role: 'Annotator',
        isManager: false,
        isResearcher: false,
        isAnnotator: true,
        isManagerOrResearcher: false,
      });

      const { LabelPage } = await import('../LabelPage');
      render(<LabelPage />);

      expect(screen.queryByTestId('data-analysis-mock')).not.toBeInTheDocument();
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('should show permission message when access denied', async () => {
      mockUseUserRole.mockReturnValue({
        role: 'Annotator',
        isManager: false,
        isResearcher: false,
        isAnnotator: true,
        isManagerOrResearcher: false,
      });

      const { LabelPage } = await import('../LabelPage');
      render(<LabelPage />);

      expect(screen.getByText(/Manager and Researcher roles/)).toBeInTheDocument();
    });
  });
});
