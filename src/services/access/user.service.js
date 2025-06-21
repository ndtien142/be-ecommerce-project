'use strict';

const bcrypt = require('bcrypt');
const database = require('../../models');
const { generateuserId } = require('../../utils');
const { BadRequestError } = require('../../core/error.response');

class UserService {
    static async createUser({
        username,
        password,
        avatarUrl,
        roleId,
        firstName,
        lastName,
        phoneNumber,
        address,
    }) {
        const transaction = await database.Account.sequelize.transaction();

        try {
            const role = await database.Role.findByPk(roleId);

            const existingAccount = await database.Account.findOne({
                where: { username },
            });
            if (existingAccount) {
                throw new BadRequestError(
                    'Error: Username already registered!',
                );
            }
            // Step 2: hashing password
            const passwordHash = await bcrypt.hash(password, 10);

            const newAccount = await database.Account.create(
                {
                    user_code: generateuserId(),
                    username,
                    password: passwordHash,
                    fk_role_id: role.id,
                    is_active: true,
                    is_block: false,
                },
                { transaction },
            );

            const profile = await database.Profile.create(
                {
                    fk_user_code: newAccount.user_code,
                    first_name: firstName,
                    last_name: lastName,
                    avatar_url: avatarUrl,
                    phone_number: phoneNumber,
                    address,
                },
                { transaction },
            );

            await transaction.commit();

            return {
                userId: account.user_code,
                username: account.username,
                roleId: account.fk_role_id,
                isActive: account.is_active,
                isBlock: account.is_block,
                profiles: [
                    {
                        id: profile.id,
                        firstName: profile.first_name,
                        lastName: profile.last_name,
                        avatarUrl: profile.avatar_url,
                        phoneNumber: profile.phone_number,
                        address: profile.address,
                    },
                ],
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async updateUser({
        userId,
        username,
        avatarUrl,
        roleId,
        isActive,
        isBlock,
        firstName,
        lastName,
        phoneNumber,
        address,
    }) {
        const transaction = await database.Account.sequelize.transaction();
        try {
            const account = await database.Account.findByPk(userId);
            if (!account) {
                throw new BadRequestError('User not found');
            }

            account.username = username;
            account.fk_role_id = roleId;
            account.is_active = isActive;
            account.is_block = isBlock;
            account.avatar_url = avatarUrl;
            await account.save({ transaction });

            const profile = await database.Profile.findOne({
                where: { fk_user_code: userId },
            });
            if (!profile) {
                throw new Error('Profile not found');
            }

            profile.first_name = firstName;
            profile.last_name = lastName;
            profile.phone_number = phoneNumber;
            profile.address = address;
            await profile.save({ transaction });

            await transaction.commit();

            return { account, profile };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async markUserAsDeleted(userId) {
        const account = await database.Account.findByPk(userId);
        if (!account) {
            throw new Error('User not found');
        }

        account.is_delete = true;
        await account.save();
        return {
            userId,
            isDeleted: account.is_delete,
        };
    }

    static async markUserAsBlocked(userId, isBlock) {
        const account = await database.Account.findByPk(userId);
        if (!account) {
            throw new Error('User not found');
        }

        account.is_block = isBlock;
        await account.save();
        return {
            userId,
            isBlock: account.is_block,
        };
    }

    static async getUser(userId) {
        const account = await database.Account.findByPk(userId, {
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

        return {
            userId: account.user_code,
            username: account.username,
            isActive: account.is_active,
            isBlock: account.is_block,
            role: {
                id: account.role.id,
                name: account.role.role_name,
            },
            profiles:
                account.profile.map((item) => {
                    return {
                        id: item.id,
                        firstName: item.first_name,
                        lastName: item.last_name,
                        phoneNumber: item.phone_number,
                        address: item.address,
                        create_time: item.create_time,
                        avatarUrl: item.avatar_url,
                    };
                }) || [],
        };
    }

    static async getUsers({
        page = 1,
        limit = 20,
        isActive = true,
        isBlock = false,
    }) {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { rows: accounts, count } =
            await database.Account.findAndCountAll({
                offset,
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
                order: [['create_time', 'DESC']],
            });

        return {
            items: accounts.map((account) => {
                return {
                    userId: account.user_code,
                    username: account.username,
                    isActive: account.is_active,
                    isBlock: account.is_block,
                    role: {
                        id: account.role.id,
                        name: account.role.role_name,
                    },
                    profiles:
                        account.profile.map((item) => {
                            return {
                                id: item.id,
                                firstName: item.first_name,
                                lastName: item.last_name,
                                phoneNumber: item.phone_number,
                                avatarUrl: item.avatar_url,
                                address: item.address,
                                create_time: item.create_time,
                            };
                        }) || [],
                };
            }),
            meta: {
                currentPage: parseInt(page),
                itemPerPage: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit)),
                totalItems: count,
            },
        };
    }
}

module.exports = UserService;
