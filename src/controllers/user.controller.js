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

    getUserById = async (req, res, next) => {
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
}

module.exports = new UserController();
