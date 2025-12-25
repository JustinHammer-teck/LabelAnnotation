import { render, screen } from '@testing-library/react';
import { TrainingTopicsPanel } from '../TrainingTopicsPanel';

jest.mock('../../../../i18n', () => ({
  useAviationTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'training_topics.title': 'Training Topics',
        'training_topics.threat_related': 'Threat Related',
        'training_topics.error_related': 'Error Related',
        'training_topics.uas_related': 'UAS Related',
        'training_topics.auto_filled': 'Auto-populated',
        'training_topics.count': `${params?.count ?? 0} topics`,
      };
      return translations[key] || key;
    },
    currentLanguage: 'en',
    changeLanguage: jest.fn(),
    i18n: {} as any,
  }),
}));

describe('TrainingTopicsPanel', () => {
  describe('i18n integration', () => {
    it('should display translated title using i18n key', () => {
      render(
        <TrainingTopicsPanel
          threatTopics={[]}
          errorTopics={[]}
          uasTopics={[]}
        />
      );

      expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Training Topics');
    });

    it('should display translated category labels using i18n keys', () => {
      render(
        <TrainingTopicsPanel
          threatTopics={['Topic 1']}
          errorTopics={['Topic 2']}
          uasTopics={['Topic 3']}
        />
      );

      expect(screen.getByText('Threat Related')).toBeInTheDocument();
      expect(screen.getByText('Error Related')).toBeInTheDocument();
      expect(screen.getByText('UAS Related')).toBeInTheDocument();
    });

    it('should display translated count badge with interpolation', () => {
      render(
        <TrainingTopicsPanel
          threatTopics={['Topic 1', 'Topic 2']}
          errorTopics={['Topic 3']}
          uasTopics={[]}
        />
      );

      expect(screen.getByText('3 topics')).toBeInTheDocument();
    });

    it('should display translated auto-filled message when no topics', () => {
      render(
        <TrainingTopicsPanel
          threatTopics={[]}
          errorTopics={[]}
          uasTopics={[]}
        />
      );

      const autoFilledElements = screen.getAllByText('Auto-populated');
      expect(autoFilledElements).toHaveLength(3);
    });
  });

  describe('rendering topics', () => {
    it('should render threat topics correctly', () => {
      render(
        <TrainingTopicsPanel
          threatTopics={['Threat Topic 1', 'Threat Topic 2']}
          errorTopics={[]}
          uasTopics={[]}
        />
      );

      expect(screen.getByText('Threat Topic 1')).toBeInTheDocument();
      expect(screen.getByText('Threat Topic 2')).toBeInTheDocument();
    });

    it('should render error topics correctly', () => {
      render(
        <TrainingTopicsPanel
          threatTopics={[]}
          errorTopics={['Error Topic 1']}
          uasTopics={[]}
        />
      );

      expect(screen.getByText('Error Topic 1')).toBeInTheDocument();
    });

    it('should render UAS topics correctly', () => {
      render(
        <TrainingTopicsPanel
          threatTopics={[]}
          errorTopics={[]}
          uasTopics={['UAS Topic 1', 'UAS Topic 2', 'UAS Topic 3']}
        />
      );

      expect(screen.getByText('UAS Topic 1')).toBeInTheDocument();
      expect(screen.getByText('UAS Topic 2')).toBeInTheDocument();
      expect(screen.getByText('UAS Topic 3')).toBeInTheDocument();
    });

    it('should deduplicate topics when counting', () => {
      render(
        <TrainingTopicsPanel
          threatTopics={['Shared Topic', 'Threat Only']}
          errorTopics={['Shared Topic', 'Error Only']}
          uasTopics={['Shared Topic']}
        />
      );

      // 3 unique topics: 'Shared Topic', 'Threat Only', 'Error Only'
      expect(screen.getByText('3 topics')).toBeInTheDocument();
    });

    it('should not show badge when no topics exist', () => {
      render(
        <TrainingTopicsPanel
          threatTopics={[]}
          errorTopics={[]}
          uasTopics={[]}
        />
      );

      expect(screen.queryByText(/\d+ topics/)).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should render topics list with proper list role', () => {
      render(
        <TrainingTopicsPanel
          threatTopics={['Topic 1']}
          errorTopics={[]}
          uasTopics={[]}
        />
      );

      const lists = screen.getAllByRole('list');
      expect(lists.length).toBeGreaterThan(0);
    });

    it('should render topic items with listitem role', () => {
      render(
        <TrainingTopicsPanel
          threatTopics={['Topic 1', 'Topic 2']}
          errorTopics={['Topic 3']}
          uasTopics={[]}
        />
      );

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
    });
  });
});
