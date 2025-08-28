import sequelize from '../config/sequelize';
import User from './user';
import { DailyReport } from '@/types/dailyReport';
import {
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
} from 'sequelize';

export interface DailyAiReportAssociations {
  	user: User;
}

class DailyAiReport extends Model<
	InferAttributes<DailyAiReport, { omit: keyof DailyAiReportAssociations }>,
	InferCreationAttributes<DailyAiReport, { omit: keyof DailyAiReportAssociations }>
> {
	declare id: CreationOptional<number>;
	declare report: DailyReport;
	declare userId: number;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
    
	declare user: User;
}

DailyAiReport.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		report: {
			type: DataTypes.JSON,
			allowNull: false,
			get() {

				const value = this.getDataValue("report");

				if (typeof value === "string") {

					try {
						return JSON.parse(value);
					} catch (error) {
						return value;
					}

				}

				return value;

			}
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
