# MoMo Payment API Response Documentation

## Overview

Documentation for MoMo Payment API responses để Frontend có thể tạo interface/type definitions cho tích hợp thanh toán MoMo.

## Base Response Structure

```typescript
interface BaseResponse<T> {
    message: string;
    status: 'success' | 'error';
    code: number;
    metadata: T;
}

interface ErrorResponse {
    message: string;
    status: 'error';
    code: number;
    stack?: string;
}
```

## MoMo Payment Types

```typescript
type MoMoPaymentStatus =
    | 'pending'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'expired'
    | 'refunded';

type MoMoResultCode =
    | 0 // Success
    | 9000 // Transaction cancelled
    | 1006 // Payment expired
    | 1000 // Transaction failed
    | 1001 // Transaction pending
    | 1002 // Transaction not found
    | 1003 // Transaction declined
    | 1004 // Transaction timeout
    | 1005 // Transaction error
    | 1007 // Transaction amount not valid
    | 1008 // Transaction not allowed
    | 1009 // Account not exist
    | 1010 // Account not active
    | 1011 // Account balance not enough
    | 1012 // Account locked
    | 1013 // Account suspended
    | 1014 // Account closed
    | 1015 // Account invalid
    | 1016 // Account not verified
    | 1017 // Account limit exceeded
    | 1018 // Account daily limit exceeded
    | 1019 // Account monthly limit exceeded
    | 1020 // Account yearly limit exceeded
    | 1021 // Account transaction limit exceeded
    | 1022 // Account invalid OTP
    | 1023 // Account OTP expired
    | 1024 // Account OTP invalid
    | 1025 // Account password invalid
    | 1026 // Account PIN invalid
    | 1027 // Account biometric invalid
    | 1028 // Account device not registered
    | 1029 // Account device locked
    | 1030; // Account device suspended;

type PayType = 'napas' | 'credit' | 'qr' | 'webApp' | 'momo_wallet';
```

## MoMo Payment Endpoints

### 1. POST /api/v1/order/momo

**Description:** Tạo payment MoMo và chuyển hướng đến trang thanh toán

**Request Body:**

```typescript
interface CreateMoMoPaymentRequest {
    orderId: string;
    momoOrderId?: string; // Nếu không có sẽ tự generate
    amount: number;
    orderInfo?: string;
    extraData?: string;
    items?: MoMoItem[];
    deliveryInfo?: DeliveryInfo;
    userInfo?: UserInfo;
    referenceId?: string;
    storeName?: string;
    subPartnerCode?: string;
}

interface MoMoItem {
    id: string;
    name: string;
    description?: string;
    category?: string;
    quantity: number;
    price: number;
    currency: string;
    imageUrl?: string;
    manufacturer?: string;
    unit?: string;
    totalPrice: number;
}

interface DeliveryInfo {
    deliveryAddress: string;
    deliveryFee: number;
    quantity: number;
}

interface UserInfo {
    name: string;
    phoneNumber: string;
    email: string;
}
```

**Response Type:**

```typescript
interface CreateMoMoPaymentResponse {
    payUrl: string;
    deeplink: string;
    qrCodeUrl: string;
    deeplinkMiniApp: string;
    orderId: string;
    requestId: string;
    amount: number;
    payment: PaymentRecord;
    responseTime: number;
    userFee: number;
}

interface PaymentRecord {
    id: number;
    orderId: string;
    paymentMethod: 'momo';
    transactionId: string;
    transactionCode?: string;
    status: MoMoPaymentStatus;
    amount: number;
    gatewayResponse: string; // JSON string
}
```

**Example Response:**

