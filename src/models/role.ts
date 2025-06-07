import sequelize from '../clients/sequelize';
import { DataTypes } from 'sequelize';

<<<<<<< HEAD
const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  
  name: {
    type: DataTypes.ENUM('admin', 'manager', 'member'),
    allowNull: false,
    unique: true,
  },

  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'roles',
  timestamps: true,
  underscored: true
});


const predefinedRoles = ['admin', 'manager', 'member'];

sequelize.sync().then(async () => {
  for (const roleName of predefinedRoles) {
    await Role.findOrCreate({ where: { name: roleName } });
  }

  console.log('Predefined roles inserted');
});

export default Role;
=======
const Role = sequelize.define(
  'Role',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.ENUM('admin', 'manager', 'member'),
      allowNull: false,
      unique: true,
    },

    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: 'roles',
    timestamps: true,
    underscored: true,
  }
);

export default Role;
>>>>>>> 313b2626cbf541be14459fc37db6d98aa7a51998
