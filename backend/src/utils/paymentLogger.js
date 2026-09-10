const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
const logFile = path.join(logDir, 'payment-errors.log');

exports.logPaymentError = (context) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    provider: context.provider || 'Razorpay',
    orderId: context.orderId || null,
    subscriptionId: context.subscriptionId || null,
    transactionReference: context.transactionReference || null,
    amount: context.amount || 0,
    amountInPaise: context.amountInPaise || 0,
    vpa: context.vpa || '',
    httpStatus: context.httpStatus || 500,
    errorCode: context.errorCode || 'UNKNOWN_ERROR',
    errorDescription: context.errorDescription || 'No description provided',
    errorSource: context.errorSource || null,
    errorReason: context.errorReason || null,
    rawError: context.rawError || null
  };

  const formattedLog = `\n==================================================\n[PAYMENT ERROR LOG] - ${timestamp}\n` +
    `Provider: ${logEntry.provider}\n` +
    `Order ID: ${logEntry.orderId} | Sub ID: ${logEntry.subscriptionId}\n` +
    `Txn Ref: ${logEntry.transactionReference}\n` +
    `Amount: ₹${logEntry.amount} (${logEntry.amountInPaise} paise)\n` +
    `VPA/UPI: ${logEntry.vpa}\n` +
    `HTTP Status: ${logEntry.httpStatus}\n` +
    `Error Code: ${logEntry.errorCode}\n` +
    `Description: ${logEntry.errorDescription}\n` +
    `Source: ${logEntry.errorSource || 'N/A'} | Reason: ${logEntry.errorReason || 'N/A'}\n` +
    `Raw Error Details: ${JSON.stringify(logEntry.rawError || {})}\n` +
    `==================================================\n`;

  console.error(formattedLog);

  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(logFile, formattedLog, 'utf8');
  } catch (err) {
    console.error('[PaymentLogger] Failed to write log file:', err.message);
  }

  return logEntry;
};
