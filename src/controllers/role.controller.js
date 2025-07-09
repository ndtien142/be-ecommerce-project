'use strict';

const RoleService = require('../services/access/role.service');
const { CREATED, SuccessResponse } = require('../core/success.response');

class RoleController {
    createRole = async (req, res, next) => {
        new CREATED({
            message: 'Tạo vai trò thành công',
            metadata: await RoleService.createRole(req.body),
        }).send(res);
    };

    updateRole = async (req, res, next) => {
        new SuccessResponse({
            message: 'Cập nhật vai trò thành công',
            metadata: await RoleService.updateRole({
                id: req.body.id,
                name: req.body.name,
                description: req.body.description,
                permissions: req.body.permissions,
            }),
        }).send(res);
    };

    deleteRole = async (req, res, next) => {
        new SuccessResponse({
            message: 'Xóa vai trò thành công',
            metadata: await RoleService.deleteRole(req.params.id),
        }).send(res);
    };

    getAllRoles = async (req, res, next) => {
        new SuccessResponse({
            message: 'Lấy tất cả vai trò thành công',
            metadata: await RoleService.getAllRoles(req.query),
        }).send(res);
    };

    getRoleById = async (req, res, next) => {
        new SuccessResponse({
            message: 'Lấy vai trò theo ID thành công',
            metadata: await RoleService.getRoleById(req.params.id),
        }).send(res);
    };
}

module.exports = new RoleController();
