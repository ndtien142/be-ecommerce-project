'user strict';

const JWT = require('jsonwebtoken');
const { asyncHandler } = require('../helpers/asyncHandler');
const { AuthFailureError, NotFoundError } = require('../core/error.response');
const { findKeyTokenByUserId } = require('../models/repo/keyToken.repo');

const HEADER = {
    // API_KEY: "x-api-key",
    USER_CODE: 'x-user-code',
    AUTHORIZATION: 'authorization',
    REFRESH_TOKEN: 'x-rf-token',
};

const createTokenPair = async (payload, publicKey, privateKey) => {
    try {
        // access token
        const accessToken = JWT.sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: '2 days',
        });

        // refresh token
        const refreshToken = JWT.sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: '7 days',
        });

        // verify public token
        JWT.verify(accessToken, publicKey, (err, decoded) => {
            if (err) {
                console.log('error verify: ', err);
            } else {
                console.log('decode verify: ', decoded);
            }
        });

        return {
            accessToken,
            refreshToken,
        };
    } catch (err) {
        console.log('Create token failed: ', err);
    }
};

// check error there then can't go to controller to check error
const authentication = asyncHandler(async (req, res, next) => {
    /*
        1 - check userId missing
        2 - get access token
        3 - verify token
        4 - check user in database
        5 - check keyStore with this userId
        6 - OK all => return next
     */
    const userId = req.headers[HEADER.USER_CODE];
    if (!userId) throw new AuthFailureError('Invalid Request');

    // 2
    const keyStore = await findKeyTokenByUserId(userId);
    if (!keyStore) throw new NotFoundError('Invalid Request');

    // 3
    const accessToken = req.headers[HEADER.AUTHORIZATION];
    if (!accessToken) throw new AuthFailureError('Invalid Request');

    try {
        const decodedUser = JWT.verify(accessToken, keyStore.publicKey);
        if (userId !== decodedUser.userId)
            throw new AuthFailureError('Invalid userId');
        req.keyStore = keyStore;
        return next();
    } catch (err) {
        throw err;
    }
});

const verifyJWT = async (token, keySecret) => {
    return await JWT.verify(token, keySecret);
};

const authenticationV2 = asyncHandler(async (req, res, next) => {
    /*
        1 - check userId missing
        2 - get access token
        3 - verify token
        4 - check user in database
        5 - check keyStore with this userId
        6 - OK all => return next
     */
    const userId = req.headers[HEADER.USER_CODE];
    if (!userId) throw new AuthFailureError('Invalid Request');

    // 2
    const keyStore = await findKeyTokenByUserId(userId);
    if (!keyStore) throw new NotFoundError('Invalid Request');

    // 3
    if (req.headers[HEADER.REFRESH_TOKEN]) {
        try {
            const refreshToken = req.headers[HEADER.REFRESH_TOKEN];
            const decodedUser = await verifyJWT(
                refreshToken,
                keyStore.privateKey,
            );
            if (userId !== decodedUser.userId)
                throw new AuthFailureError('Invalid userId');

            req.keyStore = keyStore;
            req.user = decodedUser;
            req.refreshToken = refreshToken;

            return next();
        } catch (err) {
            throw err;
        }
    }

    let accessToken = req.headers[HEADER.AUTHORIZATION];

    if (accessToken.startsWith('Bearer ')) {
        accessToken = accessToken.slice(7, accessToken.length);
    }

    if (!accessToken) throw new AuthFailureError('Invalid Request');

    try {
        const decodedUser = JWT.verify(accessToken, keyStore.publicKey);
        if (userId !== decodedUser.userId)
            throw new AuthFailureError('Invalid userId');
        req.keyStore = keyStore;
        // assign user id to request
        req.user = decodedUser;
        return next();
    } catch (err) {
        throw err;
    }
});

module.exports = {
    createTokenPair,
    authentication,
    verifyJWT,
    authenticationV2,
};
