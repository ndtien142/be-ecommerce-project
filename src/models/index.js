'use strict';

const Sequelize = require('sequelize');
const {
    db: { host, port, name, user, password, dialect },
} = require('../configs/config.mongodb');

const sequelize = new Sequelize(name, user, password, {
    host: host,
    port: port,
    dialect: dialect,
});

sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch((error) => {
        console.error('Unable to connect to the database: ', error);
    });

// Initialize the db object
const database = {};

// Import models
const Account = require('./user/account')(sequelize);
const Role = require('./user/role')(sequelize);
const KeyToken = require('./user/keyToken')(sequelize);
const RefreshTokenUsed = require('./user/refreshTokenUsed')(sequelize);
const Permission = require('./user/permission')(sequelize);
const Profile = require('./user/profile')(sequelize);

const Notification = require('./notification/notification')(sequelize);

database.Account = Account;
database.Role = Role;
database.KeyToken = KeyToken;
database.RefreshTokenUsed = RefreshTokenUsed;
database.Permission = Permission;
database.Profile = Profile;

// Notification
database.Notification = Notification;

// Add model to db object

// Define associations
database.Account.belongsTo(database.Role, {
    foreignKey: 'role_id',
    as: 'role',
});
database.KeyToken.belongsTo(database.Account, {
    foreignKey: 'user_code',
    as: 'account',
});
database.RefreshTokenUsed.belongsTo(database.KeyToken, {
    foreignKey: 'user_code',
    targetKey: 'user_code',
    as: 'key_token',
});
database.Permission.belongsToMany(database.Role, {
    through: 'tb_role_permission',
    foreignKey: 'permission_id',
    as: 'roles',
});
database.Role.belongsToMany(database.Permission, {
    through: 'tb_role_permission',
    foreignKey: 'role_id',
    as: 'permissions',
});

database.Profile.belongsTo(database.Account, {
    foreignKey: 'user_code',
    as: 'account',
});

database.Account.hasMany(database.Profile, {
    foreignKey: 'user_code',
    as: 'profile',
});

// Sync the models with the database
sequelize
    .sync()
    .then(() => {
        console.log('Database & tables created!');
    })
    .catch((error) => {
        console.error('Error creating database & tables: ', error);
    });

database.Sequelize = Sequelize;
database.sequelize = sequelize;

module.exports = database;
