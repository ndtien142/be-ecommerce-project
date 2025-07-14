# MoMo Transaction Status Check API

## Overview

The MoMo Transaction Status Check API allows you to query the current status of a payment transaction using the MoMo Order ID. This API is essential for verifying payment completion and handling various transaction states.

## 📋 API Details

### Endpoint
```
GET /api/v1/momo/transaction-status/:orderId
```

### Parameters
- **orderId** (path parameter, required): The MoMo Order ID to check
- **lang** (query parameter, optional): Language for response messages (`vi` or `en`, default: `vi`)

### Important Notes
- **Minimum timeout**: 30 seconds when calling this API to ensure proper response from MoMo
- **Rate limiting**: Avoid calling this API too frequently (recommended: every 30 seconds minimum)
- **Auto-refresh**: Use appropriate intervals for status checking in frontend applications

## 🔧 Backend Implementation

### Service Method

```javascript
// src/services/payment/momo.service.js
static async checkTransactionStatus({
    orderId,
    lang = 'vi'
}) {
    // Creates signature with accessKey, orderId, partnerCode, requestId
    const rawSignature = `accessKey=${momoConfig.accessKey}&orderId=${orderId}&partnerCode=${momoConfig.partnerCode}&requestId=${requestId}`;
    
    // Makes POST request to MoMo's /v2/gateway/api/query endpoint
    const response = await this.makeHttpRequest(
        `${momoConfig.endpoint}/v2/gateway/api/query`,
        requestData
    );
    
    // Returns structured response with success/failure status
    return {
        success: response.resultCode === 0,
        resultCode: response.resultCode,
        message: this.getStatusMessage(response.resultCode, lang),
        data: { /* transaction details */ }
    };
}
```

### Controller Method

```javascript
// src/controllers/momo.controller.js
checkTransactionStatus = async (req, res, next) => {
    const { orderId } = req.params;
    const { lang = 'vi' } = req.query;

    new SuccessResponse({
        message: 'Kiểm tra trạng thái giao dịch thành công',
        metadata: await MomoPaymentService.checkTransactionStatus({
            orderId,
            lang
        }),
    }).send(res);
};
```

## 📱 Frontend Integration

### Service Method

```javascript
// services/momoService.js
class MomoPaymentService {
    static async checkTransactionStatus(orderId, lang = 'vi') {
        try {
            const response = await api.get(`/momo/transaction-status/${orderId}`, {
                params: { lang }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to check transaction status');
        }
    }
}
```

### React Component Usage

```javascript
import TransactionStatusChecker from './TransactionStatusChecker';

const PaymentPage = () => {
    const [orderId, setOrderId] = useState('ORDER_123_1672900000000');
    
    return (
        <div>
            <h2>Payment Status</h2>
            <TransactionStatusChecker 
                orderId={orderId}
                autoRefresh={true}
                refreshInterval={30000} // 30 seconds minimum
            />
        </div>
    );
};
```

## 🎯 Response Format

### Success Response (ResultCode = 0)

```json
{
    "message": "Kiểm tra trạng thái giao dịch thành công",
    "status": 200,
    "metadata": {
        "success": true,
        "resultCode": 0,
        "message": "Giao dịch thành công",
        "data": {
            "orderId": "ORDER_123_1672900000000",
            "transId": 4088878653,
            "amount": 100000,
            "payType": "qr",
            "paymentOption": "momo",
            "promotionInfo": [
                {
                    "amount": 5000,
                    "amountSponsor": 3000,
                    "voucherId": "VOUCHER_001",
                    "voucherType": "Percent",
                    "voucherName": "Giảm 5% cho đơn hàng đầu tiên",
                    "merchantRate": "60"
                }
            ],
            "refundTrans": [],
            "responseTime": 1672900000000,
            "extraData": "eyJza3VzIjoiIn0="
        }
    }
}
```

### Failed/Pending Response (ResultCode ≠ 0)

```json
{
    "message": "Kiểm tra trạng thái giao dịch thành công",
    "status": 200,
    "metadata": {
        "success": false,
        "resultCode": 1000,
        "message": "Đang chờ xác nhận",
        "data": {
            "orderId": "ORDER_123_1672900000000",
            "amount": 100000,
            "responseTime": 1672900000000
        }
    }
}
```

## 🔍 Result Codes & Status Mapping

### Common Result Codes

