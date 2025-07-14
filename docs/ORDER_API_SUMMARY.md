# 📋 Order Management API Summary

## 🔄 Workflow APIs (New System)

### Base URL: `/api/v1/order/workflow`

| Method | Endpoint                     | Description                   | Status    |
| ------ | ---------------------------- | ----------------------------- | --------- |
| `GET`  | `/:orderId`                  | Lấy workflow hiện tại         | ✅ Active |
| `POST` | `/:orderId/confirm`          | Xác nhận đơn hàng             | ✅ Active |
| `POST` | `/:orderId/pickup`           | Shipper lấy hàng              | ✅ Active |
| `POST` | `/:orderId/deliver`          | Shipper giao hàng             | ✅ Active |
| `POST` | `/:orderId/customer-confirm` | Khách hàng xác nhận nhận hàng | ✅ Active |
| `POST` | `/:orderId/complete-cod`     | Hoàn tất COD                  | ✅ Active |
| `POST` | `/:orderId/return`           | Trả hàng                      | ✅ Active |
| `POST` | `/:orderId/cancel`           | Hủy đơn hàng                  | ✅ Active |
| `GET`  | `/statistics`                | Thống kê đơn hàng             | ✅ Active |

## 📊 Logs APIs (New System)

### Base URL: `/api/v1/order/logs`

| Method | Endpoint                | Description          | Status    |
| ------ | ----------------------- | -------------------- | --------- |
| `GET`  | `/:orderId`             | Lấy lịch sử log      | ✅ Active |
| `GET`  | `/:orderId/timeline`    | Lấy timeline UI      | ✅ Active |
| `GET`  | `/action/:action`       | Lấy log theo action  | ✅ Active |
| `GET`  | `/stats/actor`          | Thống kê theo actor  | ✅ Active |
| `GET`  | `/dashboard`            | Dashboard statistics | ✅ Active |
| `GET`  | `/pending-confirmation` | Đơn chờ xác nhận     | ✅ Active |
| `GET`  | `/admin/all`            | Admin xem all logs   | ✅ Active |

## 🛒 Order APIs (Existing System)

### Base URL: `/api/v1/order`

| Method      | Endpoint                | Description             | Status        |
| ----------- | ----------------------- | ----------------------- | ------------- |
| `POST`      | `/`                     | Tạo đơn hàng            | ✅ Active     |
| `GET`       | `/user`                 | Lấy đơn hàng của user   | ✅ Active     |
| `GET`       | `/user/:id`             | Lấy đơn hàng theo ID    | ✅ Active     |
| `GET`       | `/admin`                | Admin lấy tất cả đơn    | ✅ Active     |
| `GET`       | `/admin/:id`            | Admin lấy đơn theo ID   | ✅ Active     |
| `PATCH`     | `/user/:id/address`     | Cập nhật địa chỉ        | ✅ Active     |
| ~~`PATCH`~~ | ~~`/admin/:id/status`~~ | ~~Cập nhật trạng thái~~ | ❌ Deprecated |
| ~~`PATCH`~~ | ~~`/admin/:id/cancel`~~ | ~~Hủy đơn hàng~~        | ❌ Deprecated |

## 🔄 Migration Guide

### Deprecated APIs → New APIs

| Old API                   | New API                                    | Notes               |
| ------------------------- | ------------------------------------------ | ------------------- |
| `PATCH /admin/:id/status` | `POST /workflow/:orderId/confirm`          | Chỉ cho xác nhận    |
| `PATCH /admin/:id/status` | `POST /workflow/:orderId/pickup`           | Chỉ cho lấy hàng    |
| `PATCH /admin/:id/status` | `POST /workflow/:orderId/deliver`          | Chỉ cho giao hàng   |
| `PATCH /admin/:id/cancel` | `POST /workflow/:orderId/cancel`           | Hủy đơn hàng        |
| N/A                       | `POST /workflow/:orderId/customer-confirm` | Mới: Khách xác nhận |
| N/A                       | `GET /logs/:orderId/timeline`              | Mới: Timeline UI    |

## 🚀 New Features

### 1. Complete Order Workflow

- **Dual confirmation**: Shipper giao + Khách hàng xác nhận
- **COD completion**: Tự động hoàn tất thanh toán COD
- **Smart validation**: Kiểm tra điều kiện chuyển trạng thái
- **Auto refund**: Tự động hoàn tiền MoMo khi cần

