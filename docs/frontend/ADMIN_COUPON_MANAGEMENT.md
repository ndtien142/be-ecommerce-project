# Admin Dashboard - Coupon Management

## Admin Components Architecture

### 1. Admin Routes Structure

```
src/
├── pages/
│   └── admin/
│       ├── CouponManagement.jsx
│       ├── CouponCreate.jsx
│       ├── CouponEdit.jsx
│       └── UserCouponManagement.jsx
├── components/
│   └── admin/
│       ├── coupon/
│       │   ├── CouponTable.jsx
│       │   ├── CouponForm.jsx
│       │   ├── CouponFilter.jsx
│       │   ├── CouponStats.jsx
│       │   └── UserCouponGrant.jsx
│       └── common/
│           ├── AdminLayout.jsx
│           ├── DataTable.jsx
│           └── FormComponents.jsx
```

### 2. Main Admin Components

#### `pages/admin/CouponManagement.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CouponTable from '../../components/admin/coupon/CouponTable';
import CouponFilter from '../../components/admin/coupon/CouponFilter';
import CouponStats from '../../components/admin/coupon/CouponStats';
import { useAdminCoupons } from '../../hooks/useAdminCoupons';

const CouponManagement = () => {
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        is_active: null,
        type: null,
        code: '',
    });

    const {
        coupons,
        loading,
        error,
        pagination,
        fetchCoupons,
        deleteCoupon,
        updateCouponStatus,
    } = useAdminCoupons();

    useEffect(() => {
        fetchCoupons(filters);
    }, [filters]);

    const handleFilterChange = (newFilters) => {
        setFilters((prev) => ({
            ...prev,
            ...newFilters,
            page: 1, // Reset page when filter changes
        }));
    };

    const handlePageChange = (page) => {
        setFilters((prev) => ({ ...prev, page }));
    };

    const handleDelete = async (couponId) => {
        if (window.confirm('Bạn có chắc muốn xóa coupon này?')) {
            try {
                await deleteCoupon(couponId);
                fetchCoupons(filters); // Refresh list
            } catch (error) {
                console.error('Error deleting coupon:', error);
            }
        }
    };

    const handleStatusToggle = async (couponId, currentStatus) => {
        try {
            await updateCouponStatus(couponId, !currentStatus);
            fetchCoupons(filters); // Refresh list
        } catch (error) {
            console.error('Error updating coupon status:', error);
        }
    };

    return (
        <div className="admin-coupon-management">
            <div className="page-header">
                <h1>Quản lý Coupon</h1>
                <Link to="/admin/coupons/create" className="btn btn-primary">
                    Tạo Coupon Mới
                </Link>
            </div>

            <CouponStats />

            <div className="management-content">
                <CouponFilter
                    filters={filters}
                    onFilterChange={handleFilterChange}
                />

                <CouponTable
                    coupons={coupons}
                    loading={loading}
                    error={error}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onDelete={handleDelete}
                    onStatusToggle={handleStatusToggle}
                />
            </div>
        </div>
    );
};

export default CouponManagement;
```

#### `components/admin/coupon/CouponForm.jsx`

```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminCoupons } from '../../../hooks/useAdminCoupons';

