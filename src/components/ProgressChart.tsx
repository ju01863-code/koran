import React from 'react';
import { WeeklyInsightsSection, ProgressChart as ProgressChartComponent } from './WeeklyInsightsSection';
import { UserProgressState } from '../utils/storage';

export interface ProgressChartProps {
  progress: UserProgressState;
  onNavigateTab?: (tab: 'alphabet' | 'words' | 'roots' | 'grammar' | 'plan' | 'quran') => void;
  largeFont?: boolean;
}

export const ProgressChart: React.FC<ProgressChartProps> = (props) => {
  return <ProgressChartComponent {...props} />;
};

export default ProgressChart;
