# 🎯 Discount Management API Documentation

## 📋 Tổng quan

Tài liệu này mô tả chi tiết các API endpoints cho hệ thống quản lý giảm giá (Discount Management System), bao gồm:

- **Coupon Management**: Quản lý mã giảm giá
- **Product Sale Management**: Quản lý giảm giá sản phẩm
- **User Coupon Management**: Quản lý phiếu giảm giá của người dùng
- **Validation & Application**: Xác thực và áp dụng giảm giá

## 🔐 Authentication

Tất cả API đều yêu cầu JWT token trong header:

```
Authorization: Bearer {token}
```

## 🏷️ 1. Coupon Management APIs

### 1.1 Tạo Coupon Mới

**POST** `/api/v1/coupons`

#### Request Body (camelCase):

```json
{
    "code": "WELCOME50",
    "name": "Chào mừng khách hàng mới",
    "description": "Giảm giá 50% cho khách hàng mới",
    "type": "percent", // "percent" | "fixed" | "free_shipping"
    "value": 50,
    "minOrderAmount": 100000,
    "maxDiscountAmount": 500000,
    "usageLimit": 1000,
    "usageLimitPerUser": 1,
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z",
    "applicableProducts": [1, 2, 3],
    "applicableCategories": [1, 2],
    "excludedProducts": [4, 5],
    "excludedCategories": [3],
    "firstOrderOnly": true,
    "applicableUserGroups": ["vip", "premium"],
    "createdBy": 1
}
```

#### Response:

```json
{
    "code": 200,
    "status": "success",
    "message": "Coupon created successfully",
    "metadata": {
        "id": 1,
        "code": "WELCOME50",
        "name": "Chào mừng khách hàng mới",
        "description": "Giảm giá 50% cho khách hàng mới",
        "type": "percent",
        "value": 50,
        "minOrderAmount": 100000,
        "maxDiscountAmount": 500000,
        "usageLimit": 1000,
        "usageLimitPerUser": 1,
        "usedCount": 0,
        "startDate": "2024-01-01T00:00:00Z",
        "endDate": "2024-12-31T23:59:59Z",
        "isActive": true,
        "firstOrderOnly": true,
        "applicableProducts": [1, 2, 3],
        "applicableCategories": [1, 2],
        "excludedProducts": [4, 5],
        "excludedCategories": [3],
        "applicableUserGroups": ["vip", "premium"],
        "createdBy": 1,
        "createTime": "2024-01-01T00:00:00Z",
        "updateTime": "2024-01-01T00:00:00Z"
    }
}
```

### 1.2 Lấy Danh Sách Coupon

**GET** `/api/v1/coupons`

#### Query Parameters:

```
page=1&limit=10&isActive=true&type=percent&code=WELCOME&startDate=2024-01-01&endDate=2024-12-31
```

#### Response:

```json
{
    "code": 200,
    "status": "success",
    "metadata": {
        "coupons": [
            {
                "id": 1,
                "code": "WELCOME50",
                "name": "Chào mừng khách hàng mới",
                "type": "percent",
                "value": 50,
                "usedCount": 25,
                "usageLimit": 1000,
                "isActive": true,
                "startDate": "2024-01-01T00:00:00Z",
                "endDate": "2024-12-31T23:59:59Z",
                "createTime": "2024-01-01T00:00:00Z"
            }
        ],
        "pagination": {
            "total": 50,
            "page": 1,
            "limit": 10,
            "totalPages": 5
        }
    }
}
```

### 1.3 Lấy Chi Tiết Coupon

**GET** `/api/v1/coupons/{id}`

#### Response:

