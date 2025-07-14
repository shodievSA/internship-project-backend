export interface UserData {
  id: number;
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  createdAt: Date;
}


export interface MemberProductivity { 
    member: { 
        fullName: string,
        position: string,
        role: string,
    },
    productivityScore: number,
    tasksCompleted: number,
    completionRate: number,
    avgTimeForTask: number,
    taskDistribution: { 
        inProgress: number,
        completed: number,
        rejected: number,
        underReview: number,
        overdue: number,
    },
    recentActivity : shortTask[]
}

interface shortTask { 
    title: string,
    status: string,
    time: number,
}
