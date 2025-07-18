import sequelize from '../clients/sequelize';
import {
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
} from 'sequelize';
import User from './user';

export interface CommentAssociations {
	user: User;
}


class AiUsage extends Model<
	InferAttributes<AiUsage, { omit: keyof CommentAssociations }>,
	InferCreationAttributes<AiUsage, { omit: keyof CommentAssociations }>
> {
	declare userId: number;
    declare requestCount: number;
    declare date : Date;

	declare user: User; 
}

AiUsage.init(
	{

		userId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id'
			},
            onDelete: 'CASCADE',
		},

        requestCount: { 
            type: DataTypes.INTEGER,
            allowNull: false, 
            defaultValue: 0,
        },
        
        date : {
            type: DataTypes.DATEONLY, 
            allowNull: false, 
        }

	},
	{   
        indexes : [{
            unique: true,
            fields: ["user_id", "date"],
        }],

        timestamps: false,    
		sequelize,
		underscored: true,
	}
);

export default AiUsage;
