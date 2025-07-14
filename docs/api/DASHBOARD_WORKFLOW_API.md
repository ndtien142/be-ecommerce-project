# Dashboard Workflow API Documentation

## Overview

Comprehensive API documentation for the Dashboard Workflow Statistics system. This system provides real-time analytics and insights for order management, payment processing, and workflow optimization.

## Base URL

```
/api/v1/dashboard/workflow
```

## Authentication

- **Required**: Bearer Token in Authorization header
- **Role**: Admin only
- **Rate Limiting**: 100 requests per minute per user

---

## API Endpoints

### 1. Workflow Statistics API

#### GET `/api/v1/dashboard/workflow/statistics`

**Description**: Get comprehensive workflow statistics with order status and payment method breakdowns.

**Query Parameters**:
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `period` | string | No | Time period: 'today', '7days', 'month', 'custom' | `7days` |
| `startDate` | string | No | Start date (YYYY-MM-DD) - required when period='custom' | `2025-07-01` |
| `endDate` | string | No | End date (YYYY-MM-DD) - required when period='custom' | `2025-07-14` |
| `timezone` | string | No | Timezone for calculations | `Asia/Ho_Chi_Minh` |

**Response Schema**:

```typescript
interface WorkflowStatisticsResponse {
    message: string;
    status: number;
    metadata: {
        period: {
            type: string;
            startDate: string;
            endDate: string;
            timezone: string;
        };
        ordersByStatus: OrderStatusStat[];
        paymentsByStatusAndMethod: PaymentMethodStat[];
    };
}

interface OrderStatusStat {
    status: string;
    displayName: string;
    count: number;
    percentage: number;
    color: string;
}

interface PaymentMethodStat {
    method: string;
    displayName: string;
    status: string;
    count: number;
    totalAmount: number;
    percentage: number;
}
```

**Example Response**:

```json
{
    "message": "Lấy thống kê workflow thành công",
    "status": 200,
    "metadata": {
        "period": {
            "type": "7days",
            "startDate": "2025-07-08",
            "endDate": "2025-07-14",
            "timezone": "Asia/Ho_Chi_Minh"
        },
        "ordersByStatus": [
            {
                "status": "pending_confirmation",
                "displayName": "Chờ xác nhận",
                "count": 25,
                "percentage": 35.2,
                "color": "#ff9800"
            },
            {
                "status": "pending_pickup",
                "displayName": "Chờ lấy hàng",
                "count": 18,
                "percentage": 25.4,
                "color": "#2196f3"
            },
            {
                "status": "shipping",
                "displayName": "Đang giao hàng",
                "count": 15,
                "percentage": 21.1,
                "color": "#ff5722"
            },
            {
                "status": "delivered",
                "displayName": "Đã giao hàng",
                "count": 12,
                "percentage": 16.9,
                "color": "#4caf50"
            },
            {
                "status": "cancelled",
                "displayName": "Đã hủy",
                "count": 1,
                "percentage": 1.4,
                "color": "#f44336"
            }
        ],
        "paymentsByStatusAndMethod": [
            {
                "method": "momo",
                "displayName": "MoMo",
                "status": "completed",
                "count": 45,
                "totalAmount": 15000000,
                "percentage": 65.2
            },
            {
                "method": "vnpay",
                "displayName": "VNPay",
                "status": "completed",
                "count": 30,
                "totalAmount": 8500000,
                "percentage": 23.4
            },
            {
                "method": "cod",
                "displayName": "Thanh toán khi nhận hàng",
                "status": "pending",
                "count": 20,
                "totalAmount": 4200000,
                "percentage": 8.1
            },
            {
                "method": "banking",
                "displayName": "Chuyển khoản",
                "status": "completed",
                "count": 10,
                "totalAmount": 2800000,
                "percentage": 3.3
            }
        ]
    }
}
```

---

### 2. Dashboard Overview API

#### GET `/api/v1/dashboard/workflow/overview`

**Description**: Get comprehensive dashboard overview with KPIs, trends, and actor statistics.

**Query Parameters**: Same as Workflow Statistics API

**Response Schema**:

