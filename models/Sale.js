const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

function trimString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

const Sale = sequelize.define('Sale', {
  sellerName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
    set(value) {
      this.setDataValue('sellerName', trimString(value));
    },
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
    set(value) {
      this.setDataValue('customerName', trimString(value));
    },
  },
  customerAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
    set(value) {
      this.setDataValue('customerAddress', trimString(value));
    },
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      isInt: true,
      min: 1,
    },
  },
  status: {
    type: DataTypes.ENUM('pendente', 'entregue'),
    allowNull: false,
    defaultValue: 'pendente',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'sales',
});

module.exports = Sale;
