import sequelize from '../config/sequelize';
import {
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional
} from 'sequelize';
import User from './user';

export interface ProjectMemberAssociations {
  	user: User;
    project: any;
    role: Function
}

class ProjectMember extends Model<
	InferAttributes<ProjectMember, { omit: keyof ProjectMemberAssociations }>,
	InferCreationAttributes<ProjectMember, { omit: keyof ProjectMemberAssociations }>
> {
	declare id: CreationOptional<number>;
	declare userId: number;
	declare projectId: number;
	declare roleId: number;
	declare position: string;
	declare busyLevel: CreationOptional<'free' | 'low' | 'medium' | 'high'>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
    
	declare user: User;
	declare project: any;

    get role (): string { 
        const roles: Record<number, string > = {
            1: 'admin',
            2: 'manager',
            3: 'member'
        };

        return roles[this.roleId];
        
    }
}

ProjectMember.init(
  	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		userId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id'
			},
			onDelete: 'CASCADE'
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
		roleId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'roles',
				key: 'id'
			}
		},
		position: {
			type: DataTypes.STRING(50),
			allowNull: false,
			validate: {
				notEmpty: true,
				len: [1, 50],
			}
		},
		busyLevel: {
			type: DataTypes.ENUM('free', 'low', 'medium', 'high'),
			allowNull: false,
			defaultValue: 'free'
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
		sequelize,
		underscored: true
	}
);

export default ProjectMember;