```json
{
    "message": "Tạo thanh toán MoMo thành công",
    "status": "success",
    "code": 201,
    "metadata": {
        "payUrl": "https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT3xUVEVTVDIwMjUwMTEz",
        "deeplink": "momo://app?action=payWithAppInApp&amount=150000&description=Thanh%20toán%20đơn%20hàng&requestId=ORDER_62_1752481227667_moi8n0t2g&orderId=ORDER_62_1752481227667_moi8n0t2g",
        "qrCodeUrl": "https://test-payment.momo.vn/v2/gateway/qr?t=TU9NT3xUVEVTVDIwMjUwMTEz",
        "deeplinkMiniApp": "momo://app?action=payWithMiniApp&amount=150000&description=Thanh%20toán%20đơn%20hàng&requestId=ORDER_62_1752481227667_moi8n0t2g&orderId=ORDER_62_1752481227667_moi8n0t2g",
        "orderId": "62",
        "requestId": "ORDER_62_1752481227667_moi8n0t2g",
        "amount": 150000,
        "payment": {
            "id": 78,
            "orderId": "62",
            "paymentMethod": "momo",
            "transactionId": "ORDER_62_1752481227667_moi8n0t2g",
            "transactionCode": null,
            "status": "pending",
            "amount": 150000,
            "gatewayResponse": "{\"partnerCode\":\"MOMO\",\"orderId\":\"ORDER_62_1752481227667_moi8n0t2g\",\"requestId\":\"ORDER_62_1752481227667_moi8n0t2g\",\"amount\":150000,\"responseTime\":1642089600000,\"message\":\"Successful.\",\"resultCode\":0,\"payUrl\":\"https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT3xUVEVTVDIwMjUwMTEz\"}"
        },
        "responseTime": 1642089600000,
        "userFee": 0
    }
}
```

### 2. POST /api/v1/momo/ipn

**Description:** MoMo IPN callback endpoint (Internal use - không cần FE gọi)

**Request Body (from MoMo):**

```typescript
interface MoMoIPNRequest {
    partnerCode: string;
    orderId: string;
    requestId: string;
    amount: number;
    orderInfo: string;
    orderType: string;
    transId: number;
    resultCode: MoMoResultCode;
    message: string;
    payType: PayType;
    responseTime: number;
    extraData: string;
    signature: string;
}
```

**Response Type:**

```typescript
interface MoMoIPNResponse {
    status: 'success' | 'error';
    message: string;
    orderId: string;
    resultCode: MoMoResultCode;
}
```

**Example Response:**

```json
{
    "message": "IPN xử lý thành công",
    "status": "success",
    "code": 200,
    "metadata": {
        "status": "success",
        "message": "IPN processed successfully",
        "orderId": "ORDER_62_1752481227667_moi8n0t2g",
        "resultCode": 0
    }
}
```

### 3. GET /api/v1/momo/status/:orderId

**Description:** Kiểm tra trạng thái thanh toán MoMo

**Response Type:**

```typescript
interface MoMoStatusResponse {
    orderId: string;
    transId: number;
    resultCode: MoMoResultCode;
    message: string;
    amount: number;
    payType: PayType;
    responseTime: number;
    extraData: string;
    paymentOption: string;
    promotionInfo?: PromotionInfo;
    refundTrans: RefundTransaction[];
}

interface PromotionInfo {
    promotionCode: string;
    promotionName: string;
    discountAmount: number;
    discountType: string;
}

interface RefundTransaction {
    refundId: string;
    refundAmount: number;
    refundTime: number;
    refundReason: string;
    refundStatus: string;
}
```

**Example Response:**

```json
{
    "message": "Kiểm tra trạng thái thanh toán thành công",
    "status": "success",
    "code": 200,
    "metadata": {
        "orderId": "ORDER_62_1752481227667_moi8n0t2g",
        "transId": 2755912829,
        "resultCode": 0,
        "message": "Successful.",
        "amount": 150000,
        "payType": "qr",
        "responseTime": 1642089600000,
        "extraData": "",
        "paymentOption": "momo_wallet",
        "promotionInfo": {
            "promotionCode": "NEWYEAR2025",
            "promotionName": "Khuyến mãi năm mới",
            "discountAmount": 5000,
            "discountType": "amount"
        },
        "refundTrans": []
    }
}
```

### 4. POST /api/v1/momo/refund

**Description:** Hoàn tiền MoMo

**Request Body:**

```typescript
interface MoMoRefundRequest {
    orderId: string;
    transId: number;
    amount: number;
    description?: string;
}
```

**Response Type:**

```typescript
interface MoMoRefundResponse {
    orderId: string;
    originalOrderId: string;
    transId: number;
    resultCode: MoMoResultCode;
    message: string;
    amount: number;
    responseTime: number;
}
```

**Example Response:**

```json
{
    "message": "Hoàn tiền MoMo thành công",
    "status": "success",
    "code": 200,
    "metadata": {
        "orderId": "REFUND_ORDER_62_1752481227667_moi8n0t2g_1642089700000",
        "originalOrderId": "ORDER_62_1752481227667_moi8n0t2g",
        "transId": 2755912830,
        "resultCode": 0,
        "message": "Successful.",
        "amount": 150000,
        "responseTime": 1642089700000
    }
}
```

