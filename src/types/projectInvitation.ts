import ProjectInvitation from '@/models/projectInvitation';

export interface Invite {
    projectInvitation: ProjectInvitation;
	fullInvite: ProjectInvitation | null;
}