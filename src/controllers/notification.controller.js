const NotificationService = require('../services/notification/notification.service');
const { SuccessResponse } = require('../core/success.response');

class NotificationController {
    getNotifications = async (req, res, next) => {
        const notifications = await NotificationService.getNotifications(req.user.userCode);
        new SuccessResponse({
            message: 'Get notifications successfully',
            metadata: notifications,
        }).send(res);
    };

    markAsRead = async (req, res, next) => {
        await NotificationService.markAsRead(req.params.id);
        new SuccessResponse({
            message: 'Notification marked as read',
        }).send(res);
    };
}

module.exports = new NotificationController();
