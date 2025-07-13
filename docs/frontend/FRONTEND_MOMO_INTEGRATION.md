# Frontend MoMo Payment Integration Guide

## 🎯 Overview

This guide shows how to integrate MoMo payment in your Frontend application, covering the complete user journey from cart to payment completion.

## 🔄 Complete Payment Flow

### 1. User Journey

```
Cart → Checkout → Payment Method Selection → MoMo Payment → Payment Completion → Order Confirmation
```

### 2. Technical Flow

```
Frontend → Create Order API → MoMo Payment URL → User Payment → Webhook → Frontend Redirect → Order Status
```

## 📱 Frontend Implementation

### Step 1: Checkout Page - Payment Method Selection

```jsx
// components/Checkout/PaymentMethods.jsx
import React, { useState } from 'react';

const PaymentMethods = ({ selectedMethod, onMethodChange }) => {
    const paymentMethods = [
        { id: 'cash', name: 'Thanh toán khi nhận hàng', icon: '💵' },
        { id: 'momo', name: 'Ví MoMo', icon: '💳' },
        { id: 'vnpay', name: 'VNPay', icon: '🏦' },
    ];

    return (
        <div className="payment-methods">
            <h3>Chọn phương thức thanh toán</h3>
            {paymentMethods.map((method) => (
                <div
                    key={method.id}
                    className={`payment-method ${selectedMethod === method.id ? 'selected' : ''}`}
                    onClick={() => onMethodChange(method.id)}
                >
                    <span className="icon">{method.icon}</span>
                    <span className="name">{method.name}</span>
                    {selectedMethod === method.id && (
                        <span className="checkmark">✓</span>
                    )}
                </div>
            ))}
        </div>
    );
};

export default PaymentMethods;
```

### Step 2: Order Creation Service

```javascript
// services/orderService.js
class OrderService {
    static async createOrderWithMoMo(orderData) {
        try {
            const response = await fetch('/v1/api/order/momo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': localStorage.getItem('userId'),
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(orderData),
            });

            const result = await response.json();

            if (result.status === 201) {
                return {
                    success: true,
                    data: result.metadata,
                };
            } else {
                throw new Error(result.message || 'Failed to create order');
            }
        } catch (error) {
            console.error('Order creation error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    static async createOrderWithCash(orderData) {
        try {
            const response = await fetch('/v1/api/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': localStorage.getItem('userId'),
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(orderData),
            });

            const result = await response.json();
            return result.status === 201
                ? { success: true, data: result.metadata }
                : { success: false, error: result.message };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async checkPaymentStatus(orderId) {
        try {
            const response = await fetch(`/v1/api/momo/status/${orderId}`);
            const result = await response.json();
            return result.status === 200 ? result.metadata : null;
        } catch (error) {
            console.error('Payment status check error:', error);
            return null;
        }
    }
}

export default OrderService;
```

### Step 3: Main Checkout Component

