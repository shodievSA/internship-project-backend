import sequelize from "../clients/sequelize";
import Task from "./task";
import { 
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from 'sequelize'

export interface TaskHistoryAssociations{
    task : Task,
}
class TaskHistory extends Model <
InferAttributes <TaskHistory, {omit : keyof TaskHistoryAssociations}>,
InferCreationAttributes<TaskHistory, {omit : keyof TaskHistoryAssociations}>
> {
    declare id : CreationOptional<number>;
    declare taskId : number;
    declare status :  'ongoing'| 'closed'| 'rejected'| 'under review'| 'overdue' ;
    declare comment : CreationOptional<string>;
    declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

    declare task: Task

}

TaskHistory.init({
    id : {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    taskId : { 
        type: DataTypes.INTEGER,
        allowNull: false ,
        references: { 

            model: 'tasks',
            key: 'id',
        },
        onDelete : 'CASCADE',
    },

    status : {
        type : DataTypes.ENUM ('ongoing', 'closed', 'rejected', 'under review', 'overdue'),
        references : { 
            model: 'tasks',
            key: 'status',
        },
        allowNull: false
    },

    comment : { 
        type: DataTypes.TEXT, 
        allowNull: true,

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
})
export default TaskHistory