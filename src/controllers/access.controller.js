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
            message: 'Đăng ký thành công',
            metadata: await AccessService.signUp(req.body),
        }).send(res);
    };
    logout = async (req, res, next) => {
        new SuccessResponse({
            message: 'Đăng xuất thành công',
            metadata: await AccessService.logout(req.body),
        }).send(res);
    };
    signUpForCustomer = async (req, res, next) => {
        new CREATED({
            message: 'Đăng ký thành công',
            metadata: await AccessService.signUpCustomer(req.body),
        }).send(res);
    };
    refreshToken = async (req, res, next) => {
        new SuccessResponse({
            message: 'Làm mới token thành công',
            metadata: await AccessService.handlerRefreshToken(req.body),
        }).send(res);
    };

    changePassword = async (req, res, next) => {
        const userId = req.user.userId;
        new SuccessResponse({
            message: 'Thay đổi mật khẩu thành công',
            metadata: await AccessService.changePassword({
                userId,
                ...req.body,
            }),
        }).send(res);
    };

    verifyEmailWithCode = async (req, res, next) => {
        new SuccessResponse({
            message: 'Email verified successfully',
            metadata: await AccessService.verifyEmailWithCode(req.body),
        }).send(res);
    };

    resendVerificationCode = async (req, res, next) => {
        new SuccessResponse({
            message: 'Verification code sent',
            metadata: await AccessService.resendVerificationCode(req.body),
        }).send(res);
    };

    checkEmailVerificationStatus = async (req, res, next) => {
        new SuccessResponse({
            message: 'Email verification status retrieved',
            metadata: await AccessService.checkEmailVerificationStatus(
                req.body,
            ),
        }).send(res);
    };
}

module.exports = new AccessController();
