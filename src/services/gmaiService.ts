import { AppError } from "@/types";
import { transporter } from "@/config/email";

export enum GmailType {
    PROJECT_INVITE = 'PROJECT_INVITE',
    LEAVE_PROJECT = 'LEAVE_PROJECT',
    CHANGE_TASK_STATUS = 'CHANGE_TASK_STATUS',
    REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
	NEW_TASK = 'NEW_TASK',
	REASSIGN_TASK = 'REASSIGN_TASK',
	UPDATED_TASK = 'UPDATED_TASK',
}

type GmailMap = {
    [GmailType.PROJECT_INVITE]: InviteGmailParam;
    [GmailType.LEAVE_PROJECT]: LeaveGmailParam;
    [GmailType.CHANGE_TASK_STATUS]: ChangeTaskStatusGmailParam;
    [GmailType.REMOVE_TEAM_MEMBER]: RemoveTeamMemberGmailParam;
	[GmailType.NEW_TASK]: NewTaskGmailParam;
	[GmailType.REASSIGN_TASK]: ReassignTaskGmailParam;
	[GmailType.UPDATED_TASK]: UpdatedTaskGmailParam;
};

type InviteGmailParam = readonly [
    projectTitle: string,
    roleOffered: string,
    positionOffered: string,
]

type LeaveGmailParam = readonly [
    projectTitle: string,
    userRole: string,
    userPosition: string
]

type ChangeTaskStatusGmailParam = readonly [
    projectTitle: string,
	emailTitle: string,
    taskTitle: string,
    userRole: string,
    userPosition: string,
	projectId: number,
	tasksType: string,
]

type RemoveTeamMemberGmailParam = readonly [
    projectTitle: string,
]

type NewTaskGmailParam = readonly [
	projectTitle: string,
	taskTitle: string,
	projectId: number,
]

type ReassignTaskGmailParam = readonly [
	projectTitle: string,
	taskTitle: string,
]

type UpdatedTaskGmailParam = readonly [
	projectTitle: string,
	taskTitle: string,
]

