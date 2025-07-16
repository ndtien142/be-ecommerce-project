# Hướng dẫn Frontend - Hệ thống Coupon/Discount

## Tổng quan

Hệ thống coupon/discount bao gồm:

- **Coupon Management**: Quản lý mã giảm giá
- **User Coupons**: Coupon của người dùng
- **Product Sales**: Giảm giá sản phẩm
- **Order Integration**: Áp dụng giảm giá vào đơn hàng

## API Endpoints

### Base URL: `/api/v1/coupons`

### 1. Public Routes (Không cần authentication)

#### 1.1 Lấy danh sách coupon có sẵn

```http
GET /api/v1/coupons/available
```

**Query Parameters:**

- `page` (integer): Số trang (default: 1)
- `limit` (integer): Số lượng/trang (default: 10)
- `type` (string): Loại coupon (`percent`, `fixed`, `free_shipping`)

**Response:**

```json
{
    "message": "Lấy danh sách coupon thành công",
    "metadata": {
        "coupons": [
            {
                "id": 1,
                "code": "WELCOME50",
                "name": "Mã giảm giá chào mừng",
                "description": "Giảm 50% cho đơn hàng đầu tiên",
                "type": "percent",
                "value": 50,
                "min_order_amount": 200000,
                "max_discount_amount": 100000,
                "usage_limit": 1000,
                "usage_limit_per_user": 1,
                "start_date": "2024-01-01T00:00:00.000Z",
                "end_date": "2024-12-31T23:59:59.000Z",
                "is_active": true,
                "first_order_only": true
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 10,
            "total": 50,
            "totalPages": 5
        }
    }
}
```

### 2. Authenticated Routes (Cần Bearer Token)

#### 2.1 Validate mã coupon

```http
POST /api/v1/coupons/validate
```

**Headers:**

- `Authorization: Bearer <token>`
- `x-user-id: <user_id>`

**Request Body:**

```json
{
    "code": "WELCOME50",
    "subtotal": 500000,
    "shipping_fee": 30000,
    "items": [
        {
            "product_id": 1,
            "quantity": 2,
            "price": 250000
        }
    ]
}
```

**Response Success:**

```json
{
    "message": "Coupon hợp lệ",
    "metadata": {
        "coupon": {
            "id": 1,
            "code": "WELCOME50",
            "name": "Mã giảm giá chào mừng",
            "type": "percent",
            "value": 50
        },
        "discount": {
            "discount_amount": 100000,
            "shipping_discount": 0
        }
    }
}
```

**Response Error:**

```json
{
    "message": "Coupon không hợp lệ",
    "errors": ["Mã coupon đã hết hạn", "Đơn hàng chưa đủ điều kiện tối thiểu"]
}
```

#### 2.2 Lấy coupon của tôi

```http
GET /api/v1/coupons/my-available
```

**Headers:**

- `Authorization: Bearer <token>`
- `x-user-id: <user_id>`

**Query Parameters:**

- `page`, `limit`

**Response:**

```json
{
    "message": "Lấy danh sách coupon thành công",
    "metadata": {
        "user_coupons": [
            {
                "id": 1,
                "user_id": 123,
                "coupon_id": 1,
                "personal_code": "WELCOME_USER123",
                "gift_message": "Chào mừng bạn đến với cửa hàng",
                "used_count": 0,
                "max_usage": 1,
                "valid_from": "2024-01-01T00:00:00.000Z",
                "valid_until": "2024-12-31T23:59:59.000Z",
                "is_active": true,
                "source": "system_reward",
                "coupon": {
                    "code": "WELCOME50",
                    "name": "Mã giảm giá chào mừng",
                    "type": "percent",
                    "value": 50
                }
            }
        ],
        "pagination": {}
    }
}
```

### 3. Admin Routes (Cần admin role)

#### 3.1 Tạo coupon mới

```http
POST /api/v1/coupons
```

#### 3.2 Lấy danh sách coupon (Admin)

```http
GET /api/v1/coupons
```

#### 3.3 Tặng coupon cho user

```http
POST /api/v1/coupons/grant-user
```

**Request Body:**

```json
{
    "user_id": 123,
    "coupon_id": 1,
    "personal_code": "SPECIAL_USER123",
    "gift_message": "Chúc mừng sinh nhật!",
    "max_usage": 1,
    "valid_from": "2024-01-01T00:00:00.000Z",
    "valid_until": "2024-12-31T23:59:59.000Z",
    "source": "admin_gift"
}
```

## Frontend Components Architecture

