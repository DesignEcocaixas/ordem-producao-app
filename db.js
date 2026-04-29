const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'ordem_user',
  password: '23!Bestdavidx',
  database: 'ordem_producao',
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;

/* const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'ordem_producao',
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool; */