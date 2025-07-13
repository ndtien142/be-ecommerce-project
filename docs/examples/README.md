# 📝 Examples & Components

This folder contains ready-to-use code examples and React components for MoMo payment integration.

## 📖 Contents

### [Enhanced Examples](MOMO_ENHANCED_EXAMPLES.js)

Complete working examples for all MoMo features. Includes:

- Express.js backend examples
- React frontend integration
- Payment creation and status checking
- Refund processing examples
- Error handling patterns
- Test scenarios and validation

### [MoMo Payment Component](MoMoPayment.js)

Ready-to-use React component with auto-status checking. Features:

- Multiple payment methods (web, app, QR)
- Real-time transaction status monitoring
- Auto-refresh every 30 seconds
- Enhanced error handling
- Promotion information display
- Copy-and-paste ready

### [Transaction Status Checker](TransactionStatusChecker.js)

Advanced status monitoring component. Features:

- Comprehensive status tracking
- Multi-language support (Vietnamese/English)
- Promotion and refund information display
- Configurable auto-refresh intervals
- Real-time status updates
- Production-ready error handling

## 🚀 Quick Usage

### Simple Integration

```javascript
import MoMoPayment from './docs/examples/MoMoPayment';

<MoMoPayment
    order={{ id: '123', total: 100000 }}
    customer={{ name: 'John Doe', phone: '0909123456' }}
    onSuccess={(response) => console.log('Success!')}
    onError={(error) => console.error('Error:', error)}
/>;
```

### Advanced Status Monitoring

```javascript
import TransactionStatusChecker from './docs/examples/TransactionStatusChecker';

<TransactionStatusChecker
    orderId="ORDER_123_1672900000000"
    autoRefresh={true}
    refreshInterval={30000}
/>;
```

## 🎯 Component Features

- **Production Ready**: Complete error handling and validation
- **Mobile Responsive**: Works on all devices
- **Auto-Refresh**: Real-time status updates
- **Multi-Language**: Vietnamese and English support
- **Customizable**: Easy to modify and extend

## 🔗 Related Documentation

- **API Implementation**: [../api/](../api/)
- **Frontend Guides**: [../frontend/](../frontend/)
- **Advanced Features**: [../features/](../features/)

---

**Last Updated**: July 13, 2025
