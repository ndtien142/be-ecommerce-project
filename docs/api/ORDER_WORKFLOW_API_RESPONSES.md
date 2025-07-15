# Order Workflow API Response Documentation

## Overview

Documentation for API responses của Order Workflow system để Frontend có thể tạo interface/type definitions.

## Base Response Structure

```typescript
interface BaseResponse<T> {
    message: string;
    status: 'success' | 'error';
    code: number;
    metadata: T;
}

interface ErrorResponse {
    message: string;
    status: 'error';
    code: number;
    stack?: string;
}
```

## Order Workflow Endpoints

### 1. GET /api/v1/order/workflow/:orderId

**Description:** Lấy workflow hiện tại và các hành động có thể thực hiện

**Response Type:**

```typescript
interface OrderWorkflowResponse {
    currentStatus: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
    availableActions: WorkflowAction[];
}

type OrderStatus =
    | 'pending_confirmation'
    | 'pending_pickup'
    | 'shipping'
    | 'delivered'
    | 'customer_confirmed'
    | 'returned'
    | 'cancelled';

type PaymentStatus =
    | 'pending'
    | 'completed'
    | 'failed'
    | 'refunded'
    | 'cancelled'
    | 'expired';

type PaymentMethod = 'cash' | 'momo' | 'bank_transfer';

type WorkflowAction =
    | 'confirm'
    | 'cancel'
    | 'pickup'
    | 'deliver'
    | 'return'
    | 'customer_confirm'
    | 'complete_cod_payment';
```

**Example Response:**

```json
{
    "message": "Lấy workflow đơn hàng thành công",
    "status": "success",
    "code": 200,
    "metadata": {
        "currentStatus": "pending_confirmation",
        "paymentStatus": "pending",
        "paymentMethod": "cash",
        "availableActions": ["confirm", "cancel"]
    }
}
```

### 2. POST /api/v1/order/workflow/:orderId/confirm

**Description:** Xác nhận đơn hàng (Admin)

**Request Body:**

```typescript
interface ConfirmOrderRequest {
    note?: string;
}
```

**Response Type:**

```typescript
interface ConfirmOrderResponse {
    id: number;
    userId: number;
    status: OrderStatus;
    totalAmount: number;
    note?: string;
    orderedDate: string;
    shippedDate?: string;
    deliveredDate?: string;
    customerConfirmedDate?: string;
    shippingMethodId?: number;
    shippingFee?: number;
    trackingNumber?: string;
    shippedBy?: string;
    createTime: string;
    updateTime: string;
    payment?: PaymentInfo;
}

interface PaymentInfo {
    id: number;
    orderId: number;
    externalOrderId?: string;
    paymentMethod: PaymentMethod;
    transactionId?: string;
    transactionCode?: string;
    status: PaymentStatus;
    amount: number;
    paidAt?: string;
    createTime: string;
    updateTime: string;
}
```

**Example Response:**

```json
{
    "message": "Xác nhận đơn hàng thành công",
    "status": "success",
    "code": 200,
    "metadata": {
        "id": 62,
        "userId": 37,
        "status": "pending_pickup",
        "totalAmount": 150000,
        "note": "Xác nhận nha",
        "orderedDate": "2025-01-13T10:30:00.000Z",
        "createTime": "2025-01-13T10:30:00.000Z",
        "updateTime": "2025-01-13T10:35:00.000Z",
        "payment": {
            "id": 45,
            "orderId": 62,
            "paymentMethod": "cash",
            "status": "pending",
            "amount": 150000,
            "createTime": "2025-01-13T10:30:00.000Z",
            "updateTime": "2025-01-13T10:30:00.000Z"
        }
    }
}
```

### 3. POST /api/v1/order/workflow/:orderId/pickup

**Description:** Shipper lấy hàng

**Request Body:**

```typescript
interface PickupOrderRequest {
    trackingNumber?: string;
    shippedBy?: string;
    note?: string;
}
```

**Response Type:** Same as ConfirmOrderResponse

**Example Response:**

```json
{
    "message": "Lấy hàng thành công",
    "status": "success",
    "code": 200,
    "metadata": {
        "id": 62,
        "status": "shipping",
        "shippedDate": "2025-01-13T11:00:00.000Z",
        "trackingNumber": "VN123456789",
        "shippedBy": "Shipper Nguyen Van A"
    }
}
```

### 4. POST /api/v1/order/workflow/:orderId/deliver

**Description:** Giao hàng thành công

**Request Body:**

```typescript
interface DeliverOrderRequest {
    note?: string;
}
```

**Response Type:** Same as ConfirmOrderResponse

**Example Response:**