const CouponForm = ({ initialData = null, mode = 'create' }) => {
    const navigate = useNavigate();
    const { createCoupon, updateCoupon, loading } = useAdminCoupons();

    const [formData, setFormData] = useState({
        code: initialData?.code || '',
        name: initialData?.name || '',
        description: initialData?.description || '',
        type: initialData?.type || 'percent',
        value: initialData?.value || '',
        min_order_amount: initialData?.min_order_amount || '',
        max_discount_amount: initialData?.max_discount_amount || '',
        usage_limit: initialData?.usage_limit || '',
        usage_limit_per_user: initialData?.usage_limit_per_user || 1,
        start_date: initialData?.start_date
            ? new Date(initialData.start_date).toISOString().slice(0, 16)
            : '',
        end_date: initialData?.end_date
            ? new Date(initialData.end_date).toISOString().slice(0, 16)
            : '',
        is_active: initialData?.is_active ?? true,
        first_order_only: initialData?.first_order_only || false,
        applicable_products: initialData?.applicable_products || [],
        applicable_categories: initialData?.applicable_categories || [],
        excluded_products: initialData?.excluded_products || [],
        excluded_categories: initialData?.excluded_categories || [],
    });

    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!formData.code.trim()) {
            newErrors.code = 'Mã coupon là bắt buộc';
        } else if (!/^[A-Z0-9_]+$/.test(formData.code)) {
            newErrors.code = 'Mã coupon chỉ chứa chữ hoa, số và dấu gạch dưới';
        }

        if (!formData.name.trim()) {
            newErrors.name = 'Tên coupon là bắt buộc';
        }

        if (!formData.value || formData.value <= 0) {
            newErrors.value = 'Giá trị giảm phải lớn hơn 0';
        }

        if (formData.type === 'percent' && formData.value > 100) {
            newErrors.value = 'Giá trị phần trăm không được vượt quá 100%';
        }

        if (formData.start_date && formData.end_date) {
            if (new Date(formData.start_date) >= new Date(formData.end_date)) {
                newErrors.end_date = 'Ngày kết thúc phải sau ngày bắt đầu';
            }
        }

        if (formData.min_order_amount && formData.min_order_amount < 0) {
            newErrors.min_order_amount = 'Giá trị đơn hàng tối thiểu phải >= 0';
        }

        if (formData.usage_limit && formData.usage_limit <= 0) {
            newErrors.usage_limit = 'Số lần sử dụng phải lớn hơn 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            const submitData = {
                ...formData,
                value: Number(formData.value),
                min_order_amount: formData.min_order_amount
                    ? Number(formData.min_order_amount)
                    : null,
                max_discount_amount: formData.max_discount_amount
                    ? Number(formData.max_discount_amount)
                    : null,
                usage_limit: formData.usage_limit
                    ? Number(formData.usage_limit)
                    : null,
                usage_limit_per_user: Number(formData.usage_limit_per_user),
                start_date: formData.start_date
                    ? new Date(formData.start_date).toISOString()
                    : null,
                end_date: formData.end_date
                    ? new Date(formData.end_date).toISOString()
                    : null,
            };

            if (mode === 'create') {
                await createCoupon(submitData);
            } else {
                await updateCoupon(initialData.id, submitData);
            }

            navigate('/admin/coupons');
        } catch (error) {
            console.error('Error saving coupon:', error);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: null,
            }));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="coupon-form">
            <div className="form-section">
                <h3>Thông tin cơ bản</h3>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="code">Mã Coupon *</label>
                        <input
                            type="text"
                            id="code"
                            value={formData.code}
                            onChange={(e) =>
                                handleInputChange(
                                    'code',
                                    e.target.value.toUpperCase(),
                                )
                            }
                            placeholder="VD: WELCOME50"
                            className={errors.code ? 'error' : ''}
                        />
                        {errors.code && (
                            <span className="error-message">{errors.code}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="name">Tên Coupon *</label>
                        <input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                                handleInputChange('name', e.target.value)
                            }
                            placeholder="Tên hiển thị của coupon"
                            className={errors.name ? 'error' : ''}
                        />
                        {errors.name && (
                            <span className="error-message">{errors.name}</span>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="description">Mô tả</label>
                    <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                            handleInputChange('description', e.target.value)
                        }
                        placeholder="Mô tả chi tiết về coupon"
                        rows="3"
                    />
                </div>
            </div>

            <div className="form-section">
                <h3>Cấu hình giảm giá</h3>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="type">Loại giảm giá *</label>
                        <select
                            id="type"
                            value={formData.type}
                            onChange={(e) =>
                                handleInputChange('type', e.target.value)
                            }
                        >
                            <option value="percent">Phần trăm (%)</option>
                            <option value="fixed">Số tiền cố định (VND)</option>
                            <option value="free_shipping">
                                Miễn phí vận chuyển
                            </option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="value">Giá trị giảm *</label>
                        <input
                            type="number"
                            id="value"
                            value={formData.value}
                            onChange={(e) =>
                                handleInputChange('value', e.target.value)
                            }
                            placeholder={
                                formData.type === 'percent'
                                    ? 'VD: 50'
                                    : 'VD: 100000'
                            }
                            min="0"
                            max={
                                formData.type === 'percent' ? '100' : undefined
                            }
                            className={errors.value ? 'error' : ''}
                        />
                        {errors.value && (
                            <span className="error-message">
                                {errors.value}
                            </span>
                        )}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="min_order_amount">
                            Giá trị đơn hàng tối thiểu (VND)
                        </label>
                        <input
                            type="number"
                            id="min_order_amount"
                            value={formData.min_order_amount}
                            onChange={(e) =>
                                handleInputChange(
                                    'min_order_amount',
                                    e.target.value,
                                )
                            }
                            placeholder="VD: 200000"
                            min="0"
                            className={errors.min_order_amount ? 'error' : ''}
                        />
                        {errors.min_order_amount && (
                            <span className="error-message">
                                {errors.min_order_amount}
                            </span>
                        )}
                    </div>

                    {formData.type === 'percent' && (
                        <div className="form-group">
                            <label htmlFor="max_discount_amount">
                                Số tiền giảm tối đa (VND)
                            </label>
                            <input
                                type="number"
                                id="max_discount_amount"
                                value={formData.max_discount_amount}
                                onChange={(e) =>
                                    handleInputChange(
                                        'max_discount_amount',
                                        e.target.value,
                                    )
                                }
                                placeholder="VD: 100000"
                                min="0"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="form-section">
                <h3>Điều kiện sử dụng</h3>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="usage_limit">
                            Số lần sử dụng tối đa
                        </label>
                        <input
                            type="number"
                            id="usage_limit"
                            value={formData.usage_limit}
                            onChange={(e) =>
                                handleInputChange('usage_limit', e.target.value)
                            }
                            placeholder="Để trống = không giới hạn"
                            min="1"
                            className={errors.usage_limit ? 'error' : ''}
                        />
                        {errors.usage_limit && (
                            <span className="error-message">
                                {errors.usage_limit}
                            </span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="usage_limit_per_user">
                            Số lần mỗi user có thể sử dụng
                        </label>
                        <input
                            type="number"
                            id="usage_limit_per_user"
                            value={formData.usage_limit_per_user}
                            onChange={(e) =>
                                handleInputChange(
                                    'usage_limit_per_user',
                                    e.target.value,
                                )
                            }
                            min="1"
                            required
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="start_date">Ngày bắt đầu</label>
                        <input
                            type="datetime-local"
                            id="start_date"
                            value={formData.start_date}
                            onChange={(e) =>
                                handleInputChange('start_date', e.target.value)
                            }
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="end_date">Ngày kết thúc</label>
                        <input
                            type="datetime-local"
                            id="end_date"
                            value={formData.end_date}
                            onChange={(e) =>
                                handleInputChange('end_date', e.target.value)
                            }
                            className={errors.end_date ? 'error' : ''}
                        />
                        {errors.end_date && (
                            <span className="error-message">
                                {errors.end_date}
                            </span>
                        )}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={formData.first_order_only}
                                onChange={(e) =>
                                    handleInputChange(
                                        'first_order_only',
                                        e.target.checked,
                                    )
                                }
                            />
                            Chỉ áp dụng cho đơn hàng đầu tiên
                        </label>
                    </div>

                    <div className="form-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) =>
                                    handleInputChange(
                                        'is_active',
                                        e.target.checked,
                                    )
                                }
                            />
                            Kích hoạt coupon
                        </label>
                    </div>
                </div>
            </div>

            <div className="form-actions">
                <button
                    type="button"
                    onClick={() => navigate('/admin/coupons')}
                    className="btn btn-secondary"
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                >
                    {loading
                        ? 'Đang lưu...'
                        : mode === 'create'
                          ? 'Tạo Coupon'
                          : 'Cập nhật'}
                </button>
            </div>
        </form>
    );
};

export default CouponForm;
```

#### `components/admin/coupon/CouponTable.jsx`

```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate, formatCurrency } from '../../../utils/formatters';

const CouponTable = ({
    coupons,
    loading,
    error,
    pagination,
    onPageChange,
    onDelete,
    onStatusToggle,
}) => {
    const formatDiscountValue = (type, value) => {
        switch (type) {
            case 'percent':
                return `${value}%`;
            case 'fixed':
                return formatCurrency(value);
            case 'free_shipping':
                return 'Miễn phí ship';
            default:
                return value;
        }
    };

    const getStatusBadge = (isActive) => {
        return (
            <span
                className={`status-badge ${isActive ? 'active' : 'inactive'}`}
            >
                {isActive ? 'Hoạt động' : 'Tạm dừng'}
            </span>
        );
    };

    const getUsageInfo = (coupon) => {
        if (!coupon.usage_limit) return 'Không giới hạn';
        return `${coupon.used_count}/${coupon.usage_limit}`;
    };

    if (loading) {
        return (
            <div className="table-loading">
                <div className="loading-spinner"></div>
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="table-error">
                <p>Có lỗi xảy ra: {error}</p>
            </div>
        );
    }

    return (
        <div className="coupon-table-container">
            <div className="table-wrapper">
                <table className="coupon-table">
                    <thead>
                        <tr>
                            <th>Mã Coupon</th>
                            <th>Tên</th>
                            <th>Loại</th>
                            <th>Giá trị</th>
                            <th>Đơn tối thiểu</th>
                            <th>Sử dụng</th>
                            <th>Hạn sử dụng</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coupons.map((coupon) => (
                            <tr key={coupon.id}>
                                <td>
                                    <code className="coupon-code">
                                        {coupon.code}
                                    </code>
                                </td>
                                <td>
                                    <div className="coupon-name">
                                        <strong>{coupon.name}</strong>
                                        {coupon.description && (
                                            <small className="coupon-description">
                                                {coupon.description}
                                            </small>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <span
                                        className={`type-badge type-${coupon.type}`}
                                    >
                                        {coupon.type === 'percent'
                                            ? 'Phần trăm'
                                            : coupon.type === 'fixed'
                                              ? 'Cố định'
                                              : 'Miễn phí ship'}
                                    </span>
                                </td>
                                <td>
                                    {formatDiscountValue(
                                        coupon.type,
                                        coupon.value,
                                    )}
                                </td>
                                <td>
                                    {coupon.min_order_amount
                                        ? formatCurrency(
                                              coupon.min_order_amount,
                                          )
                                        : 'Không có'}
                                </td>
                                <td>{getUsageInfo(coupon)}</td>
                                <td>
                                    {coupon.end_date ? (
                                        <span
                                            className={
                                                new Date(coupon.end_date) <
                                                new Date()
                                                    ? 'expired'
                                                    : ''
                                            }
                                        >
                                            {formatDate(coupon.end_date)}
                                        </span>
                                    ) : (
                                        'Không giới hạn'
                                    )}
                                </td>
                                <td>{getStatusBadge(coupon.is_active)}</td>
                                <td>
                                    <div className="action-buttons">
                                        <Link
                                            to={`/admin/coupons/${coupon.id}`}
                                            className="btn btn-sm btn-info"
                                            title="Xem chi tiết"
                                        >
                                            <i className="icon-eye"></i>
                                        </Link>
                                        <Link
                                            to={`/admin/coupons/${coupon.id}/edit`}
                                            className="btn btn-sm btn-warning"
                                            title="Chỉnh sửa"
                                        >
                                            <i className="icon-edit"></i>
                                        </Link>
                                        <button
                                            onClick={() =>
                                                onStatusToggle(
                                                    coupon.id,
                                                    coupon.is_active,
                                                )
                                            }
                                            className={`btn btn-sm ${coupon.is_active ? 'btn-secondary' : 'btn-success'}`}
                                            title={
                                                coupon.is_active
                                                    ? 'Tạm dừng'
                                                    : 'Kích hoạt'
                                            }
                                        >
                                            <i
                                                className={`icon-${coupon.is_active ? 'pause' : 'play'}`}
                                            ></i>
                                        </button>
                                        <button
                                            onClick={() => onDelete(coupon.id)}
                                            className="btn btn-sm btn-danger"
                                            title="Xóa"
                                        >
                                            <i className="icon-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {coupons.length === 0 && (
                <div className="empty-state">
                    <p>Không có coupon nào được tìm thấy</p>
                </div>
            )}

            {pagination && pagination.totalPages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => onPageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="btn btn-secondary"
                    >
                        Trước
                    </button>

                    <div className="page-info">
                        Trang {pagination.page} / {pagination.totalPages}
                    </div>

                    <button
                        onClick={() => onPageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="btn btn-secondary"
                    >
                        Sau
                    </button>
                </div>
            )}
        </div>
    );
};

export default CouponTable;
```

#### `components/admin/coupon/CouponStats.jsx`

```javascript
import React, { useEffect, useState } from 'react';
import { couponService } from '../../../services/couponService';

const CouponStats = () => {
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        expired: 0,
        used_this_month: 0,
        revenue_saved: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            // This would be a custom endpoint for stats
            const response = await couponService.getCouponStats();
            setStats(response.metadata);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="stats-loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="coupon-stats">
            <div className="stat-card">
                <div className="stat-icon">
                    <i className="icon-ticket"></i>
                </div>
                <div className="stat-content">
                    <h3>{stats.total}</h3>
                    <p>Tổng coupon</p>
                </div>
            </div>

            <div className="stat-card active">
                <div className="stat-icon">
                    <i className="icon-check-circle"></i>
                </div>
                <div className="stat-content">
                    <h3>{stats.active}</h3>
                    <p>Đang hoạt động</p>
                </div>
            </div>

            <div className="stat-card expired">
                <div className="stat-icon">
                    <i className="icon-clock"></i>
                </div>
                <div className="stat-content">
                    <h3>{stats.expired}</h3>
                    <p>Đã hết hạn</p>
                </div>
            </div>

            <div className="stat-card used">
                <div className="stat-icon">
                    <i className="icon-trending-up"></i>
                </div>
                <div className="stat-content">
                    <h3>{stats.used_this_month}</h3>
                    <p>Đã sử dụng tháng này</p>
                </div>
            </div>

            <div className="stat-card revenue">
                <div className="stat-icon">
                    <i className="icon-dollar-sign"></i>
                </div>
                <div className="stat-content">
                    <h3>{stats.revenue_saved.toLocaleString()}đ</h3>
                    <p>Tiền đã tiết kiệm</p>
                </div>
            </div>
        </div>
    );
};

export default CouponStats;
```

#### `components/admin/coupon/UserCouponGrant.jsx`

```javascript
import React, { useState } from 'react';
import { useAdminCoupons } from '../../../hooks/useAdminCoupons';
import { userService } from '../../../services/userService';

const UserCouponGrant = ({ onClose, onSuccess }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [users, setUsers] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    const { coupons, grantCouponToUser, loading } = useAdminCoupons();

    const [grantData, setGrantData] = useState({
        personal_code: '',
        gift_message: '',
        max_usage: 1,
        valid_from: '',
        valid_until: '',
        source: 'admin_gift',
    });

    const searchUsers = async (term) => {
        if (!term.trim()) {
            setUsers([]);
            return;
        }

        setSearchLoading(true);
        try {
            const response = await userService.searchUsers({ q: term });
            setUsers(response.metadata.users);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleUserSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        searchUsers(term);
    };

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setUsers([]);
        setSearchTerm(user.user_email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedUser || !selectedCoupon) {
            alert('Vui lòng chọn user và coupon');
            return;
        }

        try {
            const submitData = {
                user_id: selectedUser.id,
                coupon_id: selectedCoupon.id,
                ...grantData,
                valid_from: grantData.valid_from
                    ? new Date(grantData.valid_from).toISOString()
                    : null,
                valid_until: grantData.valid_until
                    ? new Date(grantData.valid_until).toISOString()
                    : null,
            };

            await grantCouponToUser(submitData);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error granting coupon:', error);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content user-coupon-grant">
                <div className="modal-header">
                    <h2>Tặng Coupon cho User</h2>
                    <button onClick={onClose} className="btn-close">
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <h3>Chọn User</h3>
                        <div className="user-search">
                            <input
                                type="text"
                                placeholder="Tìm user theo email hoặc tên..."
                                value={searchTerm}
                                onChange={handleUserSearch}
                                className="search-input"
                            />

                            {searchLoading && (
                                <div className="search-loading">
                                    Đang tìm...
                                </div>
                            )}

                            {users.length > 0 && (
                                <div className="search-results">
                                    {users.map((user) => (
                                        <div
                                            key={user.id}
                                            className="user-item"
                                            onClick={() =>
                                                handleUserSelect(user)
                                            }
                                        >
                                            <div className="user-info">
                                                <strong>
                                                    {user.user_email}
                                                </strong>
                                                <span>
                                                    {
                                                        user.user_profile
                                                            ?.full_name
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedUser && (
                                <div className="selected-user">
                                    <strong>Đã chọn:</strong>{' '}
                                    {selectedUser.user_email}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Chọn Coupon</h3>
                        <select
                            value={selectedCoupon?.id || ''}
                            onChange={(e) => {
                                const coupon = coupons.find(
                                    (c) => c.id === parseInt(e.target.value),
                                );
                                setSelectedCoupon(coupon);
                            }}
                            required
                        >
                            <option value="">Chọn coupon</option>
                            {coupons
                                .filter((c) => c.is_active)
                                .map((coupon) => (
                                    <option key={coupon.id} value={coupon.id}>
                                        {coupon.code} - {coupon.name}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div className="form-section">
                        <h3>Cấu hình tặng</h3>

                        <div className="form-group">
                            <label>Mã cá nhân hóa (tùy chọn)</label>
                            <input
                                type="text"
                                value={grantData.personal_code}
                                onChange={(e) =>
                                    setGrantData((prev) => ({
                                        ...prev,
                                        personal_code: e.target.value,
                                    }))
                                }
                                placeholder="VD: BIRTHDAY_USER123"
                            />
                        </div>

                        <div className="form-group">
                            <label>Lời nhắn tặng</label>
                            <textarea
                                value={grantData.gift_message}
                                onChange={(e) =>
                                    setGrantData((prev) => ({
                                        ...prev,
                                        gift_message: e.target.value,
                                    }))
                                }
                                placeholder="Lời nhắn khi tặng voucher..."
                                rows="3"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Số lần sử dụng</label>
                                <input
                                    type="number"
                                    value={grantData.max_usage}
                                    onChange={(e) =>
                                        setGrantData((prev) => ({
                                            ...prev,
                                            max_usage: parseInt(e.target.value),
                                        }))
                                    }
                                    min="1"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Nguồn tặng</label>
                                <select
                                    value={grantData.source}
                                    onChange={(e) =>
                                        setGrantData((prev) => ({
                                            ...prev,
                                            source: e.target.value,
                                        }))
                                    }
                                >
                                    <option value="admin_gift">
                                        Admin tặng
                                    </option>
                                    <option value="event_reward">
                                        Phần thưởng sự kiện
                                    </option>
                                    <option value="system_reward">
                                        Hệ thống tặng
                                    </option>
                                    <option value="loyalty_point">
                                        Đổi điểm thành viên
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Có hiệu lực từ</label>
                                <input
                                    type="datetime-local"
                                    value={grantData.valid_from}
                                    onChange={(e) =>
                                        setGrantData((prev) => ({
                                            ...prev,
                                            valid_from: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="form-group">
                                <label>Có hiệu lực đến</label>
                                <input
                                    type="datetime-local"
                                    value={grantData.valid_until}
                                    onChange={(e) =>
                                        setGrantData((prev) => ({
                                            ...prev,
                                            valid_until: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? 'Đang tặng...' : 'Tặng Coupon'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserCouponGrant;
```

### 3. Admin Hooks

#### `hooks/useAdminCoupons.js`

```javascript
import { useState, useEffect } from 'react';
import { couponService } from '../services/couponService';

export const useAdminCoupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState(null);

    const fetchCoupons = async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const response = await couponService.getCoupons(params);
            setCoupons(response.metadata.coupons);
            setPagination(response.metadata.pagination);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const createCoupon = async (couponData) => {
        setLoading(true);
        try {
            const response = await couponService.createCoupon(couponData);
            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateCoupon = async (id, couponData) => {
        setLoading(true);
        try {
            const response = await couponService.updateCoupon(id, couponData);
            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteCoupon = async (id) => {
        setLoading(true);
        try {
            const response = await couponService.deleteCoupon(id);
            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateCouponStatus = async (id, isActive) => {
        try {
            const response = await couponService.updateCoupon(id, {
                is_active: isActive,
            });
            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const grantCouponToUser = async (grantData) => {
        setLoading(true);
        try {
            const response = await couponService.grantCouponToUser(grantData);
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
        pagination,
        fetchCoupons,
        createCoupon,
        updateCoupon,
        deleteCoupon,
        updateCouponStatus,
        grantCouponToUser,
    };
};
```

### 4. Admin Styles

#### `styles/admin-coupon.css`

```css
.admin-coupon-management {
    padding: 20px;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.page-header h1 {
    margin: 0;
    color: #333;
}

.coupon-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.stat-card {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 15px;
}

.stat-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f8f9fa;
    color: #6c757d;
}

.stat-card.active .stat-icon {
    background-color: #d4edda;
    color: #155724;
}

.stat-card.expired .stat-icon {
    background-color: #f8d7da;
    color: #721c24;
}

.stat-card.used .stat-icon {
    background-color: #d1ecf1;
    color: #0c5460;
}

.stat-card.revenue .stat-icon {
    background-color: #fff3cd;
    color: #856404;
}

.stat-content h3 {
    margin: 0 0 5px 0;
    font-size: 24px;
    font-weight: bold;
    color: #333;
}

.stat-content p {
    margin: 0;
    color: #666;
    font-size: 14px;
}

.coupon-form {
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-section {
    margin-bottom: 30px;
    border-bottom: 1px solid #eee;
    padding-bottom: 20px;
}

.form-section:last-child {
    border-bottom: none;
}

.form-section h3 {
    margin: 0 0 20px 0;
    color: #333;
    font-size: 18px;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #007bff;
}

.form-group input.error,
.form-group select.error,
.form-group textarea.error {
    border-color: #dc3545;
}

.error-message {
    color: #dc3545;
    font-size: 12px;
    margin-top: 5px;
    display: block;
}

.checkbox-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.checkbox-group input[type='checkbox'] {
    width: auto;
    margin: 0;
}

.form-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 30px;
}

.coupon-table-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.table-wrapper {
    overflow-x: auto;
}

.coupon-table {
    width: 100%;
    border-collapse: collapse;
}

.coupon-table th,
.coupon-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
}

.coupon-table th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #333;
}

.coupon-code {
    background-color: #f8f9fa;
    padding: 4px 8px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    color: #007bff;
}

.coupon-name strong {
    display: block;
    margin-bottom: 4px;
}

.coupon-description {
    color: #666;
    font-size: 12px;
}

.type-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
}

.type-badge.type-percent {
    background-color: #e7f3ff;
    color: #0066cc;
}

.type-badge.type-fixed {
    background-color: #fff2e7;
    color: #cc6600;
}

.type-badge.type-free_shipping {
    background-color: #e7f8f0;
    color: #00aa44;
}

.status-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
}

.status-badge.active {
    background-color: #d4edda;
    color: #155724;
}

.status-badge.inactive {
    background-color: #f8d7da;
    color: #721c24;
}

.action-buttons {
    display: flex;
    gap: 5px;
}

.btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

.btn-primary {
    background-color: #007bff;
    color: white;
}

.btn-secondary {
    background-color: #6c757d;
    color: white;
}

.btn-success {
    background-color: #28a745;
    color: white;
}

.btn-warning {
    background-color: #ffc107;
    color: #212529;
}

.btn-danger {
    background-color: #dc3545;
    color: white;
}

.btn-info {
    background-color: #17a2b8;
    color: white;
}

.btn-sm {
    padding: 4px 8px;
    font-size: 12px;
}

.btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    padding: 20px;
    background-color: #f8f9fa;
}

.page-info {
    font-size: 14px;
    color: #666;
}

.empty-state {
    text-align: center;
    padding: 40px;
    color: #666;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 8px;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #eee;
}

.modal-header h2 {
    margin: 0;
    color: #333;
}

.btn-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding: 20px;
    border-top: 1px solid #eee;
}

.user-search {
    position: relative;
}

.search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-top: none;
    max-height: 200px;
    overflow-y: auto;
    z-index: 10;
}

.user-item {
    padding: 12px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.user-item:hover {
    background-color: #f8f9fa;
}

.user-item:last-child {
    border-bottom: none;
}

.user-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.user-info strong {
    color: #333;
}

.user-info span {
    color: #666;
    font-size: 14px;
}

.selected-user {
    margin-top: 10px;
    padding: 8px;
    background-color: #e7f3ff;
    border-radius: 4px;
    color: #0066cc;
}

.search-loading {
    text-align: center;
    padding: 10px;
    color: #666;
}

.table-loading,
.table-error {
    text-align: center;
    padding: 40px;
}

.loading-spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    width: 40px;
    height: 40px;
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

.expired {
    color: #dc3545;
}

@media (max-width: 768px) {
    .form-row {
        grid-template-columns: 1fr;
        gap: 0;
    }

    .coupon-stats {
        grid-template-columns: 1fr;
    }

    .page-header {
        flex-direction: column;
        gap: 20px;
        align-items: flex-start;
    }

    .action-buttons {
        flex-direction: column;
    }
}
```

## Usage Examples

### Admin Dashboard Route Setup

```javascript
// In your admin router
import { Routes, Route } from 'react-router-dom';
import CouponManagement from './pages/admin/CouponManagement';
import CouponCreate from './pages/admin/CouponCreate';
import CouponEdit from './pages/admin/CouponEdit';

const AdminRoutes = () => (
    <Routes>
        <Route path="/admin/coupons" element={<CouponManagement />} />
        <Route path="/admin/coupons/create" element={<CouponCreate />} />
        <Route path="/admin/coupons/:id/edit" element={<CouponEdit />} />
    </Routes>
);
```

### Admin Navigation

```javascript
const AdminNavigation = () => (
    <nav className="admin-nav">
        <Link to="/admin/coupons" className="nav-item">
            <i className="icon-ticket"></i>
            Quản lý Coupon
        </Link>
    </nav>
);
```

Tài liệu này cung cấp đầy đủ hướng dẫn để xây dựng admin dashboard cho việc quản lý coupon/discount system một cách chuyên nghiệp và hiệu quả.
