'use strict';

const bcrypt = require('bcrypt');
const database = require('../../models');
const { BadRequestError } = require('../../core/error.response');
const { toCamel } = require('../../utils/common.utils');

class UserService {
    static async createUser({
        username,
        password,
        email,
        avatarUrl,
        roleId,
        firstName,
        lastName,
        phoneNumber,
        address,
    }) {
        const transaction = await database.User.sequelize.transaction();

        try {
            const role = await database.Role.findByPk(roleId);
            if (!role) {
                throw new BadRequestError('Role không tồn tại!');
            }

            const existingAccount = await database.User.findOne({
                where: {
                    [database.Sequelize.Op.or]: [
                        { user_login: username },
                        { user_email: email },
                    ],
                },
            });
            if (existingAccount) {
                throw new BadRequestError(
                    'Lỗi: Tên đăng nhập hoặc email đã được đăng ký!',
                );
            }
            // Step 2: hashing password
            const passwordHash = await bcrypt.hash(password, 10);

            const newAccount = await database.User.create(
                {
                    user_login: username,
                    user_pass: passwordHash,
                    user_email: email,
                    role_id: role.id,
                    user_registered: new Date(),
                    user_status: 'normal',
                },
                { transaction },
            );

            const profile = await database.Profile.create(
                {
                    user_id: newAccount.id,
                    first_name: firstName,
                    last_name: lastName,
                    avatar_url: avatarUrl,
                    phone_number: phoneNumber,
                    address,
                },
                { transaction },
            );

            await transaction.commit();

            return toCamel({
                userId: newAccount.id,
                username: newAccount.user_login,
                email: newAccount.user_email,
                roleId: newAccount.role_id,
                userStatus: newAccount.user_status,
                profile: {
                    id: profile.id,
                    firstName: profile.first_name,
                    lastName: profile.last_name,
                    avatarUrl: profile.avatar_url,
                    phoneNumber: profile.phone_number,
                    address: profile.address,
                },
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async updateUser({
        userId,
        username,
        email,
        avatarUrl,
        roleId,
        userStatus,
        firstName,
        lastName,
        phoneNumber,
        address,
    }) {
        const transaction = await database.User.sequelize.transaction();
        try {
            const account = await database.User.findByPk(userId);
            if (!account) {
                throw new BadRequestError('Không tìm thấy người dùng');
            }

            if (username) account.user_login = username;
            if (email) account.user_email = email;
            if (roleId) account.role_id = roleId;
            if (userStatus) account.user_status = userStatus;
            await account.save({ transaction });

            const profile = await database.Profile.findOne({
                where: { user_id: userId },
            });
            if (!profile) {
                throw new Error('Không tìm thấy hồ sơ');
            }

            if (firstName) profile.first_name = firstName;
            if (lastName) profile.last_name = lastName;
            if (phoneNumber) profile.phone_number = phoneNumber;
            if (address) profile.address = address;
            if (avatarUrl) profile.avatar_url = avatarUrl;
            await profile.save({ transaction });

            await transaction.commit();

            return toCamel({
                userId: account.id,
                username: account.user_login,
                email: account.user_email,
                roleId: account.role_id,
                userStatus: account.user_status,
                profile: {
                    id: profile.id,
                    firstName: profile.first_name,
                    lastName: profile.last_name,
                    phoneNumber: profile.phone_number,
                    address: profile.address,
                    avatarUrl: profile.avatar_url,
                },
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async markUserAsDeleted(userId) {
        const account = await database.User.findByPk(userId);
        if (!account) {
            throw new Error('Không tìm thấy người dùng');
        }

        account.user_status = 'deleted';
        await account.save();
        return toCamel({
            userId,
            userStatus: account.user_status,
        });
    }

    static async markUserAsBlocked(userId, isBlock) {
        const account = await database.User.findByPk(userId);
        if (!account) {
            throw new Error('Không tìm thấy người dùng');
        }

        account.user_status = isBlock ? 'blocked' : 'normal';
        await account.save();
        return toCamel({
            userId,
            userStatus: account.user_status,
            isBlocked: isBlock,
        });
    }

    static async getUser(userId) {
        const account = await database.User.findByPk(userId, {
            include: [
                {
                    model: database.Profile,
                    as: 'profile',
                },
                {
                    model: database.Role,
                    as: 'role',
                },
            ],
        });

        if (!account) {
            throw new Error('User not found');
        }

        return toCamel({
            userId: account.id,
            username: account.user_login,
            email: account.user_email,
            userStatus: account.user_status,
            emailVerified: account.email_verified,
            userRegistered: account.user_registered,
            role: {
                id: account.role.id,
                name: account.role.role_name,
            },
            profile: account.profile
                ? {
                      id: account.profile.id,
                      firstName: account.profile.first_name,
                      lastName: account.profile.last_name,
                      phoneNumber: account.profile.phone_number,
                      address: account.profile.address,
                      avatarUrl: account.profile.avatar_url,
                      createTime: account.profile.create_time,
                  }
                : null,
        });
    }

    static async getUsers({
        page = 1,
        limit = 20,
        roleName = '',
        search = '',
        status = 'normal',
    }) {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const where = {
            user_status: status,
        };
        if (roleName) {
            where['$role.name$'] = roleName;
        }
        if (search) {
            where[database.Sequelize.Op.or] = [
                {
                    user_login: {
                        [database.Sequelize.Op.like]: `%${search}%`,
                    },
                },
                {
                    user_email: {
                        [database.Sequelize.Op.like]: `%${search}%`,
                    },
                },
            ];
        }

        const { rows: accounts, count } = await database.User.findAndCountAll({
            offset,
            where,
            limit: parseInt(limit),
            include: [
                {
                    model: database.Profile,
                    as: 'profile',
                },
                {
                    model: database.Role,
                    as: 'role',
                },
            ],
            order: [['user_registered', 'DESC']],
        });

        return toCamel({
            items: accounts.map((account) => {
                return {
                    userId: account.id,
                    username: account.user_login,
                    email: account.user_email,
                    userStatus: account.user_status,
                    emailVerified: account.email_verified,
                    userRegistered: account.user_registered,
                    role: {
                        id: account.role.id,
                        name: account.role.role_name,
                    },
                    profile: account?.profile
                        ? {
                              id: account.profile.id,
                              firstName: account.profile.first_name,
                              lastName: account.profile.last_name,
                              phoneNumber: account.profile.phone_number,
                              address: account.profile.address,
                              avatarUrl: account.profile.avatar_url,
                              createTime: account.profile.create_time,
                          }
                        : null,
                };
            }),
            meta: {
                currentPage: parseInt(page),
                itemPerPage: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit)),
                totalItems: count,
            },
        });
    }

    static async createAdmin(userData) {
        // Tìm role admin
        const adminRole = await database.Role.findOne({
            where: { role_name: 'admin' },
        });

        if (!adminRole) {
            throw new BadRequestError(
                'Role admin không tồn tại trong hệ thống!',
            );
        }

        return this.createUser({
            ...userData,
            roleId: adminRole.id,
        });
    }
}

module.exports = UserService;