### 1. Components Structure

```
src/
├── components/
│   ├── coupon/
│   │   ├── CouponCard.jsx
│   │   ├── CouponList.jsx
│   │   ├── CouponSelector.jsx
│   │   ├── CouponValidation.jsx
│   │   └── admin/
│   │       ├── CouponForm.jsx
│   │       ├── CouponManagement.jsx
│   │       └── UserCouponGrant.jsx
│   ├── cart/
│   │   ├── CartCouponApply.jsx
│   │   └── CartSummary.jsx
│   └── checkout/
│       ├── CheckoutCoupon.jsx
│       └── OrderSummary.jsx
├── hooks/
│   ├── useCoupon.js
│   ├── useUserCoupons.js
│   └── useCouponValidation.js
├── services/
│   └── couponService.js
└── store/
    ├── couponSlice.js
    └── cartSlice.js
```

### 2. Service Layer

#### `services/couponService.js`

```javascript
import axiosInstance from './axiosConfig';

export const couponService = {
    // Public APIs
    getAvailableCoupons: async (params = {}) => {
        const { data } = await axiosInstance.get('/coupons/available', {
            params,
        });
        return data;
    },

    // Authenticated APIs
    validateCoupon: async (validationData) => {
        const { data } = await axiosInstance.post(
            '/coupons/validate',
            validationData,
        );
        return data;
    },

    getMyAvailableCoupons: async (params = {}) => {
        const { data } = await axiosInstance.get('/coupons/my-available', {
            params,
        });
        return data;
    },

    // Admin APIs
    createCoupon: async (couponData) => {
        const { data } = await axiosInstance.post('/coupons', couponData);
        return data;
    },

    getCoupons: async (params = {}) => {
        const { data } = await axiosInstance.get('/coupons', { params });
        return data;
    },

    updateCoupon: async (id, couponData) => {
        const { data } = await axiosInstance.put(`/coupons/${id}`, couponData);
        return data;
    },

    deleteCoupon: async (id) => {
        const { data } = await axiosInstance.delete(`/coupons/${id}`);
        return data;
    },

    grantCouponToUser: async (grantData) => {
        const { data } = await axiosInstance.post(
            '/coupons/grant-user',
            grantData,
        );
        return data;
    },

    getUserCoupons: async (userId, params = {}) => {
        const { data } = await axiosInstance.get(`/coupons/user/${userId}`, {
            params,
        });
        return data;
    },
};
```

### 3. Custom Hooks

#### `hooks/useCoupon.js`

```javascript
import { useState, useEffect } from 'react';
import { couponService } from '../services/couponService';

export const useCoupon = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchAvailableCoupons = async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const response = await couponService.getAvailableCoupons(params);
            setCoupons(response.metadata.coupons);
            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        coupons,
        loading,
        error,
        fetchAvailableCoupons,
    };
};
```

#### `hooks/useCouponValidation.js`

```javascript
import { useState } from 'react';
import { couponService } from '../services/couponService';

export const useCouponValidation = () => {
    const [validationResult, setValidationResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const validateCoupon = async (validationData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await couponService.validateCoupon(validationData);
            setValidationResult(response.metadata);
            return response;
        } catch (err) {
            setError(err.message);
            setValidationResult(null);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const clearValidation = () => {
        setValidationResult(null);
        setError(null);
    };

    return {
        validationResult,
        loading,
        error,
        validateCoupon,
        clearValidation,
    };
};
```

### 4. React Components

#### `components/coupon/CouponCard.jsx`

```javascript
import React from 'react';

const CouponCard = ({ coupon, onSelect, isSelected, canUse = true }) => {
    const formatDiscount = (type, value) => {
        switch (type) {
            case 'percent':
                return `${value}%`;
            case 'fixed':
                return `${value.toLocaleString()}đ`;
            case 'free_shipping':
                return 'Miễn phí ship';
            default:
                return value;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    return (
        <div
            className={`coupon-card ${isSelected ? 'selected' : ''} ${!canUse ? 'disabled' : ''}`}
        >
            <div className="coupon-header">
                <div className="coupon-code">{coupon.code}</div>
                <div className="coupon-discount">
                    {formatDiscount(coupon.type, coupon.value)}
                </div>
            </div>

            <div className="coupon-body">
                <h3 className="coupon-name">{coupon.name}</h3>
                <p className="coupon-description">{coupon.description}</p>

                <div className="coupon-conditions">
                    {coupon.min_order_amount && (
                        <p>
                            Đơn tối thiểu:{' '}
                            {coupon.min_order_amount.toLocaleString()}đ
                        </p>
                    )}
                    {coupon.max_discount_amount &&
                        coupon.type === 'percent' && (
                            <p>
                                Giảm tối đa:{' '}
                                {coupon.max_discount_amount.toLocaleString()}đ
                            </p>
                        )}
                    {coupon.usage_limit_per_user && (
                        <p>Số lần sử dụng: {coupon.usage_limit_per_user}</p>
                    )}
                    {coupon.first_order_only && (
                        <p>Chỉ áp dụng đơn hàng đầu tiên</p>
                    )}
                </div>

                <div className="coupon-validity">
                    <p>HSD: {formatDate(coupon.end_date)}</p>
                </div>
            </div>

            {canUse && (
                <div className="coupon-actions">
                    <button
                        className="btn-select-coupon"
                        onClick={() => onSelect(coupon)}
                    >
                        {isSelected ? 'Đã chọn' : 'Chọn'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default CouponCard;
```

