import { models } from "@/models";
import { AppError } from "@/types";
import { Transaction } from "sequelize";

export async function createNotification(
    userId: number, 
    projectId: number,
    taskTitle: string, 
    transaction?: Transaction,
    option = ''
) { 

    try { 

        if (!userId ) { 
            throw new AppError('No such user to send notification')
        }

        const project = await models.Project.findByPk(projectId, {transaction})
        
        if (option === 'newTask') { 
            
            await models.Notification.create(
				{
					title: "New Task",
					message: `Project: ${project?.title}\nAssigned new task!`,
					userId: userId
            	},
				{ transaction }
			);
        }
        if ( option === 'reassignTask'){
                
            await models.Notification.create(
				{
					title: "Task reassigned",
					message: `Project: ${project?.title}\nYour task: ${taskTitle} was removed from your tasks by authority`,
					userId: userId
            	},
				{ transaction }
			);
        }

        if ( option === 'updatedTask'){
                
            await models.Notification.create(
				{
					title: "Task updated",
					message: `Project: ${project?.title}\nYour task: ${taskTitle} was updated by authority`,
					userId: userId
            	},
				{ transaction }
			);
        }





    }catch ( error) { 
        throw error
    }
    
}