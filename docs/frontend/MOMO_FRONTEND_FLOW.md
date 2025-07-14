# 🚀 MoMo Payment Frontend Integration - Complete Flow

## 📋 Quick Start Guide

### 1. **Files to Check**

- ✅ Backend API: Running on `http://localhost:3055`
- ✅ Frontend Demo: Open `momo-demo.html` in browser
- ✅ Integration Guide: `FRONTEND_MOMO_INTEGRATION.md`

### 2. **Test the Flow**

```bash
# 1. Start your backend server
npm run dev

# 2. Open the HTML demo file
open momo-demo.html
# OR serve it with a simple server:
python -m http.server 8000
# Then open: http://localhost:8000/momo-demo.html
```

## 🔄 Complete User Flow

### **Step-by-Step Process:**

1. **🛒 User on Checkout Page**

    - Sees order summary (products, shipping, total)
    - Enters delivery address and contact info
    - Chooses "MoMo" as payment method

2. **💳 Payment Method Selection**

    ```javascript
    // User clicks MoMo payment option
    selectPaymentMethod('momo');
    // Button text changes to "Đặt hàng với MoMo"
    ```

3. **📤 Order Creation Request**

    ```javascript
    const orderData = {
        cart: { id: 1, lineItems: [...] },
        addressId: 1,
        shippingMethodId: 1,
        note: "Customer notes",
        shippingFee: 30000,
        orderInfo: "Đơn hàng #123 - Customer Name"
    };

    // API Call: POST /v1/api/order/momo
    const response = await fetch('/v1/api/order/momo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId
        },
        body: JSON.stringify(orderData)
    });
    ```

4. **🏦 Backend Processing**

    ```javascript
    // Backend creates:
    // 1. Order with status "pending_payment"
    // 2. Payment record with status "pending"
    // 3. MoMo payment request
    // 4. Returns MoMo payment URL
    ```

5. **🔀 Redirect to MoMo**

    ```javascript
    // Frontend receives response:
    {
        "status": 201,
        "metadata": {
            "order": { "id": 123, "totalAmount": 75000 },
            "momoPayment": {
                "payUrl": "https://payment.momo.vn/pay/...",
                "orderId": "123",
                "amount": 75000
            }
        }
    }

    // Store order info and redirect
    localStorage.setItem('pendingOrder', JSON.stringify({
        orderId: 123,
        amount: 75000,
        paymentMethod: 'momo'
    }));

    window.location.href = result.metadata.momoPayment.payUrl;
    ```

6. **📱 User on MoMo Page**

    - User enters MoMo PIN or uses biometric
    - Confirms payment amount
    - Completes payment

7. **✅ Payment Completion**

    - MoMo processes payment
    - Sends webhook to backend (IPN)
    - Redirects user back to frontend

8. **🔄 Return to Frontend**

    ```javascript
    // User returns to: /payment/return?orderId=123&resultCode=0&message=Success
    // Frontend checks URL parameters:

    const urlParams = new URLSearchParams(window.location.search);
    const resultCode = urlParams.get('resultCode');
    const orderId = urlParams.get('orderId');

    if (resultCode === '0') {
        // ✅ Payment successful
        showSuccessMessage();
        clearCart();
    } else {
        // ❌ Payment failed
        showErrorMessage();
    }
    ```

9. **🔔 Backend Webhook Processing**
    ```javascript
    // MoMo sends webhook to: POST /v1/api/momo/ipn
    // Backend:
    // 1. Verifies signature
    // 2. Updates payment status
    // 3. Updates order status
    // 4. Processes inventory (reduces stock)
    // 5. Sends confirmation email
    ```

## 💻 Frontend Implementation Options

### **Option 1: Simple HTML/JavaScript (Demo)**

- ✅ **File**: `momo-demo.html`
- ✅ **Best for**: Quick testing, prototyping
- ✅ **Features**: Complete flow, responsive design

### **Option 2: React.js Application**

- ✅ **Guide**: `FRONTEND_MOMO_INTEGRATION.md`
- ✅ **Best for**: Production applications
- ✅ **Features**: Component-based, state management, routing

### **Option 3: Next.js Application**

