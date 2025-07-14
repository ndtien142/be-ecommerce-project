import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Quick MoMo Payment Component - Ready to use!
const MoMoPayment = ({ order, customer, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('web');
  const [orderId, setOrderId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const API_BASE_URL = 'http://localhost:3055/api/v1';

  // Check transaction status
  const checkTransactionStatus = async (momoOrderId) => {
    if (!momoOrderId) return;
    
    setStatusLoading(true);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/momo/transaction-status/${momoOrderId}`, {
        params: { lang: 'vi' }
      });
      
      if (response.data.metadata) {
        setPaymentStatus(response.data.metadata);
        
        if (response.data.metadata.success) {
          onSuccess?.(response.data.metadata);
        } else if (response.data.metadata.resultCode >= 5000 && response.data.metadata.resultCode <= 6000) {
          // Failed or expired
          onError?.(response.data.metadata.message);
        }
      }
    } catch (error) {
      console.error('Error checking transaction status:', error);
      onError?.(error.response?.data?.message || error.message);
    } finally {
      setStatusLoading(false);
    }
  };

  // Auto-check status every 30 seconds
  useEffect(() => {
    if (!orderId) return;
    
    const interval = setInterval(() => {
      checkTransactionStatus(orderId);
    }, 30000); // 30 seconds minimum as per MoMo documentation
    
    return () => clearInterval(interval);
  }, [orderId]);

  const createPayment = async () => {
    setLoading(true);
    
    try {
      const momoOrderId = `ORDER_${order.id}_${Date.now()}`;
      
      const response = await axios.post(`${API_BASE_URL}/momo/create-payment`, {
        orderId: momoOrderId,
        amount: order.total,
        orderInfo: `Thanh toán đơn hàng #${order.id}`,
        
        // Enhanced features - include if you have the data
        items: order.items || [],
        deliveryInfo: order.deliveryInfo || null,
        userInfo: customer || null,
        referenceId: order.referenceId || null,
        storeName: order.storeName || 'Your Store'
      });

      if (response.data.metadata) {
        const { payUrl, deeplink, qrCodeUrl } = response.data.metadata;
        
        // Store order ID for status checking
        setOrderId(momoOrderId);
        
        // Handle different payment methods
        if (paymentMethod === 'app' && deeplink) {
          window.location.href = deeplink;
        } else if (paymentMethod === 'qr' && qrCodeUrl) {
          alert(`QR Code: ${qrCodeUrl}`); // Replace with QR display
        } else if (payUrl) {
          window.location.href = payUrl;
        }
        
        // Start checking status after payment creation
        setTimeout(() => {
          checkTransactionStatus(momoOrderId);
        }, 5000); // Check after 5 seconds
      }
    } catch (error) {
      console.error('Payment failed:', error);
      onError?.(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (resultCode) => {
    if (resultCode === 0) return '#4caf50';
    if (resultCode >= 7000 && resultCode <= 9000) return '#ff9800';
    return '#f44336';
  };

  const getStatusIcon = (resultCode) => {
    if (resultCode === 0) return '✅';
    if (resultCode >= 7000 && resultCode <= 9000) return '⏳';
    return '❌';
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h3>Thanh toán MoMo</h3>
      
      {/* Payment Method Selection */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          <input
            type="radio"
            value="web"
            checked={paymentMethod === 'web'}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          {' '}Thanh toán trên web
        </label>
        
        <label style={{ display: 'block', marginBottom: '5px' }}>
          <input
            type="radio"
            value="app"
            checked={paymentMethod === 'app'}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          {' '}Mở ứng dụng MoMo
        </label>
        
        <label style={{ display: 'block', marginBottom: '5px' }}>
          <input
            type="radio"
            value="qr"
            checked={paymentMethod === 'qr'}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          {' '}Quét mã QR
        </label>
      </div>

      {/* Order Summary */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '15px'
      }}>
        <h4>Đơn hàng #{order.id}</h4>
        <p><strong>Số tiền:</strong> {order.total.toLocaleString()} VND</p>
        {customer && (
          <p><strong>Khách hàng:</strong> {customer.name}</p>
        )}
        {orderId && (
          <p style={{ fontSize: '12px', color: '#666' }}>
            <strong>MoMo Order ID:</strong> {orderId}
          </p>
        )}
      </div>

      {/* Payment Status */}
      {paymentStatus && (
        <div style={{
          backgroundColor: `${getStatusColor(paymentStatus.resultCode)}15`,
          border: `1px solid ${getStatusColor(paymentStatus.resultCode)}`,
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '15px'
        }}>
          <h4 style={{ 
            color: getStatusColor(paymentStatus.resultCode),
            margin: '0 0 10px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {getStatusIcon(paymentStatus.resultCode)} Trạng thái thanh toán
          </h4>
          
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
            {paymentStatus.message}
          </p>
          
          {paymentStatus.success && paymentStatus.data && (
            <div style={{ fontSize: '14px', color: '#666' }}>
              <p><strong>Mã giao dịch:</strong> {paymentStatus.data.transId}</p>
              <p><strong>Phương thức:</strong> {paymentStatus.data.payType}</p>
              <p><strong>Thời gian:</strong> {new Date(paymentStatus.data.responseTime).toLocaleString('vi-VN')}</p>
              
              {paymentStatus.data.promotionInfo && paymentStatus.data.promotionInfo.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <strong>Khuyến mãi:</strong>
                  {paymentStatus.data.promotionInfo.map((promo, idx) => (
                    <div key={idx} style={{ 
                      backgroundColor: '#fff3cd', 
                      padding: '8px', 
                      borderRadius: '4px',
                      marginTop: '5px'
                    }}>
                      {promo.voucherName} - Giảm {promo.amount.toLocaleString()} VND
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={() => checkTransactionStatus(orderId)}
              disabled={statusLoading}
              style={{
                padding: '6px 12px',
                backgroundColor: statusLoading ? '#ccc' : getStatusColor(paymentStatus.resultCode),
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: statusLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {statusLoading ? 'Đang kiểm tra...' : 'Kiểm tra lại'}
            </button>
          </div>
        </div>
      )}

      {/* Payment Button */}
      <button
        onClick={createPayment}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: loading ? '#ccc' : '#a50b8c',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Đang xử lý...' : '🟣 Thanh toán với MoMo'}
      </button>
      
      {orderId && !paymentStatus && (
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px', textAlign: 'center' }}>
          Tự động kiểm tra trạng thái mỗi 30 giây
        </p>
      )}
    </div>
  );
};

export default MoMoPayment;

// Usage Example:
/*
import MoMoPayment from './MoMoPayment';

const App = () => {
  const order = {
    id: 'ORD123',
    total: 100000,
    items: [
      {
        id: 'PROD_001',
        name: 'Sản phẩm A',
        price: 50000,
        quantity: 2
      }
    ]
  };

  const customer = {
    name: 'Nguyen Van A',
    phone: '0909123456',
    email: 'user@example.com'
  };

  return (
    <div>
      <h1>Checkout</h1>
      <MoMoPayment
        order={order}
        customer={customer}
        onSuccess={(response) => {
          console.log('Payment success:', response);
          // Handle success
        }}
        onError={(error) => {
          console.error('Payment error:', error);
          // Handle error
        }}
      />
    </div>
  );
};
*/
