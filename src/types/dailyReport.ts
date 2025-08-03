export interface TaskDueToday {
	from: {
		projectName: string
	};
	title: string;
	description: string;
	priority: "high" | "middle" | "low";
	deadline: Date;
	assignedBy: {
		name: string;
		avatarUrl: string | null;
	}
}

export type TaskDueTomorrow = TaskDueToday;
export type TaskDueThisWeek = TaskDueToday;

export interface TaskForReview {
	from: {
		projectId: number;
		projectName: string;
	};
	id: number;
	title: string;
	description: string;
	priority: "high" | "middle" | "low";
	deadline: Date;
	assignedTo: {
		name: string;
		avatarUrl: string | null;
	}
}

export interface NewNotification {
	id: number;
	title: string;
	message: string;
	createdAt: Date;
}

export interface DailyReport {
	tasksDueToday: TaskDueToday[];
	tasksDueTomorrow: TaskDueTomorrow[];
	tasksDueThisWeek: TaskDueThisWeek[];
	tasksForReview: TaskForReview[];
	newNotifications: NewNotification[];
    summary?: string;
}