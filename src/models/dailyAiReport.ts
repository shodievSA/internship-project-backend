import sequelize from '../clients/sequelize';
import {
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
} from 'sequelize';
import User from './user';

export interface DailyAiReportAssociations {
  	User?: User;
}

class DailyAiReport extends Model<
	InferAttributes<DailyAiReport, { omit: keyof DailyAiReportAssociations }>,
	InferCreationAttributes<DailyAiReport>
> {
	declare id: CreationOptional<number>;
	declare report: string;
	declare userId: number;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
	declare User?: User;
}

DailyAiReport.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		report: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		userId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id',
			}
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
		underscored: true,
	}
);

export default DailyAiReport;
