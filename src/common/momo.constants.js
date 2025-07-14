'use strict';

const MOMO_RESULT_CODES = {
    SUCCESS: 0,
    INVALID_SIGNATURE: 1,
    INVALID_PARAMETERS: 2,
    INVALID_AMOUNT: 3,
    INVALID_CAPTURE_WALLET: 4,
    TRANSACTION_NOT_FOUND: 5,
    TRANSACTION_FAILED: 6,
    PAYMENT_EXPIRED: 7,
    INSUFFICIENT_BALANCE: 8,
    SYSTEM_ERROR: 9,
    DUPLICATE_REQUEST: 10,
    TRANSACTION_CANCELLED: 11,
    REFUND_FAILED: 12,
    REFUND_AMOUNT_EXCEEDED: 13,
    UNAUTHORIZED: 21,
    FORBIDDEN: 43,
    INVALID_REQUEST: 99,
};

const MOMO_PAYMENT_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired',
    REFUNDED: 'refunded',
    PARTIALLY_REFUNDED: 'partially_refunded',
};

const ORDER_STATUS = {
    PENDING_PAYMENT: 'pending_payment',
    PAYMENT_FAILED: 'payment_failed',
    PAYMENT_EXPIRED: 'payment_expired',
    PAYMENT_CANCELLED: 'payment_cancelled',
    PENDING_CONFIRMATION: 'pending_confirmation',
    PENDING_PICKUP: 'pending_pickup',
    SHIPPING: 'shipping',
    DELIVERED: 'delivered',
    RETURNED: 'returned',
    PARTIALLY_RETURNED: 'partially_returned',
    REFUNDED: 'refunded',
    PARTIALLY_REFUNDED: 'partially_refunded',
    CANCELLED: 'cancelled',
};

const CART_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    ORDERED: 'ordered',
};

const MOMO_PAYMENT_METHODS = {
    MOMO_WALLET: 'momo_wallet',
    CREDIT_CARD: 'credit_card',
    DEBIT_CARD: 'debit_card',
    BANK_TRANSFER: 'bank_transfer',
};

const MOMO_REQUEST_TYPES = {
    CAPTURE_WALLET: 'captureWallet',
    CAPTURE: 'capture',
    CANCEL: 'cancel',
    REFUND: 'refund',
};

const MOMO_ENDPOINTS = {
    CREATE_PAYMENT: '/v2/gateway/api/create',
    QUERY_TRANSACTION: '/v2/gateway/api/query',
    CONFIRM_PAYMENT: '/v2/gateway/api/confirm',
    REFUND_PAYMENT: '/v2/gateway/api/refund',
};

module.exports = {
    MOMO_RESULT_CODES,
    MOMO_PAYMENT_STATUS,
    ORDER_STATUS,
    CART_STATUS,
    MOMO_PAYMENT_METHODS,
    MOMO_REQUEST_TYPES,
    MOMO_ENDPOINTS,
};
