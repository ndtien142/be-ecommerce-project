# Enhanced MoMo Payment Integration

## Overview

This document outlines the enhanced MoMo payment integration that fully complies with the official MoMo API documentation for one-time payments.

## 🚀 Key Features

### ✅ **Full MoMo API Compliance**
- **Correct endpoint**: Uses `/v2/gateway/api/create` with `captureWallet` request type
- **Complete parameter support**: All optional parameters from MoMo documentation
- **Enhanced validation**: Amount range validation (1,000 - 50,000,000 VND)
- **Proper signature handling**: Both request and response signature verification

### ✅ **Enhanced Product Information**
- **Items support**: Up to 50 items per payment with complete product details
- **Delivery information**: Delivery address, fees, and quantity
- **User information**: Customer name, phone, email for notifications
- **Reference ID**: Additional reference codes for tracking

### ✅ **Complete Response Handling**
- **Multiple payment methods**: payUrl, deeplink, qrCodeUrl, deeplinkMiniApp
- **Enhanced IPN processing**: Handles all callback parameters
- **Promotion tracking**: Supports promotion and voucher information
- **User fee tracking**: Tracks fees charged to users

## 🔧 API Endpoints

### 1. Create Payment

**POST** `/api/v1/momo/create-payment`

#### Request Body (Enhanced)

```json
{
  "orderId": "ORDER_12345_1672900000000_123",
  "amount": 100000,
  "orderInfo": "Thanh toán đơn hàng #12345",
  "extraData": "eyJza3VzIjoiIn0=",
  "items": [
    {
      "id": "PROD_001",
      "name": "Áo thun cotton",
      "description": "Áo thun cotton 100% chất lượng cao",
      "category": "fashion",
      "imageUrl": "https://example.com/product1.jpg",
      "manufacturer": "Fashion Brand",
      "price": 50000,
      "quantity": 2,
      "unit": "piece",
      "taxAmount": 1000
    }
  ],
  "deliveryInfo": {
    "deliveryAddress": "123 Nguyen Van Linh, Q7, TP.HCM",
    "deliveryFee": "30000",
    "quantity": "2"
  },
  "userInfo": {
    "name": "Nguyen Van A",
    "phoneNumber": "0909123456",
    "email": "user@example.com"
  },
  "referenceId": "REF_12345",
  "storeName": "My Store",
  "subPartnerCode": "SUB_PARTNER_01"
}
```

#### Response (Enhanced)

```json
{
  "message": "Tạo thanh toán MoMo thành công",
  "status": 201,
  "metadata": {
    "payUrl": "https://test-payment.momo.vn/v2/gateway/pay?t=...",
    "deeplink": "momo://app?action=payWithApp&serviceType=app&sid=...",
    "qrCodeUrl": "00020101021226110007vn.momo382600...",
    "deeplinkMiniApp": "momo://miniapp?action=pay&sid=...",
    "orderId": "ORDER_12345_1672900000000_123",
    "requestId": "ORDER_12345_1672900000000_123_1672900000000",
    "amount": 100000,
    "responseTime": 1672900000000,
    "userFee": 0
  }
}
```

### 2. IPN Handler (Enhanced)

**POST** `/api/v1/momo/ipn`

#### IPN Request Body (From MoMo)

```json
{
  "orderType": "momo_wallet",
  "amount": 100000,
  "partnerCode": "MOMOT5BZ20231213_TEST",
  "orderId": "ORDER_12345_1672900000000_123",
  "extraData": "eyJza3VzIjoiIn0=",
  "signature": "7b9f4ca728076c32f16041cbc917ebf5e6e7359f0bde343dde3add69a518cf0d",
  "transId": 4088878653,
  "responseTime": 1672900000000,
  "resultCode": 0,
  "message": "Successful.",
  "payType": "qr",
  "requestId": "ORDER_12345_1672900000000_123_1672900000000",
  "orderInfo": "Thanh toán đơn hàng #12345",
  "partnerUserId": "momo_user_123",
  "paymentOption": "momo",
  "userFee": 0,
  "promotionInfo": [
    {
      "amount": 5000,
      "amountSponsor": 3000,
      "voucherId": "VOUCHER_001",
      "voucherType": "Percent",
      "voucherName": "Giảm 5% cho đơn hàng đầu tiên",
      "merchantRate": "60"
    }
  ]
}
```

#### IPN Response

```json
{
  "resultCode": 0,
  "message": "Success"
}
```

## 📝 Enhanced Features

### 1. **Product Items Support**

```javascript
// Example usage in frontend
const paymentData = {
  orderId: generateOrderId(),
  amount: 150000,
  orderInfo: "Thanh toán đơn hàng #12345",
  items: [
    {
      id: "PROD_001",
      name: "Áo thun cotton",
      price: 50000,
      quantity: 2,
      description: "Áo thun cotton 100%",
      category: "fashion",
      imageUrl: "https://example.com/product1.jpg",
      manufacturer: "Fashion Brand",
      unit: "piece",
      taxAmount: 1000
    },
    {
      id: "PROD_002", 
      name: "Quần jeans",
      price: 100000,
      quantity: 1,
      description: "Quần jeans cao cấp",
      category: "fashion",
      imageUrl: "https://example.com/product2.jpg",
      manufacturer: "Jeans Co",
      unit: "piece",
      taxAmount: 2000
    }
  ]
};
```