| Code | Status | Description (VI) | Description (EN) |
|------|---------|------------------|------------------|
| 0 | `completed` | Giao dịch thành công | Transaction successful |
| 1000 | `pending` | Đang chờ xác nhận | Pending confirmation |
| 2000 | `insufficient` | Số dư không đủ | Insufficient balance |
| 3000 | `invalid` | Giao dịch không hợp lệ | Invalid transaction |
| 4000 | `rejected` | Giao dịch bị từ chối | Transaction rejected |
| 5000 | `expired` | Giao dịch đã hết hạn | Transaction expired |
| 6000 | `failed` | Giao dịch thất bại | Transaction failed |
| 7000 | `pending` | Giao dịch đang chờ xử lý | Transaction is pending |
| 8000 | `cancelled` | Giao dịch đã bị hủy | Transaction was cancelled |
| 9000 | `processing` | Giao dịch đang được xử lý | Transaction is being processed |
| 10 | `failed` | Lỗi hệ thống | System error |
| 11 | `invalid` | Số tiền không hợp lệ | Invalid amount |
| 12 | `invalid` | Merchant không hợp lệ | Invalid merchant |
| 13 | `invalid` | Chữ ký không hợp lệ | Invalid signature |
| 20 | `failed` | Không tìm thấy giao dịch | Transaction not found |
| 21 | `duplicate` | Giao dịch trùng lặp | Duplicate transaction |
| 99 | `failed` | Lỗi không xác định | Unknown error |

## 📊 Response Data Fields

### Core Fields
- **orderId**: MoMo Order ID
- **transId**: MoMo internal transaction ID
- **amount**: Transaction amount in VND
- **payType**: Payment method (`web`, `qr`, `app`)
- **paymentOption**: Payment source (`momo`, `pay_later`)
- **responseTime**: Transaction response timestamp
- **extraData**: Additional data from original request

### Promotion Information
When promotions are applied, the response includes:
```json
"promotionInfo": [
    {
        "amount": 5000,           // Discount amount
        "amountSponsor": 3000,    // Sponsor amount
        "voucherId": "VOUCHER_001", // Voucher ID
        "voucherType": "Percent",   // Voucher type
        "voucherName": "Giảm 5%",   // Voucher name
        "merchantRate": "60"        // Merchant rate
    }
]
```

### Refund Information
If refunds exist, the response includes:
```json
"refundTrans": [
    {
        "refundId": "REF_001",
        "amount": 20000,
        "status": "completed",
        "responseTime": 1672900000000
    }
]
```

## 🚀 Usage Examples

### 1. Basic Status Check

```javascript
const checkPaymentStatus = async (orderId) => {
    try {
        const response = await MomoPaymentService.checkTransactionStatus(orderId);
        
        if (response.metadata.success) {
            console.log('✅ Payment completed!');
            console.log('Transaction ID:', response.metadata.data.transId);
            console.log('Amount:', response.metadata.data.amount);
            
            // Handle promotions
            if (response.metadata.data.promotionInfo?.length > 0) {
                console.log('🎁 Promotions applied:', response.metadata.data.promotionInfo);
            }
        } else {
            console.log('⏳ Payment status:', response.metadata.message);
        }
    } catch (error) {
        console.error('❌ Error checking status:', error.message);
    }
};
```

### 2. Polling for Status Updates

```javascript
const pollPaymentStatus = (orderId, callback) => {
    const interval = setInterval(async () => {
        try {
            const response = await MomoPaymentService.checkTransactionStatus(orderId);
            
            // Call callback with current status
            callback(response.metadata);
            
            // Stop polling if transaction is completed or failed
            if (response.metadata.success || 
                response.metadata.resultCode === 6000 || // failed
                response.metadata.resultCode === 5000) { // expired
                clearInterval(interval);
            }
        } catch (error) {
            console.error('Error polling status:', error);
            clearInterval(interval);
        }
    }, 30000); // Check every 30 seconds
    
    return interval; // Return interval ID for cleanup
};

// Usage
const intervalId = pollPaymentStatus(orderId, (status) => {
    console.log('Status update:', status);
});

// Cleanup when component unmounts
// clearInterval(intervalId);
```

### 3. Integration with React Hook

```javascript
import { useState, useEffect } from 'react';

const useTransactionStatus = (orderId, autoRefresh = true) => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const checkStatus = async () => {
        if (!orderId) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const response = await MomoPaymentService.checkTransactionStatus(orderId);
            setStatus(response.metadata);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!autoRefresh || !orderId) return;

        checkStatus();
        const interval = setInterval(checkStatus, 30000);
        
        return () => clearInterval(interval);
    }, [orderId, autoRefresh]);

    return { status, loading, error, checkStatus };
};

// Usage in component
const PaymentStatus = ({ orderId }) => {
    const { status, loading, error, checkStatus } = useTransactionStatus(orderId);

    if (loading) return <div>Checking status...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!status) return <div>No status available</div>;

    return (
        <div>
            <h3>Payment Status: {status.message}</h3>
            <p>Success: {status.success ? 'Yes' : 'No'}</p>
            <p>Result Code: {status.resultCode}</p>
            <button onClick={checkStatus}>Refresh Status</button>
        </div>
    );
};
```

