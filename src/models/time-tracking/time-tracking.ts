export interface CreateTimeEntryDto {
  userId: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds, for manual entries
  note?: string;
}

export interface UpdateTimeEntryDto {
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  note?: string;
}

export interface StartTimerDto {
  userId: string;
  taskId: string;
  note?: string;
}

export interface StopTimerDto {
  endTime?: Date;
  note?: string;
}

export interface TimeEntryFiltersDto {
  userId?: string;
  taskId?: string;
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface TimeEntryResponseDto {
  id: string;
  userId: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  note?: string;
  createdAt: Date;
  task?: {
    id: string;
    title: string;
    status: string;
    project?: {
      id: string;
      name: string;
    };
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface TimeReportDto {
  totalTime: number; // in seconds
  totalHours: number;
  totalDays: number;
  entries: TimeEntryResponseDto[];
  summary: {
    byTask: Array<{
      taskId: string;
      taskTitle: string;
      time: number;
      hours: number;
    }>;
    byUser: Array<{
      userId: string;
      userName: string;
      time: number;
      hours: number;
    }>;
    byDate: Array<{
      date: string;
      time: number;
      hours: number;
    }>;
  };
}

export interface TimerStatusDto {
  isRunning: boolean;
  currentEntry?: TimeEntryResponseDto;
  totalToday: number; // in seconds
  totalTodayHours: number;
}
