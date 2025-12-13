import { HierarchicalSelection, TrainingTopics } from '../types/aviation.types';

export class TrainingCalculator {
  /**
   * Calculate training topics from a hierarchical selection
   */
  static calculateFromSelection(selection: HierarchicalSelection): string[] {
    if (!selection.level3 || !selection.level3.training_topics) {
      return [];
    }
    return selection.level3.training_topics;
  }

  /**
   * Aggregate all training topics from threat, error, and UAS selections
   */
  static aggregateAllTraining(
    threatTopics: string[],
    errorTopics: string[],
    uasTopics: string[]
  ): TrainingTopics {
    // Remove duplicates by creating a Set
    const allTopics = [...threatTopics, ...errorTopics, ...uasTopics];
    const combined = Array.from(new Set(allTopics));

    // Sort alphabetically for consistent display
    combined.sort();

    return {
      threat_training_topics: threatTopics,
      error_training_topics: errorTopics,
      uas_training_topics: uasTopics,
      combined,
    };
  }

  /**
   * Check if a training topic should be highlighted based on frequency
   */
  static getTopicPriority(topic: string, allTopics: string[]): 'high' | 'medium' | 'low' {
    const count = allTopics.filter(t => t === topic).length;

    if (count >= 3) return 'high';
    if (count === 2) return 'medium';
    return 'low';
  }

  /**
   * Group training topics by category
   */
  static groupTopicsByCategory(topics: string[]): Record<string, string[]> {
    const grouped: Record<string, string[]> = {
      'Technical': [],
      'Non-Technical': [],
      'Communication': [],
      'Decision Making': [],
      'Situational Awareness': [],
      'Other': [],
    };

    topics.forEach(topic => {
      // Simple categorization based on keywords
      const lowerTopic = topic.toLowerCase();

      if (lowerTopic.includes('technical') || lowerTopic.includes('system') || lowerTopic.includes('procedure')) {
        grouped['Technical'].push(topic);
      } else if (lowerTopic.includes('communication') || lowerTopic.includes('coordinate')) {
        grouped['Communication'].push(topic);
      } else if (lowerTopic.includes('decision') || lowerTopic.includes('judgment')) {
        grouped['Decision Making'].push(topic);
      } else if (lowerTopic.includes('awareness') || lowerTopic.includes('monitor')) {
        grouped['Situational Awareness'].push(topic);
      } else if (lowerTopic.includes('leadership') || lowerTopic.includes('team') || lowerTopic.includes('workload')) {
        grouped['Non-Technical'].push(topic);
      } else {
        grouped['Other'].push(topic);
      }
    });

    // Remove empty categories
    Object.keys(grouped).forEach(key => {
      if (grouped[key].length === 0) {
        delete grouped[key];
      }
    });

    return grouped;
  }

  /**
   * Calculate training priority score based on likelihood and severity
   */
  static calculateTrainingPriority(
    likelihood: string,
    severity: string
  ): 'critical' | 'high' | 'medium' | 'low' {
    const likelihoodScores: Record<string, number> = {
      'Very Likely': 5,
      'Likely': 4,
      'Possible': 3,
      'Unlikely': 2,
      'Very Unlikely': 1,
    };

    const severityScores: Record<string, number> = {
      'Catastrophic': 5,
      'Major': 4,
      'Moderate': 3,
      'Minor': 2,
      'Negligible': 1,
    };

    const lScore = likelihoodScores[likelihood] || 0;
    const sScore = severityScores[severity] || 0;
    const totalScore = lScore + sScore;

    if (totalScore >= 9) return 'critical';
    if (totalScore >= 7) return 'high';
    if (totalScore >= 4) return 'medium';
    return 'low';
  }

  /**
   * Generate training recommendations based on selected topics
   */
  static generateRecommendations(topics: string[]): string[] {
    const recommendations: string[] = [];

    if (topics.length === 0) {
      return recommendations;
    }

    // Analyze topics and generate recommendations
    const grouped = this.groupTopicsByCategory(topics);

    if (grouped['Technical'] && grouped['Technical'].length > 2) {
      recommendations.push('Consider comprehensive technical skills refresher training');
    }

    if (grouped['Communication'] && grouped['Communication'].length > 0) {
      recommendations.push('Include CRM (Crew Resource Management) modules');
    }

    if (grouped['Situational Awareness'] && grouped['Situational Awareness'].length > 0) {
      recommendations.push('Focus on threat and error management (TEM) principles');
    }

    if (topics.length > 5) {
      recommendations.push('Consider multi-phase training program due to complexity');
    }

    return recommendations;
  }
}