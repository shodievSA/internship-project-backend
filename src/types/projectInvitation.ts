export interface InviteType {
    invites: {
        id: number,
		status: "pending" | "accepted" | "rejected" | undefined,
		receiverName: string | null | undefined,
		receiverEmail: string,
		receiverAvatarUrl: string | null | undefined,
		positionOffered: string,
		roleOffered: "manager" | "member" | undefined,
		createdAt: Date,
    };

    project: {
        title: string | undefined,
    }
}

export interface FrontInvite { 
    id : number;
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