```json
{
    "message": "Giao hàng thành công",
    "status": "success",
    "code": 200,
    "metadata": {
        "id": 62,
        "status": "delivered",
        "deliveredDate": "2025-01-13T15:30:00.000Z"
    }
}
```

### 5. POST /api/v1/order/workflow/:orderId/customer-confirm

**Description:** Khách hàng xác nhận đã nhận hàng

**Request Body:**

```typescript
interface CustomerConfirmRequest {
    note?: string;
}
```

**Response Type:** Same as ConfirmOrderResponse

**Example Response:**

```json
{
    "message": "Xác nhận nhận hàng thành công",
    "status": "success",
    "code": 200,
    "metadata": {
        "id": 62,
        "status": "customer_confirmed",
        "customerConfirmedDate": "2025-01-13T16:00:00.000Z"
    }
}
```

### 6. POST /api/v1/order/workflow/:orderId/return

**Description:** Trả hàng

**Request Body:**

```typescript
interface ReturnOrderRequest {
    reason?: string;
}
```

**Response Type:** Same as ConfirmOrderResponse

**Example Response:**

```json
{
    "message": "Trả hàng thành công",
    "status": "success",
    "code": 200,
    "metadata": {
        "id": 62,
        "status": "returned",
        "note": "Khách hàng không nhận hàng\nLý do trả hàng: Sản phẩm không đúng mô tả"
    }
}
```

### 7. POST /api/v1/order/workflow/:orderId/cancel

**Description:** Hủy đơn hàng

**Request Body:**

```typescript
interface CancelOrderRequest {
    reason?: string;
}
```

**Response Type:** Same as ConfirmOrderResponse

**Example Response:**

```json
{
    "message": "Hủy đơn hàng thành công",
    "status": "success",
    "code": 200,
    "metadata": {
        "id": 62,
        "status": "cancelled",
        "note": "Lý do hủy: Khách hàng đổi ý"
    }
}
```

### 8. POST /api/v1/order/workflow/:orderId/complete-cod

**Description:** Hoàn tất thanh toán COD

**Response Type:** Same as ConfirmOrderResponse

**Example Response:**

```json
{
    "message": "Hoàn tất COD thành công",
    "status": "success",
    "code": 200,
    "metadata": {
        "id": 62,
        "payment": {
            "status": "completed",
            "paidAt": "2025-01-13T16:30:00.000Z"
        }
    }
}
```

### 9. GET /api/v1/order/workflow/statistics

**Description:** Thống kê đơn hàng theo trạng thái

**Response Type:**

```typescript
interface OrderStatisticsResponse {
    ordersByStatus: OrderStatusStat[];
    paymentsByStatusAndMethod: PaymentStatusStat[];
}

interface OrderStatusStat {
    status: OrderStatus;
    count: number;
}

interface PaymentStatusStat {
    status: PaymentStatus;
    method: PaymentMethod;
    count: number;
    totalAmount: number;
}
```

**Example Response:**

```json
{
    "message": "Lấy thống kê đơn hàng thành công",
    "status": "success",
    "code": 200,
    "metadata": {
        "ordersByStatus": [
            { "status": "pending_confirmation", "count": 15 },
            { "status": "pending_pickup", "count": 8 },
            { "status": "shipping", "count": 12 },
            { "status": "delivered", "count": 25 },
            { "status": "customer_confirmed", "count": 45 },
            { "status": "cancelled", "count": 3 },
            { "status": "returned", "count": 2 }
        ],
        "paymentsByStatusAndMethod": [
            {
                "status": "pending",
                "method": "cash",
                "count": 20,
                "totalAmount": 2500000
            },
            {
                "status": "completed",
                "method": "cash",
                "count": 40,
                "totalAmount": 5800000
            },
            {
                "status": "completed",
                "method": "momo",
                "count": 25,
                "totalAmount": 3200000
            },
            {
                "status": "refunded",
                "method": "momo",
                "count": 2,
                "totalAmount": 320000
            }
        ]
    }
}
```

## Order Log Endpoints

### 10. GET /api/v1/order/logs/:orderId

**Description:** Lấy lịch sử log của đơn hàng

**Query Parameters:**

```typescript
interface OrderLogsQuery {
    limit?: number; // default: 50
    offset?: number; // default: 0
}
```

**Response Type:**

```typescript
interface OrderLogsResponse {
    logs: OrderLog[];
    total: number;
    limit: number;
    offset: number;
}

interface OrderLog {
    id: number;
    orderId: number;
    fromStatus?: OrderStatus;
    toStatus: OrderStatus;
    action: LogAction;
    actorType: ActorType;
    actorId?: number;
    actorName?: string;
    note?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
    updatedAt: string;
}

type LogAction =
    | 'created'
    | 'confirmed'
    | 'picked_up'
    | 'shipped'
    | 'delivered'
    | 'customer_confirmed'
    | 'returned'
    | 'cancelled'
    | 'cod_completed'
    | 'payment_completed'
    | 'refunded';

type ActorType =
    | 'system'
    | 'admin'
    | 'customer'
    | 'shipper'
    | 'payment_gateway';
```