```typescript
interface DashboardOverviewResponse {
    message: string;
    status: number;
    metadata: {
        period: PeriodInfo;
        totalOrders: number;
        totalActions: number;
        completionRate: number;
        averageProcessingTime: number;
        trends: TrendsInfo;
        pendingAlerts: AlertsInfo;
        actionStats: ActionStat[];
        actorStats: ActorStat[];
    };
}

interface TrendsInfo {
    ordersGrowth: number;
    actionsGrowth: number;
    completionRateChange: number;
    processingTimeChange: number;
}

interface AlertsInfo {
    pendingConfirmation: number;
    pendingPickup: number;
    overdueOrders: number;
    paymentIssues: number;
}

interface ActionStat {
    action: string;
    displayName: string;
    count: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
    trendValue: number;
}

interface ActorStat {
    actorType: string;
    displayName: string;
    count: number;
    percentage: number;
    averageResponseTime: number;
    activeCount: number | null;
}
```

**Example Response**:

```json
{
    "message": "Lấy thống kê dashboard thành công",
    "status": 200,
    "metadata": {
        "period": {
            "type": "7days",
            "startDate": "2025-07-08",
            "endDate": "2025-07-14",
            "timezone": "Asia/Ho_Chi_Minh"
        },
        "totalOrders": 156,
        "totalActions": 423,
        "completionRate": 87.5,
        "averageProcessingTime": 45,
        "trends": {
            "ordersGrowth": 12.5,
            "actionsGrowth": 8.3,
            "completionRateChange": 0.0,
            "processingTimeChange": -5.2
        },
        "pendingAlerts": {
            "pendingConfirmation": 12,
            "pendingPickup": 8,
            "overdueOrders": 3,
            "paymentIssues": 2
        },
        "actionStats": [
            {
                "action": "payment_completed",
                "displayName": "Thanh toán hoàn tất",
                "count": 145,
                "percentage": 34.3,
                "trend": "up",
                "trendValue": 12.5
            },
            {
                "action": "confirmed",
                "displayName": "Xác nhận đơn hàng",
                "count": 132,
                "percentage": 31.2,
                "trend": "up",
                "trendValue": 8.7
            },
            {
                "action": "picked_up",
                "displayName": "Lấy hàng",
                "count": 89,
                "percentage": 21.0,
                "trend": "stable",
                "trendValue": 0.2
            },
            {
                "action": "delivered",
                "displayName": "Giao hàng thành công",
                "count": 78,
                "percentage": 18.4,
                "trend": "up",
                "trendValue": 15.3
            },
            {
                "action": "cancelled",
                "displayName": "Hủy đơn hàng",
                "count": 15,
                "percentage": 3.5,
                "trend": "down",
                "trendValue": -23.1
            }
        ],
        "actorStats": [
            {
                "actorType": "admin",
                "displayName": "Quản trị viên",
                "count": 189,
                "percentage": 44.7,
                "averageResponseTime": 15,
                "activeCount": 5
            },
            {
                "actorType": "shipper",
                "displayName": "Người giao hàng",
                "count": 156,
                "percentage": 36.9,
                "averageResponseTime": 30,
                "activeCount": 12
            },
            {
                "actorType": "payment_gateway",
                "displayName": "Cổng thanh toán",
                "count": 145,
                "percentage": 34.3,
                "averageResponseTime": 2,
                "activeCount": null
            },
            {
                "actorType": "customer",
                "displayName": "Khách hàng",
                "count": 23,
                "percentage": 5.4,
                "averageResponseTime": 120,
                "activeCount": null
            },
            {
                "actorType": "system",
                "displayName": "Hệ thống",
                "count": 12,
                "percentage": 2.8,
                "averageResponseTime": 1,
                "activeCount": null
            }
        ]
    }
}
```

---

### 3. Time Series Data API

#### GET `/api/v1/dashboard/workflow/timeseries`

**Description**: Get time series data for charts and trend analysis.

**Query Parameters**:
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `period` | string | No | Time period | `7days` |
| `startDate` | string | No | Start date | `2025-07-01` |
| `endDate` | string | No | End date | `2025-07-14` |
| `granularity` | string | No | Time granularity: 'hour', 'day', 'week' | `day` |
| `metrics` | string | No | Comma-separated metrics | `orders,revenue,actions` |

**Response Schema**:

```typescript
interface TimeSeriesResponse {
    message: string;
    status: number;
    metadata: {
        period: PeriodInfo;
        timeSeries: TimeSeriesDataPoint[];
    };
}

interface TimeSeriesDataPoint {
    date: string;
    orders?: number;
    revenue?: number;
    actions?: number;
    completionRate?: number;
}
```