### 5. GET /api/v1/momo/payment-status/:orderId

**Description:** Lấy trạng thái payment từ database

**Response Type:**

```typescript
interface PaymentStatusResponse {
    orderId: string;
    paymentStatus: MoMoPaymentStatus;
    amount: number;
    transactionId: string;
    transactionCode?: string;
    paidAt?: string;
    gatewayResponse: string; // JSON string
}
```

**Example Response:**

```json
{
    "message": "Lấy trạng thái thanh toán thành công",
    "status": "success",
    "code": 200,
    "metadata": {
        "orderId": "62",
        "paymentStatus": "completed",
        "amount": 150000,
        "transactionId": "ORDER_62_1752481227667_moi8n0t2g",
        "transactionCode": "2755912829",
        "paidAt": "2025-01-13T10:40:00.000Z",
        "gatewayResponse": "{\"partnerCode\":\"MOMO\",\"orderId\":\"ORDER_62_1752481227667_moi8n0t2g\",\"requestId\":\"ORDER_62_1752481227667_moi8n0t2g\",\"amount\":150000,\"orderInfo\":\"Thanh toán đơn hàng\",\"orderType\":\"momo_wallet\",\"transId\":2755912829,\"resultCode\":0,\"message\":\"Successful.\",\"payType\":\"qr\",\"responseTime\":1642089600000,\"extraData\":\"\"}"
    }
}
```

## MoMo Payment Flow Integration

### Frontend Payment Flow

```typescript
// 1. Tạo payment
const createPayment = async (orderData: CreateMoMoPaymentRequest) => {
    const response = await fetch('/api/v1/order/momo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
    });

    const result: BaseResponse<CreateMoMoPaymentResponse> =
        await response.json();

    if (result.status === 'success') {
        // Redirect to MoMo payment page
        window.location.href = result.metadata.payUrl;
        // Or open in new window
        // window.open(result.metadata.payUrl, '_blank');
    }

    return result;
};

// 2. Kiểm tra trạng thái payment (polling)
const checkPaymentStatus = async (orderId: string) => {
    const response = await fetch(`/api/v1/momo/status/${orderId}`);
    const result: BaseResponse<MoMoStatusResponse> = await response.json();
    return result;
};

// 3. Payment status polling
const pollPaymentStatus = async (orderId: string, maxAttempts = 30) => {
    let attempts = 0;

    const poll = async (): Promise<MoMoStatusResponse> => {
        const result = await checkPaymentStatus(orderId);

        if (result.status === 'success') {
            const { resultCode } = result.metadata;

            // Payment successful
            if (resultCode === 0) {
                return result.metadata;
            }

            // Payment failed/cancelled/expired
            if ([9000, 1006, 1000].includes(resultCode)) {
                throw new Error(result.metadata.message);
            }

            // Payment still pending, continue polling
            if (attempts < maxAttempts) {
                attempts++;
                await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
                return poll();
            }

            throw new Error('Payment timeout');
        }

        throw new Error('Failed to check payment status');
    };

    return poll();
};
```

### React Payment Component Example

```typescript
import React, { useState, useEffect } from 'react';

interface MoMoPaymentProps {
  orderId: string;
  amount: number;
  orderInfo?: string;
  onSuccess: (result: MoMoStatusResponse) => void;
  onError: (error: string) => void;
}

const MoMoPayment: React.FC<MoMoPaymentProps> = ({
  orderId,
  amount,
  orderInfo,
  onSuccess,
  onError
}) => {
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'creating' | 'pending' | 'completed' | 'failed'>('idle');
  const [paymentUrl, setPaymentUrl] = useState<string>('');

  const createPayment = async () => {
    setPaymentStatus('creating');

    try {
      const response = await fetch('/api/v1/order/momo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount,
          orderInfo: orderInfo || `Thanh toán đơn hàng ${orderId}`,
        })
      });

      const result: BaseResponse<CreateMoMoPaymentResponse> = await response.json();

      if (result.status === 'success') {
        setPaymentUrl(result.metadata.payUrl);
        setPaymentStatus('pending');

        // Start polling for payment status
        startPaymentPolling();
      } else {
        onError(result.message);
        setPaymentStatus('failed');
      }
    } catch (error) {
      onError('Không thể tạo thanh toán MoMo');
      setPaymentStatus('failed');
    }
  };

  const startPaymentPolling = async () => {
    try {
      const result = await pollPaymentStatus(orderId);
      setPaymentStatus('completed');
      onSuccess(result);
    } catch (error) {
      setPaymentStatus('failed');
      onError(error instanceof Error ? error.message : 'Thanh toán thất bại');
    }
  };

  return (
    <div className="momo-payment">
      {paymentStatus === 'idle' && (
        <button onClick={createPayment} className="momo-pay-button">
          Thanh toán với MoMo
        </button>
      )}

      {paymentStatus === 'creating' && (
        <div>Đang tạo thanh toán...</div>
      )}

      {paymentStatus === 'pending' && (
        <div>
          <p>Đang chờ thanh toán...</p>
          <a href={paymentUrl} target="_blank" rel="noopener noreferrer">
            Mở trang thanh toán MoMo
          </a>
        </div>
      )}

      {paymentStatus === 'completed' && (
        <div className="success">Thanh toán thành công!</div>
      )}

      {paymentStatus === 'failed' && (
        <div className="error">Thanh toán thất bại!</div>
      )}
    </div>
  );
};

export default MoMoPayment;
```

