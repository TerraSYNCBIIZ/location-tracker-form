import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { WeeklyReport } from '@/types';
import { DEFAULT_METRICS } from '@/lib/services';

// Helper function to get date range based on time frame
const getDateRange = (timeFrame: string): { startDate: Date; endDate: Date } => {
  // Always use today as end date
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999); // End of day today
  
  // Calculate start date based on time frame
  let startDate;
  
  switch (timeFrame) {
    case 'week': {
      // Get the current day of the week (0 = Sunday, 1 = Monday, etc.)
      const currentDay = now.getDay();
      // Calculate days since last Monday (or Sunday if you prefer Sunday as week start)
      const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
      
      // Start date is the previous Monday (or Sunday)
      startDate = new Date(now);
      startDate.setDate(now.getDate() - daysSinceMonday);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case 'month': {
      // Start from 30 days ago
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case 'quarter': {
      // Get 90 days ago
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 90);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case 'halfYear': {
      // Get 180 days ago
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 180);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case 'year': {
      // Get 365 days ago
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 365);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    default: {
      // Default to current month
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
  }
  
  console.log(`Date range for ${timeFrame}: ${startDate.toISOString()} to ${endDate.toISOString()}`);
  console.log('Current date for reference:', now.toISOString());
  return { startDate, endDate };
};

// Get reports within a specific date range
export const getReportsByDateRange = async (startDate: Date, endDate: Date): Promise<WeeklyReport[]> => {
  try {
    console.log('Querying reports with dates:', { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString() 
    });
    
    // Only query by status without using orderBy to avoid index issues
    const q = query(
      collection(db, 'weeklyReports'),
      where('status', '==', 'submitted')
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.docs.length} total submitted reports`);
    
    // Filter reports by date range in-memory to handle date complexities better
    const filteredReports = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          weekEndingDate: data.weekEndingDate.toDate(),
        } as WeeklyReport;
      })
      .filter(report => {
        // Include reports where weekEndingDate is within the time range
        // or createdAt is within the time range
        const weekEndTime = report.weekEndingDate.getTime();
        const createdTime = report.createdAt.getTime();
        const isInRange = 
          (weekEndTime >= startDate.getTime() && weekEndTime <= endDate.getTime()) ||
          (createdTime >= startDate.getTime() && createdTime <= endDate.getTime());
        
        return isInRange;
      })
      // Sort them in memory instead of using Firestore's orderBy
      .sort((a, b) => b.weekEndingDate.getTime() - a.weekEndingDate.getTime());
    
    console.log(`Filtered to ${filteredReports.length} reports in date range`);
    
    return filteredReports;
  } catch (error) {
    console.error('Error fetching reports by date range:', error);
    return [];
  }
};

// Get all reports for analytics data
export const getReportsForAnalytics = async (timeFrame: string): Promise<WeeklyReport[]> => {
  try {
    const { startDate, endDate } = getDateRange(timeFrame);
    return await getReportsByDateRange(startDate, endDate);
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return [];
  }
};

// Get overall metrics performance data
export const getMetricsPerformance = async (timeFrame: string): Promise<{
  byDate: { date: string; metrics: Record<string, number> }[];
  totals: Record<string, number>;
  averages: Record<string, number>;
  completion: Record<string, number>;
}> => {
  try {
    const reports = await getReportsForAnalytics(timeFrame);
    
    // Process data
    const metricNames = new Set<string>();
    const metricsByDate: Record<string, Record<string, number>> = {};
    const metricTotals: Record<string, { sum: number; target: number; count: number }> = {};
    
    // Process each report
    reports.forEach(report => {
      const dateKey = report.createdAt.toISOString().split('T')[0];
      metricsByDate[dateKey] = metricsByDate[dateKey] || {};
      
      // Process each metric in the report
      report.metrics?.forEach(metric => {
        const { title, value = 0, targetValue = 0 } = metric;
        metricNames.add(title);
        
        // Add to date-specific metrics
        metricsByDate[dateKey][title] = (metricsByDate[dateKey][title] || 0) + value;
        
        // Add to totals
        if (!metricTotals[title]) {
          metricTotals[title] = { sum: 0, target: 0, count: 0 };
        }
        metricTotals[title].sum += value;
        metricTotals[title].target += targetValue;
        metricTotals[title].count += 1;
      });
    });
    
    // Format data for charts
    const byDate = Object.keys(metricsByDate)
      .sort()
      .map(date => ({
        date,
        metrics: metricsByDate[date],
      }));
    
    // Calculate totals and averages
    const totals: Record<string, number> = {};
    const averages: Record<string, number> = {};
    const completion: Record<string, number> = {};
    
    Object.entries(metricTotals).forEach(([title, { sum, target, count }]) => {
      totals[title] = sum;
      averages[title] = count > 0 ? sum / count : 0;
      completion[title] = target > 0 ? (sum / target) * 100 : 0;
    });
    
    return { byDate, totals, averages, completion };
  } catch (error) {
    console.error('Error processing metrics performance:', error);
    return { byDate: [], totals: {}, averages: {}, completion: {} };
  }
};

// Get performance by metric
export const getPerformanceByMetric = async (timeFrame: string, metricTitle: string): Promise<{
  data: { date: string; value: number; target: number }[];
  total: number;
  average: number;
  completionRate: number;
}> => {
  try {
    const reports = await getReportsForAnalytics(timeFrame);
    console.log(`Found ${reports.length} reports for metric ${metricTitle} in timeframe ${timeFrame}`);
    
    // Extract data for specific metric
    const dataMap = new Map<string, { date: string; value: number; target: number }>();
    let totalValue = 0;
    let totalTarget = 0;
    let count = 0;
    
    // Get date range for this timeframe
    const { startDate, endDate } = getDateRange(timeFrame);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`Using date range: ${startDateStr} to ${endDateStr} for ${metricTitle}`);
    
    // Find the default target for this metric
    const defaultMetric = DEFAULT_METRICS.find(m => m.title === metricTitle);
    const targetValue = defaultMetric?.targetValue || 10; // Ensure a reasonable default
    
    // Process the actual reports
    for (const report of reports) {
      // Use weekEndingDate for consistency - this is the date that matters for reporting
      const dateObj = report.weekEndingDate || report.createdAt;
      const dateKey = dateObj.toISOString().split('T')[0];
      
      console.log(`Processing report for ${metricTitle} on date ${dateKey}`, report);
      
      const metric = report.metrics?.find(m => m.title === metricTitle);
      
      if (metric) {
        const value = typeof metric.value === 'number' ? metric.value : 0;
        const target = typeof metric.targetValue === 'number' ? metric.targetValue : targetValue;
        
        // Combine values for the same date
        if (dataMap.has(dateKey)) {
          const existing = dataMap.get(dateKey);
          if (existing) {
            dataMap.set(dateKey, {
              date: dateKey,
              value: existing.value + value,
              target: Math.max(existing.target, target)
            });
          }
        } else {
          dataMap.set(dateKey, {
            date: dateKey,
            value,
            target
          });
        }
        
        totalValue += value;
        totalTarget += target;
        count += 1;
      }
    }
    
    // Convert to array and sort by date
    const data = Array.from(dataMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const average = count > 0 ? totalValue / count : 0;
    const completionRate = totalTarget > 0 ? (totalValue / totalTarget) * 100 : 0;
    
    // If there's absolutely no data, return an empty array
    // This will trigger appropriate UI handling
    if (data.length === 0) {
      return {
        data: [],
        total: 0,
        average: 0,
        completionRate: 0
      };
    }
    
    // Final safety check to ensure data points have consistent structure
    const cleanedData = data.map(point => ({
      date: point.date,
      value: typeof point.value === 'number' ? point.value : 0,
      target: typeof point.target === 'number' ? point.target : targetValue
    }));
    
    console.log(`Performance data for ${metricTitle}:`, cleanedData);
    
    return {
      data: cleanedData,
      total: totalValue,
      average,
      completionRate,
    };
  } catch (error) {
    console.error(`Error getting performance for metric ${metricTitle}:`, error);
    
    // Return empty data - do not generate dummy data
    return { 
      data: [], 
      total: 0, 
      average: 0, 
      completionRate: 0 
    };
  }
};

// These functions will be used in future development
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateDataPointsForRange(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  startDate: Date, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  endDate: Date, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  timeFrame: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  targetValue: number
): Array<{ date: string; value: number; target: number }> {
  // Implementation
  return [];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ensureDataPointsForRange(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  existingData: Array<{ date: string; value: number; target: number }>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  startDate: Date,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  endDate: Date,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  timeFrame: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  targetValue: number
): Array<{ date: string; value: number; target: number }> {
  // Implementation
  return [];
}

// Calculate achievement percentage for metrics
export const calculateAchievementPercentage = (reports: WeeklyReport[]): Record<string, { percentage: number; status: string }> => {
  const metricPerformance: Record<string, { sum: number; target: number }> = {};
  
  // Start with all default metrics initialized with zero values
  DEFAULT_METRICS.forEach(metric => {
    metricPerformance[metric.title] = { sum: 0, target: 0 };
  });
  
  // Accumulate values from reports
  for (const report of reports) {
    if (report.metrics) {
      for (const metric of report.metrics) {
        const { title, value = 0, targetValue = 0 } = metric;
        
        if (!metricPerformance[title]) {
          metricPerformance[title] = { sum: 0, target: 0 };
        }
        
        metricPerformance[title].sum += value;
        metricPerformance[title].target += targetValue;
      }
    }
  }
  
  // If no data was found for a metric, use the default target value
  Object.keys(metricPerformance).forEach(title => {
    if (metricPerformance[title].target === 0) {
      const defaultMetric = DEFAULT_METRICS.find(m => m.title === title);
      if (defaultMetric && defaultMetric.targetValue) {
        metricPerformance[title].target = defaultMetric.targetValue;
      }
    }
  });
  
  // Calculate percentages and status
  const result: Record<string, { percentage: number; status: string }> = {};
  
  Object.entries(metricPerformance).forEach(([title, { sum, target }]) => {
    const percentage = target > 0 ? Math.min(100, (sum / target) * 100) : 0;
    let status = 'behind';
    
    if (percentage >= 100) {
      status = 'ahead';
    } else if (percentage >= 75) {
      status = 'on-track';
    }
    
    result[title] = { percentage, status };
  });
  
  console.log('Achievement percentages:', result);
  return result;
}; 