// Entrypoint for Hostinger Node Application Manager
const server = require('./backend/server.js');
const app = require('./backend/src/app.js');

module.exports = app;
module.exports.server = server;
