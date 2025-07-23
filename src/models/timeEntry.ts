import sequelize from '../clients/sequelize';
import {
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
    ForeignKey
} from 'sequelize';
import User from './user';
import Task from './task';

class TimeEntry extends Model<
    InferAttributes<TimeEntry, { omit: 'user' | 'task' }>,
    InferCreationAttributes<TimeEntry, { omit: 'user' | 'task' }>
> {
    declare id: CreationOptional<number>;
    declare startTime: Date;
    declare endTime: CreationOptional<Date | null>;
    declare duration: CreationOptional<number | null>; // in seconds
    declare note: CreationOptional<string | null>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    declare userId: ForeignKey<User['id']>;
    declare taskId: ForeignKey<Task['id']>;

    // Associations
    declare user?: User;
    declare task?: Task;
}

TimeEntry.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        taskId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'tasks',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        startTime: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        endTime: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        duration: {
            type: DataTypes.INTEGER, // Storing duration in seconds
            allowNull: true,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        sequelize,
        underscored: true,
        modelName: 'TimeEntry',
    }
);

export default TimeEntry; 