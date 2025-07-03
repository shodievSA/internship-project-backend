import cron from 'node-cron';
import Task from '../models/task';
import { Op } from 'sequelize';
import { AppError } from '@/types';

async function markOverdueTasks() {
    try {
        const now = new Date();
        const [updatedCount] = await Task.update(
            { status: 'overdue' },
            {
                where: {
                    deadline: { [Op.lt]: now },
                    status: ['ongoing', 'under review', 'rejected'],
                },
            }
        );
        if (updatedCount > 0) {
            console.log(`Marked ${updatedCount} tasks as overdue.`);
        }
    } catch (err) {
        throw new AppError(`Error marking overdue tasks: ${err}`);
    }
}

export async function startCronJobs() {
    // Start the cron job: every day at 00:00:10
    cron.schedule('10 0 0 * * *', markOverdueTasks);



    // Run once immediately on server start
    await markOverdueTasks();
}

export { markOverdueTasks }; 