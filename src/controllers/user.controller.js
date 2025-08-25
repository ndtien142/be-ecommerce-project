'use strict';

const { CREATED, SuccessResponse } = require('../core/success.response');
const UserService = require('../services/access/user.service');

class UserController {
    createUser = async (req, res, next) => {
        new CREATED({
            message: 'Tạo người dùng mới thành công',
            metadata: await UserService.createUser(req.body),
        }).send(res);
    };

    createAdmin = async (req, res, next) => {
        new CREATED({
            message: 'Tạo tài khoản admin thành công',
            metadata: await UserService.createAdmin(req.body),
        }).send(res);
    };

    getUserById = async (req, res, next) => {
        // Kiểm tra quyền: admin có thể xem bất kỳ user nào, user chỉ xem được chính mình
        const requestedUserId = parseInt(req.params.id);
        const currentUserId = req.user.userId;
        const userRole = req.user.role.name;

        if (userRole !== 'admin' && currentUserId !== requestedUserId) {
            return res.status(403).json({
                message:
                    'Forbidden: Bạn chỉ có thể xem thông tin của chính mình',
            });
        }

        new SuccessResponse({
            message: 'Lấy người dùng theo ID thành công',
            metadata: await UserService.getUser(req.params.id),
        }).send(res);
    };

    updateUser = async (req, res, next) => {
        new SuccessResponse({
            message: 'Cập nhật người dùng thành công',
            metadata: await UserService.updateUser({
                userId: req.params.id,
                ...req.body,
            }),
        }).send(res);
    };

    markUserAsDeleted = async (req, res, next) => {
        new SuccessResponse({
            message: 'Đánh dấu người dùng đã xóa thành công',
            metadata: await UserService.markUserAsDeleted(req.params.id),
        }).send(res);
    };

    markUserAsBlocked = async (req, res, next) => {
        new SuccessResponse({
            message: 'Cập nhật trạng thái chặn người dùng thành công',
            metadata: await UserService.markUserAsBlocked(
                req.params.id,
                req.body.isBlock,
            ),
        }).send(res);
    };

    getAllUsers = async (req, res, next) => {
        new SuccessResponse({
            message: 'Lấy tất cả người dùng thành công',
            metadata: await UserService.getUsers(req.query),
        }).send(res);
    };

    getCurrentUserProfile = async (req, res, next) => {
        new SuccessResponse({
            message: 'Lấy profile người dùng hiện tại thành công',
            metadata: await UserService.getUser(req.user.userId),
        }).send(res);
    };

    updateCurrentUserProfile = async (req, res, next) => {
        // User chỉ có thể cập nhật một số trường nhất định
        const allowedFields = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            phoneNumber: req.body.phoneNumber,
            address: req.body.address,
            avatarUrl: req.body.avatarUrl,
        };

        // Loại bỏ các trường undefined
        const updateData = Object.fromEntries(
            Object.entries(allowedFields).filter(([_, v]) => v !== undefined),
        );

        new SuccessResponse({
            message: 'Cập nhật profile thành công',
            metadata: await UserService.updateUser({
                userId: req.user.userId,
                ...updateData,
            }),
        }).send(res);
    };
}

module.exports = new UserController();
