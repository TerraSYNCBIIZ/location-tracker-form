export type MetricData = {
  id: string;
  title: string;
  target: string;
  frequency: string;
  trackingMethod: string;
  completed: boolean;
  value?: number;
  targetValue?: number;
  previousValue?: number;
};

export type WeeklyReport = {
  id: string;
  userId: string;
  reportText: string;
  metrics: MetricData[];
  createdAt: Date;
  weekEndingDate: Date;
  status: 'pending' | 'submitted';
  archived: boolean;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
}; 