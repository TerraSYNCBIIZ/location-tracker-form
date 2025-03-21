import { 
  collection, 
  addDoc, 
  query, 
  getDocs, 
  Timestamp,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  where,
  limit,
  deleteDoc,
  startAfter,
  endBefore,
  limitToLast,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import type { MetricData, WeeklyReport } from '@/types';
import { getEasternTimeDate, getWeekRange } from '@/lib/dateUtils';

// Type for Firestore document reference - make it accept both types
export type FirestoreDocRef = DocumentSnapshot<DocumentData> | QueryDocumentSnapshot<DocumentData>;

// Default metrics template
export const DEFAULT_METRICS: MetricData[] = [
  {
    id: '1',
    title: 'New Accounts Outreach',
    target: '10 per week',
    frequency: 'Weekly',
    trackingMethod: 'CRM/Spreadsheet (Date, Company, Contact, Outcome)',
    completed: false,
    value: 0,
    targetValue: 10,
    previousValue: 0
  },
  {
    id: '2',
    title: 'Acres Secured',
    target: '5 per month',
    frequency: 'Monthly',
    trackingMethod: 'Signed Contracts, Internal Records',
    completed: false,
    value: 0,
    targetValue: 5,
    previousValue: 0
  },
  {
    id: '3',
    title: 'Quotations Sent',
    target: '20 per month',
    frequency: 'Monthly',
    trackingMethod: 'CRM/Spreadsheet (Date, Recipient, Acreage)',
    completed: false,
    value: 0,
    targetValue: 20,
    previousValue: 0
  },
  {
    id: '4',
    title: 'Quotation Closing Rate',
    target: '20%',
    frequency: 'Monthly',
    trackingMethod: '(Contracts Signed / Quotations Sent) * 100',
    completed: false,
    value: 0,
    targetValue: 20,
    previousValue: 0
  }
];

// Utility function to convert Firestore document to WeeklyReport (for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const convertDocToWeeklyReport = (doc: DocumentSnapshot<DocumentData>): WeeklyReport => {
  const data = doc.data();
  if (!data) {
    throw new Error('Document data is undefined');
  }
  
  return {
    id: doc.id,
    userId: data.userId,
    reportText: data.reportText,
    metrics: data.metrics,
    createdAt: data.createdAt.toDate(),
    weekEndingDate: data.weekEndingDate.toDate(),
    status: data.status as 'pending' | 'submitted',
    archived: !!data.archived
  };
};

// Submit a new weekly report
export const submitWeeklyReport = async (
  name: string, 
  reportText: string, 
  metrics: MetricData[],
  weekEndingDate: Date
) => {
  try {
    const reportData = {
      userId: name, // Using name instead of userId
      reportText,
      metrics,
      createdAt: Timestamp.now(),
      weekEndingDate: Timestamp.fromDate(weekEndingDate),
      status: 'submitted', // Mark the report as submitted
      archived: false // New reports are not archived by default
    };
    
    const docRef = await addDoc(collection(db, 'weeklyReports'), reportData);
    return { id: docRef.id, ...reportData };
  } catch (error) {
    console.error('Error submitting report:', error);
    throw error;
  }
};

// Create a pending report for a user
export const createPendingReport = async (name: string): Promise<WeeklyReport> => {
  try {
    // Get Eastern Time date for reference (not directly used)
    getEasternTimeDate();
    
    // Create a new date for the end of the week (Sunday)
    const weekRange = getWeekRange();
    const weekEndingDate = weekRange.end;
    
    const reportData = {
      userId: name,
      reportText: '',
      metrics: DEFAULT_METRICS,
      createdAt: Timestamp.now(),
      weekEndingDate: Timestamp.fromDate(weekEndingDate),
      status: 'pending' as const, // Mark the report as pending
      archived: false // New reports are not archived by default
    };
    
    const docRef = await addDoc(collection(db, 'weeklyReports'), reportData);
    return { 
      id: docRef.id, 
      ...reportData,
      createdAt: reportData.createdAt.toDate(),
      weekEndingDate: reportData.weekEndingDate.toDate()
    };
  } catch (error) {
    console.error('Error creating pending report:', error);
    throw error;
  }
};

