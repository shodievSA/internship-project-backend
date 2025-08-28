import sequelize from '../config/sequelize';
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional
} from 'sequelize';
import Project from './project';
import User from './user';
import { notificationConnectionsMap } from '../upgradeHandler';

export interface InviteAssociations {
	project: Project;
	user: User;
	inviter: User;
}

class Invite extends Model<
	InferAttributes<Invite, { omit: keyof InviteAssociations }>,
	InferCreationAttributes<Invite, { omit: keyof InviteAssociations }>
> {
	declare id: CreationOptional<number>;
	declare projectId: number;
	declare invitedUserId: number;
	declare invitedBy: number;
	declare status: CreationOptional<'pending' | 'accepted' | 'rejected'>;
	declare positionOffered: string;
	declare roleOffered: 'manager' | 'member';
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
    
	declare project: Project;
	declare user: User;
	declare inviter: User;
}

Invite.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		projectId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'projects',
				key: 'id'
			},
			onDelete: 'CASCADE'
		},
		invitedUserId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id'
			}
		},
		invitedBy: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id'
			}
		},
		status: {
			type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
			allowNull: false,
			defaultValue: 'pending'
		},
		positionOffered: {
			type: DataTypes.STRING(50),
			allowNull: false
		},
		roleOffered: {
			type: DataTypes.ENUM('manager', 'member'),
			allowNull: false
		},
		createdAt: {
			type: DataTypes.DATE,
			allowNull: false
		},
		updatedAt: {
			type: DataTypes.DATE,
			allowNull: false
		}
	},
	{
        hooks: { 
                    afterCreate: async (record, options) => { 

                        const recordWithUserAndProject = await record.reload({ 
                            include : [
                                {
                                    model: Project,
                                    as: 'project',
                                    attributes: ['title']
                                    
                                },
                                {
                                    model : User, 
                                    as: "inviter",
                                    attributes : ['fullName', 'email', 'avatarUrl']
                                }
                            ],
                            transaction : options.transaction,
                        })
                        //send via websocket connection to receiver user              
                        const userWs = notificationConnectionsMap.get(recordWithUserAndProject.invitedUserId);
                        
                        if (userWs) {
        
                            const payload = JSON.stringify ({
                                type: "new-invite",
                                newInvite: { 
                                    id: recordWithUserAndProject.id,
				                    projectId: recordWithUserAndProject.projectId,
				                    project: { 
					                    title: recordWithUserAndProject.project.title,       
				                    },
				                    from: { 
					                    fullName: recordWithUserAndProject.inviter.fullName as string,
					                    email: recordWithUserAndProject.inviter.email,
					                    avatarUrl: recordWithUserAndProject.inviter.avatarUrl,               
				                    },
				                    positionOffered: recordWithUserAndProject.positionOffered,
				                    roleOffered: recordWithUserAndProject.roleOffered,
				                    status: recordWithUserAndProject.status,
				                    createdAt: recordWithUserAndProject.createdAt,
				                    updatedAt: recordWithUserAndProject.updatedAt,
			                    },
                            })
        
                            userWs.send(payload);
                        }
                    }
                },
		sequelize,
		underscored: true
	}
);

export default Invite;
