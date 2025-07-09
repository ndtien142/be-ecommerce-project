'use strict';

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { createTokenPair, verifyJWT } = require('../../auth/authUtils');
const { getInfoData } = require('../../utils');
const {
    BadRequestError,
    AuthFailureError,
    ForbiddenError,
    NotFoundError,
} = require('../../core/error.response');
const { getRoleByName } = require('../../models/repo/role.repo');
const {
    createAccount,
    getAccountByUserLogin,
} = require('../../models/repo/user.repo');
const {
    createKeyToken,
    removeKeyTokenByUserId,
} = require('../../models/repo/keyToken.repo');
const database = require('../../models');
const emailService = require('../email/email.service');

class AccessService {
    static logout = async ({ userId }) => {
        const delKeyStore = await removeKeyTokenByUserId(userId);
        return delKeyStore;
    };
    /*
        1 - Check username in database
        2 - match password
        3 - create access token and refresh token and save
        4 - generate tokens
        5 - get data return login
    */
    static login = async ({ username, password, refreshToken = null }) => {
        // 1
        const foundAccount = await database.User.findOne({
            where: { user_login: username },
            include: [{ model: database.Role, as: 'role' }],
        });
        if (!foundAccount) throw new BadRequestError('Username not registered');
        // 2
        const matchPassword = await bcrypt.compare(
            password,
            foundAccount.user_pass,
        );
        if (!matchPassword) throw new AuthFailureError('Authentication Error');

        // Check if email is verified
        if (!foundAccount.email_verified) {
            throw new AuthFailureError(
                'Please verify your email address before logging in',
            );
        }

        // if (foundAccount.is_block || !foundAccount.is_active)
        //     throw new AuthFailureError('Account has something wrong');

        // 3
        const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
                // public key cryptographic standard
                type: 'pkcs1',
                format: 'pem',
            },
            privateKeyEncoding: {
                // public key cryptographic standard
                type: 'pkcs1',
                format: 'pem',
            },
        });

        // 4
        const tokens = await createTokenPair(
            {
                userId: foundAccount.id,
                username: foundAccount.user_login,
                role: foundAccount.role ? foundAccount.role : undefined,
                email: foundAccount.user_email,
            },
            publicKey,
            privateKey,
        );
        await createKeyToken({
            userId: foundAccount.id,
            refreshToken: tokens.refreshToken,
            privateKey,
            publicKey,
        });
        return {
            code: 200,
            tokens,
            user: {
                userId: foundAccount.id,
                username: foundAccount.user_login,
                email: foundAccount.user_email,
                role: {
                    id: foundAccount.role.id,
                    name: foundAccount.role.name,
                    description: foundAccount.role.description,
                },
            },
        };
    };

    static signUp = async ({
        username,
        password,
        roleName,
        email,
        firstName,
        lastName,
        dateOfBirth,
    }) => {
        // step 1: check username exist
        const existingAccount = await getAccountByUserLogin(username);
        if (existingAccount) {
            throw new BadRequestError('Lỗi: Tên đăng nhập đã được đăng ký!');
        }
        // Step 2: hashing password
        const passwordHash = await bcrypt.hash(password, 10);

        let role;
        if (roleName) {
            role = await getRoleByName(roleName);
            if (!role) {
                throw new BadRequestError('Không tìm thấy vai trò');
            }
        } else {
            role = await getRoleByName(roleName);
            if (!role) {
                throw new BadRequestError('Không tìm thấy vai trò mặc định');
            }
        }

        // Generate email verification code
        const verificationCode = emailService.generateVerificationCode();
        const verificationExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes for testing

        const newAccount = await createAccount({
            username,
            password: passwordHash,
            roleId: role.id,
            email,
            dateOfBirth,
            emailVerificationCode: verificationCode,
            emailVerificationExpires: verificationExpires,
        });

        if (newAccount) {
            // Create profile if firstName or lastName are provided
            if (firstName || lastName) {
                const fullName = [firstName, lastName]
                    .filter(Boolean)
                    .join(' ');
                await database.Profile.create({
                    user_id: newAccount.id,
                    full_name: fullName,
                });
            }

            // created privateKey, publicKey
            // use has private key
            // system store public key
            // private key use to sync token
            // public key use to verify token
            const { privateKey, publicKey } = crypto.generateKeyPairSync(
                'rsa',
                {
                    modulusLength: 4096,
                    publicKeyEncoding: {
                        // public key cryptographic standard
                        type: 'pkcs1',
                        format: 'pem',
                    },
                    privateKeyEncoding: {
                        // public key cryptographic standard
                        type: 'pkcs1',
                        format: 'pem',
                    },
                },
            );
            // if exist handle save to collection KeyStore
            const publicKeyString = await createKeyToken({
                userId: newAccount.id,
                publicKey,
                privateKey,
            });

            if (!publicKeyString) {
                throw new BadRequestError('Public key string error');
            }

            // Send verification email
            const emailResult = await emailService.sendVerificationEmail(
                newAccount.user_email,
                newAccount.user_login,
                verificationCode,
            );

            if (!emailResult.success) {
                console.error(
                    'Failed to send verification email:',
                    emailResult.error,
                );
            }

            // Note: Don't create tokens for unverified users
            // They need to verify email first before they can login

            return {
                code: 201,
                message:
                    'Account created successfully. Please check your email for a 6-digit verification code.',
                user: {
                    userId: newAccount.id,
                    username: newAccount.user_login,
                    email: newAccount.user_email,
                    role: newAccount.role ? newAccount.role.name : undefined,
                    emailVerified: false,
                },
                emailSent: emailResult.success,
                previewUrl: emailResult.previewUrl, // For development
            };
        }
        return {
            code: 201,
        };
    };

    static signUpCustomer = async ({
        username,
        password,
        email,
        firstName,
        lastName,
        dateOfBirth,
    }) => {
        // step 1: check username exist
        const existingAccount = await getAccountByUserLogin(username);
        if (existingAccount) {
            throw new BadRequestError('Lỗi: Tên đăng nhập đã được đăng ký!');
        }
        // Step 2: hashing password
        const passwordHash = await bcrypt.hash(password, 10);

        const role = await getRoleByName('customer');
        if (!role) {
            throw new BadRequestError('Không tìm thấy vai trò');
        }

        // Generate email verification code
        const verificationCode = emailService.generateVerificationCode();
        const verificationExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes for testing

        const newAccount = await createAccount({
            username,
            email,
            dateOfBirth,
            password: passwordHash,
            roleId: role.id,
            emailVerificationCode: verificationCode,
            emailVerificationExpires: verificationExpires,
        });

        if (newAccount) {
            // Create profile if firstName or lastName are provided
            if (firstName || lastName) {
                const fullName = [firstName, lastName]
                    .filter(Boolean)
                    .join(' ');
                await database.Profile.create({
                    user_id: newAccount.id,
                    full_name: fullName,
                });
            }

            // created privateKey, publicKey
            // use has private key
            // system store public key
            // private key use to sync token
            // public key use to verify token
            const { privateKey, publicKey } = crypto.generateKeyPairSync(
                'rsa',
                {
                    modulusLength: 4096,
                    publicKeyEncoding: {
                        // public key cryptographic standard
                        type: 'pkcs1',
                        format: 'pem',
                    },
                    privateKeyEncoding: {
                        // public key cryptographic standard
                        type: 'pkcs1',
                        format: 'pem',
                    },
                },
            );
            // if exist handle save to collection KeyStore
            const publicKeyString = await createKeyToken({
                userId: newAccount.id,
                publicKey,
                privateKey,
            });

            if (!publicKeyString) {
                throw new BadRequestError('Public key string error');
            }

            // Send verification email
            const emailResult = await emailService.sendVerificationEmail(
                newAccount.user_email,
                newAccount.user_login,
                verificationCode,
            );

            if (!emailResult.success) {
                console.error(
                    'Failed to send verification email:',
                    emailResult.error,
                );
            }

            // Note: Don't create tokens for unverified customers
            // They need to verify email first before they can login

            return {
                code: 201,
                message:
                    'Customer account created successfully. Please check your email for a 6-digit verification code.',
                user: {
                    userId: newAccount.id,
                    username: newAccount.user_login,
                    email: newAccount.user_email,
                    role: newAccount.role ? newAccount.role.name : undefined,
                    emailVerified: false,
                },
                emailSent: emailResult.success,
                previewUrl: emailResult.previewUrl, // For development
            };
        }
        return {
            code: 201,
        };
    };

    /*
        check token used
    */
    static handlerRefreshToken = async ({ refreshToken, keyStore, user }) => {
        // check keystore refreshToken is null
        const { userId, username, role, email } = user;

        if (keyStore.refreshTokenUsed.includes(refreshToken)) {
            await removeKeyTokenByUserId(userId);
            throw new ForbiddenError('Something wrong happend! Pls relogin');
        }

        if (keyStore.refreshToken !== refreshToken)
            throw new AuthFailureError('Shop not registed');

        //     const foundShop = await findByEmail(email);
        // console.log({foundShop});
        // if(!foundShop) throw new AuthFailureError("Shop not registed");

        // create 1 cap moi
        const tokens = await createTokenPair(
            { userId, username, role, email },
            keyStore.publicKey,
            keyStore.privateKey,
        );

        // update token
        await keyStore.update({
            $set: {
                refreshToken: tokens.refreshToken,
            },
            $addToSet: {
                refreshTokenUsed: refreshToken, // da duoc su dung de lay token moi
            },
        });
        return {
            user: { userId, username, role, email },
            tokens,
        };
    };

    static handlerRefreshTokenV2 = async ({ refreshToken }) => {
        const keyToken = await database.KeyToken.findOne({
            where: { refreshToken },
        });

        if (!keyToken) {
            throw new NotFoundError('Refresh token not found');
        }

        let decoded;
        try {
            // 3 - Verify refresh token
            decoded = await verifyJWT(refreshToken, keyToken.publicKey);
        } catch (err) {
            throw new BadRequestError('Refresh token verification failed');
        }

        const { userId, username, role, email } = decoded;

        // 4 - check userId
        const foundUser = await database.User.findByPk(userId);
        if (!foundUser) {
            throw new NotFoundError('User not found');
        }

        // 5 - check keyToken exist in database
        if (!keyToken) {
            throw new NotFoundError('Key token not found');
        }

        // 6 - create new key pair for refresh
        const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: 'pkcs1',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs1',
                format: 'pem',
            },
        });

        // 7 - create new token pair
        const tokens = await createTokenPair(
            { userId, username, role, email },
            publicKey,
            privateKey,
        );

        // 8 - update keyToken
        if (!keyToken) {
            throw new BadRequestError('Failed to create new key token.');
        }
        keyToken.refreshToken = tokens.refreshToken;
        keyToken.publicKey = publicKey;
        keyToken.privateKey = privateKey;
        await keyToken.save();

        return {
            code: 200,
            tokens: tokens,
            user: { userId, username, role, email },
        };
    };

    static changePassword = async ({ userId, oldPassword, newPassword }) => {
        const user = await database.User.findByPk(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }
        const match = await bcrypt.compare(oldPassword, user.user_pass);
        if (!match) {
            throw new BadRequestError('Mật khẩu cũ không chính xác');
        }
        const newHash = await bcrypt.hash(newPassword, 10);
        user.user_pass = newHash;
        await user.save();
        return { message: 'Thay đổi mật khẩu thành công' };
    };

    static verifyEmailWithCode = async ({ code, email }) => {
        const user = await database.User.findOne({
            where: {
                user_email: email,
                email_verification_code: code,
            },
        });

        if (!user) {
            throw new BadRequestError('Invalid verification code or email');
        }

        if (user.email_verification_expires < new Date()) {
            throw new BadRequestError('Verification code has expired');
        }

        if (user.email_verified) {
            throw new BadRequestError('Email is already verified');
        }

        // Update user to mark email as verified
        await user.update({
            email_verified: true,
            email_verification_code: null,
            email_verification_expires: null,
        });

        // Send welcome email
        await emailService.sendWelcomeEmail(user.user_email, user.user_login);

        return {
            message: 'Email verified successfully',
            user: {
                userId: user.id,
                username: user.user_login,
                email: user.user_email,
                emailVerified: true,
            },
        };
    };

    static resendVerificationCode = async ({ email }) => {
        const user = await database.User.findOne({
            where: { user_email: email },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (user.email_verified) {
            throw new BadRequestError('Email is already verified');
        }

        // Generate new verification code
        const verificationCode = emailService.generateVerificationCode();
        const verificationExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes for testing

        await user.update({
            email_verification_code: verificationCode,
            email_verification_expires: verificationExpires,
        });

        // Send verification email
        const emailResult = await emailService.sendVerificationEmail(
            user.user_email,
            user.user_login,
            verificationCode,
        );

        if (!emailResult.success) {
            throw new BadRequestError('Failed to send verification email');
        }

        return {
            message: 'Verification code sent successfully',
            emailSent: true,
            previewUrl: emailResult.previewUrl, // For development
        };
    };

    static checkEmailVerificationStatus = async ({ email }) => {
        const user = await database.User.findOne({
            where: { user_email: email },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return {
            email: user.user_email,
            emailVerified: user.email_verified,
            hasCode: !!user.email_verification_code,
            codeExpired: user.email_verification_expires
                ? user.email_verification_expires < new Date()
                : false,
        };
    };
}

module.exports = AccessService;