## 🔧 Advanced Features

### 1. Status History Tracking

```javascript
const trackStatusHistory = (orderId) => {
    const history = [];
    
    const checkWithHistory = async () => {
        try {
            const response = await MomoPaymentService.checkTransactionStatus(orderId);
            
            // Add to history
            history.push({
                timestamp: new Date(),
                status: response.metadata,
                resultCode: response.metadata.resultCode,
                message: response.metadata.message
            });
            
            // Keep only last 20 checks
            if (history.length > 20) {
                history.shift();
            }
            
            return { current: response.metadata, history };
        } catch (error) {
            history.push({
                timestamp: new Date(),
                error: error.message
            });
            
            throw error;
        }
    };
    
    return checkWithHistory;
};
```

### 2. Conditional Status Checking

```javascript
const smartStatusCheck = async (orderId) => {
    try {
        const response = await MomoPaymentService.checkTransactionStatus(orderId);
        
        // Different handling based on result code
        switch (response.metadata.resultCode) {
            case 0: // Success
                handlePaymentSuccess(response.metadata.data);
                break;
                
            case 1000: // Pending
            case 7000: // Pending
            case 9000: // Processing
                scheduleNextCheck(orderId); // Continue checking
                break;
                
            case 5000: // Expired
                handlePaymentExpired(orderId);
                break;
                
            case 6000: // Failed
            case 8000: // Cancelled
                handlePaymentFailure(response.metadata);
                break;
                
            default:
                handleUnknownStatus(response.metadata);
        }
        
        return response.metadata;
    } catch (error) {
        handleCheckError(error);
        throw error;
    }
};
```

### 3. Batch Status Checking

```javascript
const checkMultipleTransactions = async (orderIds) => {
    const results = await Promise.allSettled(
        orderIds.map(orderId => 
            MomoPaymentService.checkTransactionStatus(orderId)
        )
    );
    
    const successful = [];
    const failed = [];
    const pending = [];
    
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            const status = result.value.metadata;
            const orderId = orderIds[index];
            
            if (status.success) {
                successful.push({ orderId, status });
            } else if (status.resultCode >= 1000 && status.resultCode <= 9000) {
                pending.push({ orderId, status });
            } else {
                failed.push({ orderId, status });
            }
        } else {
            failed.push({ orderId: orderIds[index], error: result.reason });
        }
    });
    
    return { successful, failed, pending };
};
```

## 🛡️ Best Practices

### 1. **Respect API Limits**
- Minimum 30-second intervals between checks
- Implement exponential backoff for failed requests
- Use appropriate timeouts (30+ seconds)

### 2. **Error Handling**
- Always handle network failures gracefully
- Log errors for debugging
- Provide user-friendly error messages

### 3. **Performance Optimization**
- Stop polling when transaction is final (success/failure)
- Use background polling to avoid blocking UI
- Implement caching for recent status checks

### 4. **Security**
- Never expose sensitive transaction data in logs
- Validate orderId format before API calls
- Use HTTPS for all API communications

### 5. **User Experience**
- Show loading indicators during status checks
- Provide clear status messages in user's language
- Auto-refresh status with visual indicators

## 🧪 Testing

### Unit Tests

```javascript
describe('MoMo Transaction Status', () => {
    test('should check transaction status successfully', async () => {
        const mockResponse = {
            metadata: {
                success: true,
                resultCode: 0,
                message: 'Giao dịch thành công',
                data: {
                    orderId: 'ORDER_123',
                    transId: 123456,
                    amount: 100000
                }
            }
        };
        
        jest.spyOn(MomoPaymentService, 'checkTransactionStatus')
            .mockResolvedValue(mockResponse);
        
        const result = await MomoPaymentService.checkTransactionStatus('ORDER_123');
        
        expect(result.metadata.success).toBe(true);
        expect(result.metadata.resultCode).toBe(0);
        expect(result.metadata.data.orderId).toBe('ORDER_123');
    });
    
    test('should handle failed transaction status', async () => {
        const mockResponse = {
            metadata: {
                success: false,
                resultCode: 6000,
                message: 'Giao dịch thất bại'
            }
        };
        
        jest.spyOn(MomoPaymentService, 'checkTransactionStatus')
            .mockResolvedValue(mockResponse);
        
        const result = await MomoPaymentService.checkTransactionStatus('ORDER_123');
        
        expect(result.metadata.success).toBe(false);
        expect(result.metadata.resultCode).toBe(6000);
    });
});
```

The MoMo Transaction Status Check API provides comprehensive transaction monitoring capabilities with proper error handling, multi-language support, and detailed transaction information including promotions and refunds.
