module.exports = {
    orderStatus: (stat, displayName, color, totalOrders) => ({
        status: stat.status,
        displayName,
        count: parseInt(stat.count),
        percentage:
            totalOrders > 0
                ? ((parseInt(stat.count) / totalOrders) * 100).toFixed(1)
                : 0,
        color,
    }),

    paymentStatus: (stat, displayName, totalPayments) => ({
        method: stat.payment_method,
        displayName,
        status: stat.status,
        count: parseInt(stat.count),
        totalAmount: parseInt(stat.totalAmount) || 0,
        percentage:
            totalPayments > 0
                ? ((parseInt(stat.count) / totalPayments) * 100).toFixed(1)
                : 0,
    }),

    timeSeriesData: (period, value, keyName) => ({
        period,
        [keyName]: value,
    }),
};
