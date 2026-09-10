const Razorpay = require('razorpay');
const dotenv = require('dotenv');
dotenv.config();

const keyId = (process.env.RAZORPAY_KEY_ID || '').trim() || 'rzp_test_key_id';
const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim() || 'rzp_test_key_secret';

const isPlaceholder = keyId === 'rzp_test_key_id' || keySecret === 'rzp_test_key_secret';
const isLiveKey = keyId.startsWith('rzp_live_');
const isTestKey = keyId.startsWith('rzp_test_') && !isPlaceholder;

let instance = null;

if (!isPlaceholder) {
  try {
    instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
    console.log(`[Razorpay] Configured with ${isLiveKey ? 'LIVE' : isTestKey ? 'TEST' : 'CUSTOM'} credentials (${keyId.slice(0, 10)}...)`);
  } catch (e) {
    console.error('[Razorpay Initialization Error]:', e.message);
  }
} else {
  console.warn('[Razorpay Config Warning]: Placeholder keys detected (RAZORPAY_KEY_ID=rzp_test_key_id). Please set real Razorpay API keys in Hostinger environment variables.');
}

module.exports = {
  instance,
  keyId,
  keySecret,
  isPlaceholder,
  isLiveKey,
  isTestKey
};
