/**
 * Utility functions for handling dates and times in Eastern Time (ET)
 */

/**
 * Get the current date in Eastern Time
 * @returns Date object in Eastern Time
 */
export const getEasternTimeDate = (): Date => {
  const date = new Date();
  
  // Convert to Eastern Time by getting the Eastern timezone offset
  // This correctly accounts for standard time (EST) and daylight time (EDT)
  const etFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const etParts = etFormatter.formatToParts(date);
  const etValues: Record<string, number> = {};
  
  for (const part of etParts) {
    if (part.type !== 'literal') {
      etValues[part.type] = Number.parseInt(part.value, 10);
    }
  }
  
  // Create a new Date object with Eastern Time components
  return new Date(
    etValues.year,
    etValues.month - 1, // JavaScript months are 0-indexed
    etValues.day,
    etValues.hour,
    etValues.minute,
    etValues.second
  );
};

/**
 * Check if it's time to create a new report (Monday at 6 AM Eastern Time)
 * @returns boolean
 */
export const shouldCreateNewReport = (): boolean => {
  const date = getEasternTimeDate();
  const day = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const hour = date.getHours();
  
  return day === 1 && hour >= 6; // Monday after 6 AM Eastern Time
};

/**
 * Format a date to a readable string
 * @param date The date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

/**
 * Get the week range (Monday to Sunday) for a given date
 * @returns Object with start and end dates
 */
export const getWeekRange = (): { start: Date; end: Date } => {
  const etDate = getEasternTimeDate();
  const day = etDate.getDay();
  
  // Calculate days to Monday (start of week)
  const daysToMonday = day === 0 ? 6 : day - 1;
  
  // Create new date objects for start (Monday) and end (Sunday)
  const start = new Date(etDate);
  start.setDate(etDate.getDate() - daysToMonday);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}; 