**Example Response**:

```json
{
    "message": "Lấy dữ liệu thời gian thành công",
    "status": 200,
    "metadata": {
        "period": {
            "type": "7days",
            "startDate": "2025-07-08",
            "endDate": "2025-07-14",
            "granularity": "day"
        },
        "timeSeries": [
            {
                "date": "2025-07-08",
                "orders": 18,
                "revenue": 2450000,
                "actions": 52,
                "completionRate": 85.2
            },
            {
                "date": "2025-07-09",
                "orders": 22,
                "revenue": 3200000,
                "actions": 67,
                "completionRate": 89.1
            },
            {
                "date": "2025-07-10",
                "orders": 20,
                "revenue": 2800000,
                "actions": 58,
                "completionRate": 87.5
            },
            {
                "date": "2025-07-11",
                "orders": 25,
                "revenue": 3650000,
                "actions": 71,
                "completionRate": 88.3
            },
            {
                "date": "2025-07-12",
                "orders": 19,
                "revenue": 2900000,
                "actions": 55,
                "completionRate": 86.8
            },
            {
                "date": "2025-07-13",
                "orders": 28,
                "revenue": 4100000,
                "actions": 78,
                "completionRate": 91.2
            },
            {
                "date": "2025-07-14",
                "orders": 24,
                "revenue": 3400000,
                "actions": 62,
                "completionRate": 89.7
            }
        ]
    }
}
```

---

### 4. Real-time Metrics API

#### GET `/api/v1/dashboard/workflow/realtime`

**Description**: Get real-time metrics and recent activities.

**Response Schema**:

```typescript
interface RealtimeMetricsResponse {
    message: string;
    status: number;
    metadata: {
        timestamp: string;
        activeOrders: number;
        activeShippers: number;
        pendingActions: number;
        systemHealth: SystemHealthInfo;
        recentActivities: RecentActivity[];
    };
}

interface SystemHealthInfo {
    status: string;
    responseTime: number;
    uptime: number;
}

interface RecentActivity {
    id: number;
    orderId: number;
    action: string;
    actorType: string;
    actorName: string;
    timestamp: string;
    description: string;
}
```

**Example Response**:

```json
{
    "message": "Lấy thống kê thời gian thực thành công",
    "status": 200,
    "metadata": {
        "timestamp": "2025-07-14T10:30:00Z",
        "activeOrders": 45,
        "activeShippers": 12,
        "pendingActions": 8,
        "systemHealth": {
            "status": "healthy",
            "responseTime": 156,
            "uptime": 99.98
        },
        "recentActivities": [
            {
                "id": 1,
                "orderId": 62,
                "action": "delivered",
                "actorType": "shipper",
                "actorName": "Hùng",
                "timestamp": "2025-07-14T10:25:00Z",
                "description": "Đã giao hàng thành công"
            },
            {
                "id": 2,
                "orderId": 63,
                "action": "picked_up",
                "actorType": "shipper",
                "actorName": "Minh",
                "timestamp": "2025-07-14T10:20:00Z",
                "description": "Đã lấy hàng, chuẩn bị giao"
            }
        ]
    }
}
```

---

### 5. Cache Management API

#### DELETE `/api/v1/dashboard/workflow/cache`

**Description**: Clear dashboard cache (admin only).

**Response Schema**:

```typescript
interface CacheResponse {
    message: string;
    status: number;
}
```

**Example Response**:

```json
{
    "message": "Xóa cache thành công",
    "status": 200
}
```

---

## Error Responses

### 400 Bad Request

```json
{
    "message": "Tham số không hợp lệ",
    "status": 400,
    "errors": [
        {
            "field": "period",
            "message": "Giá trị period phải là: today, 7days, month, hoặc custom"
        }
    ]
}
```

### 401 Unauthorized

```json
{
    "message": "Không có quyền truy cập",
    "status": 401
}
```

### 403 Forbidden

```json
{
    "message": "Chỉ admin mới có quyền truy cập dashboard",
    "status": 403
}
```

### 500 Internal Server Error

```json
{
    "message": "Lỗi server nội bộ",
    "status": 500,
    "error": "Database connection failed"
}
```

