import Razorpay from "razorpay";
import crypto from "crypto";
import { createLogger } from "../utils/logger.js";

const log = createLogger('RazorpayService');

let razorpay;

try {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        log.info('init', 'Razorpay initialized successfully');
    } else {
        log.warn('init', 'Razorpay keys are missing. Payment features will fail.');
    }
} catch (error) {
    log.error('init', 'Failed to initialize Razorpay', { message: error.message });
}

export const createRazorpayOrder = async (amount, receiptId) => {
    log.info('createRazorpayOrder', 'Creating Razorpay order', { amount, receiptId });

    if (!razorpay) {
        log.error('createRazorpayOrder', 'Razorpay is not configured');
        throw new Error("Razorpay is not configured. Please check environment variables.");
    }

    const options = {
        amount: Math.round(amount * 100), // Amount in paise
        currency: "INR",
        receipt: receiptId.toString(),
        payment_capture: 1 // Auto capture
    };

    try {
        const order = await razorpay.orders.create(options);
        log.info('createRazorpayOrder', 'Order created successfully', { orderId: order.id, amountPaise: options.amount });
        return order;
    } catch (error) {
        log.error('createRazorpayOrder', 'Failed to create order', { message: error.message });
        throw new Error(`Razorpay Error: ${error.message}`);
    }
};

/**
 * Verify Razorpay payment signature (for order-based flow)
 */
export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
    log.info('verifyRazorpaySignature', 'Verifying payment signature', { orderId, paymentId });

    if (!process.env.RAZORPAY_KEY_SECRET) {
        log.error('verifyRazorpaySignature', 'Razorpay secret is missing');
        throw new Error("Razorpay secret is missing");
    }

    const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(orderId + "|" + paymentId)
        .digest("hex");

    const isValid = generatedSignature === signature;
    log.info('verifyRazorpaySignature', `Signature verification ${isValid ? 'passed' : 'failed'}`, { orderId, paymentId });
    return isValid;
};

/**
 * Verify Razorpay webhook signature.
 * Razorpay sends the webhook secret in the X-Razorpay-Signature header.
 * The body is signed using the webhook secret (not the key_secret).
 * 
 * @param {string|Buffer} body - Raw request body
 * @param {string} signature - X-Razorpay-Signature header value
 * @returns {boolean} Whether the signature is valid
 */
export const verifyWebhookSignature = (body, signature) => {
    log.info('verifyWebhookSignature', 'Verifying webhook signature');

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
        log.error('verifyWebhookSignature', 'Razorpay webhook secret is missing');
        throw new Error("Razorpay webhook secret is missing. Set RAZORPAY_WEBHOOK_SECRET in .env");
    }

    const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");

    const isValid = expectedSignature === signature;
    log.info('verifyWebhookSignature', `Webhook signature verification ${isValid ? 'passed' : 'failed'}`);
    return isValid;
};
