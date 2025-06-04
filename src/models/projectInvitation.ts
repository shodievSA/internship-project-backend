import sequelize from '../clients/sequelize';
import { DataTypes } from 'sequelize';

const ProjectInvitation = sequelize.define('ProjectInvitation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'project_id',
    references: {
      model: 'projects',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },

  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },

  receiverEmail: {
    type: DataTypes.STRING(320),
    allowNull: false,
    field: 'receiver_email',
    validate: {
      isEmail: true,
    },
  },

  receiverName: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'receiver_name',
  },

  receiverAvatarUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'receiver_avatar_url',
  },

  positionOffered: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'position_offered',
  },

  roleOffered: {
    type: DataTypes.ENUM('manager', 'member'),
    allowNull: false,
    field: 'role_offered',
  },
}, {
  tableName: 'project_invitations',
  timestamps: true,
  underscored: true,
});

export default ProjectInvitation;