```json
{
    "code": 200,
    "status": "success",
    "metadata": {
        "id": 1,
        "code": "WELCOME50",
        "name": "Chào mừng khách hàng mới",
        "description": "Giảm giá 50% cho khách hàng mới",
        "type": "percent",
        "value": 50,
        "minOrderAmount": 100000,
        "maxDiscountAmount": 500000,
        "usageLimit": 1000,
        "usageLimitPerUser": 1,
        "usedCount": 25,
        "startDate": "2024-01-01T00:00:00Z",
        "endDate": "2024-12-31T23:59:59Z",
        "isActive": true,
        "firstOrderOnly": true,
        "applicableProducts": [1, 2, 3],
        "applicableCategories": [1, 2],
        "excludedProducts": [4, 5],
        "excludedCategories": [3],
        "applicableUserGroups": ["vip", "premium"],
        "createdBy": 1,
        "createTime": "2024-01-01T00:00:00Z",
        "updateTime": "2024-01-01T00:00:00Z"
    }
}
```

### 1.4 Cập Nhật Coupon

**PUT** `/api/v1/coupons/{id}`

#### Request Body (camelCase):

```json
{
    "name": "Chào mừng khách hàng mới - Updated",
    "description": "Giảm giá 50% cho khách hàng mới - Updated",
    "value": 60,
    "minOrderAmount": 150000,
    "usageLimit": 2000,
    "endDate": "2024-12-31T23:59:59Z",
    "isActive": true
}
```

### 1.5 Xóa Coupon

**DELETE** `/api/v1/coupons/{id}`

#### Response:

```json
{
    "code": 200,
    "status": "success",
    "message": "Coupon deleted successfully"
}
```

### 1.6 Bật/Tắt Coupon

**POST** `/api/v1/coupons/{id}/toggle`

#### Request Body:

```json
{
    "isActive": false
}
```

## 📊 2. Product Sale Management APIs

### 2.1 Tạo Product Sale

**POST** `/api/v1/product-sales`

#### Request Body (camelCase):

```json
{
    "productId": 1,
    "salePrice": 80000,
    "originalPrice": 100000,
    "discountPercent": 20,
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z",
    "maxQuantity": 100,
    "description": "Flash sale sản phẩm ABC",
    "isActive": true,
    "priority": 1,
    "createdBy": 1
}
```

#### Response:

```json
{
    "code": 200,
    "status": "success",
    "message": "Product sale created successfully",
    "metadata": {
        "id": 1,
        "productId": 1,
        "salePrice": 80000,
        "originalPrice": 100000,
        "discountPercent": 20,
        "startDate": "2024-01-01T00:00:00Z",
        "endDate": "2024-01-31T23:59:59Z",
        "maxQuantity": 100,
        "soldQuantity": 0,
        "description": "Flash sale sản phẩm ABC",
        "isActive": true,
        "priority": 1,
        "createdBy": 1,
        "createTime": "2024-01-01T00:00:00Z",
        "product": {
            "id": 1,
            "name": "Sản phẩm ABC",
            "price": 100000,
            "sku": "ABC-001"
        }
    }
}
```

### 2.2 Lấy Danh Sách Product Sale

**GET** `/api/v1/product-sales`

#### Query Parameters:

```
page=1&limit=10&isActive=true&productId=1&startDate=2024-01-01&endDate=2024-01-31
```

### 2.3 Lấy Sản Phẩm Đang Sale

**GET** `/api/v1/product-sales/on-sale`

#### Response:

```json
{
    "code": 200,
    "status": "success",
    "metadata": {
        "productSales": [
            {
                "id": 1,
                "productId": 1,
                "salePrice": 80000,
                "originalPrice": 100000,
                "discountPercent": 20,
                "soldQuantity": 25,
                "maxQuantity": 100,
                "remainingQuantity": 75,
                "endDate": "2024-01-31T23:59:59Z",
                "product": {
                    "id": 1,
                    "name": "Sản phẩm ABC",
                    "slug": "san-pham-abc",
                    "images": ["image1.jpg", "image2.jpg"],
                    "price": 100000,
                    "sku": "ABC-001"
                }
            }
        ]
    }
}
```

## 🎁 3. User Coupon Management APIs

