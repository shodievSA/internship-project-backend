import sequelize from '../clients/sequelize';
import { DataTypes } from 'sequelize';

const DailyAiReport = sequelize.define('DailyAiReport', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  report: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'daily_ai_reports',
  underscored: true,
  timestamps: true,
});

export default DailyAiReport;