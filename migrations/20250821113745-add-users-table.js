'use strict';

module.exports = {

	async up (queryInterface, Sequelize) {
		
		await queryInterface.changeColumn('tasks', 'title', {
			type: Sequelize.STRING(100)
		})

	},

	async down (queryInterface, Sequelize) {
		
		await queryInterface.changeColumn('tasks', 'title', {
			type: Sequelize.STRING(50)
		})

	}

};
