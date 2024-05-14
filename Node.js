// Import the mysql module
const mysql = require('mysql');

// // Create a connection object with the connection details
// const connection = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME
// });

// // Connect to the database
// connection.connect(err => {
//   if (err) {
//     console.error('An error occurred while connecting to the DB');
//     throw err;
//   }
//   console.log('Connected!');
// });

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
}).promise();

// Export the connection and pool
module.exports = { connection, pool };