**Example Response:**

```json
{
    "message": "Lấy lịch sử đơn hàng thành công",
    "status": "success",
    "code": 200,
    "metadata": {
        "logs": [
            {
                "id": 123,
                "orderId": 62,
                "fromStatus": "pending_confirmation",
                "toStatus": "pending_pickup",
                "action": "confirmed",
                "actorType": "admin",
                "actorId": 1,
                "actorName": "testingadmin",
                "note": "Xác nhận nha",
                "ipAddress": "127.0.0.1",
                "userAgent": "Mozilla/5.0...",
                "createdAt": "2025-01-13T10:35:00.000Z",
                "updatedAt": "2025-01-13T10:35:00.000Z"
            }
        ],
        "total": 1,
        "limit": 50,
        "offset": 0
    }
}
```

### 11. GET /api/v1/order/logs/:orderId/timeline

**Description:** Lấy timeline của đơn hàng (UI-friendly)

**Response Type:**

```typescript
interface OrderTimelineResponse {
    timeline: TimelineItem[];
}

interface TimelineItem extends OrderLog {
    icon: string;
    color: string;
    title: string;
    description: string;
}
```

**Example Response:**

```json
{
    "message": "Lấy timeline đơn hàng thành công",
    "status": "success",
    "code": 200,
    "metadata": {
        "timeline": [
            {
                "id": 120,
                "orderId": 62,
                "fromStatus": null,
                "toStatus": "pending_confirmation",
                "action": "created",
                "actorType": "system",
                "icon": "🆕",
                "color": "blue",
                "title": "Tạo đơn hàng",
                "description": "Tự động bởi hệ thống",
                "createdAt": "2025-01-13T10:30:00.000Z"
            },
            {
                "id": 121,
                "orderId": 62,
                "fromStatus": "pending_confirmation",
                "toStatus": "pending_pickup",
                "action": "confirmed",
                "actorType": "admin",
                "actorName": "testingadmin",
                "icon": "✅",
                "color": "green",
                "title": "Xác nhận đơn hàng",
                "description": "Bởi: testingadmin • Xác nhận nha",
                "createdAt": "2025-01-13T10:35:00.000Z"
            }
        ]
    }
}
```

### 12. GET /api/v1/order/logs/dashboard

**Description:** Dashboard statistics cho admin

**Query Parameters:**

```typescript
interface DashboardQuery {
    startDate?: string; // ISO date
    endDate?: string; // ISO date
}
```

**Response Type:**

```typescript
interface DashboardStatsResponse {
    actionStats: ActionStat[];
    actorStats: ActorStat[];
    dailyStats: DailyStat[];
}

interface ActionStat {
    action: LogAction;
    count: number;
}

interface ActorStat {
    actorType: ActorType;
    count: number;
}

interface DailyStat {
    date: string; // YYYY-MM-DD
    count: number;
}
```

**Example Response:**

```json
{
    "message": "Lấy thống kê dashboard thành công",
    "status": "success",
    "code": 200,
    "metadata": {
        "actionStats": [
            { "action": "created", "count": 45 },
            { "action": "confirmed", "count": 40 },
            { "action": "delivered", "count": 25 },
            { "action": "customer_confirmed", "count": 20 }
        ],
        "actorStats": [
            { "actorType": "system", "count": 60 },
            { "actorType": "admin", "count": 35 },
            { "actorType": "customer", "count": 20 },
            { "actorType": "shipper", "count": 15 }
        ],
        "dailyStats": [
            { "date": "2025-01-13", "count": 25 },
            { "date": "2025-01-12", "count": 18 },
            { "date": "2025-01-11", "count": 22 }
        ]
    }
}
```

### 13. GET /api/v1/order/logs/pending-confirmation

**Description:** Lấy đơn hàng chờ xác nhận từ khách hàng

**Query Parameters:**

```typescript
interface PendingConfirmationQuery {
    limit?: number; // default: 50
    offset?: number; // default: 0
}
```

**Response Type:**

```typescript
interface PendingConfirmationResponse {
    orders: PendingOrder[];
    total: number;
    limit: number;
    offset: number;
}

interface PendingOrder {
    id: number;
    status: OrderStatus;
    deliveredDate: string;
    userId: number;
    totalAmount: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
}
```

**Example Response:**

