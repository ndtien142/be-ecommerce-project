'use strict';

const dev = {
    app: {
        port: process.env.PORT || 3055,
    },
    db: {
        host: process.env.DEV_DB_HOST || 'localhost',
        port: process.env.DEV_DB_PORT || 3306, // đổi thành 3306
        name: process.env.DEV_DB_NAME || 'universityDev',
        user: process.env.DEV_USER_NAME || 'root',
        password: process.env.DEV_PASSWORD || 'tien1234',
        dialect: process.env.DEV_DIALECT || 'mysql',
    },
};

const pro = {
    app: {
        port: process.env.PORT || 3055,
    },
    db: {
        host: process.env.PRO_DB_HOST || 'localhost',
        port: process.env.PRO_DB_PORT || 27017,
        name: process.env.PRO_DB_NAME || 'universityPro',
        user: process.env.PRO_USER_NAME || 'root',
        password: process.env.PRO_PASSWORD || 'tien1234',
        dialect: process.env.PRO_DIALECT || 'mysql',
    },
};

const config = { dev, pro };
const env = process.env.NODE_ENV || 'dev';
module.exports = config[env];
