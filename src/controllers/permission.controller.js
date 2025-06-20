'use strict';

const PermissionService = require('../services/access/permission.service');
const { CREATED, SuccessResponse } = require('../core/success.response');

class PermissionController {
    createPermission = async (req, res, next) => {
        new CREATED({
            message: 'Create permission successfully',
            metadata: await PermissionService.createPermission(req.body),
        }).send(res);
    };

    updatePermission = async (req, res, next) => {
        new SuccessResponse({
            message: 'Update permission successfully',
            metadata: await PermissionService.updatePermission(req.body),
        }).send(res);
    };

    deletePermission = async (req, res, next) => {
        new SuccessResponse({
            message: 'Delete permission successfully',
            metadata: await PermissionService.deletePermission(req.params.id),
        }).send(res);
    };

    getAllPermissions = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get all permissions successfully',
            metadata: await PermissionService.getAllPermissions(req.query),
        }).send(res);
    };

    getPermissionById = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get permission by ID successfully',
            metadata: await PermissionService.getPermissionById(req.params.id),
        }).send(res);
    };
}

module.exports = new PermissionController();
