const database = require('../../models');

class NotificationService {
    /**
     * Create a notification for specific users or roles.
     * Prevents duplicate notifications for the same user, type, referenceId, and referenceType.
     * @param {object} params
     * @param {string} params.userCode - Main user (initiator or relevant)
     * @param {string[]} [params.receivers] - Array of user codes to receive the notification
     * @param {string[]} [params.roles] - Array of role codes to send notification to all users of these roles
     * @param {string} params.title
     * @param {string} params.message
     * @param {string} params.type
     * @param {number} [params.referenceId]
     * @param {string} [params.referenceType]
     */
    static async createNotification({
        userCode,
        receivers = [],
        roles = [],
        title,
        message,
        type,
        referenceId,
        referenceType,
    }) {
        // Check for duplicate notification for each receiver
        const notifications = [];

        // Send to specific users
        if (receivers && receivers.length > 0) {
            for (const receiver of receivers) {
                const exists = await database.Notification.findOne({
                    where: {
                        user_code: receiver,
                        type,
                        reference_id: referenceId,
                        reference_type: referenceType,
                        is_read: false,
                    },
                });
                if (!exists) {
                    notifications.push(
                        await database.Notification.create({
                            user_code: receiver,
                            receivers,
                            roles,
                            title,
                            message,
                            type,
                            reference_id: referenceId,
                            reference_type: referenceType,
                        })
                    );
                }
            }
        } else if (roles && roles.length > 0) {
            // Send to all users with the specified roles
            const users = await database.Account.findAll({
                include: [{
                    model: database.Role,
                    as: 'role',
                    where: { role_code: roles },
                    attributes: [],
                }],
                attributes: ['user_code'],
            });
            for (const user of users) {
                const exists = await database.Notification.findOne({
                    where: {
                        user_code: user.user_code,
                        type,
                        reference_id: referenceId,
                        reference_type: referenceType,
                        is_read: false,
                    },
                });
                if (!exists) {
                    notifications.push(
                        await database.Notification.create({
                            user_code: user.user_code,
                            receivers,
                            roles,
                            title,
                            message,
                            type,
                            reference_id: referenceId,
                            reference_type: referenceType,
                        })
                    );
                }
            }
        } else {
            // Default: send to main userCode
            const exists = await database.Notification.findOne({
                where: {
                    user_code: userCode,
                    type,
                    reference_id: referenceId,
                    reference_type: referenceType,
                    is_read: false,
                },
            });
            if (!exists) {
                notifications.push(
                    await database.Notification.create({
                        user_code: userCode,
                        receivers,
                        roles,
                        title,
                        message,
                        type,
                        reference_id: referenceId,
                        reference_type: referenceType,
                    })
                );
            }
        }

        return notifications;
    }

    /**
     * Get notifications for a user.
     * @param {string} userCode
     * @returns {Promise<Array>}
     */
    static async getNotifications(userCode) {
        return database.Notification.findAll({
            where: { user_code: userCode },
            order: [['create_time', 'DESC']],
        });
    }

    /**
     * Mark a notification as read.
     * @param {number} notificationId
     * @returns {Promise}
     */
    static async markAsRead(notificationId) {
        return database.Notification.update(
            { is_read: true },
            { where: { id: notificationId } }
        );
    }

    /**
     * Mark all notifications as read for a user.
     * @param {string} userCode
     * @returns {Promise}
     */
    static async markAllAsRead(userCode) {
        return database.Notification.update(
            { is_read: true },
            { where: { user_code: userCode, is_read: false } }
        );
    }

    /**
     * Delete a notification by id.
     * @param {number} notificationId
     * @returns {Promise}
     */
    static async deleteNotification(notificationId) {
        return database.Notification.destroy({
            where: { id: notificationId }
        });
    }

    /**
     * Delete all notifications for a user.
     * @param {string} userCode
     * @returns {Promise}
     */
    static async deleteAllNotifications(userCode) {
        return database.Notification.destroy({
            where: { user_code: userCode }
        });
    }
}

module.exports = NotificationService;
