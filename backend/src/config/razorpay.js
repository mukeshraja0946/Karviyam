const Razorpay = require('razorpay');
const dotenv = require('dotenv');
dotenv.config();

const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_key_id';
const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_key_secret';

let instance = null;
try {
  instance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
} catch (e) {
  console.warn('Razorpay initialization warning:', e.message);
}

module.exports = {
  instance,
  keyId,
  keySecret
};