### 2. **Delivery Information**

```javascript
const deliveryInfo = {
  deliveryAddress: "123 Nguyen Van Linh, Q7, TP.HCM",
  deliveryFee: "30000", // VND
  quantity: "2" // Number of packages
};
```

### 3. **User Information for Notifications**

```javascript
const userInfo = {
  name: "Nguyen Van A",
  phoneNumber: "0909123456",
  email: "user@example.com"
};
```

### 4. **Enhanced Response Handling**

```javascript
// Multiple payment options returned
const response = await MomoPaymentService.createPayment(paymentData);

// Use different payment methods based on platform
if (isMobile) {
  // Redirect to MoMo app
  window.location.href = response.metadata.deeplink;
} else {
  // Show QR code for desktop
  displayQRCode(response.metadata.qrCodeUrl);
  // Or redirect to web payment
  window.location.href = response.metadata.payUrl;
}
```

## 🔐 Security Enhancements

### 1. **Enhanced Signature Verification**

```javascript
// Supports all MoMo callback parameters
static verifySignature(callbackData) {
  const {
    partnerCode, orderId, requestId, amount, orderInfo, orderType,
    transId, resultCode, message, payType, responseTime, extraData,
    signature, partnerUserId, paymentOption, userFee, promotionInfo
  } = callbackData;
  
  // Create signature string according to MoMo documentation
  const rawSignature = `accessKey=${config.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
  
  const expectedSignature = crypto
    .createHmac('sha256', config.secretKey)
    .update(rawSignature)
    .digest('hex');
    
  return signature === expectedSignature;
}
```

### 2. **Amount Validation**

```javascript
// Validate amount range according to MoMo limits
if (amount < 1000 || amount > 50000000) {
  throw new BadRequestError('Amount must be between 1,000 and 50,000,000 VND');
}
```

### 3. **Items Validation**

```javascript
// Validate items array
if (items && items.length > 50) {
  throw new BadRequestError('Maximum 50 items allowed');
}

// Validate each item
items.forEach(item => {
  if (!item.id || !item.name || !item.price || !item.quantity) {
    throw new BadRequestError('Each item must have id, name, price, and quantity');
  }
});
```

## 🎯 Frontend Integration Updates

### 1. **Enhanced Payment Service**

```javascript
// Enhanced MoMo payment service
class MomoPaymentService {
  static async createPayment(paymentData) {
    const response = await api.post('/momo/create-payment', {
      ...paymentData,
      items: paymentData.items || [],
      deliveryInfo: paymentData.deliveryInfo || null,
      userInfo: paymentData.userInfo || null
    });
    return response.data;
  }
}
```

### 2. **Multi-Platform Payment Handling**

```javascript
// Handle different payment methods
const handlePayment = async (paymentData) => {
  try {
    const response = await MomoPaymentService.createPayment(paymentData);
    const { payUrl, deeplink, qrCodeUrl, deeplinkMiniApp } = response.metadata;
    
    // Detect platform and choose appropriate method
    if (isMobileApp) {
      window.location.href = deeplink;
    } else if (isMiniApp) {
      window.location.href = deeplinkMiniApp;
    } else if (isDesktop) {
      // Show QR code or redirect to web
      if (userPreferQR) {
        displayQRCode(qrCodeUrl);
      } else {
        window.location.href = payUrl;
      }
    }
  } catch (error) {
    console.error('Payment creation failed:', error);
  }
};
```

### 3. **Enhanced Payment Status Tracking**

```javascript
// Track enhanced payment information
const trackPayment = (ipnData) => {
  const paymentInfo = {
    orderId: ipnData.orderId,
    amount: ipnData.amount,
    status: ipnData.resultCode === 0 ? 'success' : 'failed',
    payType: ipnData.payType, // qr, app, webApp, miniapp
    paymentOption: ipnData.paymentOption, // momo, pay_later
    userFee: ipnData.userFee,
    promotions: ipnData.promotionInfo || [],
    transactionId: ipnData.transId,
    responseTime: new Date(ipnData.responseTime)
  };
  
  // Update UI with enhanced information
  updatePaymentStatus(paymentInfo);
};
```

## 🔄 Database Schema Updates

### 1. **Enhanced Payment Table**

```sql
-- Add new columns for enhanced MoMo data
ALTER TABLE payments 
ADD COLUMN pay_type VARCHAR(20) DEFAULT NULL,
ADD COLUMN payment_option VARCHAR(20) DEFAULT NULL,
ADD COLUMN user_fee DECIMAL(15,2) DEFAULT 0,
ADD COLUMN partner_user_id VARCHAR(100) DEFAULT NULL,
ADD COLUMN promotion_info TEXT DEFAULT NULL,
ADD COLUMN items_info TEXT DEFAULT NULL,
ADD COLUMN delivery_info TEXT DEFAULT NULL,
ADD COLUMN user_info TEXT DEFAULT NULL;

