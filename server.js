// Hostinger Node.js Application Manager Entrypoint
// Loads the main Node.js / Express backend server
const server = require('./backend/server.js');
const app = require('./backend/src/app.js');

module.exports = app;
module.exports.server = server;
