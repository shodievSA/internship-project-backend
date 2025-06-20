import sequelize from '../clients/sequelize';
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import User from './user';

interface DailyAiReportAttributes {
  id: number;
  report: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}
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
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'daily_ai_reports',
    timestamps: true,
    underscored: true,
  }
);

export default DailyAiReport;
