import sequelize from '../clients/sequelize';
import { DataTypes } from 'sequelize';

const ProjectMember = sequelize.define('ProjectMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
        model: 'users',
        key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },

  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'project_id',
    references: {
        model: 'projects',
        key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },

  roleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'role_id',
    references: {
        model: 'roles',
        key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
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
    allowNull: true,
    field: 'busy_level',
		defaultValue : 'free',
  },

  joinedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'joined_at',
  },
}, {
  tableName: 'project_members',
  timestamps: true,
  underscored: true
});

export default ProjectMember;