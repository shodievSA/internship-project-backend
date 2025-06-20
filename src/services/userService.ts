import sequelize from '../clients/sequelize';
import { models } from '../models';
import { Transaction } from 'sequelize';
import { UserData, CreateTaskBody, UserProject, ProjectDetails } from '@/types';
import ProjectMember from '@/models/projectMember';
import { ProjectAttributes } from '@/models/project';
import Task from '@/models/task';
import ProjectInvitation from '@/models/projectInvitation';

class UserService {
  async getUserData(userId: number): Promise<UserData | null> {
    try {
      const user = await models.User.findByPk(userId, {
        attributes: [
          'id',
          'email',
          'fullName',
          'avatarUrl',
          'createdAt',
          'lastLoginAt',
        ],
      });

      return user ? (user.toJSON() as UserData) : null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw new Error('Internal server error');
    }
  }

  async createNewProject(
    userId: number,
    title: string,
    position: string
  ): Promise<object> {
    const transaction: Transaction = await sequelize.transaction();
    try {
      const project = await models.Project.create({ title }, { transaction });

      await models.ProjectMember.create(
        {
          userId,
          projectId: project.id,
          position,
          roleId: 1,
        },
        { transaction }
      );

      await transaction.commit();
      return project.toJSON();
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating new project:', error);
      throw new Error('Internal server error');
    }
  }

  async getUserProjects(userId: number): Promise<UserProject[]> {
    try {
      const projects = (await models.Project.findAll({
        attributes: ['id', 'title', 'status', 'createdAt'],
        include: [
          {
            model: models.ProjectMember,
            where: { userId },
            required: true,
          },
        ],
        raw: true,
      })) as ProjectAttributes[];

      const projectsWithStats = await Promise.all(
        projects.map(async (project: ProjectAttributes) => {
          const projectId = project.id;

          const [members, tasks, completedTasks, isAdmin] = await Promise.all([
            models.ProjectMember.count({ where: { projectId } }),
            models.Task.count({ where: { projectId } }),
            models.Task.count({ where: { projectId, status: 'closed' } }),
            models.ProjectMember.findOne({
              where: {
                projectId,
                userId,
                roleId: await models.Role.findOne({
                  where: { name: 'admin' },
                  attributes: ['id'],
                }).then((role) => role?.id),
              },
              raw: true,
            }).then((member) => !!member),
          ]);

          return {
            id: project.id,
            title: project.title,
            status: project.status,
            createdAt: project.createdAt,
            members,
            totalTasks: tasks,
            totalTasksCompleted: completedTasks,
            isAdmin,
          } as UserProject;
        })
      );

      return projectsWithStats;
    } catch (error) {
      console.error('Error fetching user projects:', error);
      throw new Error('Internal server error');
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      const deletedProjectCount = await models.Project.destroy({
        where: { id: projectId },
      });

      if (deletedProjectCount === 0) {
        throw new Error('Project not found');
      }
    } catch (error) {
      console.error('Error deleting the project:', error);
      throw new Error('Internal server error');
    }
  }

