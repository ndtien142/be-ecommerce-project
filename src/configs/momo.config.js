'use strict';

const config = {
    partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
    accessKey: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
    secretKey:
        process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn',
    redirectUrl:
        process.env.MOMO_REDIRECT_URL ||
        'http://localhost:3000/payment/momo/return',
    ipnUrl:
        process.env.MOMO_IPN_URL || 'http://localhost:3000/payment/momo/ipn',
    requestType: 'payWithMethod',
    partnerName: 'Test',
    storeId: 'MomoTestStore',
    lang: 'vi',
    autoCapture: true,
    orderGroupId: '',
};

module.exports = config;
