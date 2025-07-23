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
		id: number,
        name: string,
        email?: string,
		position?: string,
        avatarUrl: string | null,
    };
    assignedTo: {
		id: number,
        name: string,
        email?: string,
		position?: string,
        avatarUrl: string | null,
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

export interface SprintMetaData { 
    id: number;
	title: string;
	description?: string;
	status: 'planned' |'active' | 'closed' | 'overdue';
	projectId: number;
	createdBy: {
        fullName: string | null
        avatarUrl: string | null
        email: string
    };
    totalTasks: number, 
    totalTasksCompleted: number,
    startDate: Date;
    endDate: Date;
}

export interface ProjectDetails {
	metaData: ProjectMetaData;
    tasks: ProjectTask[];
    sprints: SprintMetaData[];
    currentMemberId: number;
    currentMemberRole : "admin" | "manager" | "member"
	team: TeamMember[]
}