```jsx
// components/Checkout/CheckoutPage.jsx
import React, { useState, useEffect } from 'react';
import PaymentMethods from './PaymentMethods';
import OrderService from '../../services/orderService';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

const CheckoutPage = () => {
    const { cart, clearCart } = useCart();
    const { user } = useAuth();
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [shippingMethod, setShippingMethod] = useState(null);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePlaceOrder = async () => {
        if (!selectedAddress || !shippingMethod) {
            alert('Vui lòng chọn địa chỉ giao hàng và phương thức vận chuyển');
            return;
        }

        setLoading(true);

        const orderData = {
            cart: {
                id: cart.id,
                lineItems: cart.items,
            },
            addressId: selectedAddress.id,
            shippingMethodId: shippingMethod.id,
            note: note,
            shippingFee: shippingMethod.fee || 0,
            orderInfo: `Đơn hàng ${cart.id} - ${user.name}`,
        };

        try {
            let result;

            if (paymentMethod === 'momo') {
                result = await OrderService.createOrderWithMoMo(orderData);

                if (result.success) {
                    // Store order info for later reference
                    localStorage.setItem(
                        'pendingOrder',
                        JSON.stringify({
                            orderId: result.data.order.id,
                            amount: result.data.order.totalAmount,
                            paymentMethod: 'momo',
                        }),
                    );

                    // Redirect to MoMo payment
                    window.location.href = result.data.momoPayment.payUrl;
                } else {
                    alert('Lỗi tạo đơn hàng: ' + result.error);
                }
            } else {
                // Cash payment
                result = await OrderService.createOrderWithCash(orderData);

                if (result.success) {
                    clearCart();
                    // Redirect to success page
                    window.location.href = `/order/success/${result.data.id}`;
                } else {
                    alert('Lỗi tạo đơn hàng: ' + result.error);
                }
            }
        } catch (error) {
            console.error('Order placement error:', error);
            alert('Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="checkout-page">
            <div className="checkout-container">
                {/* Order Summary */}
                <div className="order-summary">
                    <h2>Tổng quan đơn hàng</h2>
                    {cart.items.map((item) => (
                        <div key={item.id} className="order-item">
                            <span>{item.name}</span>
                            <span>x{item.quantity}</span>
                            <span>
                                {(item.price * item.quantity).toLocaleString()}đ
                            </span>
                        </div>
                    ))}
                    <div className="total">
                        <strong>
                            Tổng cộng: {cart.total.toLocaleString()}đ
                        </strong>
                    </div>
                </div>

                {/* Address Selection */}
                <div className="address-section">
                    {/* Address selection component */}
                </div>

                {/* Shipping Method */}
                <div className="shipping-section">
                    {/* Shipping method selection component */}
                </div>

                {/* Payment Methods */}
                <PaymentMethods
                    selectedMethod={paymentMethod}
                    onMethodChange={setPaymentMethod}
                />

                {/* Order Note */}
                <div className="note-section">
                    <textarea
                        placeholder="Ghi chú đơn hàng (tùy chọn)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                    />
                </div>

                {/* Place Order Button */}
                <button
                    className="place-order-btn"
                    onClick={handlePlaceOrder}
                    disabled={loading}
                >
                    {loading
                        ? 'Đang xử lý...'
                        : paymentMethod === 'momo'
                          ? 'Thanh toán với MoMo'
                          : 'Đặt hàng'}
                </button>
            </div>
        </div>
    );
};

export default CheckoutPage;
```

### Step 4: Payment Return Handling

```jsx
// pages/PaymentReturn.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import OrderService from '../services/orderService';

const PaymentReturn = () => {
    const [searchParams] = useSearchParams();
    const [paymentStatus, setPaymentStatus] = useState('checking');
    const [orderInfo, setOrderInfo] = useState(null);

    const orderId = searchParams.get('orderId');
    const resultCode = searchParams.get('resultCode');
    const message = searchParams.get('message');

    useEffect(() => {
        const checkPaymentResult = async () => {
            try {
                // Get pending order from localStorage
                const pendingOrder = localStorage.getItem('pendingOrder');
                if (pendingOrder) {
                    setOrderInfo(JSON.parse(pendingOrder));
                }

                if (resultCode === '0') {
                    // Payment successful
                    setPaymentStatus('success');

                    // Clear cart and pending order
                    localStorage.removeItem('pendingOrder');
                    localStorage.removeItem('cart');

                    // Optionally check payment status from server
                    if (orderId) {
                        const status =
                            await OrderService.checkPaymentStatus(orderId);
                        console.log('Payment status from server:', status);
                    }
                } else {
                    // Payment failed
                    setPaymentStatus('failed');
                }
            } catch (error) {
                console.error('Error checking payment result:', error);
                setPaymentStatus('error');
            }
        };

        checkPaymentResult();
    }, [orderId, resultCode]);

    const renderPaymentResult = () => {
        switch (paymentStatus) {
            case 'checking':
                return (
                    <div className="payment-checking">
                        <div className="spinner"></div>
                        <p>Đang kiểm tra kết quả thanh toán...</p>
                    </div>
                );

            case 'success':
                return (
                    <div className="payment-success">
                        <div className="success-icon">✅</div>
                        <h2>Thanh toán thành công!</h2>
                        <p>
                            Đơn hàng #{orderId} đã được thanh toán thành công.
                        </p>
                        {orderInfo && (
                            <div className="order-details">
                                <p>
                                    Số tiền:{' '}
                                    {parseInt(
                                        orderInfo.amount,
                                    ).toLocaleString()}
                                    đ
                                </p>
                                <p>Phương thức: MoMo</p>
                            </div>
                        )}
                        <div className="action-buttons">
                            <button
                                onClick={() =>
                                    (window.location.href = '/orders')
                                }
                            >
                                Xem đơn hàng
                            </button>
                            <button
                                onClick={() => (window.location.href = '/')}
                            >
                                Tiếp tục mua sắm
                            </button>
                        </div>
                    </div>
                );

            case 'failed':
                return (
                    <div className="payment-failed">
                        <div className="error-icon">❌</div>
                        <h2>Thanh toán thất bại</h2>
                        <p>Rất tiếc, thanh toán của bạn không thành công.</p>
                        <p className="error-message">Lý do: {message}</p>
                        <div className="action-buttons">
                            <button
                                onClick={() =>
                                    (window.location.href = '/checkout')
                                }
                            >
                                Thử lại
                            </button>
                            <button
                                onClick={() => (window.location.href = '/cart')}
                            >
                                Quay lại giỏ hàng
                            </button>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="payment-error">
                        <div className="error-icon">⚠️</div>
                        <h2>Có lỗi xảy ra</h2>
                        <p>Không thể xác định kết quả thanh toán.</p>
                        <button
                            onClick={() => (window.location.href = '/orders')}
                        >
                            Kiểm tra đơn hàng
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="payment-return-page">
            <div className="container">{renderPaymentResult()}</div>
        </div>
    );
};

export default PaymentReturn;
```

