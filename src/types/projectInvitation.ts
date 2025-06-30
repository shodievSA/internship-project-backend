import Invite from '@/models/invites';

export interface InviteType {
    Invites: Invite;
	fullProdInvite: Invite | null;
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
    created_at : Date, 
    updated_at : Date,

}