  async updateProject(
    projectId: string,
    updatedFields: Partial<{
      title: string;
      status: 'active' | 'paused' | 'completed';
    }>
  ): Promise<object> {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const [count, rows] = await models.Project.update(updatedFields, {
        where: { id: projectId },
        returning: true,
      });

      if (count === 0 || rows.length === 0) {
        throw new Error('Project not found');
      }

      return rows[0].toJSON();
    } catch (error) {
      console.error('Error updating the project:', error);
      throw new Error('Internal server error');
    }
  }

  async getProjectTasks(
    userId: number,
    projectId: number
  ): Promise<ProjectDetails> {
    const project = await models.Project.findByPk(projectId, {
      attributes: ['id', 'title'],
    });

    if (!project) throw new Error('Project not found');

    const teamMembers = await models.ProjectMember.findAll({
      where: { projectId },
      attributes: ['id', 'position', 'roleId'],
      include: [{ model: models.User, attributes: ['fullName', 'email'] }],
    });

    const team = teamMembers.map((pm: ProjectMember) => ({
      id: pm.id as number,
      name: pm.User?.fullName!,
      email: pm.User?.email!,
      position: pm.position,
      role: pm.roleId as number,
    }));

    const tasks = await models.Task.findAll({
      where: { projectId },
      include: [
        {
          model: models.ProjectMember,
          as: 'assignedByMember',
          include: [{ model: models.User, attributes: ['fullName'] }],
        },
        {
          model: models.ProjectMember,
          as: 'assignedToMember',
          include: [{ model: models.User, attributes: ['fullName'] }],
        },
        { model: models.Subtask },
      ],
    });

    const allTasks = tasks.map((task: Task) => ({
      id: task.id as number,
      title: task.title,
      description: task.description as string,
      priority: task.priority,
      deadline: task.deadline,
      subtask: task.Subtasks,
      assignedBy: task.assignedByMember?.User?.fullName as string,
      assignedTo: task.assignedToMember?.User?.fullName as string,
      status: task.status,
    }));

    const myTasks = tasks
      .filter((task: Task) => task.assignedTo === userId)
      .map((task: Task) => ({
        id: task.id as number,
        title: task.title,
        description: task.description,
        priority: task.priority,
        deadline: task.deadline,
        assignedBy: task.assignedByMember?.User?.fullName as string,
        status: task.status,
        subtask: task.Subtasks,
        completion_note: task.completionNote as string | null,
        rejection_reason: task.rejectionReason as string | null,
        approval_note: task.approvalNote as string | null,
      }));

    const assignedTasks = tasks
      .filter((task: Task) => task.assignedBy === userId)
      .map((task: Task) => ({
        id: task.id as number,
        title: task.title,
        description: task.description,
        priority: task.priority,
        deadline: task.deadline,
        assignedTo: task.assignedToMember?.User?.fullName as string,
        subtask: task.Subtasks,
        status: task.status,
        completion_note: task.completionNote as string | null,
        rejection_reason: task.rejectionReason as string | null,
        approval_note: task.approvalNote as string | null,
      }));

    const reviews = tasks
      .filter(
        (task: Task) =>
          task.assignedBy === userId && task.status === 'under review'
      )
      .map((task: Task) => ({
        id: task.id as number,
        title: task.title,
        description: task.description,
        priority: task.priority,
        deadline: task.deadline,
        assignedTo: task.assignedToMember?.User?.fullName as string,
        subtask: task.Subtasks,
        status: task.status,
        completion_note: task.completionNote as string | null,
        rejection_reason: task.rejectionReason as string | null,
        approval_note: task.approvalNote as string | null,
        submitted: task.updatedAt,
      }));

    const invites = await models.ProjectInvitation.findAll({
      where: { projectId },
      include: [
        {
          model: models.User,
          as: 'receiver',
          attributes: ['fullName', 'email', 'avatarUrl'],
        },
      ],
    });

    const formattedInvites = invites.map((invite: ProjectInvitation) => ({
      id: invite.id as number,
      status: invite.status,
      receiver_email: invite.receiver?.email as string,
      receiver_name: invite.receiver?.fullName as string,
      receiver_avatar_url: invite.receiver?.avatarUrl as string | null,
      created_at: invite.createdAt as Date,
      position_offered: invite.positionOffered as string,
      role_offered: invite.roleOffered,
    }));
    return {
      id: project.id as number,
      title: project.title as string,
      team,
      allTasks,
      myTasks,
      assignedTasks,
      reviews,
      invites: formattedInvites,
    } as ProjectDetails;
  }

  async createTask(
    assignerId: number,
    projectId: number,
    body: CreateTaskBody
  ): Promise<object> {
    const transaction = await sequelize.transaction();
    try {
      const task = await models.Task.create(
        {
          title: body.title,
          description: body.description,
          priority: body.priority,
          deadline: body.deadline,
          assignedTo: body.assignedTo,
          assignedBy: assignerId,
          projectId: projectId,
        },
        { transaction }
      );
      if (body.subtasks.length > 0) {
        await models.Subtask.bulkCreate(
          body.subtasks.map((subtask) => ({
            title: subtask,
            taskId: task.get('id'),
          })),
          { transaction }
        );
      }
      await transaction.commit();

      return task.toJSON();
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating task', error);
      throw new Error('Internal server error');
    }
  }
}

export default new UserService();