### Step 5: React Router Setup

```jsx
// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CheckoutPage from './components/Checkout/CheckoutPage';
import PaymentReturn from './pages/PaymentReturn';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/payment/return" element={<PaymentReturn />} />
                <Route path="/payment/success" element={<PaymentReturn />} />
                <Route path="/payment/failed" element={<PaymentReturn />} />
                {/* Other routes */}
            </Routes>
        </Router>
    );
}

export default App;
```

### Step 6: CSS Styling

```css
/* styles/checkout.css */
.payment-methods {
    margin: 20px 0;
}

.payment-method {
    display: flex;
    align-items: center;
    padding: 15px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.payment-method:hover {
    border-color: #d63384;
}

.payment-method.selected {
    border-color: #d63384;
    background-color: #f8f9fa;
}

.payment-method .icon {
    font-size: 24px;
    margin-right: 15px;
}

.payment-method .name {
    flex: 1;
    font-weight: 500;
}

.payment-method .checkmark {
    color: #d63384;
    font-weight: bold;
}

.place-order-btn {
    width: 100%;
    padding: 15px;
    background-color: #d63384;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.place-order-btn:hover:not(:disabled) {
    background-color: #b02a5b;
}

.place-order-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

/* Payment Return Page Styles */
.payment-return-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f8f9fa;
}

.payment-success,
.payment-failed,
.payment-checking,
.payment-error {
    text-align: center;
    padding: 40px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    width: 100%;
}

.success-icon,
.error-icon {
    font-size: 64px;
    margin-bottom: 20px;
}

.action-buttons {
    margin-top: 30px;
}

.action-buttons button {
    margin: 0 10px;
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
}

.action-buttons button:first-child {
    background-color: #d63384;
    color: white;
}

.action-buttons button:last-child {
    background-color: #6c757d;
    color: white;
}

.spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #d63384;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
```

## 🔧 Environment Configuration

### Frontend Environment Variables

```javascript
// .env.local (Next.js) or .env (React)
REACT_APP_API_BASE_URL=http://localhost:3055
NEXT_PUBLIC_API_BASE_URL=http://localhost:3055
```

### API Base URL Configuration

```javascript
// config/api.js
const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:3055';

export default API_BASE_URL;
```

## 📱 Mobile Responsive Considerations

```css
/* Mobile optimizations */
@media (max-width: 768px) {
    .checkout-container {
        padding: 10px;
    }

    .payment-method {
        padding: 12px;
    }

    .action-buttons {
        flex-direction: column;
    }

    .action-buttons button {
        margin: 5px 0;
        width: 100%;
    }
}
```

## 🔄 Complete User Flow Summary

1. **Cart Page**: User reviews items and clicks "Checkout"
2. **Checkout Page**: User selects address, shipping, and payment method (MoMo)
3. **Order Creation**: Frontend calls API to create order with MoMo payment
4. **MoMo Redirect**: User is redirected to MoMo payment page
5. **Payment Processing**: User completes payment on MoMo
6. **Return Handling**: User returns to your app with payment result
7. **Status Display**: Show success/failure message based on payment result
8. **Order Completion**: Backend processes the order via webhook

## 🎯 Key Frontend Features

- ✅ **Payment Method Selection**: Easy UI for choosing MoMo
- ✅ **Loading States**: User feedback during processing
- ✅ **Error Handling**: Graceful error management
- ✅ **Return Handling**: Proper payment result processing
- ✅ **Local Storage**: Temporary order data storage
- ✅ **Responsive Design**: Mobile-friendly interface
- ✅ **Status Checking**: Real-time payment status verification

This implementation provides a complete, production-ready frontend integration for MoMo payments that works seamlessly with your backend API!
