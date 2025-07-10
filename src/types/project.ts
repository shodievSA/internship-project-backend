import Subtask from '@/models/subTask';
import TaskHistory from '@/models/taskHistory';

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

export interface ProjectInvite {
	id: number;
	status: 'pending' | 'accepted' | 'rejected';
	receiverEmail: string;
	receiverName: string | null;
	receiverAvatarUrl: string | null;
	createdAt: Date;
	positionOffered: string;
	roleOffered: 'manager' | 'member';
}

export interface ProjectTask { 
    id: number;
    title: string | null;
    description: string;
    priority: 'low' | 'high' | 'middle';
    deadline: Date;
    subtasks: Subtask[] | undefined;
    assignedBy: {
        name: string,
        avatarUrl: string | null,
		id: number
    };
    assignedTo: {
        name: string,
        avatarUrl: string | null,
		id: number
    };
    status: 'ongoing' | 'closed' | 'rejected' | 'under review' | 'overdue';
    history: TaskHistory[];
    createdAt: Date;
}

export interface ProjectTeam {
	id: number;
	name: string | null;
	email: string;
	avatarUrl: string | null;
	position: string;
	role: string;
}

export interface ProjectMetaData {
	id: number;
	title: string;
	status: 'active' | 'paused' | 'completed';
	createdAt: Date;
}

export interface ProjectDetails {
	metaData: ProjectMetaData;
	team: ProjectTeam[];
    tasks: ProjectTask[];
    invites: ProjectInvite[];
	currentMemberId: number;
	currentMemberRole: string;
}