// Update a pending report to submitted
export const submitPendingReport = async (
  reportId: string,
  name: string,
  reportText: string,
  metrics: MetricData[]
) => {
  try {
    const reportRef = doc(db, 'weeklyReports', reportId);
    await updateDoc(reportRef, {
      userId: name,
      reportText,
      metrics,
      status: 'submitted'
    });
    return true;
  } catch (error) {
    console.error('Error submitting pending report:', error);
    throw error;
  }
};

// Check if a user has a pending report for the current week
export const getCurrentWeekPendingReport = async (name: string) => {
  try {
    // Get the current date in Eastern Time
    const now = new Date();
    
    // Calculate the start of the week (Sunday)
    const weekStartDate = new Date(now);
    const currentDay = weekStartDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    weekStartDate.setDate(weekStartDate.getDate() - currentDay); // Go to Sunday
    weekStartDate.setHours(0, 0, 0, 0); // Start of day
    
    // Calculate the end of the week (Saturday)
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6); // Go to Saturday
    weekEndDate.setHours(23, 59, 59, 999); // End of day
    
    const q = query(
      collection(db, 'weeklyReports'),
      where('userId', '==', name),
      where('weekEndingDate', '>=', Timestamp.fromDate(weekStartDate)),
      where('weekEndingDate', '<=', Timestamp.fromDate(weekEndDate)),
      where('status', '==', 'pending'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      weekEndingDate: doc.data().weekEndingDate.toDate()
    } as WeeklyReport;
  } catch (error) {
    console.error('Error checking for pending report:', error);
    throw error;
  }
};

// Check if a user has any report (pending or submitted) for the current week
export const getCurrentWeekAnyReport = async (name: string) => {
  try {
    // Get the current date in Eastern Time
    const now = new Date();
    
    // Calculate the start of the week (Sunday)
    const weekStartDate = new Date(now);
    const currentDay = weekStartDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    weekStartDate.setDate(weekStartDate.getDate() - currentDay); // Go to Sunday
    weekStartDate.setHours(0, 0, 0, 0); // Start of day
    
    // Calculate the end of the week (Saturday)
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6); // Go to Saturday
    weekEndDate.setHours(23, 59, 59, 999); // End of day
    
    const q = query(
      collection(db, 'weeklyReports'),
      where('userId', '==', name),
      where('weekEndingDate', '>=', Timestamp.fromDate(weekStartDate)),
      where('weekEndingDate', '<=', Timestamp.fromDate(weekEndDate)),
      // Note: Not filtering by status, to get both pending and submitted reports
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      weekEndingDate: doc.data().weekEndingDate.toDate()
    } as WeeklyReport;
  } catch (error) {
    console.error('Error checking for any report:', error);
    throw error;
  }
};

// Check if any report exists for the current week (from any user)
export const getCurrentWeekAnyReportGlobal = async () => {
  try {
    console.log('Checking for any report this week (global)...');
    
    // Get the current date in Eastern Time
    const now = new Date();
    
    // Calculate the start of the week (Sunday)
    const weekStartDate = new Date(now);
    const currentDay = weekStartDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    weekStartDate.setDate(weekStartDate.getDate() - currentDay); // Go to Sunday
    weekStartDate.setHours(0, 0, 0, 0); // Start of day
    
    // Calculate the end of the week (Saturday)
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6); // Go to Saturday
    weekEndDate.setHours(23, 59, 59, 999); // End of day
    
    console.log('Week date range:', weekStartDate, 'to', weekEndDate);
    
    const q = query(
      collection(db, 'weeklyReports'),
      where('weekEndingDate', '>=', Timestamp.fromDate(weekStartDate)),
      where('weekEndingDate', '<=', Timestamp.fromDate(weekEndDate)),
      limit(10) // Increased limit to ensure we find at least one non-archived report
    );
    
    const querySnapshot = await getDocs(q);
    console.log('Weekly report query returned', querySnapshot.docs.length, 'documents');
    
    if (querySnapshot.empty) {
      console.log('No reports found for this week');
      return null;
    }
    
    // Find the first non-archived report
    const nonArchivedDoc = querySnapshot.docs.find(doc => {
      const data = doc.data();
      return data.archived !== true;
    });
    
    if (!nonArchivedDoc) {
      console.log('Only archived reports found for this week');
      return null;
    }
    
    const data = nonArchivedDoc.data();
    const report = {
      id: nonArchivedDoc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      weekEndingDate: data.weekEndingDate.toDate()
    } as WeeklyReport;
    
    console.log('Found weekly report:', report);
    return report;
  } catch (error) {
    console.error('Error checking for any report globally:', error);
    throw error;
  }
};

