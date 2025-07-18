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
    assignedBy: {
        name: string,
        avatarUrl: string | null,
		id: number,
		position: string,
		email: string
    };
    assignedTo: {
        name: string,
        avatarUrl: string | null,
		id: number,
		position: string,
		email: string
    };
    status: 'ongoing' | 'closed' | 'rejected' | 'under review' | 'overdue';
    history: TaskHistory[];
    createdAt: Date;
	updatedAt: Date;
}

export interface TeamMember {
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
	team: TeamMember[];
    tasks: ProjectTask[];
    invites: ProjectInvite[];
	currentMemberId: number;
    currentMemberRole : "admin" | "manager" | "member"
}