function buildEmailHTML({
  headerColor,
  title,
  projectTitle,
  taskTitle,
  role,
  position,
  buttonText,
  buttonColor,
  buttonLink,
}: {
  headerColor: string;
  title: string;
  projectTitle: string;
  taskTitle?: string;
  role?: string;
  position?: string;
  buttonText: string;
  buttonColor: string;
  buttonLink: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
      <h1 style="color:${headerColor};">${title}</h1>
      <h2 style="color: #333; font-size: 22px; margin-top: 20px;">
        Project: ${projectTitle}
      </h2>

      ${taskTitle ? `<h3 style="font-size: 20px;">Task: ${taskTitle}</h3>` : ''}

      ${(role || position) ? `
        <p style="font-size: 16px;">
          ${role ? `<strong>Role:</strong> ${role}<br>` : ''}
          ${position ? `<strong>Position:</strong> ${position}` : ''}
        </p>` : ''
      }

      <a href="${buttonLink}" style="
        display: inline-block;
        margin-top: 20px;
        padding: 10px 20px;
        background-color: ${buttonColor};
        color: white;
        text-decoration: none;
        border-radius: 5px;
        font-weight: bold;
      ">
        ${buttonText}
      </a>
    </div>
  `;
}

abstract class Gmail<T> {
    abstract sendGmail(receiverEmail: string, params: T): Promise<void>;
}

class ProjectInvite extends Gmail<InviteGmailParam> {
    async sendGmail(receiverEmail: string, params: InviteGmailParam) {

        const [projectTitle, roleOffered, positionOffered] = params;

        await transporter.sendMail({
						
			to: receiverEmail,
			from: process.env.EMAIL,
			subject: '📬 Project invitation',
			html: buildEmailHTML({
				headerColor: '#007BFF',
				title: 'You have been invited to a project!',
				projectTitle,
				role: roleOffered,
				position: positionOffered,
				buttonText: 'Accept Invitation',
				buttonColor: '#007BFF',
				buttonLink: `${process.env.FRONTEND_URL}/invites`
			})
		});
    }
}

class LeaveProject extends Gmail<LeaveGmailParam> {
    async sendGmail(receiverEmail: string, params: LeaveGmailParam) {

        const [projectTitle, userRole, userPosition] = params;

        await transporter.sendMail({
						
			to: receiverEmail,
			from: process.env.EMAIL,
			subject: '📬 Leave Project',
			html: buildEmailHTML({
				headerColor: 'rgb(255, 0, 0)',
				title: 'User has left the project!',
				projectTitle,
				role: userRole,
				position: userPosition,
				buttonText: 'View notification in the app',
				buttonColor: 'rgb(255, 0, 0)',
				buttonLink: `${process.env.FRONTEND_URL}/notifications`
			})	
		});
    }
}

class ChangeTaskStatus extends Gmail<ChangeTaskStatusGmailParam> {
    async sendGmail(receiverEmail: string, params: ChangeTaskStatusGmailParam) {

        const [projectTitle, emailTitle, taskTitle, userRole, userPosition, projectId, tasksType] = params;

		let emailColor: string;

		if (emailTitle.endsWith('review!')) {
			emailColor =  'rgb(219, 207, 35)';
		} else if (emailTitle.includes('rejected')) {
			emailColor = 'rgb(255, 0, 0)'
		} else {
			emailColor = 'rgb(11, 177, 11)';
		}

        await transporter.sendMail({
						
			to: receiverEmail,
			from: process.env.EMAIL,
			subject: '📬 Task Status Change',
			html: buildEmailHTML({
				headerColor: emailColor,
				title: emailTitle,
				projectTitle,
				taskTitle,
				role: userRole,
				position: userPosition,
				buttonText: 'View notification in the app',
				buttonColor: emailColor,
				buttonLink: `${process.env.FRONTEND_URL}/projects/${projectId}/${tasksType}`
      		})
		});
    }
}

class RemoveTeamMember extends Gmail<RemoveTeamMemberGmailParam> {
    async sendGmail(receiverEmail: string, params: RemoveTeamMemberGmailParam) {

        const [projectTitle] = params;

        await transporter.sendMail({
						
			to: receiverEmail,
			from: process.env.EMAIL,
			subject: '📬 Project removal',
			html: buildEmailHTML({
				headerColor: 'rgb(255, 0, 0)',
				title: 'You have been removed from the project',
				projectTitle,
				buttonText: 'View notification in the app',
				buttonColor: 'rgb(255, 0, 0)',
				buttonLink: `${process.env.FRONTEND_URL}/notifications`
			})
		});
    }
}

class NewTask extends Gmail<NewTaskGmailParam> {
    async sendGmail(receiverEmail: string, params: NewTaskGmailParam) {

        const [projectTitle, taskTitle, projectId] = params;

        await transporter.sendMail({
						
			to: receiverEmail,
			from: process.env.EMAIL,
			subject: '📬 New Task',
			html: buildEmailHTML({
				headerColor: 'rgb(21, 211, 21)',
				title: 'You have been assigned a new task',
				projectTitle,
				taskTitle,
				buttonText: 'View notification in the app',
				buttonColor: 'rgb(21, 211, 21)',
				buttonLink: `${process.env.FRONTEND_URL}/projects/${projectId}/assigned-tasks`
			})
		});
    }
}

class ReassignTask extends Gmail<ReassignTaskGmailParam> {
    async sendGmail(receiverEmail: string, params: ReassignTaskGmailParam) {

        const [projectTitle, taskTitle] = params;

        await transporter.sendMail({
						
			to: receiverEmail,
			from: process.env.EMAIL,
			subject: '📬 Task Reassign',
			html: buildEmailHTML({
				headerColor: 'rgb(224, 128, 18)',
				title: 'Your task was removed from your tasks by authority',
				projectTitle,
				taskTitle,
				buttonText: 'View notification in the app',
				buttonColor: 'rgb(224, 128, 18)',
				buttonLink: `${process.env.FRONTEND_URL}/notifications`
			})
		});
    }
}

class UpdatedTask extends Gmail<UpdatedTaskGmailParam> {
    async sendGmail(receiverEmail: string, params: UpdatedTaskGmailParam) {

        const [projectTitle, taskTitle] = params;

        await transporter.sendMail({
						
			to: receiverEmail,
			from: process.env.EMAIL,
			subject: '📬 Task Update',
			html: buildEmailHTML({
				headerColor: 'rgb(87, 103, 192)',
				title: 'Your task has been updated',
				projectTitle,
				taskTitle,
				buttonText: 'View notification in the app',
				buttonColor: 'rgb(87, 103, 192)',
				buttonLink: `${process.env.FRONTEND_URL}/notifications`
			})
		});
    }
}

export class GmailSenderFactory {
    static sendGmail<T extends GmailType>(type: T): Gmail<GmailMap[T]> {
        switch (type) {
            case GmailType.PROJECT_INVITE:
                return new ProjectInvite() as Gmail<GmailMap[T]>;
            
            case GmailType.LEAVE_PROJECT:
                return new LeaveProject() as Gmail<GmailMap[T]>;

            case GmailType.CHANGE_TASK_STATUS:
                return new ChangeTaskStatus() as Gmail<GmailMap[T]>;

            case GmailType.REMOVE_TEAM_MEMBER:
                return new RemoveTeamMember() as Gmail<GmailMap[T]>

			case GmailType.NEW_TASK:
                return new NewTask() as Gmail<GmailMap[T]>

			case GmailType.REASSIGN_TASK:
                return new ReassignTask() as Gmail<GmailMap[T]>

			case GmailType.UPDATED_TASK:
                return new UpdatedTask() as Gmail<GmailMap[T]>

            default:
                const _exhaustiveCheck: never = type;
                throw new AppError(`Unhandled task status: ${_exhaustiveCheck}`);
        }
    }
}