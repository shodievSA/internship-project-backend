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

export interface SummaryDashboard {
    statusOverview: StatusOverviewResponse;
    teamWorkload: TeamWorkloadResponse;
} 