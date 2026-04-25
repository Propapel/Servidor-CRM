const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'optivosa1@',
    database: 'prosales'
  });

  const [rows] = await connection.execute('SELECT id, name, fcmToken, refreshToken FROM user ORDER BY id DESC LIMIT 5');
  console.log(JSON.stringify(rows, null, 2));
  
  await connection.end();
}

main().catch(console.error);