```json
{
    "message": "Lấy danh sách đơn hàng chờ xác nhận thành công",
    "status": "success",
    "code": 200,
    "metadata": {
        "orders": [
            {
                "id": 60,
                "status": "delivered",
                "deliveredDate": "2025-01-12T14:30:00.000Z",
                "userId": 35,
                "totalAmount": 250000,
                "firstName": "Nguyen",
                "lastName": "Van A",
                "email": "nguyenvana@example.com",
                "phone": "0123456789"
            }
        ],
        "total": 1,
        "limit": 50,
        "offset": 0
    }
}
```

### 14. GET /api/v1/order/logs/admin/all

**Description:** Admin xem tất cả logs với filter

**Query Parameters:**

```typescript
interface AdminLogsQuery {
    limit?: number; // default: 100
    offset?: number; // default: 0
    action?: LogAction;
    actorType?: ActorType;
    startDate?: string; // ISO date
    endDate?: string; // ISO date
    orderId?: number;
}
```

**Response Type:**

```typescript
interface AdminLogsResponse {
    logs: AdminOrderLog[];
    total: number;
    limit: number;
    offset: number;
}

interface AdminOrderLog extends OrderLog {
    order: {
        id: number;
        status: OrderStatus;
        totalAmount: number;
        userId: number;
        user: {
            id: number;
            firstName: string;
            lastName: string;
            email: string;
        };
    };
}
```

**Example Response:**

```json
{
    "message": "Lấy tất cả logs thành công",
    "status": "success",
    "code": 200,
    "metadata": {
        "logs": [
            {
                "id": 123,
                "orderId": 62,
                "action": "confirmed",
                "actorType": "admin",
                "actorName": "testingadmin",
                "createdAt": "2025-01-13T10:35:00.000Z",
                "order": {
                    "id": 62,
                    "status": "pending_pickup",
                    "totalAmount": 150000,
                    "userId": 37,
                    "user": {
                        "id": 37,
                        "firstName": "Nguyen",
                        "lastName": "Van B",
                        "email": "nguyenvanb@example.com"
                    }
                }
            }
        ],
        "total": 1,
        "limit": 100,
        "offset": 0
    }
}
```

## Error Responses

### Common Error Codes

- **400 Bad Request:** Invalid request data
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** No permission
- **404 Not Found:** Resource not found
- **409 Conflict:** Business logic conflict
- **500 Internal Server Error:** Server error

### Error Response Examples

```json
{
    "message": "Đơn hàng không tồn tại",
    "status": "error",
    "code": 404
}
```

```json
{
    "message": "Đơn hàng không thể xác nhận",
    "status": "error",
    "code": 400
}
```

```json
{
    "message": "Bạn không có quyền xác nhận đơn hàng này",
    "status": "error",
    "code": 403
}
```

```json
{
    "message": "Lock wait timeout exceeded; try restarting transaction",
    "status": "error",
    "code": 500,
    "stack": "Error\n    at Query.run..."
}
```

## Usage Notes

1. **Authentication:** Tất cả endpoints cần authentication header
2. **Permissions:**
    - Admin: Tất cả endpoints
    - Customer: Chỉ customer-confirm và view own orders
    - Shipper: pickup, deliver endpoints
3. **Rate Limiting:** Apply rate limiting cho tất cả endpoints
4. **Validation:** Validate input data trước khi xử lý
5. **Transaction:** Sử dụng database transaction để đảm bảo data consistency
6. **Logging:** Tự động tạo log entries cho mọi status changes

## Frontend Integration

### React/TypeScript Example

```typescript
// types/order.ts
export interface OrderWorkflowResponse {
  currentStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  availableActions: WorkflowAction[];
}

// services/orderApi.ts
export const orderApi = {
  getWorkflow: (orderId: number): Promise<ApiResponse<OrderWorkflowResponse>> =>
    fetch(`/api/v1/order/workflow/${orderId}`).then(res => res.json()),

  confirmOrder: (orderId: number, data: ConfirmOrderRequest): Promise<ApiResponse<Order>> =>
    fetch(`/api/v1/order/workflow/${orderId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
};

// components/OrderWorkflow.tsx
const OrderWorkflow: React.FC<{ orderId: number }> = ({ orderId }) => {
  const [workflow, setWorkflow] = useState<OrderWorkflowResponse | null>(null);

  useEffect(() => {
    orderApi.getWorkflow(orderId).then(response => {
      if (response.status === 'success') {
        setWorkflow(response.metadata);
      }
    });
  }, [orderId]);

  return (
    <div>
      <h3>Current Status: {workflow?.currentStatus}</h3>
      <div>
        {workflow?.availableActions.map(action => (
          <button key={action} onClick={() => handleAction(action)}>
            {action}
          </button>
        ))}
      </div>
    </div>
  );
};
```

Các type definitions này sẽ giúp Frontend team có thể tạo ra interface chính xác và type-safe cho việc tương tác với Order Workflow API.