---

## Frontend Integration

### TypeScript Interfaces

```typescript
// types/dashboard.ts
export interface DashboardApiResponse<T> {
    message: string;
    status: number;
    metadata: T;
}

export interface PeriodInfo {
    type: string;
    startDate: string;
    endDate: string;
    timezone: string;
}

export interface OrderStatusStat {
    status: string;
    displayName: string;
    count: number;
    percentage: number;
    color: string;
}

export interface PaymentMethodStat {
    method: string;
    displayName: string;
    status: string;
    count: number;
    totalAmount: number;
    percentage: number;
}

export interface ActionStat {
    action: string;
    displayName: string;
    count: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
    trendValue: number;
}

export interface ActorStat {
    actorType: string;
    displayName: string;
    count: number;
    percentage: number;
    averageResponseTime: number;
    activeCount: number | null;
}

export interface WorkflowStatistics {
    period: PeriodInfo;
    ordersByStatus: OrderStatusStat[];
    paymentsByStatusAndMethod: PaymentMethodStat[];
}

export interface DashboardOverview {
    period: PeriodInfo;
    totalOrders: number;
    totalActions: number;
    completionRate: number;
    averageProcessingTime: number;
    trends: {
        ordersGrowth: number;
        actionsGrowth: number;
        completionRateChange: number;
        processingTimeChange: number;
    };
    pendingAlerts: {
        pendingConfirmation: number;
        pendingPickup: number;
        overdueOrders: number;
        paymentIssues: number;
    };
    actionStats: ActionStat[];
    actorStats: ActorStat[];
}

export interface TimeSeriesDataPoint {
    date: string;
    orders?: number;
    revenue?: number;
    actions?: number;
    completionRate?: number;
}

export interface TimeSeriesData {
    period: PeriodInfo;
    timeSeries: TimeSeriesDataPoint[];
}

export interface RealtimeMetrics {
    timestamp: string;
    activeOrders: number;
    activeShippers: number;
    pendingActions: number;
    systemHealth: {
        status: string;
        responseTime: number;
        uptime: number;
    };
    recentActivities: {
        id: number;
        orderId: number;
        action: string;
        actorType: string;
        actorName: string;
        timestamp: string;
        description: string;
    }[];
}
```

### API Service

```typescript
// services/dashboardApi.ts
import axios from 'axios';
import {
    DashboardApiResponse,
    WorkflowStatistics,
    DashboardOverview,
    TimeSeriesData,
    RealtimeMetrics,
} from '../types/dashboard';

const API_BASE_URL = '/api/v1/dashboard/workflow';

export const dashboardApi = {
    // Get workflow statistics
    getWorkflowStatistics: async (params: {
        period?: string;
        startDate?: string;
        endDate?: string;
        timezone?: string;
    }): Promise<DashboardApiResponse<WorkflowStatistics>> => {
        const response = await axios.get(`${API_BASE_URL}/statistics`, {
            params,
        });
        return response.data;
    },

    // Get dashboard overview
    getDashboardOverview: async (params: {
        period?: string;
        startDate?: string;
        endDate?: string;
        timezone?: string;
    }): Promise<DashboardApiResponse<DashboardOverview>> => {
        const response = await axios.get(`${API_BASE_URL}/overview`, {
            params,
        });
        return response.data;
    },

    // Get time series data
    getTimeSeriesData: async (params: {
        period?: string;
        startDate?: string;
        endDate?: string;
        granularity?: string;
        metrics?: string;
    }): Promise<DashboardApiResponse<TimeSeriesData>> => {
        const response = await axios.get(`${API_BASE_URL}/timeseries`, {
            params,
        });
        return response.data;
    },

    // Get real-time metrics
    getRealtimeMetrics: async (): Promise<
        DashboardApiResponse<RealtimeMetrics>
    > => {
        const response = await axios.get(`${API_BASE_URL}/realtime`);
        return response.data;
    },

    // Clear cache
    clearCache: async (): Promise<DashboardApiResponse<void>> => {
        const response = await axios.delete(`${API_BASE_URL}/cache`);
        return response.data;
    },
};
```

### React Hooks

