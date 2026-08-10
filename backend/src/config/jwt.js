const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  secret: process.env.JWT_SECRET || 'karviyam_super_secret_jwt_key_2026_prod',
  expiresIn: '7d'
};
