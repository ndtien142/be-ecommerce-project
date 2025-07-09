const NotificationService = require('../services/notification/notification.service');
const { SuccessResponse } = require('../core/success.response');

class NotificationController {
    getNotifications = async (req, res, next) => {
        const notifications = await NotificationService.getNotifications(
            req.user.userId,
        );
        new SuccessResponse({
            message: 'Lấy thông báo thành công',
            metadata: notifications,
        }).send(res);
    };

    markAsRead = async (req, res, next) => {
        await NotificationService.markAsRead(req.params.id);
        new SuccessResponse({
            message: 'Đánh dấu thông báo đã đọc thành công',
        }).send(res);
    };
}

module.exports = new NotificationController();
