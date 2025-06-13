import sequelize from '../clients/sequelize';
import { models } from '../models';
import { Transaction, where } from 'sequelize';

interface RawProject {
  id: number;
  title: string;
  createdAt: string;
  status: 'active' | 'paused' | 'completed';
}

interface UserProject {
  id: number;
  title: string;
  createdAt: string;
  status: 'active' | 'paused' | 'completed';
  members: number;
  totalTasks: number;
  totalTasksCompleted: number;
  isAdmin: boolean;
}

interface ProjectDetails {
  id: number;
  title: string;
  team: {
    id: number;
    name: string;
    email: string;
    position: string;
    role: number;
  }[]; // from table project_members where project_id = projectId (which comes from client side);
  allTasks: {
    id: number;
    title: string;
    description: string;
    priority: number;
    deadline: Date;
    assignedBy: string;
    assignedTo: string;
    status: number;
  }[];
  myTasks: {
    id: number;
    title: string;
    description: string;
    priority: number;
    deadline: Date;
    assignedBy: string;
    status: number;
    completion_note: string;
    rejection_reason: string;
    approval_note: string;
  }[]; // tasks where assigned_To = userId (userId comes from client);
  assignedTasks: {
    id: number;
    title: string;
    description: string;
    priority: number;
    deadline: Date;
    assignedTo: string;
    status: number;
    completion_note: string;
    rejection_reason: string;
    approval_note: string;
  }[]; // assigned_by = userId
  reviews: {
    id: number;
    title: string;
    description: string;
    priority: number;
    deadline: Date;
    assignedTo: string;
    status: number;
    completion_note: string;
    rejection_reason: string;
    approval_note: string;
    submitted: Date; // updated_at in table
  }[]; // assigned_by= userId and status="under review"
  invites: {
    id: number;
    status: number; //(ENUM - "pending", "accepted", "rejected")
    receiver_email: string;
    receiver_name: string;
    receiver_avatar_url: string;
    created_at: Date;
    position_offered: string;
    role_offered: string; //(ENUM - "admin","manager", "member")
  }[]; // project_id = projectId that comes from client
}

class UserService {
  async getUserData(userId: number): Promise<object | null> {
    try {
      const user = await models.User.findByPk(userId, {
        attributes: [
          'id',
          'fullName',
          'email',
          'avatarUrl',
          'phoneNumber',
          'createdAt',
          'updatedAt',
        ],
      });

      if (!user) {
        return null;
      }
      return user;
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
          projectId: project.get('id'),
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
        attributes: ['id', 'title', 'createdAt', 'status'],
        include: [
          {
            model: models.ProjectMember,
            attributes: [],
            where: { userId },
            required: true,
          },
        ],
        raw: true,
      })) as unknown as RawProject[];

      const projectsWithStats = await Promise.all(
        projects.map(async (project: RawProject) => {
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
                }).then((role) => role?.get('id')),
              },
              raw: true,
            }).then((member) => !!member),
          ]);

          return {
            id: project.id,
            title: project.title,
            createdAt: project.createdAt,
            status: project.status,
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
        where: {id: projectId}
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
    updatedTitle: string,
    updatedStatus: 'active' | 'paused' | 'completed'
  ): Promise<RawProject> {
    try {
      const [ count, rows ] = await models.Project.update(
        { title: updatedTitle, status: updatedStatus },
        { where: {id: projectId}, returning: true }
      );

      if (count === 0 || rows.length === 0) {
        throw new Error('Project not found');
      }

      return rows[0].toJSON() as RawProject;
    } catch (error) {
      console.error('Error updating the project:', error);
      throw new Error('Internal server error');
    }
  }

  async getProjectTasks(projectId: number, userId: number): Promise<any> {
    const project = await models.Project.findByPk(projectId, {
      attributes: ['id', 'title'],
    });

    if (!project) throw new Error('Project not found');

    const teamMembers = await models.ProjectMember.findAll({
      where: { projectId },
      include: [{ model: models.User, attributes: ['fullName', 'email'] }],
      attributes: ['id', 'position', 'roleId'],
    });

    const team = teamMembers.map((pm: any) => ({
      id: pm.get('id'),
      name: pm.User.fullName,
      email: pm.User.email,
      position: pm.get('position'),
      role: pm.get('roleId'),
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
      ],
    });

    const allTasks = tasks.map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      deadline: task.deadline,
      assignedBy: task.assigned_by?.User?.fullName || 'Unknown',
      assignedTo: task.assigned_to?.User?.fullName || 'Unknown',
      status: task.status,
    }));

    const myTasks = tasks
      .filter((task: any) => task.assigned_to === userId)
      .map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        deadline: task.deadline,
        assignedBy: task.assigned_by?.User?.fullName || 'Unknown',
        status: task.status,
        completion_note: task.completionNote,
        rejection_reason: task.rejectionReason,
        approval_note: task.approvalNote,
      }));

    const assignedTasks = tasks
      .filter((task: any) => task.assigned_by === userId)
      .map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        deadline: task.deadline,
        assignedTo: task.assigned_to?.User?.fullName || 'Unknown',
        status: task.status,
        completion_note: task.completionNote,
        rejection_reason: task.rejectionReason,
        approval_note: task.approvalNote,
      }));

    const reviews = tasks
      .filter(
        (task: any) =>
          task.assigned_by === userId && task.status === 'under review'
      )
      .map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        deadline: task.deadline,
        assignedTo: task.assigned_to?.User?.fullName || 'Unknown',
        status: task.status,
        completion_note: task.completionNote,
        rejection_reason: task.rejectionReason,
        approval_note: task.approvalNote,
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

    const formattedInvites = invites.map((invite: any) => ({
      id: invite.id,
      status: invite.status,
      receiver_email: invite.User.email,
      receiver_name: invite.User.fullName,
      receiver_avatar_url: invite.User.avatarUrl,
      created_at: invite.createdAt,
      position_offered: invite.position,
      role_offered: invite.Role?.name || 'member',
    }));
    return {
      id: project.get('id'),
      title: project.get('title'),
      team,
      allTasks,
      myTasks,
      assignedTasks,
      reviews,
      invites: formattedInvites,
    };
  }
}

export default new UserService();
