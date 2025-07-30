export interface TaskPerformanceMetrics {
  totalTasksAssigned: number;
  completedTasks: number;
  ongoingTasks: number;
  overdueTasks: number;
  taskCompletionRate: number;
  tasksUnderReview: number;
  rejectedTasks: number;
  tasksByPriority: {
    high: number;
    middle: number;
    low: number;
  };
}

export interface TimeTrackingAnalytics {
  totalTimeLogged: number; // in seconds
  totalTimeLoggedFormatted: string; // formatted as "Xh Ym Zs"
  averageSessionDuration: number; // in seconds
  averageSessionDurationFormatted: string;
  dailyTimeDistribution: {
    date: string;
    totalTime: number;
    sessions: number;
  }[];
  weeklyTimeDistribution: {
    week: string;
    totalTime: number;
    averageDailyTime: number;
  }[];
  monthlyTimeDistribution: {
    month: string;
    totalTime: number;
    averageDailyTime: number;
  }[];
  timePerTask: {
    taskId: number;
    taskTitle: string;
    totalTime: number;
    averageTimePerSession: number;
  }[];
  productivityHours: {
    hour: number;
    totalTime: number;
    sessions: number;
  }[];
}

export interface MemberProductivityData {
  memberId: number;
  memberName: string;
  memberAvatar: string | null;
  projectId: number;
  projectName: string;
  role: string;
  position: string;
  busyLevel: 'free' | 'low' | 'medium' | 'high';
  taskPerformance: TaskPerformanceMetrics;
  timeTracking: TimeTrackingAnalytics;
  lastUpdated: Date;
}

export interface MemberProductivityFilters {
  projectId?: number;
  memberId?: number;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  timeRange?: 'day' | 'week' | 'month' | 'all';
}

export interface MemberProductivityResponse {
  success: boolean;
  data: MemberProductivityData;
  message: string;
} 