### 3.1 Tặng Coupon Cho User

**POST** `/api/v1/user-coupons/grant`

#### Request Body (camelCase):

```json
{
    "userId": 1,
    "couponId": 1,
    "personalCode": "BIRTHDAY_USER123",
    "giftMessage": "Chúc mừng sinh nhật!",
    "maxUsage": 1,
    "validFrom": "2024-01-01T00:00:00Z",
    "validUntil": "2024-01-31T23:59:59Z",
    "source": "admin_gift",
    "metadata": {
        "grantedBy": 1,
        "reason": "Birthday gift",
        "event": "birthday_2024"
    }
}
```

#### Response:

```json
{
    "code": 200,
    "status": "success",
    "message": "Coupon granted successfully",
    "metadata": {
        "id": 1,
        "userId": 1,
        "couponId": 1,
        "personalCode": "BIRTHDAY_USER123",
        "giftMessage": "Chúc mừng sinh nhật!",
        "maxUsage": 1,
        "usedCount": 0,
        "validFrom": "2024-01-01T00:00:00Z",
        "validUntil": "2024-01-31T23:59:59Z",
        "source": "admin_gift",
        "isActive": true,
        "createTime": "2024-01-01T00:00:00Z",
        "coupon": {
            "id": 1,
            "code": "WELCOME50",
            "name": "Chào mừng khách hàng mới",
            "type": "percent",
            "value": 50
        }
    }
}
```

### 3.2 Lấy Danh Sách User Coupon

**GET** `/api/v1/user-coupons`

#### Query Parameters:

```
page=1&limit=10&userId=1&couponId=1&isActive=true&source=admin_gift
```

### 3.3 Lấy Coupon Của User (User API)

**GET** `/api/v1/user-coupons/my-coupons`

#### Query Parameters:

```
page=1&limit=10&isActive=true&isAvailableOnly=true
```

#### Response:

```json
{
    "code": 200,
    "status": "success",
    "metadata": {
        "userCoupons": [
            {
                "id": 1,
                "userId": 1,
                "couponId": 1,
                "personalCode": "BIRTHDAY_USER123",
                "giftMessage": "Chúc mừng sinh nhật!",
                "maxUsage": 1,
                "usedCount": 0,
                "validFrom": "2024-01-01T00:00:00Z",
                "validUntil": "2024-01-31T23:59:59Z",
                "source": "admin_gift",
                "isActive": true,
                "canUse": true,
                "coupon": {
                    "id": 1,
                    "code": "WELCOME50",
                    "name": "Chào mừng khách hàng mới",
                    "type": "percent",
                    "value": 50,
                    "minOrderAmount": 100000,
                    "maxDiscountAmount": 500000,
                    "description": "Giảm giá 50% cho khách hàng mới"
                }
            }
        ],
        "pagination": {
            "total": 5,
            "page": 1,
            "limit": 10,
            "totalPages": 1
        }
    }
}
```

### 3.4 Thu Hồi Coupon

**DELETE** `/api/v1/user-coupons/{id}`

#### Response:

```json
{
    "code": 200,
    "status": "success",
    "message": "User coupon revoked successfully"
}
```

## ✅ 4. Validation & Application APIs

### 4.1 Validate Coupon

**POST** `/api/v1/coupons/validate`

#### Request Body (camelCase):

```json
{
    "code": "WELCOME50",
    "userId": 1,
    "orderData": {
        "subtotal": 200000,
        "shippingFee": 30000,
        "items": [
            {
                "productId": 1,
                "quantity": 2,
                "price": 100000
            }
        ]
    }
}
```

#### Response:

```json
{
    "code": 200,
    "status": "success",
    "message": "Coupon is valid",
    "metadata": {
        "coupon": {
            "id": 1,
            "code": "WELCOME50",
            "name": "Chào mừng khách hàng mới",
            "type": "percent",
            "value": 50,
            "minOrderAmount": 100000,
            "maxDiscountAmount": 500000
        },
        "discount": {
            "discountAmount": 100000,
            "shippingDiscount": 0,
            "finalAmount": 130000,
            "savingAmount": 100000
        },
        "isValid": true,
        "canApply": true
    }
}
```

