import Task from "@/models/task";

export interface Notification { 
    id: number;
    message: string;
    projectTitle? : string;
    type: 	
        'invite'|
	    'new task'|
	    'task review'|
	    'task rejection'|
	    'task approval'|
	    'comment'|
	    'task update',
    priority: 'low' | 'middle' | 'high';
    isViewed: boolean;
    userId: number;
    projectId: number | null;
    createdAt: Date;
    task? : Task[] | any ;
    updatedAt: Date;
}
