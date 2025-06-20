'use strict';

const { CREATED, SuccessResponse } = require('../core/success.response');
const UserService = require('../services/access/user.service');

class UserController {
    createUser = async (req, res, next) => {
        new CREATED({
            message: 'Create new user successfully',
            metadata: await UserService.createUser(req.body),
        }).send(res);
    };

    getUserById = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get user by id successfully',
            metadata: await UserService.getUser(req.params.id),
        }).send(res);
    };

    updateUser = async (req, res, next) => {
        new SuccessResponse({
            message: 'Update user successfully',
            metadata: await UserService.updateUser({
                userCode: req.params.id,
                ...req.body,
            }),
        }).send(res);
    };

    markUserAsDeleted = async (req, res, next) => {
        new SuccessResponse({
            message: 'Mark user as deleted successfully',
            metadata: await UserService.markUserAsDeleted(req.params.id),
        }).send(res);
    };

    markUserAsBlocked = async (req, res, next) => {
        new SuccessResponse({
            message: 'Update user block status successfully',
            metadata: await UserService.markUserAsBlocked(
                req.params.id,
                req.body.isBlock,
            ),
        }).send(res);
    };

    getAllUsers = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get all users successfully',
            metadata: await UserService.getUsers(req.query),
        }).send(res);
    };
}

module.exports = new UserController();