### 4.2 Áp Dụng Coupon (Khi Tạo Order)

**POST** `/api/v1/orders/{orderId}/apply-coupon`

#### Request Body (camelCase):

```json
{
    "couponCode": "WELCOME50",
    "userCouponId": 1,
    "discountData": {
        "couponCode": "WELCOME50",
        "discountType": "percent",
        "discountValue": 50,
        "discountAmount": 100000,
        "orderSubtotal": 200000,
        "shippingFee": 30000,
        "shippingDiscount": 0,
        "appliedProducts": [1, 2],
        "conditionsMet": {
            "minOrderAmount": true,
            "userLimit": true,
            "timeValid": true,
            "productApplicable": true
        }
    }
}
```

#### Response:

```json
{
    "code": 200,
    "status": "success",
    "message": "Coupon applied successfully",
    "metadata": {
        "orderCoupon": {
            "id": 1,
            "orderId": 1,
            "couponId": 1,
            "userCouponId": 1,
            "couponCode": "WELCOME50",
            "discountAmount": 100000,
            "finalAmount": 130000,
            "appliedAt": "2024-01-01T00:00:00Z"
        }
    }
}
```

### 4.3 Tính Toán Discount

**POST** `/api/v1/coupons/calculate-discount`

#### Request Body (camelCase):

```json
{
    "couponCode": "WELCOME50",
    "orderData": {
        "subtotal": 200000,
        "shippingFee": 30000,
        "items": [
            {
                "productId": 1,
                "quantity": 2,
                "price": 100000
            }
        ]
    }
}
```

#### Response:

```json
{
    "code": 200,
    "status": "success",
    "metadata": {
        "originalAmount": 230000,
        "discountAmount": 100000,
        "shippingDiscount": 0,
        "finalAmount": 130000,
        "savingAmount": 100000,
        "discountBreakdown": {
            "couponDiscount": 100000,
            "productSaleDiscount": 0,
            "shippingDiscount": 0
        }
    }
}
```

## 📈 5. Analytics & Statistics APIs

### 5.1 Coupon Statistics

**GET** `/api/v1/coupons/stats`

#### Response:

```json
{
    "code": 200,
    "status": "success",
    "metadata": {
        "totalCoupons": 50,
        "activeCoupons": 30,
        "expiredCoupons": 15,
        "usedCoupons": 120,
        "totalDiscount": 50000000,
        "averageDiscount": 100000,
        "topCoupons": [
            {
                "code": "WELCOME50",
                "name": "Chào mừng khách hàng mới",
                "usedCount": 25,
                "totalDiscount": 2500000
            }
        ]
    }
}
```

### 5.2 Product Sale Statistics

**GET** `/api/v1/product-sales/stats`

#### Response:

```json
{
    "code": 200,
    "status": "success",
    "metadata": {
        "totalSales": 20,
        "activeSales": 10,
        "expiredSales": 8,
        "totalRevenue": 100000000,
        "totalDiscount": 20000000,
        "topSaleProducts": [
            {
                "productId": 1,
                "productName": "Sản phẩm ABC",
                "soldQuantity": 50,
                "revenue": 4000000
            }
        ]
    }
}
```

## 🔍 6. Search & Filter APIs

### 6.1 Tìm Kiếm Coupon

**GET** `/api/v1/coupons/search`

#### Query Parameters:

```
q=welcome&type=percent&minValue=10&maxValue=100&status=active
```

### 6.2 Lọc Sản Phẩm Đang Sale

**GET** `/api/v1/product-sales/filter`

#### Query Parameters:

```
categoryId=1&minDiscount=10&maxDiscount=50&priceRange=100000-500000
```

