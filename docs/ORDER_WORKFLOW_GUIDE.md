# 🔄 Order Workflow Management System

## Tổng quan

Hệ thống quản lý workflow đơn hàng được thiết kế để xử lý hai loại thanh toán chính:

- **COD (Cash on Delivery)**: Thanh toán khi nhận hàng
- **MoMo**: Thanh toán trước

## 🎯 Quy tắc Workflow

### 1. COD (Thanh toán khi nhận hàng)

```
pending_confirmation (Chờ xác nhận)
    ↓ [Xác nhận đơn]
pending_pickup (Chờ lấy hàng)
    ↓ [Shipper lấy hàng]
shipping (Đang giao hàng)
    ↓ [Shipper giao thành công]
delivered (Đã giao - chờ khách xác nhận)
    ↓ [Khách hàng xác nhận nhận hàng]
customer_confirmed (Khách đã xác nhận)
    ↓ [Tự động hoàn tất COD]
Payment: completed (COD thu thành công)
```

### 2. MoMo (Thanh toán trước)

```
pending_confirmation (Chờ xác nhận)
    ↓ [Đã thanh toán MoMo]
pending_pickup (Chờ lấy hàng)
    ↓ [Shipper lấy hàng]
shipping (Đang giao hàng)
    ↓ [Shipper giao thành công]
delivered (Đã giao - chờ khách xác nhận)
    ↓ [Khách hàng xác nhận nhận hàng]
customer_confirmed (Hoàn tất - tiền đã thu từ trước)
```

### 3. Refund/Trả hàng (Chung cho COD và MoMo)

```
shipping / delivered / customer_confirmed
    ↓ [Không nhận / trả hàng]
returned (Đã trả hàng)
    ↓ [Nếu đã thanh toán MoMo: hoàn tiền]
Payment: refunded
```

## 📊 Bảng Trạng Thái

### Order Status

| Status                 | Mô tả          |
| ---------------------- | -------------- |
| `pending_confirmation` | Chờ xác nhận   |
| `pending_pickup`       | Chờ lấy hàng   |
| `shipping`             | Đang giao hàng |
| `delivered`            | Đã giao        |
| `returned`             | Trả hàng       |
| `cancelled`            | Đã hủy         |

### Payment Status

| Status      | Mô tả               |
| ----------- | ------------------- |
| `pending`   | Chưa thanh toán     |
| `completed` | Đã thanh toán       |
| `failed`    | Thanh toán thất bại |
| `cancelled` | Đã hủy              |
| `expired`   | Hết hạn             |
| `refunded`  | Đã hoàn tiền        |

## 🔧 API Endpoints

### Base URL: `/api/v1/order/workflow`

#### 1. Lấy workflow hiện tại

```http
GET /api/v1/order/workflow/:orderId
```

**Response:**

```json
{
    "currentStatus": "pending_confirmation",
    "paymentStatus": "pending",
    "paymentMethod": "cash",
    "availableActions": ["confirm", "cancel"]
}
```

#### 2. Xác nhận đơn hàng

```http
POST /api/v1/order/workflow/:orderId/confirm
```

**Điều kiện:**

- Order status: `pending_confirmation`
- MoMo: Payment status phải là `completed`

#### 3. Shipper lấy hàng

```http
POST /api/v1/order/workflow/:orderId/pickup
```

**Body:**

```json
{
    "trackingNumber": "string",
    "shippedBy": "string"
}
```

**Điều kiện:**

- Order status: `pending_pickup`

#### 4. Giao hàng thành công

```http
POST /api/v1/order/workflow/:orderId/deliver
```

**Điều kiện:**

- Order status: `shipping`

#### 5. Shipper nộp tiền COD

```http
POST /api/v1/order/workflow/:orderId/complete-cod
```

**Điều kiện:**

- Order status: `delivered`
- Payment method: `cash`
- Payment status: `pending`

#### 6. Trả hàng

```http
POST /api/v1/order/workflow/:orderId/return
```

**Body:**

```json
{
    "reason": "string"
}
```

**Điều kiện:**

- Order status: `shipping` hoặc `delivered`

**Tự động xử lý:**

- Hoàn lại stock sản phẩm
- Refund MoMo nếu đã thanh toán

#### 7. Hủy đơn hàng

```http
POST /api/v1/order/workflow/:orderId/cancel
```

**Body:**

```json
{
    "reason": "string"
}
```

**Điều kiện:**

- Order status: `pending_confirmation` hoặc `pending_pickup`

**Tự động xử lý:**

- Hoàn lại stock sản phẩm
- Refund MoMo nếu đã thanh toán

#### 8. Thống kê đơn hàng

```http
GET /api/v1/order/workflow/statistics
```

**Response:**

```json
{
    "ordersByStatus": [
        {
            "status": "pending_confirmation",
            "count": 10
        }
    ],
    "paymentsByStatusAndMethod": [
        {
            "status": "completed",
            "method": "momo",
            "count": 5,
            "totalAmount": 1000000
        }
    ]
}
```

## 🚨 Xử lý Lỗi

### Lỗi thường gặp:

1. **Trạng thái không hợp lệ**: Không thể thực hiện hành động với trạng thái hiện tại
2. **MoMo chưa thanh toán**: Đơn MoMo chưa thanh toán không thể xác nhận
3. **Refund thất bại**: Lỗi khi hoàn tiền MoMo

### Error Response Format:

```json
{
    "status": "error",
    "code": 400,
    "message": "Đơn hàng không thể xác nhận",
    "stack": "..."
}
```

## 💡 Lưu ý Quan Trọng

1. **COD**: Đơn chỉ hoàn tất khi shipper nộp tiền → `payment.status = completed`
2. **MoMo**: Đơn chỉ ship khi `payment.status = completed`
3. **Refund**: Chỉ hoàn tiền toàn phần, không hoàn tiền một phần
4. **Stock**: Tự động hoàn lại stock khi hủy/trả hàng
5. **Email**: Gửi email thông báo cho các trạng thái quan trọng

## 🧪 Testing

### Test Cases:

#### COD Flow:

1. Tạo đơn COD → `pending_confirmation`
2. Xác nhận → `pending_pickup`
3. Lấy hàng → `shipping`
4. Giao hàng → `delivered`
5. Nộp tiền COD → `payment.completed`

#### MoMo Flow:

1. Tạo đơn MoMo → `pending_confirmation`
2. Thanh toán MoMo → `payment.completed`
3. Xác nhận → `pending_pickup`
4. Lấy hàng → `shipping`
5. Giao hàng → `delivered`

#### Return Flow:

1. Từ `shipping` → Return → `returned`
2. Từ `delivered` → Return → `returned`
3. Tự động refund nếu đã thanh toán MoMo

#### Cancel Flow:

1. Từ `pending_confirmation` → Cancel → `cancelled`
2. Từ `pending_pickup` → Cancel → `cancelled`
3. Tự động refund nếu đã thanh toán MoMo

## 🔍 Monitoring

### Metrics quan trọng:

- Tỷ lệ thành công giao hàng
- Thời gian xử lý mỗi bước
- Số lượng trả hàng/hủy đơn
- Tỷ lệ hoàn tiền

### Logs cần theo dõi:

- Chuyển đổi trạng thái đơn hàng
- Lỗi refund MoMo
- Lỗi cập nhật stock
- Lỗi gửi email

## 📝 Changelog

### v1.0.0

- Triển khai workflow cơ bản cho COD và MoMo
- Xử lý refund tự động
- API endpoints đầy đủ
- Thống kê và monitoring
