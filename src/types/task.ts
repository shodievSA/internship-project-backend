export interface CreateTaskBody {
  title: string;
  description: string;
  priority: 'low' | 'middle' | 'high';
  deadline: Date;
  assignedTo: number;
  subtasks: string[];
}
export interface RawTask {
  id: number;
  title: string;
  description: string;
  priority: number;
  deadline: Date;
  assignedTo: number;
  assignedBy: number;
  projectId: number;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
