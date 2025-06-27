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
