import sequelize from "../config/sequelize";
import Task from "./task";
import { 
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from 'sequelize'

export interface TaskFilesAssociations {
    task: Task,
}

class TaskFiles extends Model<
    InferAttributes<TaskFiles, { omit: keyof TaskFilesAssociations }>,
    InferCreationAttributes<TaskFiles, { omit: keyof TaskFilesAssociations }>
> {
    declare id: CreationOptional<number>;
    declare taskId: number;
    declare key: string;
    declare fileName: string;
    declare size: number;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    declare task: Task;
}

TaskFiles.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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

    key: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    fileName: {
        type: DataTypes.STRING,
        allowNull: false
    },

    size: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },

    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize,
    underscored: true,
    tableName: 'task_files',
});

export default TaskFiles;