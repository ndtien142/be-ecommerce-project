'use strict';

const RoleService = require('../services/access/role.service');
const { CREATED, SuccessResponse } = require('../core/success.response');

class RoleController {
    createRole = async (req, res, next) => {
        new CREATED({
            message: 'Create role successfully',
            metadata: await RoleService.createRole(req.body),
        }).send(res);
    };

    updateRole = async (req, res, next) => {
        new SuccessResponse({
            message: 'Update role successfully',
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
            message: 'Delete role successfully',
            metadata: await RoleService.deleteRole(req.params.id),
        }).send(res);
    };

    getAllRoles = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get all roles successfully',
            metadata: await RoleService.getAllRoles(req.query),
        }).send(res);
    };

    getRoleById = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get role by ID successfully',
            metadata: await RoleService.getRoleById(req.params.id),
        }).send(res);
    };
}

module.exports = new RoleController();
