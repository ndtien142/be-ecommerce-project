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

    // ===============================
    // GOOGLE OAUTH METHODS
    // ===============================

    /**
     * Initiate Google OAuth login
     */
    googleLogin = async (req, res, next) => {
        // This will be handled by passport middleware
        // Just redirect to Google OAuth
    };

    /**
     * Handle Google OAuth callback
     */
    googleCallback = async (req, res, next) => {
        try {
            if (!req.user) {
                return res.redirect(
                    `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
                );
            }

            const result = await AccessService.handleGoogleCallback(req.user);

            // Redirect to frontend with tokens
            const queryParams = new URLSearchParams({
                access_token: result.tokens.accessToken,
                refresh_token: result.tokens.refreshToken,
                user: JSON.stringify(result.user),
            });

            res.redirect(
                `${process.env.FRONTEND_URL}/auth/callback?${queryParams}`,
            );
        } catch (error) {
            console.error('Google OAuth callback error:', error);
            res.redirect(
                `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
            );
        }
    };

    /**
     * Link Google account to existing user
     */
    linkGoogleAccount = async (req, res, next) => {
        const userId = req.user.userId;
        new SuccessResponse({
            message: 'Google account linked successfully',
            metadata: await AccessService.linkGoogleAccount(
                userId,
                req.body.googleId,
            ),
        }).send(res);
    };

    /**
     * Unlink Google account from user
     */
    unlinkGoogleAccount = async (req, res, next) => {
        const userId = req.user.userId;
        new SuccessResponse({
            message: 'Google account unlinked successfully',
            metadata: await AccessService.unlinkGoogleAccount(userId),
        }).send(res);
    };
}

module.exports = new AccessController();
