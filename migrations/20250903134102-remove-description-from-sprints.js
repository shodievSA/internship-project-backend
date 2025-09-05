'use strict';


module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn("sprints", "description");
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.addColumn("sprints", "description", {
      type: 'TEXT', 
      allowNull: true,
    });
  }
};
