import Role from '../models/role';

const predefinedRoles = ['admin', 'manager', 'member'];

export default async function seedRoles () {
	try {
    for (const roleName of predefinedRoles) {
      await Role.findOrCreate({ where: { name: roleName } });
    }

    console.log('Predefined roles inserted');
  } catch (error) {
	  console.error('Error inserting predefined roles:', error);
  }
} 