```typescript
// hooks/useDashboard.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboardApi';

export const useDashboardHooks = () => {
    const queryClient = useQueryClient();

    // Workflow statistics hook
    const useWorkflowStatistics = (params: {
        period?: string;
        startDate?: string;
        endDate?: string;
        timezone?: string;
    }) => {
        return useQuery({
            queryKey: ['workflow-statistics', params],
            queryFn: () => dashboardApi.getWorkflowStatistics(params),
            staleTime: 5 * 60 * 1000, // 5 minutes
            cacheTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: false,
        });
    };

    // Dashboard overview hook
    const useDashboardOverview = (params: {
        period?: string;
        startDate?: string;
        endDate?: string;
        timezone?: string;
    }) => {
        return useQuery({
            queryKey: ['dashboard-overview', params],
            queryFn: () => dashboardApi.getDashboardOverview(params),
            staleTime: 5 * 60 * 1000,
            cacheTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
        });
    };

    // Time series data hook
    const useTimeSeriesData = (params: {
        period?: string;
        startDate?: string;
        endDate?: string;
        granularity?: string;
        metrics?: string;
    }) => {
        return useQuery({
            queryKey: ['time-series-data', params],
            queryFn: () => dashboardApi.getTimeSeriesData(params),
            staleTime: 5 * 60 * 1000,
            cacheTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
        });
    };

    // Real-time metrics hook
    const useRealtimeMetrics = () => {
        return useQuery({
            queryKey: ['realtime-metrics'],
            queryFn: dashboardApi.getRealtimeMetrics,
            staleTime: 30 * 1000, // 30 seconds
            cacheTime: 60 * 1000, // 1 minute
            refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
            refetchOnWindowFocus: false,
        });
    };

    // Clear cache mutation
    const useClearCache = () => {
        return useMutation({
            mutationFn: dashboardApi.clearCache,
            onSuccess: () => {
                // Invalidate all dashboard queries
                queryClient.invalidateQueries({
                    queryKey: ['workflow-statistics'],
                });
                queryClient.invalidateQueries({
                    queryKey: ['dashboard-overview'],
                });
                queryClient.invalidateQueries({
                    queryKey: ['time-series-data'],
                });
                queryClient.invalidateQueries({
                    queryKey: ['realtime-metrics'],
                });
            },
        });
    };

    return {
        useWorkflowStatistics,
        useDashboardOverview,
        useTimeSeriesData,
        useRealtimeMetrics,
        useClearCache,
    };
};
```

### React Component Examples

```typescript
// components/DashboardOverview.tsx
import React, { useState } from 'react';
import { Card, Select, DatePicker, Button, Row, Col, Statistic } from 'antd';
import { useDashboardHooks } from '../hooks/useDashboard';

const { RangePicker } = DatePicker;

export const DashboardOverview: React.FC = () => {
  const [period, setPeriod] = useState('7days');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const { useDashboardOverview, useClearCache } = useDashboardHooks();

  const { data: dashboardData, isLoading, error } = useDashboardOverview({
    period,
    startDate: dateRange?.[0],
    endDate: dateRange?.[1],
  });

  const clearCacheMutation = useClearCache();

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    if (value !== 'custom') {
      setDateRange(null);
    }
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
    } else {
      setDateRange(null);
    }
  };

  const handleClearCache = () => {
    clearCacheMutation.mutate();
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const metadata = dashboardData?.metadata;

  return (
    <div>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Select
              value={period}
              onChange={handlePeriodChange}
              style={{ width: '100%' }}
            >
              <Select.Option value="today">Hôm nay</Select.Option>
              <Select.Option value="7days">7 ngày qua</Select.Option>
              <Select.Option value="month">Tháng này</Select.Option>
              <Select.Option value="custom">Tùy chọn</Select.Option>
            </Select>
          </Col>
          {period === 'custom' && (
            <Col span={8}>
              <RangePicker onChange={handleDateRangeChange} />
            </Col>
          )}
          <Col span={8}>
            <Button
              onClick={handleClearCache}
              loading={clearCacheMutation.isLoading}
            >
              Xóa Cache
            </Button>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Tổng đơn hàng"
              value={metadata?.totalOrders}
              suffix={
                <span style={{ color: metadata?.trends.ordersGrowth > 0 ? 'green' : 'red' }}>
                  {metadata?.trends.ordersGrowth > 0 ? '↑' : '↓'} {metadata?.trends.ordersGrowth}%
                </span>
              }
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Tổng hành động"
              value={metadata?.totalActions}
              suffix={
                <span style={{ color: metadata?.trends.actionsGrowth > 0 ? 'green' : 'red' }}>
                  {metadata?.trends.actionsGrowth > 0 ? '↑' : '↓'} {metadata?.trends.actionsGrowth}%
                </span>
              }
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Tỷ lệ hoàn thành"
              value={metadata?.completionRate}
              suffix="%"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Thời gian xử lý TB"
              value={metadata?.averageProcessingTime}
              suffix="phút"
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="Cảnh báo đang chờ">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Chờ xác nhận"
                  value={metadata?.pendingAlerts.pendingConfirmation}
                  valueStyle={{ color: '#ff9800' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Chờ lấy hàng"
                  value={metadata?.pendingAlerts.pendingPickup}
                  valueStyle={{ color: '#2196f3' }}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Statistic
                  title="Đơn hàng quá hạn"
                  value={metadata?.pendingAlerts.overdueOrders}
                  valueStyle={{ color: '#f44336' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Lỗi thanh toán"
                  value={metadata?.pendingAlerts.paymentIssues}
                  valueStyle={{ color: '#ff5722' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Thống kê hoạt động">
            {metadata?.actionStats.slice(0, 5).map((stat) => (
              <div key={stat.action} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{stat.displayName}</span>
                  <span>
                    {stat.count} ({stat.percentage}%)
                    <span style={{
                      color: stat.trend === 'up' ? 'green' : stat.trend === 'down' ? 'red' : 'gray',
                      marginLeft: 8
                    }}>
                      {stat.trend === 'up' ? '↑' : stat.trend === 'down' ? '↓' : '→'} {stat.trendValue}%
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
```

