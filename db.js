const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
const useSsl = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';
const rejectUnauthorized = String(process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false';

const sequelizeOptions = {
  dialect: 'mysql',
  logging: false,
  pool: {
    max: Number(process.env.DB_POOL_MAX) || 5,
    min: Number(process.env.DB_POOL_MIN) || 0,
    acquire: Number(process.env.DB_POOL_ACQUIRE) || 30000,
    idle: Number(process.env.DB_POOL_IDLE) || 10000,
  },
};

if (useSsl) {
  sequelizeOptions.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized,
    },
  };
}

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, sequelizeOptions)
  : new Sequelize(
    process.env.DB_NAME || process.env.MYSQLDATABASE || 'ranking_vendas',
    process.env.DB_USER || process.env.MYSQLUSER || 'root',
    process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    {
      ...sequelizeOptions,
      host: process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || process.env.MYSQLPORT) || 3306,
    },
  );

module.exports = { sequelize };
