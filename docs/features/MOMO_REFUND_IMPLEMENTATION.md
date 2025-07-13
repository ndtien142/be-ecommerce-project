# MoMo Payment Refund Implementation Guide

## Overview

This implementation provides comprehensive refund functionality for MoMo payments, supporting both full and partial refunds, as well as itemized refunds for order returns.

## Features

### 1. Full Refund

- Complete refund of the entire payment amount
- Automatic order status update to "returned"
- Product stock restoration

### 2. Partial Refund

- Refund a portion of the payment amount
- Support for itemized refunds
- Validation against original payment amount
- Order status update to "partially_returned"

### 3. Refund Query

- Check refund status with MoMo
- Get detailed refund transaction information
- Track refund processing status

### 4. Refund History

- Complete refund history for orders
- Total refunded amount tracking
- Refund transaction details

## API Endpoints

### Full Refund

```http
POST /api/v1/momo/refund/full
Content-Type: application/json
Authorization: Bearer <token>

{
  "orderId": "123",
  "reason": "Customer requested return"
}
```

### Partial Refund

```http
POST /api/v1/momo/refund/partial
Content-Type: application/json
Authorization: Bearer <token>

{
  "orderId": "123",
  "amount": 50000,
  "reason": "Damaged item return",
  "items": [
    {
      "itemId": "PRODUCT_SKU_1",
      "amount": 30000,
      "productId": "1"
    },
    {
      "itemId": "PRODUCT_SKU_2",
      "amount": 20000,
      "productId": "2"
    }
  ]
}
```

### Manual Refund (Admin Only)

```http
POST /api/v1/momo/refund/manual
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "originalOrderId": "123",
  "refundOrderId": "REFUND_123_1672900000000",
  "amount": 100000,
  "transId": "2820086739",
  "description": "Manual refund for special case",
  "transGroup": [
    {
      "itemId": "ITEM_1",
      "amount": 60000,
      "transId": "2820086739"
    },
    {
      "itemId": "ITEM_2",
      "amount": 40000,
      "transId": "2820086739"
    }
  ]
}
```

### Query Refund Status

```http
GET /api/v1/momo/refund/status/{refundOrderId}/{requestId}
Authorization: Bearer <token>
```

### Get Refund History

```http
GET /api/v1/momo/refund/history/{orderId}
Authorization: Bearer <token>
```

### Get Total Refunded Amount

```http
GET /api/v1/momo/refund/total/{orderId}
Authorization: Bearer <token>
```

## Database Changes

### Payment Table Updates

```sql
-- Add new payment methods for refunds
ALTER TABLE tb_payment MODIFY COLUMN payment_method ENUM(
  'cash', 'momo', 'vnpay', 'bank_transfer', 'momo_refund'
) NOT NULL DEFAULT 'cash';

-- Add new payment statuses for refunds
ALTER TABLE tb_payment MODIFY COLUMN status ENUM(
  'pending', 'completed', 'failed', 'cancelled', 'expired',
  'refunded', 'partially_refunded'
) NOT NULL DEFAULT 'pending';
```

### Order Table Updates

```sql
-- Add new order statuses for returns and refunds
ALTER TABLE tb_order MODIFY COLUMN status ENUM(
  'pending_payment', 'payment_failed', 'payment_expired', 'payment_cancelled',
  'pending_confirmation', 'pending_pickup', 'shipping', 'delivered',
  'returned', 'partially_returned', 'refunded', 'partially_refunded', 'cancelled'
) NOT NULL DEFAULT 'pending_confirmation';
```

## Business Logic

### Refund Processing Flow

1. **Validation**

    - Check if original payment exists and is completed
    - Validate refund amount doesn't exceed original payment
    - Check total refunded amount doesn't exceed original payment

2. **MoMo API Call**

    - Generate unique refund order ID
    - Create refund signature using HMAC SHA256
    - Send refund request to MoMo API with 30-second timeout

3. **Database Updates**

    - Create refund payment record with negative amount
    - Update original payment status if fully refunded
    - Update order status based on refund type

4. **Stock Management**
    - Restore product stock for returned items (if applicable)
    - Update inventory status based on new stock levels

### Refund Status Mapping

| MoMo Result Code | Status    | Description                                   |
| ---------------- | --------- | --------------------------------------------- |
| 0                | completed | Refund successful                             |
| 1002             | failed    | Refund rejected by issuer                     |
| 1080             | failed    | Refund processing failed                      |
| 1081             | failed    | Refund rejected - already refunded            |
| 1088             | failed    | Refund not supported for original transaction |
| 7002             | pending   | Refund being processed                        |

## Error Handling

### Common Error Scenarios

1. **Original Payment Not Found**

    ```json
    {
        "error": "Original completed payment not found",
        "code": "PAYMENT_NOT_FOUND"
    }
    ```

2. **Refund Amount Exceeds Original**

    ```json
    {
        "error": "Refund amount cannot exceed original payment amount",
        "code": "AMOUNT_EXCEEDED"
    }
    ```

3. **Already Fully Refunded**

    ```json
    {
        "error": "Total refund amount would exceed original payment",
        "code": "ALREADY_REFUNDED"
    }
    ```

4. **MoMo API Timeout**
    ```json
    {
        "error": "Refund request timeout",
        "code": "API_TIMEOUT"
    }
    ```

## Frontend Integration

### React Example for Refund Process