// Get all reports (for everyone, not filtered by user)
export const getAllReports = async () => {
  try {
    console.log('Fetching all reports...');
    
    // Notice: Removing the where clause for 'archived' since it may not be set on all documents
    const q = query(
      collection(db, 'weeklyReports'), 
      orderBy('weekEndingDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log('Query returned', querySnapshot.docs.length, 'documents');
    
    const reports = querySnapshot.docs.map(doc => {
      const data = doc.data();
      if (!data) {
        throw new Error('Document has no data');
      }
      return {
        id: doc.id,
        userId: data.userId,
        reportText: data.reportText,
        metrics: data.metrics,
        createdAt: data.createdAt.toDate(),
        weekEndingDate: data.weekEndingDate.toDate(),
        status: data.status as 'pending' | 'submitted',
        archived: !!data.archived
      } as WeeklyReport;
    }).filter(report => report.archived !== true); // Filter out archived reports in JS instead of in the query
    
    console.log('Processed reports (after filtering):', reports);
    return reports;
  } catch (error) {
    console.error('Error getting reports:', error);
    throw error;
  }
};

// Get archived reports with pagination
export const getArchivedReports = async (pageSize = 5, lastDoc?: FirestoreDocRef) => {
  try {
    let q: ReturnType<typeof query>;
    
    if (lastDoc) {
      // For pagination - get next page
      q = query(
        collection(db, 'weeklyReports'),
        where('archived', '==', true),
        where('status', '==', 'submitted'),
        orderBy('weekEndingDate', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );
    } else {
      // First page
      q = query(
        collection(db, 'weeklyReports'),
        where('archived', '==', true),
        where('status', '==', 'submitted'),
        orderBy('weekEndingDate', 'desc'),
        limit(pageSize)
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    const reports = querySnapshot.docs.map(doc => {
      const data = doc.data() as {
        userId: string;
        reportText: string;
        metrics: MetricData[];
        createdAt: { toDate(): Date };
        weekEndingDate: { toDate(): Date };
        status: string;
        archived: boolean | undefined;
      };
      
      return {
        id: doc.id,
        userId: data.userId,
        reportText: data.reportText,
        metrics: data.metrics,
        createdAt: data.createdAt.toDate(),
        weekEndingDate: data.weekEndingDate.toDate(),
        status: data.status as 'pending' | 'submitted',
        archived: !!data.archived
      } as WeeklyReport;
    });
    
    // Get the last document for pagination
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    return {
      reports,
      lastDoc: lastVisible
    };
  } catch (error) {
    console.error('Error getting archived reports:', error);
    throw error;
  }
};

// Get previous page of archived reports
export const getPreviousArchivedReports = async (firstDoc: FirestoreDocRef, pageSize = 5) => {
  try {
    const q = query(
      collection(db, 'weeklyReports'),
      where('archived', '==', true),
      where('status', '==', 'submitted'),
      orderBy('weekEndingDate', 'desc'),
      endBefore(firstDoc),
      limitToLast(pageSize)
    );
    
    const querySnapshot = await getDocs(q);
    
    const reports = querySnapshot.docs.map(doc => {
      const data = doc.data() as {
        userId: string;
        reportText: string;
        metrics: MetricData[];
        createdAt: { toDate(): Date };
        weekEndingDate: { toDate(): Date };
        status: string;
        archived: boolean | undefined;
      };
      
      return {
        id: doc.id,
        userId: data.userId,
        reportText: data.reportText,
        metrics: data.metrics,
        createdAt: data.createdAt.toDate(),
        weekEndingDate: data.weekEndingDate.toDate(),
        status: data.status as 'pending' | 'submitted',
        archived: !!data.archived
      } as WeeklyReport;
    });
    
    // Get the first document for pagination
    const firstVisible = querySnapshot.docs[0];
    
    return {
      reports,
      firstDoc: firstVisible
    };
  } catch (error) {
    console.error('Error getting previous archived reports:', error);
    throw error;
  }
};

// Get a specific report by ID
export const getReportById = async (reportId: string) => {
  try {
    const docRef = doc(db, 'weeklyReports', reportId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        weekEndingDate: data.weekEndingDate.toDate()
      } as WeeklyReport;
    }
    
    throw new Error('Report not found');
  } catch (error) {
    console.error('Error getting report:', error);
    throw error;
  }
};

// Archive a report
export const archiveReport = async (reportId: string) => {
  try {
    const reportRef = doc(db, 'weeklyReports', reportId);
    await updateDoc(reportRef, {
      archived: true
    });
    return true;
  } catch (error) {
    console.error('Error archiving report:', error);
    throw error;
  }
};

// Delete a report
export const deleteReport = async (reportId: string) => {
  try {
    const reportRef = doc(db, 'weeklyReports', reportId);
    await deleteDoc(reportRef);
    return true;
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
};

// Update a report
export const updateReport = async (reportId: string, updatedData: Partial<WeeklyReport>) => {
  try {
    const reportRef = doc(db, 'weeklyReports', reportId);
    await updateDoc(reportRef, updatedData);
    return true;
  } catch (error) {
    console.error('Error updating report:', error);
    throw error;
  }
};

// Get reports for the current month for a specific user
export const getCurrentMonthReports = async (userName: string) => {
  try {
    // Calculate the first day of the current month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    // Calculate the last day of the current month
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    lastDayOfMonth.setHours(23, 59, 59, 999);
    
    const q = query(
      collection(db, 'weeklyReports'),
      where('userId', '==', userName),
      where('createdAt', '>=', Timestamp.fromDate(firstDayOfMonth)),
      where('createdAt', '<=', Timestamp.fromDate(lastDayOfMonth)),
      where('status', '==', 'submitted'), // Only include submitted reports
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      weekEndingDate: doc.data().weekEndingDate.toDate()
    })) as WeeklyReport[];
  } catch (error) {
    console.error('Error getting current month reports:', error);
    throw error;
  }
};

// Calculate monthly progress from previous reports
export const calculateMonthlyProgress = async (userName: string) => {
  try {
    const monthlyReports = await getCurrentMonthReports(userName);
    
    // Initialize monthly progress tracker
    const monthlyProgress: Record<string, {
      value: number;
      targetValue: number;
      frequency: string;
    }> = {};
    
    // Accumulate values from all reports this month
    for (const report of monthlyReports) {
      for (const metric of report.metrics) {
        if (metric.frequency === 'Monthly') {
          if (!monthlyProgress[metric.title]) {
            monthlyProgress[metric.title] = {
              value: 0,
              targetValue: metric.targetValue || 0,
              frequency: 'Monthly'
            };
          }
          
          // Add this week's value to the cumulative total
          monthlyProgress[metric.title].value += (metric.value || 0);
        }
      }
    }
    
    return monthlyProgress;
  } catch (error) {
    console.error('Error calculating monthly progress:', error);
    return {};
  }
};

// Revert a submitted report back to pending status
export const revertToPending = async (reportId: string) => {
  try {
    const reportRef = doc(db, 'weeklyReports', reportId);
    await updateDoc(reportRef, {
      status: 'pending'
    });
    return true;
  } catch (error) {
    console.error('Error reverting report to pending:', error);
    throw error;
  }
}; 