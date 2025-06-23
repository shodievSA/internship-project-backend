import Subtask from '@/models/subTask';

export interface PlainProject {
	id: number;
	title: string;
	status: 'active' | 'completed' | 'paused';
	createdAt: Date;
	updatedAt?: Date;
}

export interface FormattedProject {
	id: number;
	title: string;
	createdAt: Date;
	status: 'active' | 'paused' | 'completed';
	members: number;
	totalTasks: number;
	totalTasksCompleted: number;
	isAdmin: boolean;
}

export interface ProjectDetails {
	id: number;
	title: string;
	team: {
		id: number;
		name: string;
		email: string;
		position: string;
		role: number;
	}[]; // from table project_members where project_id = projectId (which comes from client side);
	allTasks: {
		id: number;
		title: string | null;
		description: string;
		priority: 'low' | 'high' | 'middle';
		deadline: Date;
		subtask: Subtask[] | undefined;
		assignedBy: string;
		assignedTo: string;
		status: 'ongoing' | 'closed' | 'rejected' | 'under review' | 'overdue';
	}[];
	myTasks: {
		id: number;
		title: string | null;
		description: string;
		priority: 'low' | 'high' | 'middle';
		deadline: Date;
		assignedBy: string;
		subtask: Subtask[] | undefined;
		status: 'ongoing' | 'closed' | 'rejected' | 'under review' | 'overdue';
		completion_note: string | null;
		rejection_reason: string | null;
		approval_note: string | null;
	}[]; // tasks where assigned_To = userId (userId comes from client);
	assignedTasks: {
		id: number;
		title: string | null;
		description: string;
		priority: 'low' | 'high' | 'middle';
		deadline: Date;
		assignedTo: string;
		subtask: Subtask[] | undefined;
		status: 'ongoing' | 'closed' | 'rejected' | 'under review' | 'overdue';
		completion_note: string | null;
		rejection_reason: string | null;
		approval_note: string | null;
	}[]; // assigned_by = userId
	reviews: {
		id: number;
		title: string | null;
		description: string;
		priority: 'low' | 'high' | 'middle';
		deadline: Date;
		assignedTo: string;
		subtask: Subtask[] | undefined;
		status: 'ongoing' | 'closed' | 'rejected' | 'under review' | 'overdue';
		completion_note: string | null;
		rejection_reason: string | null;
		approval_note: string | null;
		submitted: Date; // updated_at in table
	}[]; // assigned_by= userId and status="under review"
	invites: {
		id: number;
		status: 'pending' | 'accepted' | 'rejected'; //(ENUM - "pending", "accepted", "rejected")
		receiver_email: string;
		receiver_name: string;
		receiver_avatar_url: string | null;
		created_at: Date;
		position_offered: string;
		role_offered: 'manager' | 'member'; //(ENUM - "admin","manager", "member")
	}[]; // project_id = projectId that comes from client
}
