import Subtask from '@/models/subTask';
import TaskHistory from '@/models/taskHistory';

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
		name: string | null ;
		email: string;
        avatarUrl : string | null ;
		position: string;
		role: string;
	}[]; // from table project_members where project_id = projectId (which comes from client side);
	allTasks: {
		id: number;
		title: string | null;
		description: string;
		priority: 'low' | 'high' | 'middle';
		deadline: Date;
		subtasks: Subtask[] | undefined;
		assignedBy: string;
		assignedTo: string;
		status: 'ongoing' | 'closed' | 'rejected' | 'under review' | 'overdue';
        history : TaskHistory[]
	}[];
	myTasks: {
		id: number;
		title: string | null;
		description: string;
		priority: 'low' | 'high' | 'middle';
		deadline: Date;
		assignedBy: string;
		subtasks: Subtask[] | undefined;
		status: 'ongoing' | 'closed' | 'rejected' | 'under review' | 'overdue';
        history : TaskHistory[]
	}[]; // tasks where assigned_To = userId (userId comes from client);
	assignedTasks: {
		id: number;
		title: string | null;
		description: string;
		priority: 'low' | 'high' | 'middle';
		deadline: Date;
		assignedTo: string;
		subtasks: Subtask[] | undefined;
		status: 'ongoing' | 'closed' | 'rejected' | 'under review' | 'overdue';
        history : TaskHistory[]
	}[]; // assigned_by = projectMemberId
	reviews: {
		id: number;
		title: string | null;
		description: string;
		priority: 'low' | 'high' | 'middle';
		deadline: Date;
		assignedTo: string;
		subtasks: Subtask[] | undefined;
		status: 'ongoing' | 'closed' | 'rejected' | 'under review' | 'overdue';
        history : TaskHistory[]
		submitted: Date; // updated_at in table
	}[]; // assigned_by= userId and status="under review"
	invites: {
		id: number;
		status: 'pending' | 'accepted' | 'rejected'; //(ENUM - "pending", "accepted", "rejected")
		receiverEmail: string;
		receiverName: string | null;
		receiverAvatarUrl: string | null;
		createdAt: Date;
		positionOffered: string;
		roleOffered: 'manager' | 'member'; //(ENUM - "admin","manager", "member")
	}[]; // project_id = projectId that comes from client
}