---

## Performance Optimization

### Database Optimization

1. **Indexes**: Create composite indexes on frequently queried fields

```sql
CREATE INDEX idx_order_create_status ON tb_order(createTime, status);
CREATE INDEX idx_orderlog_created_action ON tb_order_log(createdAt, action);
CREATE INDEX idx_payment_status_method ON tb_payment(status, paymentMethod);
```

2. **Query Optimization**: Use appropriate JOIN strategies and LIMIT clauses
3. **Materialized Views**: For complex aggregations that don't change frequently

### Caching Strategy

1. **Redis Cache**: 5-minute TTL for dashboard statistics
2. **Application Cache**: In-memory caching for frequently accessed data
3. **Cache Invalidation**: Automatic cache clearing on data updates

### Rate Limiting

1. **API Rate Limiting**: 100 requests per minute per user
2. **Database Connection Pooling**: Optimal connection management
3. **Response Compression**: Gzip compression for large responses

### Monitoring and Alerting

1. **Response Time Monitoring**: Track API response times
2. **Error Rate Monitoring**: Monitor 4xx and 5xx error rates
3. **Resource Usage**: CPU, memory, and database performance monitoring
4. **Business Metrics**: Track completion rates and processing times

---

## Security Considerations

### Authentication & Authorization

1. **JWT Token Validation**: Verify token signature and expiration
2. **Role-Based Access Control**: Admin-only access to dashboard APIs
3. **Rate Limiting**: Prevent API abuse and DOS attacks

### Data Protection

1. **Input Validation**: Sanitize all query parameters
2. **SQL Injection Prevention**: Use parameterized queries
3. **XSS Prevention**: Escape output data appropriately

### Audit Logging

1. **API Access Logs**: Log all dashboard API calls
2. **Performance Logs**: Track slow queries and performance issues
3. **Error Logs**: Comprehensive error tracking and alerting

---

## Deployment Notes

### Environment Variables

```bash
# Redis configuration for caching
REDIS_URL=redis://localhost:6379
REDIS_TTL=300

# Database optimization
DB_POOL_SIZE=10
DB_QUERY_TIMEOUT=30000

# API rate limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Health Checks

```bash
# API health check
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/v1/dashboard/workflow/realtime"
```

### Monitoring Setup

1. **Prometheus Metrics**: Custom metrics for dashboard performance
2. **Grafana Dashboards**: Visual monitoring of system performance
3. **Alert Manager**: Automated alerts for system issues

This comprehensive documentation provides all the necessary information for frontend developers to integrate with the Dashboard Workflow API, including TypeScript interfaces, React hooks, and complete component examples.
