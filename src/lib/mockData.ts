/**
 * Mock data generation utilities for development and testing
 */

import { DEFAULT_METRICS } from './services';

export const generateRealisticMetricData = (
  timeRange: string,
  metricTitle: string,
  metricColors: Record<string, string>
) => {
  const now = new Date();
  const data = [];
  const defaultMetric = DEFAULT_METRICS.find(m => m.title === metricTitle);
  const targetVal = defaultMetric?.targetValue || 10; // Default to 10 if undefined
  
  // Generate data points for the selected time range
  let days: number;
  let interval: number;
  
  // Calculate appropriate intervals and ranges based on timeframe
  switch(timeRange) {
    case 'week':
      days = 7;
      interval = 1; // Daily points for week view
      break;
    case 'month':
      days = 30;
      interval = 2; // Every 2 days for month view
      break;
    case 'quarter':
      days = 90;
      interval = 6; // Every 6 days for quarter
      break;
    case 'halfYear':
      days = 180;
      interval = 12; // Every 12 days for 6 months
      break;
    case 'year':
      days = 365;
      interval = 24; // Every ~3 weeks for yearly view
      break;
    default:
      days = 7;
      interval = 1;
  }
  
  // Create a starting point and build up values
  let previousValue = 0;
  
  // Add a slight sinusoidal pattern to make it look more organic
  const addSinWave = (value: number, position: number, totalPoints: number) => {
    const amplitude = targetVal * 0.15; // 15% of target as wave amplitude
    const frequency = 2 * Math.PI / totalPoints;
    return value + amplitude * Math.sin(frequency * position);
  };
  
  // Generate points
  const totalPoints = Math.ceil(days / interval);
  for (let i = 0; i < totalPoints; i++) {
    const date = new Date(now);
    const daysToSubtract = days - (i * interval);
    date.setDate(date.getDate() - daysToSubtract);
    const dateStr = date.toISOString().split('T')[0];
    
    // Create a realistic pattern with progression and some fluctuation
    const progress = i / totalPoints; // 0 at start, 1 at end
    
    // Generate a new value that follows a credible trend from the previous value
    let baseValue: number;
    
    if (previousValue === 0) {
      // First point
      baseValue = Math.max(0, Math.floor(targetVal * progress * 0.5));
    } else {
      // Subsequent points - slight increase with some variation
      const change = Math.floor(targetVal * 0.08 * (Math.random() + 0.7)); // Between 70% and 170% of 8% of target
      baseValue = previousValue + change;
    }
    
    // Add some randomness but ensure the general trend is upward
    const randomVariation = Math.floor(targetVal * 0.08 * (Math.random() - 0.3)); // Bias toward positive
    
    // Add sinusoidal wave for more realistic patterns
    let value = Math.max(0, Math.min(targetVal * 2, baseValue + randomVariation));
    value = addSinWave(value, i, totalPoints);
    
    previousValue = value;
    
    data.push({
      date: dateStr,
      value,
      target: targetVal
    });
  }
  
  return {
    title: metricTitle,
    color: metricColors[metricTitle as keyof typeof metricColors] || '#c0ff54',
    data
  };
};

export const generateMockChartData = (timeRange: string, metricColors: Record<string, string>) => {
  return DEFAULT_METRICS.map(metric => 
    generateRealisticMetricData(timeRange, metric.title, metricColors)
  );
};

export const generateMockAchievements = (mockData: Array<{
  title: string;
  color: string;
  data: Array<{ date: string; value: number; target: number }>;
}>) => {
  const achievements: Record<string, { percentage: number; status: string }> = {};
  
  for (const metric of DEFAULT_METRICS) {
    // Calculate percentage based on the last data point in the mock data
    const metricData = mockData.find(d => d.title === metric.title);
    const lastDataPoint = metricData?.data[metricData.data.length - 1];
    
    let percentage = 0;
    if (lastDataPoint) {
      percentage = Math.min(100, Math.floor((lastDataPoint.value / lastDataPoint.target) * 100));
    } else {
      percentage = Math.floor(Math.random() * 100);
    }
    
    let status = 'behind';
    if (percentage >= 100) status = 'ahead';
    else if (percentage >= 75) status = 'on-track';
    
    achievements[metric.title] = { percentage, status };
  }
  
  return achievements;
}; 