'use strict';

module.exports = {

	async up(queryInterface, Sequelize) {
		
		await queryInterface.removeColumn('tasks', 'file_attachments');

	},

	async down(queryInterface, Sequelize) {
		
		await queryInterface.addColumn('tasks', 'file_attachments', {
			type: Sequelize.JSONB,
			allowNull: true
		});

	}

};