#### `components/cart/CartCouponApply.jsx`

```javascript
import React, { useState } from 'react';
import { useCouponValidation } from '../../hooks/useCouponValidation';
import { useCart } from '../../hooks/useCart';

const CartCouponApply = ({ onCouponApplied }) => {
    const [couponCode, setCouponCode] = useState('');
    const { validateCoupon, loading, error, validationResult } =
        useCouponValidation();
    const { cart } = useCart();

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;

        try {
            const validationData = {
                code: couponCode,
                subtotal: cart.subtotal,
                shipping_fee: cart.shipping_fee,
                items: cart.items.map((item) => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price,
                })),
            };

            const result = await validateCoupon(validationData);
            onCouponApplied(result.metadata);
        } catch (err) {
            console.error('Lỗi validate coupon:', err);
        }
    };

    return (
        <div className="cart-coupon-apply">
            <div className="coupon-input-group">
                <input
                    type="text"
                    placeholder="Nhập mã giảm giá"
                    value={couponCode}
                    onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                    }
                    className="coupon-input"
                />
                <button
                    onClick={handleApplyCoupon}
                    disabled={loading || !couponCode.trim()}
                    className="btn-apply-coupon"
                >
                    {loading ? 'Đang kiểm tra...' : 'Áp dụng'}
                </button>
            </div>

            {error && <div className="coupon-error">{error}</div>}

            {validationResult && (
                <div className="coupon-success">
                    <p>
                        ✓ Áp dụng mã "{validationResult.coupon.code}" thành
                        công!
                    </p>
                    <p>
                        Giảm:{' '}
                        {validationResult.discount.discount_amount.toLocaleString()}
                        đ
                    </p>
                    {validationResult.discount.shipping_discount > 0 && (
                        <p>
                            Giảm phí ship:{' '}
                            {validationResult.discount.shipping_discount.toLocaleString()}
                            đ
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default CartCouponApply;
```

#### `components/coupon/CouponSelector.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { useUserCoupons } from '../../hooks/useUserCoupons';
import CouponCard from './CouponCard';

