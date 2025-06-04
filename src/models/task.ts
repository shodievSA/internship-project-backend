import sequelize from '../clients/sequelize';
import { DataTypes } from 'sequelize';

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  title: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  priority: {
    type: DataTypes.ENUM('low', 'middle', 'high'),
    allowNull: false,
  },

  deadline: {
    type: DataTypes.DATE,
    allowNull: false,
  },

  assignedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'assigned_by',
    references: {
      model: 'project_members',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },

  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'assigned_to',
    references: {
      model: 'project_members',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },

  status: {
    type: DataTypes.ENUM('ongoing', 'closed', 'rejected', 'under review', 'overdue'),
    allowNull: false,
    defaultValue: 'ongoing',
  },

  completionNote: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'completion_note',
  },

  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'rejection_reason',
  },

  approvalNote: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'approval_note',
  },
}, {
  tableName: 'tasks',
  underscored: true,
  timestamps: true,
});

export default Task;