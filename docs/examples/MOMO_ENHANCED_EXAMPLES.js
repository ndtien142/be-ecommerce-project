// Enhanced MoMo Payment Integration Example
// This example shows how to use the enhanced MoMo payment integration

const express = require('express');
const MomoPaymentService = require('./src/services/payment/momo.service');

const app = express();
app.use(express.json());

// Example 1: Simple payment
app.post('/api/simple-payment', async (req, res) => {
    try {
        const result = await MomoPaymentService.createPayment({
            orderId: `ORDER_${Date.now()}`,
            amount: 100000,
            orderInfo: 'Thanh toán đơn hàng simple',
            internalOrderId: 'INTERNAL_123'
        });
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Example 2: Enhanced payment with items, delivery, and user info
app.post('/api/enhanced-payment', async (req, res) => {
    try {
        const result = await MomoPaymentService.createPayment({
            orderId: `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: 250000,
            orderInfo: 'Thanh toán đơn hàng #12345',
            internalOrderId: 'INTERNAL_12345',
            
            // Product items (up to 50 items)
            items: [
                {
                    id: 'PROD_001',
                    name: 'Áo thun cotton premium',
                    description: 'Áo thun cotton 100% chất lượng cao',
                    category: 'fashion',
                    imageUrl: 'https://example.com/product1.jpg',
                    manufacturer: 'Fashion Brand',
                    price: 150000,
                    quantity: 1,
                    unit: 'piece',
                    taxAmount: 5000
                },
                {
                    id: 'PROD_002',
                    name: 'Quần jeans slim fit',
                    description: 'Quần jeans slim fit phong cách',
                    category: 'fashion',
                    imageUrl: 'https://example.com/product2.jpg',
                    manufacturer: 'Jeans Co',
                    price: 80000,
                    quantity: 1,
                    unit: 'piece',
                    taxAmount: 3000
                }
            ],
            
            // Delivery information
            deliveryInfo: {
                deliveryAddress: '123 Nguyen Van Linh, Quan 7, TP.HCM',
                deliveryFee: '20000',
                quantity: '2'
            },
            
            // User information for notifications
            userInfo: {
                name: 'Nguyen Van A',
                phoneNumber: '0909123456',
                email: 'nguyenvana@example.com'
            },
            
            // Additional fields
            referenceId: 'REF_12345',
            storeName: 'My Fashion Store',
            subPartnerCode: 'SUB_PARTNER_01'
        });
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Example 3: Frontend integration example
const frontendIntegrationExample = {
    description: 'React component example for enhanced MoMo payment integration',
    code: `
import React, { useState } from 'react';
import MomoPaymentService from '../services/momoService';

const EnhancedCheckout = ({ order, customer }) => {
    const [loading, setLoading] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState({
        showQR: false,
        useApp: false,
        useWeb: true
    });

    const handlePayment = async () => {
        setLoading(true);
        
        try {
            // Prepare payment data with enhanced features
            const paymentData = {
                orderId: \`ORDER_\${order.id}_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
                amount: order.total,
                orderInfo: \`Thanh toán đơn hàng #\${order.id}\`,
                internalOrderId: order.id,
                
                // Add items from cart
                items: order.items.map(item => ({
                    id: item.productId,
                    name: item.name,
                    description: item.description,
                    category: item.category,
                    imageUrl: item.imageUrl,
                    manufacturer: item.brand,
                    price: item.price,
                    quantity: item.quantity,
                    unit: item.unit || 'piece',
                    taxAmount: item.tax || 0
                })),
                
                // Add delivery information
                deliveryInfo: {
                    deliveryAddress: order.deliveryAddress,
                    deliveryFee: order.deliveryFee.toString(),
                    quantity: order.items.length.toString()
                },
                
                // Add customer information
                userInfo: {
                    name: customer.name,
                    phoneNumber: customer.phone,
                    email: customer.email
                },
                
                referenceId: order.referenceId,
                storeName: 'My Online Store'
            };
            
            const response = await MomoPaymentService.createPayment(paymentData);
            
            // Handle different payment methods
            if (paymentMethods.useApp && response.metadata.deeplink) {
                // Open MoMo app
                window.location.href = response.metadata.deeplink;
            } else if (paymentMethods.showQR && response.metadata.qrCodeUrl) {
                // Show QR code for scanning
                displayQRCode(response.metadata.qrCodeUrl);
            } else {
                // Redirect to MoMo web payment
                window.location.href = response.metadata.payUrl;
            }
            
        } catch (error) {
            console.error('Payment failed:', error);
            alert('Thanh toán thất bại: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const displayQRCode = (qrCodeUrl) => {
        // Use QR code library to display QR code
        // Example with qrcode.js
        const QRCode = require('qrcode');
        QRCode.toCanvas(document.getElementById('qr-canvas'), qrCodeUrl, {
            width: 256,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
    };

    return (
        <div className="enhanced-checkout">
            <h2>Thanh toán với MoMo</h2>
            
            {/* Payment method selection */}
            <div className="payment-methods">
                <label>
                    <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethods.useWeb}
                        onChange={() => setPaymentMethods({
                            showQR: false, useApp: false, useWeb: true
                        })}
                    />
                    Thanh toán web
                </label>
                
                <label>
                    <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethods.useApp}
                        onChange={() => setPaymentMethods({
                            showQR: false, useApp: true, useWeb: false
                        })}
                    />
                    Mở ứng dụng MoMo
                </label>
                
                <label>
                    <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethods.showQR}
                        onChange={() => setPaymentMethods({
                            showQR: true, useApp: false, useWeb: false
                        })}
                    />
                    Quét mã QR
                </label>
            </div>
            
            {/* QR Code display area */}
            {paymentMethods.showQR && (
                <div className="qr-code-container">
                    <canvas id="qr-canvas" style={{ display: 'none' }}></canvas>
                    <p>Quét mã QR bằng ứng dụng MoMo để thanh toán</p>
                </div>
            )}
            
            {/* Payment button */}
            <button
                onClick={handlePayment}
                disabled={loading}
                className="momo-payment-button"
                style={{
                    backgroundColor: '#a50b8c',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '16px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                }}
            >
                {loading ? 'Đang tạo thanh toán...' : 'Thanh toán với MoMo'}
            </button>
        </div>
    );
};

export default EnhancedCheckout;
`
};

// Example 4: IPN handling with enhanced data
app.post('/api/v1/momo/ipn', async (req, res) => {
    try {
        console.log('Enhanced MoMo IPN received:', {
            orderId: req.body.orderId,
            amount: req.body.amount,
            resultCode: req.body.resultCode,
            payType: req.body.payType, // qr, app, webApp, miniapp
            paymentOption: req.body.paymentOption, // momo, pay_later
            userFee: req.body.userFee,
            promotionInfo: req.body.promotionInfo,
            partnerUserId: req.body.partnerUserId
        });
        
        const result = await MomoPaymentService.handleIPN(req.body);
        
        // Additional processing for enhanced data
        if (req.body.promotionInfo && req.body.promotionInfo.length > 0) {
            // Track promotion usage
            await trackPromotionUsage(req.body.promotionInfo);
        }
        
        if (req.body.userFee > 0) {
            // Track user fees
            await trackUserFees(req.body.orderId, req.body.userFee);
        }
        
        res.json(result);
    } catch (error) {
        console.error('IPN handling error:', error);
        res.status(500).json({
            resultCode: 1,
            message: 'Error processing IPN'
        });
    }
});

// Helper functions
async function trackPromotionUsage(promotionInfo) {
    // Track promotion usage in database
    for (const promo of promotionInfo) {
        console.log('Promotion used:', {
            voucherId: promo.voucherId,
            voucherName: promo.voucherName,
            amount: promo.amount,
            amountSponsor: promo.amountSponsor,
            merchantRate: promo.merchantRate
        });
        // Save to database...
    }
}

async function trackUserFees(orderId, userFee) {
    // Track user fees in database
    console.log('User fee tracked:', { orderId, userFee });
    // Save to database...
}

// Example 5: Testing the enhanced integration
const testEnhancedIntegration = async () => {
    try {
        // Test 1: Simple payment
        console.log('Testing simple payment...');
        const simplePayment = await MomoPaymentService.createPayment({
            orderId: 'TEST_SIMPLE_' + Date.now(),
            amount: 50000,
            orderInfo: 'Test simple payment',
            internalOrderId: 'TEST_INTERNAL_1'
        });
        console.log('Simple payment created:', simplePayment);
        
        // Test 2: Enhanced payment with all features
        console.log('Testing enhanced payment...');
        const enhancedPayment = await MomoPaymentService.createPayment({
            orderId: 'TEST_ENHANCED_' + Date.now(),
            amount: 150000,
            orderInfo: 'Test enhanced payment',
            internalOrderId: 'TEST_INTERNAL_2',
            items: [
                {
                    id: 'TEST_ITEM_1',
                    name: 'Test Product 1',
                    description: 'Test product description',
                    category: 'test',
                    price: 100000,
                    quantity: 1,
                    unit: 'piece'
                }
            ],
            deliveryInfo: {
                deliveryAddress: 'Test Address 123',
                deliveryFee: '30000',
                quantity: '1'
            },
            userInfo: {
                name: 'Test User',
                phoneNumber: '0909123456',
                email: 'test@example.com'
            },
            referenceId: 'TEST_REF_123'
        });
        console.log('Enhanced payment created:', enhancedPayment);
        
        // Test 3: Amount validation
        console.log('Testing amount validation...');
        try {
            await MomoPaymentService.createPayment({
                orderId: 'TEST_INVALID_' + Date.now(),
                amount: 100, // Too small
                orderInfo: 'Test invalid amount'
            });
        } catch (error) {
            console.log('Amount validation working:', error.message);
        }
        
        // Test 4: Items validation
        console.log('Testing items validation...');
        try {
            const tooManyItems = Array(51).fill(null).map((_, i) => ({
                id: `ITEM_${i}`,
                name: `Item ${i}`,
                price: 1000,
                quantity: 1
            }));
            
            await MomoPaymentService.createPayment({
                orderId: 'TEST_ITEMS_' + Date.now(),
                amount: 51000,
                orderInfo: 'Test too many items',
                items: tooManyItems
            });
        } catch (error) {
            console.log('Items validation working:', error.message);
        }
        
        console.log('All tests completed!');
        
    } catch (error) {
        console.error('Test failed:', error);
    }
};

// Run tests if this file is executed directly
if (require.main === module) {
    testEnhancedIntegration();
}

module.exports = {
    app,
    testEnhancedIntegration
};
