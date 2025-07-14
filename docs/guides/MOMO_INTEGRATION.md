# MoMo Payment Integration Guide

## Overview

This guide explains how to integrate MoMo payment into your e-commerce application. The integration includes creating payment requests, handling callbacks, and managing order status updates.

## 🚀 Features Implemented

- ✅ MoMo payment request creation
- ✅ Signature generation and verification
- ✅ IPN (Instant Payment Notification) handling
- ✅ Order status management
- ✅ Return URL handling
- ✅ Payment status tracking
- ✅ Database integration
- ✅ Error handling and validation

## 📁 Files Created/Modified

### New Files Created:

1. `src/configs/momo.config.js` - MoMo configuration
2. `src/services/payment/momo.service.js` - MoMo payment service
3. `src/controllers/momo.controller.js` - MoMo payment controller
4. `src/routes/momo/index.js` - MoMo routes
5. `test-momo.js` - Test script and integration guide

### Modified Files:

1. `src/routes/index.js` - Added MoMo routes
2. `src/models/payment/payment.js` - Added MoMo support
3. `src/models/order/order.js` - Added payment status
4. `src/services/order/order.service.js` - Added MoMo integration
5. `src/controllers/order.controller.js` - Added MoMo order creation
6. `src/routes/order/index.js` - Added MoMo order route
7. `.env` - Added MoMo configuration

## 🔧 Configuration

### Environment Variables (.env)

```bash
# MoMo Payment Configuration
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_ENDPOINT=https://test-payment.momo.vn
MOMO_REDIRECT_URL=http://localhost:3055/v1/api/momo/return
MOMO_IPN_URL=http://localhost:3055/v1/api/momo/ipn
FRONTEND_URL=http://localhost:3000
```

**⚠️ Note:** These are TEST credentials. Replace with PRODUCTION credentials for live environment.

## 🌐 API Endpoints

### 1. Create MoMo Payment

```http
POST /v1/api/momo/create-payment
Content-Type: application/json

{
    "orderId": "ORDER123",
    "amount": 50000,
    "orderInfo": "Thanh toán đơn hàng",
    "extraData": ""
}
```

**Response:**

```json
{
    "status": 201,
    "message": "Tạo thanh toán MoMo thành công",
    "metadata": {
        "payUrl": "https://payment.momo.vn/pay/...",
        "deeplink": "momo://...",
        "qrCodeUrl": "https://payment.momo.vn/qrcode/...",
        "orderId": "ORDER123",
        "requestId": "ORDER123_1640995200000",
        "amount": 50000
    }
}
```

### 2. Create Order with MoMo Payment

```http
POST /v1/api/order/momo
Content-Type: application/json
x-user-id: USER_ID

{
    "cart": {
        "id": 1,
        "lineItems": [...]
    },
    "addressId": 1,
    "shippingMethodId": 1,
    "note": "Ghi chú đơn hàng",
    "shippingFee": 30000,
    "orderInfo": "Thanh toán đơn hàng"
}
```

### 3. MoMo Return URL (GET)

```http
GET /v1/api/momo/return?orderId=123&resultCode=0&message=Success
```

### 4. MoMo IPN Webhook (POST)

```http
POST /v1/api/momo/ipn
Content-Type: application/json

{
    "partnerCode": "MOMO",
    "orderId": "ORDER123",
    "requestId": "ORDER123_1640995200000",
    "amount": "50000",
    "orderInfo": "Thanh toán đơn hàng",
    "orderType": "momo_wallet",
    "transId": "13014845",
    "resultCode": "0",
    "message": "Successful.",
    "payType": "qr",
    "responseTime": "1640995123456",
    "extraData": "",
    "signature": "..."
}
```

### 5. Get Payment Status

```http
GET /v1/api/momo/status/{orderId}
```

## 🔄 Payment Flow

1. **Order Creation**: User creates order with MoMo payment option
2. **Payment Request**: System calls MoMo API to generate payment URL
3. **User Redirect**: User is redirected to MoMo payment page
4. **Payment Processing**: User completes payment on MoMo
5. **IPN Callback**: MoMo sends webhook to confirm payment
6. **Signature Verification**: System verifies webhook signature
7. **Order Update**: System updates order and payment status
8. **Stock Management**: System updates product stock and inventory
9. **User Redirect**: User returns to success/failure page

## 💾 Database Changes

### Payment Model Updates

- Added `payment_method` enum field with 'momo' option
- Added `transaction_id` for MoMo transaction tracking
- Added `gateway_response` for storing full MoMo responses
- Updated status enum to include 'completed', 'failed', 'cancelled'

### Order Model Updates

- Added `pending_payment` and `payment_failed` status options
- Enhanced order flow to handle payment pending states

## 🧪 Testing

Run the test script to verify integration:

```bash
node test-momo.js
```

This script will:

- Test signature generation
- Test signature verification
- Display API endpoints
- Show environment setup guide
- Explain integration flow

## 🔐 Security Features

1. **HMAC SHA256 Signature**: All requests/responses are signed with HMAC SHA256
2. **Signature Verification**: All IPN callbacks are verified before processing
3. **Environment Variables**: Sensitive credentials stored in environment variables
4. **Error Handling**: Comprehensive error handling for all scenarios
5. **Transaction Safety**: Database transactions ensure data consistency

## 📝 Usage Examples

### Frontend Integration Example

```javascript
// Create order with MoMo payment
const createMoMoOrder = async (orderData) => {
    try {
        const response = await fetch('/v1/api/order/momo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId,
            },
            body: JSON.stringify(orderData),
        });

        const result = await response.json();

        if (result.status === 201) {
            // Redirect to MoMo payment URL
            window.location.href = result.metadata.momoPayment.payUrl;
        }
    } catch (error) {
        console.error('Payment creation failed:', error);
    }
};
```

### Check Payment Status

```javascript
const checkPaymentStatus = async (orderId) => {
    try {
        const response = await fetch(`/v1/api/momo/status/${orderId}`);
        const result = await response.json();
        return result.metadata;
    } catch (error) {
        console.error('Status check failed:', error);
    }
};
```

## 🚨 Error Handling

The integration includes comprehensive error handling for:

- Invalid signatures
- Network timeouts
- MoMo API errors
- Database transaction failures
- Missing or invalid parameters

## 📱 Production Deployment

For production deployment:

1. **Update Environment Variables**:

    - Replace test credentials with production credentials
    - Update URLs to production domains
    - Set proper HTTPS URLs for IPN and redirect URLs

2. **MoMo Account Setup**:

    - Register for MoMo Business account
    - Get production credentials from MoMo
    - Configure webhook URLs in MoMo dashboard

3. **SSL Certificate**:

    - Ensure HTTPS is enabled for IPN endpoints
    - MoMo requires HTTPS for production webhooks

4. **Testing**:
    - Test with small amounts first
    - Verify webhook delivery
    - Test error scenarios

## 🤝 Support

For MoMo-specific issues, refer to:

- [MoMo Developer Documentation](https://developers.momo.vn/)
- [MoMo API Reference](https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method)

For implementation issues, check the test script and error logs.

## 📋 Checklist

- [x] MoMo configuration setup
- [x] Payment service implementation
- [x] Controller and routes setup
- [x] Database model updates
- [x] Order integration
- [x] Signature verification
- [x] IPN handling
- [x] Error handling
- [x] Testing script
- [x] Documentation
- [ ] Production credentials setup (when ready)
- [ ] SSL certificate for webhooks (for production)
- [ ] Frontend integration testing
