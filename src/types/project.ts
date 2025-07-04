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

export interface formattedInvites {
	id: number;
	status: 'pending' | 'accepted' | 'rejected'; //(ENUM - "pending", "accepted", "rejected")
	receiverEmail: string;
	receiverName: string | null;
	receiverAvatarUrl: string | null;
	createdAt: Date;
	positionOffered: string;
	roleOffered: 'manager' | 'member'; //(ENUM - "admin","manager", "member")
}


export interface ProjectTaskDetails{ 
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
    history : TaskHistory[]
    createdAt : Date,
}

export type AssignedTaskType = ProjectTaskDetails;
export type ReviewType = Omit<ProjectTaskDetails, 'assignedBy'> & { submitted: Date };

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
	
    allTasks: ProjectTaskDetails[]

	myTasks: ProjectTaskDetails[] // tasks where assigned_To = userId (userId comes from client);
	
    assignedTasks: AssignedTaskType[] //assigned_by = projectMemberId
	
    reviews: ReviewType[]; //assigned_by= userId and status="under review"
	
    invites: formattedInvites[]; // project_id = projectId that comes from client
}
