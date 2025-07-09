const db = require('..');

const createAccount = async ({
    username,
    password,
    nickname,
    email,
    roleId,
    dateOfBirth = null,
    avatarUrl,
    registered = new Date(),
    status = 'normal',
    emailVerificationCode = null,
    emailVerificationExpires = null,
}) => {
    const result = await db.User.create({
        user_login: username,
        user_pass: password,
        user_nickname: nickname,
        user_email: email,
        user_url: avatarUrl,
        user_registered: registered,
        user_status: status,
        user_date_of_birth: dateOfBirth,
        role_id: roleId,
        email_verification_code: emailVerificationCode,
        email_verification_expires: emailVerificationExpires,
    });
    console.log(result);
    return result;
};

const getAccountByUserId = async (userId) => {
    return await db.User.findByPk(userId);
};

const getAllAccount = async () => {
    return await db.User.findAll();
};

const updateAccount = async ({
    user_login,
    user_pass,
    user_nickname,
    user_email,
    user_url,
    user_status,
    user_date_of_birth,
}) => {
    return await db.User.update(
        {
            user_pass,
            user_nickname,
            user_email,
            user_url,
            user_status,
            user_date_of_birth,
        },
        { where: { user_login } },
    );
};

const deleteAccount = async (user_login) => {
    return await db.User.update(
        {
            user_status: 3, // 3: deleted
        },
        { where: { user_login, user_status: { [db.Sequelize.Op.ne]: 3 } } },
    );
};

const blockAccount = async (user_login) => {
    return await db.User.update(
        {
            user_status: 2, // 2: blocked
        },
        { where: { user_login, user_status: { [db.Sequelize.Op.ne]: 2 } } },
    );
};

const getAccountByUserLogin = async (user_login) => {
    return db.User.findOne({ where: { user_login } });
};

const getAccountByEmail = async (user_email) => {
    return db.User.findOne({ where: { user_email } });
};

const updateEmailVerification = async (
    user_email,
    email_verified = true,
    email_verification_code = null,
    email_verification_expires = null,
) => {
    return db.User.update(
        {
            email_verified,
            email_verification_code,
            email_verification_expires,
        },
        { where: { user_email } },
    );
};

const findUnverifiedExpiredAccounts = async (expirationDate) => {
    return db.User.findAll({
        where: {
            email_verified: false,
            create_time: {
                [db.Sequelize.Op.lt]: expirationDate,
            },
            user_status: {
                [db.Sequelize.Op.not]: 'deleted',
            },
        },
        include: [
            {
                model: db.Role,
                as: 'role',
                where: {
                    name: {
                        [db.Sequelize.Op.not]: 'admin', // Exclude admin users
                    },
                },
            },
        ],
        attributes: ['id', 'user_login', 'user_email', 'create_time'],
    });
};

const checkUserHasOrdersOrCart = async (userId) => {
    // Check if user has any orders
    const orderCount = await db.Order.count({
        where: { user_id: userId },
    });

    // Check if user has any cart items
    const cartCount = await db.Cart.count({
        where: { user_id: userId },
    });

    return orderCount > 0 || cartCount > 0;
};

const deleteAccountWithRelations = async (userId) => {
    try {
        // Check if user has orders or cart
        const hasOrdersOrCart = await checkUserHasOrdersOrCart(userId);

        if (hasOrdersOrCart) {
            // Soft delete for users with orders/cart to preserve referential integrity
            const result = await db.User.update(
                {
                    user_status: 'deleted',
                    email_verification_code: null,
                    email_verification_expires: null,
                    user_email: `deleted_${userId}_${Date.now()}@deleted.com`, // Avoid unique constraint issues
                },
                {
                    where: { id: userId },
                },
            );
            console.log(`  🔒 Soft deleted user ${userId} (has orders/cart)`);
            return result[0] > 0 ? 1 : 0;
        } else {
            // Hard delete for users without orders/cart
            const transaction = await db.sequelize.transaction();

            try {
                // Delete related records in the correct order to avoid foreign key constraint errors

                // 1. Delete refresh tokens used (references KeyToken)
                await db.RefreshTokenUsed.destroy({
                    where: { user_id: userId },
                    transaction,
                });

                // 2. Delete key tokens (references User)
                await db.KeyToken.destroy({
                    where: { user_id: userId },
                    transaction,
                });

                // 3. Delete user profile (references User)
                await db.Profile.destroy({
                    where: { user_id: userId },
                    transaction,
                });

                // 4. Delete user addresses (references User)
                await db.UserAddress.destroy({
                    where: { user_id: userId },
                    transaction,
                });

                // 5. Delete customer payment options (references User)
                await db.CustomerPaymentOption.destroy({
                    where: { user_id: userId },
                    transaction,
                });

                // 6. Delete import receipts (references User) - only if they exist
                const importReceiptCount = await db.ImportReceipt.count({
                    where: { user_id: userId },
                    transaction,
                });
                if (importReceiptCount > 0) {
                    await db.ImportReceipt.destroy({
                        where: { user_id: userId },
                        transaction,
                    });
                }

                // 7. Finally delete the user
                await db.User.destroy({
                    where: { id: userId },
                    transaction,
                });

                await transaction.commit();
                console.log(
                    `  🗑️ Hard deleted user ${userId} and all related records (no orders/cart)`,
                );
                return 1;
            } catch (error) {
                await transaction.rollback();
                console.error(
                    `  ❌ Error during hard delete transaction for user ${userId}:`,
                    error,
                );
                throw error;
            }
        }
    } catch (error) {
        console.error(`Error deleting user ${userId}:`, error);
        throw error;
    }
};

module.exports = {
    createAccount,
    getAccountByUserId,
    getAllAccount,
    updateAccount,
    deleteAccount,
    blockAccount,
    getAccountByUserLogin,
    getAccountByEmail,
    updateEmailVerification,
    findUnverifiedExpiredAccounts,
    deleteAccountWithRelations,
    checkUserHasOrdersOrCart,
};
