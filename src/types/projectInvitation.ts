export interface InviteType {
    invite: {
        id: number,
		status: "pending" | "accepted" | "rejected" | undefined,
		receiverName: string | null | undefined,
		receiverEmail: string,
		receiverAvatarUrl: string | null | undefined,
		positionOffered: string,
		roleOffered: "manager" | "member" | undefined,
		createdAt: Date,
    };
}

export interface FrontInvite { 
    id : number;
	projectId: number;
    project: { 
        title : string;
    };
    from : { 
        fullName : string ,
        email : string , 
        avatarUrl : string  | null,
    }
    positionOffered : string , 
    roleOffered : 'manager' | 'member', 
    status : 'pending' | 'accepted' | 'rejected', 
    createdAt : Date, 
    updatedAt : Date
}