```javascript
// Full refund
const processFullRefund = async (orderId, reason) => {
    try {
        const response = await fetch('/api/v1/momo/refund/full', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ orderId, reason }),
        });

        const result = await response.json();

        if (result.metadata.success) {
            alert('Refund processed successfully');
            // Update UI to show refund status
        } else {
            alert(`Refund failed: ${result.metadata.message}`);
        }
    } catch (error) {
        console.error('Refund error:', error);
        alert('Refund process failed');
    }
};

// Partial refund with items
const processPartialRefund = async (orderId, amount, items, reason) => {
    try {
        const response = await fetch('/api/v1/momo/refund/partial', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ orderId, amount, items, reason }),
        });

        const result = await response.json();

        if (result.metadata.success) {
            alert(`Partial refund of ${amount} VND processed successfully`);
            // Update UI to show partial refund status
        } else {
            alert(`Partial refund failed: ${result.metadata.message}`);
        }
    } catch (error) {
        console.error('Partial refund error:', error);
        alert('Partial refund process failed');
    }
};

// Check refund status
const checkRefundStatus = async (refundOrderId, requestId) => {
    try {
        const response = await fetch(
            `/api/v1/momo/refund/status/${refundOrderId}/${requestId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        const result = await response.json();
        return result.metadata;
    } catch (error) {
        console.error('Error checking refund status:', error);
        return null;
    }
};
```

### Order Management UI Integration

```javascript
// Display refund history in order details
const RefundHistory = ({ orderId }) => {
    const [refunds, setRefunds] = useState([]);
    const [totalRefunded, setTotalRefunded] = useState(0);

    useEffect(() => {
        const fetchRefundHistory = async () => {
            try {
                const response = await fetch(
                    `/api/v1/momo/refund/history/${orderId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    },
                );
                const result = await response.json();

                setRefunds(result.metadata.refunds);
                setTotalRefunded(result.metadata.totalRefundedAmount);
            } catch (error) {
                console.error('Error fetching refund history:', error);
            }
        };

        fetchRefundHistory();
    }, [orderId]);

    return (
        <div className="refund-history">
            <h3>Refund History</h3>
            <p>Total Refunded: {totalRefunded.toLocaleString()} VND</p>

            {refunds.map((refund) => (
                <div key={refund.id} className="refund-item">
                    <div>Amount: {refund.amount.toLocaleString()} VND</div>
                    <div>Status: {refund.status}</div>
                    <div>
                        Date: {new Date(refund.createdAt).toLocaleDateString()}
                    </div>
                    <div>Transaction ID: {refund.transactionId}</div>
                </div>
            ))}
        </div>
    );
};
```

## Security Considerations

1. **Signature Verification**

    - All refund requests use HMAC SHA256 signature
    - Signature includes all request parameters
    - Secret key stored securely in environment variables

2. **Authorization**

    - User authentication required for all refund operations
    - Admin role required for manual refunds
    - Order ownership validation

3. **Amount Validation**
    - Strict validation against original payment amount
    - Prevention of duplicate refunds
    - Audit trail for all refund operations

## Monitoring and Logging

### Key Metrics to Monitor

1. **Refund Success Rate**

    - Track successful vs failed refunds
    - Monitor MoMo API response times
    - Alert on high failure rates

2. **Refund Volume**

    - Daily/monthly refund amounts
    - Refund reasons analysis
    - Customer return patterns

3. **System Performance**
    - API response times
    - Database query performance
    - Error rates and types

### Logging Implementation

```javascript
// Enhanced logging in refund service
console.log('Refund Request:', {
    orderId,
    refundOrderId,
    amount,
    timestamp: new Date().toISOString(),
    userId: req.user?.id,
});

console.log('MoMo Refund Response:', {
    resultCode: response.resultCode,
    message: response.message,
    transId: response.transId,
    processingTime: Date.now() - startTime,
});
```

## Testing

### Unit Tests

```javascript
describe('MoMo Refund Service', () => {
    test('should process full refund successfully', async () => {
        // Test full refund logic
    });

    test('should validate refund amount', async () => {
        // Test amount validation
    });

    test('should prevent duplicate refunds', async () => {
        // Test duplicate prevention
    });
});
```

### Integration Tests

```javascript
describe('Refund API Endpoints', () => {
    test('POST /api/v1/momo/refund/full', async () => {
        // Test full refund endpoint
    });

    test('POST /api/v1/momo/refund/partial', async () => {
        // Test partial refund endpoint
    });
});
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations executed
- [ ] MoMo sandbox testing completed
- [ ] API documentation updated
- [ ] Frontend integration tested
- [ ] Error handling verified
- [ ] Logging and monitoring setup
- [ ] Security review completed
- [ ] Performance testing done

## Support and Troubleshooting

### Common Issues

1. **Refund Timeout**

    - Increase timeout to 30+ seconds
    - Implement retry mechanism
    - Check MoMo service status

2. **Signature Mismatch**

    - Verify parameter order in signature
    - Check encoding/escaping of special characters
    - Validate secret key configuration

3. **Amount Validation Errors**
    - Check original payment status
    - Verify refund amount calculation
    - Review total refunded amount logic

### Contact Information

- Technical Support: [technical-support@company.com](mailto:technical-support@company.com)
- MoMo Integration Team: [momo-integration@company.com](mailto:momo-integration@company.com)
- Emergency Hotline: +84-xxx-xxx-xxx
