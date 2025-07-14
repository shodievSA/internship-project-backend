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
	PROJECT_INVITE_ACCEPT = 'PROJECT_INVITE_ACCEPT',
	PROJECT_INVITE_REJECT = 'PROJECT_INVITE_REJECT',
	PROMOTE_DEMOTE_MEMBER = 'PROMOTE_DEMOTE_MEMBER',
}

type GmailMap = {
    [GmailType.PROJECT_INVITE]: InviteGmailParam;
    [GmailType.LEAVE_PROJECT]: LeaveGmailParam;
    [GmailType.CHANGE_TASK_STATUS]: ChangeTaskStatusGmailParam;
    [GmailType.REMOVE_TEAM_MEMBER]: RemoveTeamMemberGmailParam;
	[GmailType.NEW_TASK]: NewTaskGmailParam;
	[GmailType.REASSIGN_TASK]: ReassignTaskGmailParam;
	[GmailType.UPDATED_TASK]: UpdatedTaskGmailParam;
	[GmailType.PROJECT_INVITE_ACCEPT]: InviteAcceptGmailParam;
	[GmailType.PROJECT_INVITE_REJECT]: InviteRejectGmailParam;
	[GmailType.PROMOTE_DEMOTE_MEMBER]: PromoteDemoteMemberGmailParam;
};

type InviteGmailParam = readonly [
    projectTitle: string,
    roleOffered: string,
    positionOffered: string,
]

type InviteAcceptGmailParam = readonly [
    projectTitle: string,
    userRole: string,
    userPosition: string,
	projectId: number,
]

type InviteRejectGmailParam = readonly [
    projectTitle: string,
    roleOffered: string,
    positionOffered: string,
	projectId: number,
]

type PromoteDemoteMemberGmailParam = readonly [
    projectTitle: string,
    userRole: string,
	projectId: number,
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
	projectId: number,
]

type UpdatedTaskGmailParam = readonly [
	projectTitle: string,
	taskTitle: string,
	projectId: number,
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
			subject: '📬 Project Invitation',
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

class ProjectInviteAccept extends Gmail<InviteAcceptGmailParam> {
    async sendGmail(receiverEmail: string, params: InviteAcceptGmailParam) {

        const [projectTitle, userRole, userPosition, projectId] = params;

        await transporter.sendMail({
						
			to: receiverEmail,
			from: process.env.EMAIL,
			subject: '📬 Project Invitation Acceptance',
			html: buildEmailHTML({
				headerColor: 'rgb(21, 211, 21)',
				title: 'Your project invitation has been accepted!',
				projectTitle,
				role: userRole,
				position: userPosition,
				buttonText: 'View notification in the app',
				buttonColor: 'rgb(21, 211, 21)',
				buttonLink: `${process.env.FRONTEND_URL}/projects/${projectId}/team`
			})
		});
    }
}

class ProjectInviteReject extends Gmail<InviteRejectGmailParam> {
    async sendGmail(receiverEmail: string, params: InviteRejectGmailParam) {

        const [projectTitle, roleOffered, positionOffered, projectId] = params;

        await transporter.sendMail({
						
			to: receiverEmail,
			from: process.env.EMAIL,
			subject: '📬 Project Invitation Rejection',
			html: buildEmailHTML({
				headerColor: 'rgb(255, 0, 0)',
				title: 'Your project invitation has been rejected!',
				projectTitle,
				role: roleOffered,
				position: positionOffered,
				buttonText: 'View notification in the app',
				buttonColor: 'rgb(255, 0, 0)',
				buttonLink: `${process.env.FRONTEND_URL}/projects/${projectId}/invites`
			})
		});
    }
}

class PromoteDemoteMember extends Gmail<PromoteDemoteMemberGmailParam> {
    async sendGmail(receiverEmail: string, params: PromoteDemoteMemberGmailParam) {

        const [projectTitle, userRole, projectId] = params;

        await transporter.sendMail({
						
			to: receiverEmail,
			from: process.env.EMAIL,
			subject: '📬 Role Update',
			html: buildEmailHTML({
				headerColor: 'rgb(87, 103, 192)',
				title: 'Your role in the project has been updated!',
				projectTitle,
				role: `Your new role is: ${userRole}`,
				buttonText: 'View in the app',
				buttonColor: 'rgb(87, 103, 192)',
				buttonLink: `${process.env.FRONTEND_URL}/projects/${projectId}/team`
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
				buttonLink: `${process.env.FRONTEND_URL}/projects/${projectId}/my-tasks`
			})
		});
    }
}

class ReassignTask extends Gmail<ReassignTaskGmailParam> {
    async sendGmail(receiverEmail: string, params: ReassignTaskGmailParam) {

        const [projectTitle, taskTitle, projectId] = params;

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
				buttonLink: `${process.env.FRONTEND_URL}/projects/${projectId}/my-tasks`
			})
		});
    }
}

class UpdatedTask extends Gmail<UpdatedTaskGmailParam> {
    async sendGmail(receiverEmail: string, params: UpdatedTaskGmailParam) {

        const [projectTitle, taskTitle, projectId] = params;

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
				buttonLink: `${process.env.FRONTEND_URL}/projects/${projectId}/my-tasks`
			})
		});
    }
}

export class GmailSenderFactory {

	private static instanceMap: Partial<Record<GmailType, Gmail<any>>> = {};

    static sendGmail<T extends GmailType>(type: T): Gmail<GmailMap[T]> {
		if (this.instanceMap[type]) {
			return this.instanceMap[type] as Gmail<GmailMap[T]>;
		}

		let instance: Gmail<any>;

        switch (type) {
            case GmailType.PROJECT_INVITE:
                instance = new ProjectInvite() as Gmail<GmailMap[T]>;
				break;

			case GmailType.PROJECT_INVITE_ACCEPT:
				instance = new ProjectInviteAccept() as Gmail<GmailMap[T]>;
				break;

			case GmailType.PROJECT_INVITE_REJECT:
				instance = new ProjectInviteReject() as Gmail<GmailMap[T]>;
				break;

			case GmailType.PROMOTE_DEMOTE_MEMBER:
				instance = new PromoteDemoteMember() as Gmail<GmailMap[T]>;
				break;

            case GmailType.LEAVE_PROJECT:
                instance = new LeaveProject() as Gmail<GmailMap[T]>;
				break;

            case GmailType.CHANGE_TASK_STATUS:
				instance = new ChangeTaskStatus() as Gmail<GmailMap[T]>;
				break;

            case GmailType.REMOVE_TEAM_MEMBER:
                instance = new RemoveTeamMember() as Gmail<GmailMap[T]>;
				break;

			case GmailType.NEW_TASK:
               	instance = new NewTask() as Gmail<GmailMap[T]>;
				break;

			case GmailType.REASSIGN_TASK:
                instance = new ReassignTask() as Gmail<GmailMap[T]>;
				break;

			case GmailType.UPDATED_TASK:
                instance = new UpdatedTask() as Gmail<GmailMap[T]>;
				break;

            default:
                const _exhaustiveCheck: never = type;
                throw new AppError(`Unhandled task status: ${_exhaustiveCheck}`);
        }

		this.instanceMap[type] = instance;
		return instance as Gmail<GmailMap[T]>;

    }
}