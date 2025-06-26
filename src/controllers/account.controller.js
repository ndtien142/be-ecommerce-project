'use strict';

const AccountService = require('../services/access/account.service');
const { SuccessResponse, CREATED } = require('../core/success.response');

class AccountController {
    getProfile = async (req, res, next) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new Error('User ID not found in request');
        }
        new SuccessResponse({
            metadata: await AccountService.getProfile(userId),
        }).send(res);
    };

    updateProfile = async (req, res, next) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new Error('User ID not found in request');
        }
        new SuccessResponse({
            message: 'Profile updated',
            metadata: await AccountService.updateProfile(userId, req.body),
        }).send(res);
    };
}

module.exports = new AccountController();