-- Index for faster queries
CREATE INDEX idx_payments_pay_type ON payments(pay_type);
CREATE INDEX idx_payments_payment_option ON payments(payment_option);
```

## 📊 Analytics and Reporting

### 1. **Enhanced Payment Analytics**

```javascript
// Get payment analytics with enhanced data
const getPaymentAnalytics = async () => {
  const analytics = await database.Payment.findAll({
    where: { payment_method: 'momo' },
    attributes: [
      'pay_type',
      'payment_option',
      [database.fn('COUNT', '*'), 'count'],
      [database.fn('SUM', database.col('amount')), 'total_amount'],
      [database.fn('AVG', database.col('user_fee')), 'avg_user_fee']
    ],
    group: ['pay_type', 'payment_option']
  });
  
  return analytics;
};
```

### 2. **Promotion Tracking**

```javascript
// Track promotion usage
const trackPromotions = async (promotionInfo) => {
  if (promotionInfo && promotionInfo.length > 0) {
    for (const promo of promotionInfo) {
      await database.PromotionUsage.create({
        voucher_id: promo.voucherId,
        voucher_name: promo.voucherName,
        voucher_type: promo.voucherType,
        amount: promo.amount,
        amount_sponsor: promo.amountSponsor,
        merchant_rate: promo.merchantRate,
        used_at: new Date()
      });
    }
  }
};
```

## 🚀 Production Deployment

### 1. **Environment Configuration**

```bash
# Production MoMo Configuration
MOMO_PARTNER_CODE=YOUR_PRODUCTION_PARTNER_CODE
MOMO_ACCESS_KEY=YOUR_PRODUCTION_ACCESS_KEY
MOMO_SECRET_KEY=YOUR_PRODUCTION_SECRET_KEY
MOMO_ENDPOINT=https://payment.momo.vn
MOMO_REDIRECT_URL=https://yourdomain.com/payment/momo/return
MOMO_IPN_URL=https://yourdomain.com/api/v1/momo/ipn
```

### 2. **Security Checklist**

- ✅ **HTTPS Required**: All endpoints must use HTTPS in production
- ✅ **IP Whitelisting**: Configure firewall to allow only MoMo IPs
- ✅ **Rate Limiting**: Implement rate limiting for payment endpoints
- ✅ **Request Validation**: Validate all request parameters
- ✅ **Signature Verification**: Always verify MoMo signatures
- ✅ **Logging**: Log all payment transactions for auditing
- ✅ **Error Handling**: Proper error responses without exposing sensitive data

### 3. **Performance Optimizations**

```javascript
// Connection pooling for MoMo API calls
const https = require('https');
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  timeout: 30000
});

// Use agent for MoMo requests
const options = {
  hostname: 'payment.momo.vn',
  port: 443,
  path: '/v2/gateway/api/create',
  method: 'POST',
  agent: httpsAgent, // Reuse connections
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(requestBodyString),
  },
};
```

## 🧪 Testing

### 1. **Test Environment Setup**

```bash
# Test MoMo Configuration
MOMO_PARTNER_CODE=MOMOT5BZ20231213_TEST
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_ENDPOINT=https://test-payment.momo.vn
```

### 2. **Test Cases**

```javascript
// Test payment creation with all parameters
describe('Enhanced MoMo Payment', () => {
  test('should create payment with items', async () => {
    const paymentData = {
      orderId: 'TEST_ORDER_123',
      amount: 100000,
      items: [
        {
          id: 'PROD_001',
          name: 'Test Product',
          price: 50000,
          quantity: 2
        }
      ],
      deliveryInfo: {
        deliveryAddress: 'Test Address',
        deliveryFee: '30000',
        quantity: '1'
      },
      userInfo: {
        name: 'Test User',
        phoneNumber: '0909123456',
        email: 'test@example.com'
      }
    };
    
    const result = await MomoPaymentService.createPayment(paymentData);
    
    expect(result.payUrl).toBeDefined();
    expect(result.deeplink).toBeDefined();
    expect(result.qrCodeUrl).toBeDefined();
  });
});
```

## 📚 Documentation

This enhanced MoMo integration provides:

1. **Full API compliance** with official MoMo documentation
2. **Enhanced product support** with detailed item information
3. **Multiple payment methods** (QR, app, web, mini-app)
4. **Comprehensive callback handling** with all MoMo parameters
5. **Enhanced security** with proper validation and verification
6. **Analytics support** for tracking payment patterns
7. **Production-ready** configuration and deployment guidelines

The integration now fully supports all MoMo payment features and provides a robust foundation for e-commerce applications.
