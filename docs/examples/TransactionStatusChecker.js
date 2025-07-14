import React, { useState, useEffect } from 'react';
import MomoPaymentService from '../services/momoService';

/**
 * Enhanced Transaction Status Component
 * 
 * This component demonstrates how to use the MoMo transaction status check API
 * with comprehensive error handling and real-time status updates.
 */
const TransactionStatusChecker = ({ orderId, autoRefresh = true, refreshInterval = 30000 }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [language, setLanguage] = useState('vi');

  // Check transaction status
  const checkStatus = async (showLoading = true) => {
    if (!orderId) {
      setError('Order ID is required');
      return;
    }

    if (showLoading) setLoading(true);
    setError(null);

    try {
      const response = await MomoPaymentService.checkTransactionStatus(orderId, language);
      
      if (response.metadata) {
        setStatus(response.metadata);
        setLastChecked(new Date());
        
        // Log detailed transaction info
        console.log('Transaction Status:', response.metadata);
        
        // Handle different status codes
        if (response.metadata.success) {
          console.log('✅ Transaction successful:', response.metadata.data);
          
          // Display promotion information if available
          if (response.metadata.data.promotionInfo?.length > 0) {
            console.log('🎁 Promotions applied:', response.metadata.data.promotionInfo);
          }
          
          // Display refund information if available
          if (response.metadata.data.refundTrans?.length > 0) {
            console.log('💰 Refunds:', response.metadata.data.refundTrans);
          }
        } else {
          console.log('❌ Transaction failed/pending:', response.metadata.message);
        }
      }
    } catch (error) {
      console.error('Error checking transaction status:', error);
      setError(error.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !orderId) return;

    // Check immediately
    checkStatus(true);

    // Set up interval for auto-refresh (minimum 30 seconds as per MoMo docs)
    const interval = setInterval(() => {
      checkStatus(false); // Don't show loading for auto-refresh
    }, Math.max(refreshInterval, 30000)); // Ensure minimum 30 seconds

    return () => clearInterval(interval);
  }, [orderId, autoRefresh, refreshInterval, language]);

  // Format amount for display
  const formatAmount = (amount) => {
    if (!amount) return '0';
    return amount.toLocaleString('vi-VN') + ' VND';
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  // Get status color
  const getStatusColor = (resultCode) => {
    if (resultCode === 0) return '#4caf50'; // Success - green
    if (resultCode >= 7000 && resultCode <= 9000) return '#ff9800'; // Processing/Pending - orange
    return '#f44336'; // Failed - red
  };

  // Get status icon
  const getStatusIcon = (resultCode) => {
    if (resultCode === 0) return '✅';
    if (resultCode >= 7000 && resultCode <= 9000) return '⏳';
    return '❌';
  };

  if (loading && !status) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ marginBottom: '10px' }}>🔍 Checking transaction status...</div>
        <div style={{
          width: '30px',
          height: '30px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #a50b8c',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        border: '1px solid #f44336',
        borderRadius: '8px',
        backgroundColor: '#ffebee',
        color: '#c62828'
      }}>
        <div style={{ marginBottom: '10px' }}>❌ Error checking transaction status:</div>
        <div style={{ fontSize: '14px' }}>{error}</div>
        <button
          onClick={() => checkStatus(true)}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!status) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>No transaction status available</div>
        <button
          onClick={() => checkStatus(true)}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#a50b8c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Check Status
        </button>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      border: `2px solid ${getStatusColor(status.resultCode)}`,
      borderRadius: '8px',
      backgroundColor: `${getStatusColor(status.resultCode)}10`
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: getStatusColor(status.resultCode) }}>
          {getStatusIcon(status.resultCode)} Transaction Status
        </h3>
        
        {/* Language selector */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ fontSize: '12px' }}>Language:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '12px'
            }}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* Status Message */}
      <div style={{
        fontSize: '16px',
        fontWeight: 'bold',
        color: getStatusColor(status.resultCode),
        marginBottom: '15px'
      }}>
        {status.message}
      </div>

      {/* Transaction Details */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '15px',
        marginBottom: '15px'
      }}>
        <div>
          <strong>Order ID:</strong> {status.data?.orderId || 'N/A'}
        </div>
        <div>
          <strong>Transaction ID:</strong> {status.data?.transId || 'N/A'}
        </div>
        <div>
          <strong>Amount:</strong> {formatAmount(status.data?.amount)}
        </div>
        <div>
          <strong>Payment Type:</strong> {status.data?.payType || 'N/A'}
        </div>
        <div>
          <strong>Payment Option:</strong> {status.data?.paymentOption || 'N/A'}
        </div>
        <div>
          <strong>Response Time:</strong> {formatDate(status.data?.responseTime)}
        </div>
      </div>

      {/* Promotion Information */}
      {status.data?.promotionInfo && status.data.promotionInfo.length > 0 && (
        <div style={{
          backgroundColor: '#fff3cd',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '15px',
          border: '1px solid #ffeaa7'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>🎁 Promotions Applied</h4>
          {status.data.promotionInfo.map((promo, index) => (
            <div key={index} style={{
              backgroundColor: 'white',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '10px',
              border: '1px solid #ffeaa7'
            }}>
              <div><strong>Voucher:</strong> {promo.voucherName}</div>
              <div><strong>Discount:</strong> {formatAmount(promo.amount)}</div>
              <div><strong>Type:</strong> {promo.voucherType}</div>
              <div><strong>Merchant Rate:</strong> {promo.merchantRate}%</div>
            </div>
          ))}
        </div>
      )}

      {/* Refund Information */}
      {status.data?.refundTrans && status.data.refundTrans.length > 0 && (
        <div style={{
          backgroundColor: '#e8f5e8',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '15px',
          border: '1px solid #c8e6c9'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>💰 Refund Transactions</h4>
          {status.data.refundTrans.map((refund, index) => (
            <div key={index} style={{
              backgroundColor: 'white',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '10px',
              border: '1px solid #c8e6c9'
            }}>
              <div><strong>Refund ID:</strong> {refund.refundId}</div>
              <div><strong>Amount:</strong> {formatAmount(refund.amount)}</div>
              <div><strong>Status:</strong> {refund.status}</div>
              <div><strong>Date:</strong> {formatDate(refund.responseTime)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '15px' }}>
        <button
          onClick={() => checkStatus(true)}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#a50b8c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Checking...' : 'Refresh Status'}
        </button>
        
        <div style={{ fontSize: '12px', color: '#666' }}>
          Last checked: {lastChecked ? lastChecked.toLocaleTimeString('vi-VN') : 'Never'}
        </div>
        
        {autoRefresh && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            • Auto-refresh: {refreshInterval / 1000}s
          </div>
        )}
      </div>

      {/* CSS for animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TransactionStatusChecker;

// Usage Examples:

// 1. Basic usage
/*
<TransactionStatusChecker 
  orderId="ORDER_123_1672900000000" 
/>
*/

// 2. Custom refresh interval (minimum 30 seconds)
/*
<TransactionStatusChecker 
  orderId="ORDER_123_1672900000000" 
  autoRefresh={true}
  refreshInterval={60000} // 60 seconds
/>
*/

// 3. Manual check only (no auto-refresh)
/*
<TransactionStatusChecker 
  orderId="ORDER_123_1672900000000" 
  autoRefresh={false}
/>
*/

// 4. Integration in checkout flow
/*
const CheckoutPage = () => {
  const [orderId, setOrderId] = useState(null);
  const [showStatusChecker, setShowStatusChecker] = useState(false);

  const handlePaymentCreated = (response) => {
    setOrderId(response.metadata.orderId);
    setShowStatusChecker(true);
  };

  return (
    <div>
      {!showStatusChecker ? (
        <PaymentButton onSuccess={handlePaymentCreated} />
      ) : (
        <TransactionStatusChecker 
          orderId={orderId}
          autoRefresh={true}
          refreshInterval={30000}
        />
      )}
    </div>
  );
};
*/
