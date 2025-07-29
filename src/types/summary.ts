export interface StatusOverviewResponse {
    totalWorkItems: number;
    statusDistribution: {
        ongoing: number;
        closed: number;
        underReview: number;
        overdue: number;
        rejected: number;
    };
}

export interface TeamWorkloadResponse {
    assignees: Array<{
        id: number;
        name: string;
        avatarUrl: string | null;
        workDistribution: number; // percentage
        taskCount: number;
    }>;
    unassigned: {
        workDistribution: number;
        taskCount: number;
    };
}

export interface SprintProgressResponse {
    sprints: Array<{
        id: number;
        title: string;
        description?: string;
        progress: {
            completed: number;    
            active: number;       
            blocked: number;       
            total: number;
        };
        progressPercentage: {
            completed: number;     
            active: number;        
            blocked: number;      
        };
        taskBreakdown: {
            active: number;        
            blocked: number;       
        };
    }>;
}

export interface PriorityBreakdownResponse {
    priorities: Array<{
        level: 'high' | 'middle' | 'low';
        icon: string;
        count: number;
        percentage: number;
    }>;
    totalTasks: number;
}

export interface RecentActivityResponse {
    recentActivity: {
        completed: {
            count: number;
            period: 'last7days' | 'last30days';
        };
        updated: {
            count: number;
            period: 'last7days' | 'last30days';
        };
        created: {
            count: number;
            period: 'last7days' | 'last30days';
        };
        dueSoon: {
            count: number;
            period: 'next7days';
        };
    };
}

export interface SummaryDashboard {
    statusOverview: StatusOverviewResponse;
    teamWorkload: TeamWorkloadResponse;
    sprintProgress: SprintProgressResponse;
    priorityBreakdown: PriorityBreakdownResponse;
    recentActivity: RecentActivityResponse;
} 