## 🚫 7. Error Responses

### 7.1 Validation Errors (400)

```json
{
    "code": 400,
    "status": "error",
    "message": "Validation failed",
    "errors": {
        "code": ["Coupon code is required"],
        "value": ["Value must be greater than 0"],
        "endDate": ["End date must be after start date"]
    }
}
```

### 7.2 Not Found (404)

```json
{
    "code": 404,
    "status": "error",
    "message": "Coupon not found"
}
```

### 7.3 Conflict (409)

```json
{
    "code": 409,
    "status": "error",
    "message": "Coupon code already exists"
}
```

### 7.4 Business Logic Errors (400)

```json
{
    "code": 400,
    "status": "error",
    "message": "Coupon usage limit exceeded"
}
```

## 📝 8. Data Types & Enums

### 8.1 Coupon Type

```typescript
type CouponType = 'percent' | 'fixed' | 'free_shipping';
```

### 8.2 User Coupon Source

```typescript
type UserCouponSource =
    | 'system_reward'
    | 'admin_gift'
    | 'event_reward'
    | 'referral_bonus'
    | 'loyalty_point'
    | 'birthday_gift'
    | 'first_purchase';
```

### 8.3 Order Item

```typescript
interface OrderItem {
    productId: number;
    quantity: number;
    price: number;
    discountAmount?: number;
}
```

### 8.4 Discount Calculation

```typescript
interface DiscountCalculation {
    discountAmount: number;
    shippingDiscount: number;
    finalAmount: number;
    savingAmount: number;
}
```

## 💡 9. Best Practices

### 9.1 API Usage Tips

1. **Always validate coupon before applying** - Sử dụng `/validate` endpoint trước khi áp dụng
2. **Handle concurrent usage** - Kiểm tra usage limit khi apply coupon
3. **Cache coupon data** - Cache thông tin coupon để tăng performance
4. **Use pagination** - Luôn sử dụng pagination cho danh sách
5. **Error handling** - Xử lý đầy đủ các loại error response

### 9.2 Frontend Integration

```javascript
// Example: Validate coupon
const validateCoupon = async (couponCode, orderData) => {
    try {
        const response = await fetch('/api/v1/coupons/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                code: couponCode,
                userId: currentUser.id,
                orderData: {
                    subtotal: orderData.subtotal,
                    shippingFee: orderData.shippingFee,
                    items: orderData.items,
                },
            }),
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Coupon validation failed:', error);
        throw error;
    }
};
```

### 9.3 Security Considerations

1. **Rate limiting** - Giới hạn số lần validate coupon
2. **Input validation** - Validate tất cả input từ client
3. **Permission check** - Kiểm tra quyền truy cập admin APIs
4. **Audit logging** - Log tất cả thao tác admin

## 🎯 10. Testing

### 10.1 Test Cases

```javascript
describe('Coupon API', () => {
    test('Should create coupon with valid data', async () => {
        const couponData = {
            code: 'TEST50',
            name: 'Test Coupon',
            type: 'percent',
            value: 50,
            minOrderAmount: 100000,
        };

        const response = await request(app)
            .post('/api/v1/coupons')
            .send(couponData)
            .expect(200);

        expect(response.body.metadata.code).toBe('TEST50');
    });

    test('Should validate coupon correctly', async () => {
        const validationData = {
            code: 'TEST50',
            userId: 1,
            orderData: {
                subtotal: 200000,
                items: [{ productId: 1, quantity: 2, price: 100000 }],
            },
        };

        const response = await request(app)
            .post('/api/v1/coupons/validate')
            .send(validationData)
            .expect(200);

        expect(response.body.metadata.isValid).toBe(true);
    });
});
```

---

**Tài liệu này cung cấp đầy đủ thông tin để Frontend team tích hợp với Discount Management API. Tất cả dữ liệu đều sử dụng camelCase format và được convert tự động sang snake_case ở backend.**
