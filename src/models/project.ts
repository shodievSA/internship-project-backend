import sequelize from '../clients/sequelize';
import { DataTypes } from 'sequelize';

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  title: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
	status : { 
		type : DataTypes.ENUM('active', 'completed', 'paused'),
		defaultValue : 'active',
	},
}, {
  tableName: 'projects',
  timestamps: true,
  underscored: true
});

export default Project;