## Error Handling

### Common MoMo Error Codes

```typescript
const MoMoErrorMessages: Record<MoMoResultCode, string> = {
    0: 'Thành công',
    9000: 'Giao dịch bị hủy',
    1006: 'Giao dịch hết hạn',
    1000: 'Giao dịch thất bại',
    1001: 'Giao dịch đang chờ xử lý',
    1002: 'Không tìm thấy giao dịch',
    1003: 'Giao dịch bị từ chối',
    1004: 'Giao dịch timeout',
    1005: 'Lỗi giao dịch',
    1007: 'Số tiền giao dịch không hợp lệ',
    1008: 'Giao dịch không được phép',
    1009: 'Tài khoản không tồn tại',
    1010: 'Tài khoản chưa được kích hoạt',
    1011: 'Tài khoản không đủ số dư',
    1012: 'Tài khoản bị khóa',
    1013: 'Tài khoản bị tạm ngưng',
    1014: 'Tài khoản đã đóng',
    1015: 'Tài khoản không hợp lệ',
    1016: 'Tài khoản chưa được xác thực',
    1017: 'Vượt quá hạn mức tài khoản',
    1018: 'Vượt quá hạn mức ngày',
    1019: 'Vượt quá hạn mức tháng',
    1020: 'Vượt quá hạn mức năm',
    1021: 'Vượt quá hạn mức giao dịch',
    1022: 'OTP không hợp lệ',
    1023: 'OTP hết hạn',
    1024: 'OTP sai',
    1025: 'Mật khẩu không đúng',
    1026: 'PIN không đúng',
    1027: 'Sinh trắc học không hợp lệ',
    1028: 'Thiết bị chưa được đăng ký',
    1029: 'Thiết bị bị khóa',
    1030: 'Thiết bị bị tạm ngưng',
};
```

### Error Response Examples

```json
{
    "message": "orderId and amount are required",
    "status": "error",
    "code": 400
}
```

```json
{
    "message": "Amount must be between 1,000 and 50,000,000 VND",
    "status": "error",
    "code": 400
}
```

```json
{
    "message": "MoMo payment creation failed: Invalid signature",
    "status": "error",
    "code": 400
}
```

```json
{
    "message": "Payment record not found",
    "status": "error",
    "code": 404
}
```

```json
{
    "message": "Only completed transactions can be refunded",
    "status": "error",
    "code": 400
}
```

## Usage Notes

1. **Amount Limits:** 1,000 VND - 50,000,000 VND
2. **Timeout:** Payment URLs expire after 15 minutes
3. **Polling:** Check payment status every 2-3 seconds, max 30 attempts
4. **Security:** All requests are signed with HMAC-SHA256
5. **Environment:** Use test environment for development
6. **IPN:** MoMo will send IPN callback for payment status updates
7. **Refund:** Only completed payments can be refunded
8. **Currency:** Only VND is supported

## Security Considerations

1. **Never expose secret keys** in frontend code
2. **Validate all responses** from MoMo
3. **Use HTTPS** for all communications
4. **Implement rate limiting** to prevent abuse
5. **Log all transactions** for audit purposes
6. **Handle PCI compliance** requirements
7. **Validate amounts** and order data server-side

Các type definitions này sẽ giúp Frontend team tích hợp MoMo payment một cách chính xác và type-safe.
