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
  timePerTask: {
    taskId: number;
    taskTitle: string;
    totalTime: number;
    averageTimePerSession: number;
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
  dateInfo: {
    day: string;
    month: string;
    dayOfWeek: string;
    relativeDate: string;
    fullDate: string;
  };
  sessionCount: number;
  lastUpdated: Date;
}

export interface MemberProductivityFilters {
  projectId?: number;
  memberId?: number;
  sprintId?: number; // Add sprint filtering support - null means all sprints
}

export interface MemberProductivityResponse {
  success: boolean;
  data: MemberProductivityData;
  message: string;
} 