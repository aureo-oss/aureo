const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();

// Get your webhook secret from Razorpay Dashboard
const RAZORPAY_WEBHOOK_SECRET = 'your_webhook_secret_from_razorpay_dashboard';

exports.handleRazorpayWebhook = functions.https.onRequest(async (req, res) => {
  try {
    // 1. Verify signature
    const razorpaySignature = req.headers['x-razorpay-signature'];
    const hmac = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET);
    hmac.update(JSON.stringify(req.body));
    const generatedSignature = hmac.digest('hex');

    if (razorpaySignature !== generatedSignature) {
      console.error('Invalid signature');
      return res.status(401).send('Invalid signature');
    }

    // 2. Handle different event types
    const eventType = req.body.event;
    const paymentData = req.body.payload.payment?.entity;

    switch(eventType) {
      case 'payment.captured':
        await handleSuccessfulPayment(paymentData);
        break;
      
      case 'payment.failed':
        await handleFailedPayment(paymentData);
        break;

      default:
        console.log('Unhandled event type:', eventType);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

async function handleSuccessfulPayment(payment) {
  if (!payment.notes || !payment.notes.invoiceId) {
    throw new Error('Missing invoice ID in payment notes');
  }

  const invoiceRef = admin.firestore().collection('invoices').doc(payment.notes.invoiceId);

  await invoiceRef.update({
    status: 'Paid',
    paymentId: payment.id,
    paymentDate: admin.firestore.FieldValue.serverTimestamp(),
    amountPaid: payment.amount / 100  // Convert from paise to INR
  });
}

async function handleFailedPayment(payment) {
  // Add your failed payment handling logic here
  console.log('Payment failed:', payment.id);
}