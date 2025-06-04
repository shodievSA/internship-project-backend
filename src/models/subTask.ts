import sequelize from '../clients/sequelize';
import { DataTypes } from 'sequelize';

const Subtask = sequelize.define('Subtask', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  title: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },

  taskId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'task_id',
    references: {
      model: 'tasks',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'subtasks',
  underscored: true,
  timestamps: true,
});

export default Subtask;