import api from './api';
import toast from 'react-hot-toast';

/**
 * Runs the full Buy Now → Razorpay → verify flow for a digital product.
 * @param {Object} opts
 * @param {string} opts.productId
 * @param {string} [opts.productTitle]
 * @param {() => void} [opts.onSuccess]
 * @param {() => void} [opts.onClose]
 */
export async function buyDigitalProduct({ productId, productTitle, onSuccess, onClose }) {
  // Step 1: Create digital order via Buy Now
  const { data: order } = await api.post('/digital-purchases/buy-now', { productId });
  const orderId = order.digitalOrderId;
  const amount = order.amount;

  // Step 2: Create Razorpay payment
  const { data: payData } = await api.post('/payments/digital/create-order', {
    digitalOrderId: orderId,
    amount,
  });

  // Step 3: Open Razorpay
  const options = {
    key: payData.keyId,
    amount: amount * 100,
    currency: 'INR',
    name: 'Sumit Digital',
    description: productTitle ? `Purchase: ${productTitle}` : 'Digital Purchase',
    order_id: payData.razorpayOrderId,
    theme: { color: '#4f46e5' },
    handler: async (response) => {
      try {
        await api.post('/payments/digital/verify', {
          digitalOrderId: orderId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        toast.success('Purchase successful! Go to My Library to download.');
        onSuccess?.();
      } catch {
        toast.error('Payment verification failed. Please contact support.');
      }
    },
    modal: {
      ondismiss: async () => {
        try {
          await api.post('/payments/handle-failure', {
            orderId,
            type: 'digital',
            reason: 'user_dismissed',
          });
        } catch {
          // ignore
        }
        toast('Purchase cancelled.', { icon: 'ℹ️' });
        onClose?.();
      },
    },
  };
  const rzp = new window.Razorpay(options);
  rzp.open();
}
