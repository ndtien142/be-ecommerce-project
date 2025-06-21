'use strict';

const AccessService = require('../services/access/access.service');
const { CREATED, SuccessResponse } = require('../core/success.response');

class AccessController {
    login = async (req, res, next) => {
        new SuccessResponse({
            metadata: await AccessService.login(req.body),
        }).send(res);
    };
    signUp = async (req, res, next) => {
        new CREATED({
            message: 'Registered OK',
            metadata: await AccessService.signUp(req.body),
        }).send(res);
    };
    logout = async (req, res, next) => {
        new SuccessResponse({
            message: 'Logout OK',
            metadata: await AccessService.logout(req.body),
        }).send(res);
    };
    signUpForCustomer = async (req, res, next) => {
        new CREATED({
            message: 'Registered OK',
            metadata: await AccessService.signUpCustomer(req.body),
        }).send(res);
    };
    refreshToken = async (req, res, next) => {
        new SuccessResponse({
            message: 'Refresh token OK',
            metadata: await AccessService.handlerRefreshToken(req.body),
        }).send(res);
    };
}

module.exports = new AccessController();
