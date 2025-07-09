'use strict';

const PermissionService = require('../services/access/permission.service');
const { CREATED, SuccessResponse } = require('../core/success.response');

class PermissionController {
    createPermission = async (req, res, next) => {
        new CREATED({
            message: 'Tạo quyền thành công',
            metadata: await PermissionService.createPermission(req.body),
        }).send(res);
    };

    updatePermission = async (req, res, next) => {
        new SuccessResponse({
            message: 'Cập nhật quyền thành công',
            metadata: await PermissionService.updatePermission(req.body),
        }).send(res);
    };

    deletePermission = async (req, res, next) => {
        new SuccessResponse({
            message: 'Xóa quyền thành công',
            metadata: await PermissionService.deletePermission(req.params.id),
        }).send(res);
    };

    getAllPermissions = async (req, res, next) => {
        new SuccessResponse({
            message: 'Lấy tất cả quyền thành công',
            metadata: await PermissionService.getAllPermissions(req.query),
        }).send(res);
    };

    getPermissionById = async (req, res, next) => {
        new SuccessResponse({
            message: 'Lấy quyền theo ID thành công',
            metadata: await PermissionService.getPermissionById(req.params.id),
        }).send(res);
    };
}

module.exports = new PermissionController();
