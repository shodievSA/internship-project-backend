import { TaskAttributes } from "@/models/task";

export interface RawTask {
  id: number;
  title: string;
  description: string;
  priority: number;
  deadline: Date;
  assignedBy: number;
  assignedTo: number;
  projectId: number;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskUpdatePayload = {
	projectId: number,
	taskId: number,
	filesToAdd: Express.Multer.File[],
	filesToDelete: number[],
	sizes: number[],
	fileNames: string[],
	updatedTaskProps: Partial<TaskAttributes>,
}