### 2. Comprehensive Logging

- **Full audit trail**: Theo dõi mọi thay đổi trạng thái
- **Actor tracking**: Ai làm gì, khi nào
- **Rich metadata**: IP, User Agent, tracking number, etc.
- **UI-ready timeline**: Icons, colors, descriptions

### 3. Enhanced Statistics

- **Real-time dashboard**: Thống kê theo thời gian thực
- **Actor analytics**: Phân tích theo người thực hiện
- **Pending alerts**: Cảnh báo đơn hàng cần xử lý
- **Payment tracking**: Theo dõi thanh toán chi tiết

## 🎯 Usage Examples

### 1. Complete COD Order Flow

```javascript
// 1. Xác nhận đơn hàng
POST /api/v1/order/workflow/123/confirm
{ "note": "Đơn hàng đã được xác nhận" }

// 2. Lấy hàng
POST /api/v1/order/workflow/123/pickup
{
  "trackingNumber": "TK001",
  "shippedBy": "Shipper A",
  "note": "Đã lấy hàng"
}

// 3. Giao hàng
POST /api/v1/order/workflow/123/deliver
{ "note": "Đã giao hàng thành công" }

// 4. Khách hàng xác nhận
POST /api/v1/order/workflow/123/customer-confirm
{ "note": "Hàng tốt, cảm ơn shop" }

// 5. Tự động hoàn tất COD (system)
```

### 2. Track Order Timeline

```javascript
// Lấy timeline cho UI
GET /api/v1/order/logs/123/timeline

// Response:
{
  "timeline": [
    {
      "id": 1,
      "action": "created",
      "icon": "🆕",
      "color": "blue",
      "title": "Tạo đơn hàng",
      "description": "Tự động bởi hệ thống",
      "createdAt": "2025-07-14T10:00:00Z"
    },
    {
      "id": 2,
      "action": "confirmed",
      "icon": "✅",
      "color": "green",
      "title": "Xác nhận đơn hàng",
      "description": "Bởi: Admin • Đơn hàng đã được xác nhận",
      "createdAt": "2025-07-14T10:30:00Z"
    }
  ]
}
```

### 3. Monitor Dashboard

```javascript
// Lấy dashboard statistics
GET /api/v1/order/logs/dashboard?startDate=2025-07-01&endDate=2025-07-14

// Response:
{
  "actionStats": [
    { "action": "created", "count": 150 },
    { "action": "confirmed", "count": 140 },
    { "action": "delivered", "count": 100 },
    { "action": "customer_confirmed", "count": 80 }
  ],
  "actorStats": [
    { "actorType": "system", "count": 150 },
    { "actorType": "admin", "count": 140 },
    { "actorType": "shipper", "count": 200 },
    { "actorType": "customer", "count": 80 }
  ],
  "dailyStats": [
    { "date": "2025-07-14", "count": 45 },
    { "date": "2025-07-13", "count": 38 }
  ]
}
```

## 🔧 Technical Implementation

### Database Tables

- `tb_order`: Thêm `customer_confirmed_date`, cập nhật status enum
- `tb_order_log`: Bảng mới cho audit trail
- `tb_payment`: Cập nhật status enum

### Services

- `OrderWorkflowService`: Xử lý workflow logic
- `OrderLogService`: Quản lý logs và timeline
- `OrderService`: Giữ lại cho create/read operations

### Controllers

- `OrderWorkflowController`: Workflow endpoints
- `OrderLogController`: Logs endpoints
- `OrderController`: Core order operations (cleaned up)

### Routes

- `/api/v1/order/workflow/*`: Workflow management
- `/api/v1/order/logs/*`: Logs and timeline
- `/api/v1/order/*`: Basic CRUD operations

## 📚 Documentation

- **Swagger**: Full API documentation với examples
- **Postman**: Collection với test cases
- **Guide**: Complete workflow guide trong `/docs`

## 🚨 Important Notes

1. **Backward Compatibility**: Old APIs marked as deprecated, still work
2. **Data Migration**: Run migration scripts before deployment
3. **Email Notifications**: Integrated with existing email service
4. **Error Handling**: Comprehensive error responses
5. **Security**: All endpoints require authentication
6. **Performance**: Proper indexing on log tables
7. **Testing**: Unit tests cho tất cả workflow methods
