import sequelize from '../config/sequelize';
import {
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional
} from 'sequelize';

class RolePermission extends Model<
	InferAttributes<RolePermission>,
	InferCreationAttributes<RolePermission>
> {
	declare id: CreationOptional<number>;
	declare roleId: number;
	declare permissionId: number;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
}

RolePermission.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		roleId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'roles',
				key: 'id'
			}
		},
		permissionId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'permissions',
				key: 'id'
			}
		},
		createdAt: {
			type: DataTypes.DATE,
			allowNull: false
		},
		updatedAt: {
			type: DataTypes.DATE,
			allowNull: false
		},
	},
	{
		sequelize,
		underscored: true
	}
);

export default RolePermission;
