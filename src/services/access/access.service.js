'user strict';

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { createTokenPair, verifyJWT } = require('../../auth/authUtils');
const { getInfoData, generateUserCode } = require('../../utils');
const {
    BadRequestError,
    AuthFailureError,
    ForbiddenError,
    NotFoundError,
} = require('../../core/error.response');
const { getRoleByName } = require('../../models/repo/role.repo');
const {
    createAccount,
    getAccountByUsername,
} = require('../../models/repo/account.repo');
const {
    createKeyToken,
    removeKeyTokenByUserCode,
} = require('../../models/repo/keyToken.repo');
const database = require('../../models');

class AccessService {
    static logout = async ({ userCode }) => {
        const delKeyStore = await removeKeyTokenByUserCode(userCode);
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
        const foundAccount = await database.Account.findOne({
            where: { username },
        });
        if (!foundAccount) throw new BadRequestError('Username not registered');
        // 2
        const matchPassword = await bcrypt.compare(
            password,
            foundAccount.password,
        );
        if (!matchPassword) throw new AuthFailureError('Authentication Error');

        if (foundAccount.is_block || !foundAccount.is_active)
            throw new AuthFailureError('Account has something wrong');

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
            { userCode: foundAccount.user_code, username },
            publicKey,
            privateKey,
        );
        await createKeyToken({
            userCode: foundAccount.user_code,
            refreshToken: tokens.refreshToken,
            privateKey,
            publicKey,
        });
        return {
            code: 200,
            tokens,
            user: {
                userCode: foundAccount.user_code,
                username: foundAccount.username,
            },
        };
    };

    static signUp = async ({ username, password, roleName }) => {
        // step 1: check username exist
        const existingAccount = await getAccountByUsername(username);
        if (existingAccount) {
            throw new BadRequestError('Error: Username already registered!');
        }
        // Step 2: hashing password
        const passwordHash = await bcrypt.hash(password, 10);

        let role;
        if (roleName) {
            role = await getRoleByName(roleName);
            if (!role) {
                throw new BadRequestError('Role not found');
            }
        } else {
            role = await getRoleByName(roleName);
            if (!role) {
                throw new BadRequestError('Default role not found');
            }
        }
        const newAccount = await createAccount({
            userCode: generateUserCode(),
            username,
            password: passwordHash,
            roleId: role.id,
        });

        if (newAccount) {
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
                userCode: newAccount.user_code,
                publicKey,
                privateKey,
            });

            if (!publicKeyString) {
                throw new BadRequestError('Public key string error');
            }

            const publicKeyObject = crypto.createPublicKey(publicKeyString);
            // create token pair
            const tokens = await createTokenPair(
                { userCode: newAccount.user_code, username },
                publicKeyObject,
                privateKey,
            );

            return {
                code: 201,
                user: getInfoData({
                    fields: ['user_code', 'username', 'is_active', 'is_block'],
                    object: newAccount,
                }),
                tokens: tokens,
            };
        }
        return {
            code: 201,
            metadata: null,
        };
    };

    static signUpCustomer = async ({ username, password }) => {
        // step 1: check username exist
        const existingAccount = await getAccountByUsername(username);
        if (existingAccount) {
            throw new BadRequestError('Error: Username already registered!');
        }
        // Step 2: hashing password
        const passwordHash = await bcrypt.hash(password, 10);

        const role = await getRoleByName('customer');
        if (!role) {
            throw new BadRequestError('Role not found');
        }

        const newAccount = await createAccount({
            userCode: generateUserCode(),
            username,
            password: passwordHash,
            roleId: role.id,
        });

        if (newAccount) {
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
                userCode: newAccount.user_code,
                publicKey,
                privateKey,
            });

            if (!publicKeyString) {
                throw new BadRequestError('Public key string error');
            }

            const publicKeyObject = crypto.createPublicKey(publicKeyString);
            // create token pair
            const tokens = await createTokenPair(
                { userCode: newAccount.user_code, username },
                publicKeyObject,
                privateKey,
            );

            return {
                code: 201,
                user: getInfoData({
                    fields: ['user_code', 'username', 'is_active', 'is_block'],
                    object: newAccount,
                }),
                tokens: tokens,
            };
        }
        return {
            code: 201,
            metadata: null,
        };
    };

    static handlerRefreshToken = async ({ refreshToken }) => {
        // 1 - check refresh token used in database
        const isUsed = await database.RefreshTokenUsed.findOne({
            where: { token: refreshToken },
        });
        if (isUsed) {
            throw new ForbiddenError('Refresh token has been used before.');
        }

        // 2 - find key token for this refresh token
        const keyToken = await database.KeyToken.findOne({
            where: { refreshToken },
        });

        if (!keyToken) {
            throw new NotFoundError(
                'Key token not found or invalid refresh token.',
            );
        }

        // 3 - Verify refresh token
        let decoded;
        try {
            decoded = await verifyJWT(refreshToken, keyToken.publicKey);
        } catch (err) {
            throw new ForbiddenError('Refresh token verification failed.');
        }
        const { userCode, username } = decoded;

        // 4 - Save refresh token used
        await database.RefreshTokenUsed.create({
            token: refreshToken,
            user_code: userCode,
        });

        // 5 - Generate new token pair
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

        // 6 - Create new key token
        const tokens = await createTokenPair(
            { userCode, username },
            publicKey,
            privateKey,
        );
        const newKeyToken = await createKeyToken({
            userCode,
            refreshToken: tokens.refreshToken,
            privateKey,
            publicKey,
        });

        // 7 - Save new key token to database
        if (!newKeyToken) {
            throw new BadRequestError('Failed to create new key token.');
        }
        keyToken.refreshToken = tokens.refreshToken;
        keyToken.publicKey = publicKey;
        keyToken.privateKey = privateKey;
        await keyToken.save();

        return {
            code: 200,
            tokens: tokens,
            user: { userCode, username },
        };
    };
}

module.exports = AccessService;