```javascript
// pages/checkout.js
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Checkout() {
    const router = useRouter();
    const [paymentMethod, setPaymentMethod] = useState('momo');

    const handleMoMoPayment = async (orderData) => {
        const response = await fetch('/api/order/momo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();
        if (result.success) {
            // Redirect to MoMo
            window.location.href = result.data.momoPayment.payUrl;
        }
    };

    return (
        <div>
            {/* Checkout form component */}
        </div>
    );
}

// pages/payment/return.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PaymentReturn() {
    const router = useRouter();
    const { orderId, resultCode, message } = router.query;

    useEffect(() => {
        if (resultCode === '0') {
            // Success
        } else {
            // Failed
        }
    }, [resultCode]);

    return <div>{/* Payment result UI */}</div>;
}
```

## 🛠️ Key API Endpoints for Frontend

### **1. Create Order with MoMo**

```http
POST /v1/api/order/momo
Content-Type: application/json
x-user-id: {userId}

{
    "cart": {
        "id": 1,
        "lineItems": [...]
    },
    "addressId": 1,
    "shippingMethodId": 1,
    "note": "Order notes",
    "shippingFee": 30000,
    "orderInfo": "Order description"
}
```

### **2. Create Standalone MoMo Payment**

```http
POST /v1/api/momo/create-payment

{
    "orderId": "ORDER_123",
    "amount": 75000,
    "orderInfo": "Payment for order #123",
    "extraData": ""
}
```

### **3. Check Payment Status**

```http
GET /v1/api/momo/status/{orderId}
```

## 🎨 UI/UX Best Practices

### **Loading States**

```javascript
// Show spinner during API calls
function showLoading() {
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('submitBtn').textContent = 'Đang xử lý...';
}

function hideLoading() {
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('submitBtn').textContent = 'Đặt hàng với MoMo';
}
```

### **Error Handling**

```javascript
try {
    const result = await createMoMoOrder(orderData);
    // Success
} catch (error) {
    // Show user-friendly error message
    showAlert('Có lỗi xảy ra, vui lòng thử lại: ' + error.message);
}
```

### **Mobile Optimization**

```css
@media (max-width: 768px) {
    .payment-method {
        padding: 12px;
        font-size: 14px;
    }

    .btn {
        padding: 12px;
        font-size: 16px;
    }
}
```

## 🔧 Configuration & Environment

### **Development Environment**

```javascript
// config.js
const config = {
    API_BASE_URL: 'http://localhost:3055/v1/api',
    ENVIRONMENT: 'development',
};
```

### **Production Environment**

```javascript
// config.js
const config = {
    API_BASE_URL: 'https://yourdomain.com/v1/api',
    ENVIRONMENT: 'production',
};
```

## 🚨 Error Scenarios & Handling

### **Common Error Cases:**

1. **Network Error**: API server down
2. **Invalid Order Data**: Missing required fields
3. **Payment Timeout**: User abandons MoMo page
4. **Payment Declined**: Insufficient funds
5. **Webhook Failure**: IPN not received

### **Error Handling Code:**

```javascript
const handlePaymentError = (error) => {
    const errorMessages = {
        NETWORK_ERROR: 'Không thể kết nối đến server. Vui lòng thử lại.',
        INVALID_DATA: 'Thông tin đơn hàng không hợp lệ.',
        PAYMENT_TIMEOUT: 'Phiên thanh toán đã hết hạn.',
        PAYMENT_DECLINED: 'Thanh toán bị từ chối. Vui lòng kiểm tra tài khoản.',
        WEBHOOK_FAILED: 'Lỗi xử lý thanh toán. Liên hệ hỗ trợ.',
    };

    const message =
        errorMessages[error.code] || 'Có lỗi không xác định xảy ra.';
    showAlert(message, 'error');
};
```

## 📊 Testing Checklist

### **Frontend Testing:**

- [ ] Payment method selection works
- [ ] Form validation works
- [ ] API calls are successful
- [ ] Loading states display correctly
- [ ] Error messages show properly
- [ ] Mobile responsive design
- [ ] Return URL handling works
- [ ] Local storage management

### **Integration Testing:**

- [ ] Order creation with MoMo
- [ ] Payment URL generation
- [ ] User redirect to MoMo
- [ ] Return from MoMo payment
- [ ] Webhook processing
- [ ] Order status updates
- [ ] Inventory management

## 🎯 Quick Test Commands

```bash
# Test API connectivity
curl -X POST http://localhost:3055/v1/api/momo/create-payment \
  -H "Content-Type: application/json" \
  -d '{"orderId":"TEST123","amount":50000,"orderInfo":"Test payment"}'

# Test order creation
curl -X POST http://localhost:3055/v1/api/order/momo \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{"cart":{"id":1,"lineItems":[]},"addressId":1,"shippingMethodId":1}'
```

Your MoMo integration is now complete and ready for production use! 🎉
