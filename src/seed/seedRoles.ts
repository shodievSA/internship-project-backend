import { logger } from '@/config/logger';
import Role from '../models/role';

const predefinedRoles = ['admin', 'manager', 'member'];

export default async function seedRoles() {

	try {

		for (const roleName of predefinedRoles) {

			await Role.findOrCreate({ where: { name: roleName } });

		}

    	logger.info("roles seeded successfully");

  	} catch (err) {

	  	throw err

  	}

} 