const CouponSelector = ({ onCouponSelect, selectedCoupon, cartData }) => {
    const { userCoupons, loading, fetchUserCoupons } = useUserCoupons();
    const [availableCoupons, setAvailableCoupons] = useState([]);

    useEffect(() => {
        fetchUserCoupons();
    }, []);

    useEffect(() => {
        // Filter coupons that can be used with current cart
        const filtered = userCoupons.filter((userCoupon) => {
            const coupon = userCoupon.coupon;

            // Check if coupon is active and not expired
            if (
                !userCoupon.is_active ||
                userCoupon.used_count >= userCoupon.max_usage
            ) {
                return false;
            }

            // Check validity period
            const now = new Date();
            const validFrom = new Date(
                userCoupon.valid_from || coupon.start_date,
            );
            const validUntil = new Date(
                userCoupon.valid_until || coupon.end_date,
            );

            if (now < validFrom || now > validUntil) {
                return false;
            }

            // Check minimum order amount
            if (
                coupon.min_order_amount &&
                cartData.subtotal < coupon.min_order_amount
            ) {
                return false;
            }

            return true;
        });

        setAvailableCoupons(filtered);
    }, [userCoupons, cartData]);

    if (loading) {
        return <div>Đang tải coupon...</div>;
    }

    return (
        <div className="coupon-selector">
            <h3>Chọn mã giảm giá</h3>

            {availableCoupons.length === 0 ? (
                <div className="no-coupons">
                    <p>Không có mã giảm giá khả dụng</p>
                </div>
            ) : (
                <div className="coupon-list">
                    {availableCoupons.map((userCoupon) => (
                        <CouponCard
                            key={userCoupon.id}
                            coupon={userCoupon.coupon}
                            onSelect={(coupon) => onCouponSelect(userCoupon)}
                            isSelected={selectedCoupon?.id === userCoupon.id}
                            canUse={true}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CouponSelector;
```

### 5. Redux Store Integration

#### `store/couponSlice.js`

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { couponService } from '../services/couponService';

// Async thunks
export const fetchAvailableCoupons = createAsyncThunk(
    'coupon/fetchAvailable',
    async (params) => {
        const response = await couponService.getAvailableCoupons(params);
        return response.metadata;
    },
);

export const fetchUserCoupons = createAsyncThunk(
    'coupon/fetchUserCoupons',
    async (params) => {
        const response = await couponService.getMyAvailableCoupons(params);
        return response.metadata;
    },
);

export const validateCoupon = createAsyncThunk(
    'coupon/validate',
    async (validationData) => {
        const response = await couponService.validateCoupon(validationData);
        return response.metadata;
    },
);

const couponSlice = createSlice({
    name: 'coupon',
    initialState: {
        availableCoupons: [],
        userCoupons: [],
        selectedCoupon: null,
        validationResult: null,
        loading: false,
        error: null,
    },
    reducers: {
        selectCoupon: (state, action) => {
            state.selectedCoupon = action.payload;
        },
        clearSelectedCoupon: (state) => {
            state.selectedCoupon = null;
            state.validationResult = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAvailableCoupons.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAvailableCoupons.fulfilled, (state, action) => {
                state.loading = false;
                state.availableCoupons = action.payload.coupons;
            })
            .addCase(fetchAvailableCoupons.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(fetchUserCoupons.fulfilled, (state, action) => {
                state.userCoupons = action.payload.user_coupons;
            })
            .addCase(validateCoupon.fulfilled, (state, action) => {
                state.validationResult = action.payload;
            });
    },
});

export const { selectCoupon, clearSelectedCoupon, clearError } =
    couponSlice.actions;
export default couponSlice.reducer;
```

### 6. CSS Styles

#### `styles/coupon.css`

```css
.coupon-card {
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 16px;
    margin: 8px 0;
    cursor: pointer;
    transition: all 0.3s ease;
}

.coupon-card:hover {
    border-color: #007bff;
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
}

.coupon-card.selected {
    border-color: #007bff;
    background-color: #f8f9ff;
}

.coupon-card.disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.coupon-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.coupon-code {
    font-family: monospace;
    font-size: 16px;
    font-weight: bold;
    color: #007bff;
    background-color: #f0f8ff;
    padding: 4px 8px;
    border-radius: 4px;
}

.coupon-discount {
    font-size: 18px;
    font-weight: bold;
    color: #e74c3c;
}

.coupon-name {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #333;
}

.coupon-description {
    font-size: 14px;
    color: #666;
    margin-bottom: 12px;
}

.coupon-conditions {
    font-size: 12px;
    color: #888;
    margin-bottom: 12px;
}

.coupon-conditions p {
    margin: 4px 0;
}

.coupon-validity {
    font-size: 12px;
    color: #999;
    margin-bottom: 12px;
}

.btn-select-coupon {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.btn-select-coupon:hover {
    background-color: #0056b3;
}

.cart-coupon-apply {
    margin: 16px 0;
}

.coupon-input-group {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
}

.coupon-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.btn-apply-coupon {
    background-color: #28a745;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    white-space: nowrap;
}

.btn-apply-coupon:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.coupon-error {
    color: #e74c3c;
    font-size: 14px;
    margin-top: 8px;
}

.coupon-success {
    color: #28a745;
    font-size: 14px;
    margin-top: 8px;
}

.coupon-selector {
    max-height: 400px;
    overflow-y: auto;
}

.no-coupons {
    text-align: center;
    padding: 20px;
    color: #666;
}
```

## Integration Flow

### 1. Shopping Cart Integration

```javascript
// In Cart component
const CartPage = () => {
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [cartTotal, setCartTotal] = useState(0);
    const [discount, setDiscount] = useState(0);

    const handleCouponApplied = (couponData) => {
        setAppliedCoupon(couponData.coupon);
        setDiscount(couponData.discount.discount_amount);
    };

    const finalTotal = cartTotal - discount;

    return (
        <div className="cart-page">
            <CartItems />
            <CartCouponApply onCouponApplied={handleCouponApplied} />
            <CartSummary
                subtotal={cartTotal}
                discount={discount}
                total={finalTotal}
                appliedCoupon={appliedCoupon}
            />
        </div>
    );
};
```

### 2. Checkout Integration

```javascript
// In Checkout component
const CheckoutPage = () => {
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const { cart } = useCart();

    const handleCouponSelect = (userCoupon) => {
        setSelectedCoupon(userCoupon);
    };

    const submitOrder = async () => {
        const orderData = {
            items: cart.items,
            coupon_code: selectedCoupon?.coupon.code,
            // ... other order data
        };

        await orderService.createOrder(orderData);
    };

    return (
        <div className="checkout-page">
            <CheckoutItems />
            <CouponSelector
                onCouponSelect={handleCouponSelect}
                selectedCoupon={selectedCoupon}
                cartData={cart}
            />
            <OrderSummary items={cart.items} selectedCoupon={selectedCoupon} />
            <button onClick={submitOrder}>Đặt hàng</button>
        </div>
    );
};
```

## Best Practices

### 1. Error Handling

```javascript
// Centralized error handling
const handleCouponError = (error) => {
    if (error.response?.status === 400) {
        // Coupon validation error
        showToast('error', error.response.data.message);
    } else if (error.response?.status === 401) {
        // Authentication error
        redirectToLogin();
    } else {
        // Generic error
        showToast('error', 'Có lỗi xảy ra, vui lòng thử lại');
    }
};
```

### 2. Loading States

```javascript
// Loading states for better UX
const CouponComponent = () => {
    const [loading, setLoading] = useState(true);

    if (loading) {
        return (
            <div className="coupon-loading">
                <div className="skeleton-coupon-card"></div>
                <div className="skeleton-coupon-card"></div>
            </div>
        );
    }

    return <CouponList />;
};
```

### 3. Caching Strategy

```javascript
// Cache coupon data
const useCouponCache = () => {
    const [cache, setCache] = useState(new Map());

    const getCachedCoupons = (key) => {
        const cached = cache.get(key);
        if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
            return cached.data;
        }
        return null;
    };

    const setCachedCoupons = (key, data) => {
        setCache((prev) =>
            new Map(prev).set(key, {
                data,
                timestamp: Date.now(),
            }),
        );
    };

    return { getCachedCoupons, setCachedCoupons };
};
```

## Testing Strategy

### 1. Unit Tests

```javascript
// Test coupon validation
describe('useCouponValidation', () => {
    it('should validate coupon successfully', async () => {
        const { result } = renderHook(() => useCouponValidation());

        await act(async () => {
            await result.current.validateCoupon({
                code: 'WELCOME50',
                subtotal: 500000,
            });
        });

        expect(result.current.validationResult).toBeTruthy();
        expect(result.current.error).toBeNull();
    });
});
```

### 2. Integration Tests

```javascript
// Test complete coupon flow
describe('Coupon Integration', () => {
    it('should apply coupon to cart', async () => {
        render(<CartPage />);

        const couponInput = screen.getByPlaceholderText('Nhập mã giảm giá');
        fireEvent.change(couponInput, { target: { value: 'WELCOME50' } });

        const applyButton = screen.getByText('Áp dụng');
        fireEvent.click(applyButton);

        await waitFor(() => {
            expect(
                screen.getByText('Áp dụng mã "WELCOME50" thành công!'),
            ).toBeInTheDocument();
        });
    });
});
```

## Deployment Considerations

### 1. Environment Variables

```javascript
// .env
REACT_APP_API_URL=https://api.example.com
REACT_APP_COUPON_CACHE_TTL=300000
```

### 2. Performance Optimization

```javascript
// Lazy loading for coupon components
const CouponManagement = lazy(
    () => import('./components/coupon/admin/CouponManagement'),
);
const CouponSelector = lazy(() => import('./components/coupon/CouponSelector'));
```

### 3. SEO Considerations

```javascript
// Meta tags for coupon pages
const CouponPage = () => {
    return (
        <Helmet>
            <title>Mã giảm giá - Cửa hàng ABC</title>
            <meta
                name="description"
                content="Tìm kiếm và sử dụng mã giảm giá tại cửa hàng ABC"
            />
        </Helmet>
    );
};
```

Tài liệu này cung cấp đầy đủ hướng dẫn để Frontend team có thể xây dựng hệ thống coupon/discount hoàn chỉnh và tích hợp với backend APIs.
