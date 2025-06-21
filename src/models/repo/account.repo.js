const db = require('..');

const createAccount = async ({
    user_login,
    user_pass,
    user_nickname,
    user_email,
    user_url,
    user_registered,
    user_status = 'normal',
    user_date_of_birth,
    role_id,
}) => {
    const result = await db.User.create({
        user_login,
        user_pass,
        user_nickname,
        user_email,
        user_url,
        user_registered,
        user_status,
        user_date_of_birth,
        role_id,
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
    role_id,
}) => {
    return await db.User.update(
        {
            user_pass,
            user_nickname,
            user_email,
            user_url,
            user_status,
            user_date_of_birth,
            role_id,
        },
        { where: { user_login } },
    );
};

const deleteAccount = async (user_login) => {
    return await db.User.update(
        {
            user_status: 'deleted',
        },
        {
            where: {
                user_login,
                user_status: { [db.Sequelize.Op.ne]: 'deleted' },
            },
        },
    );
};

const blockAccount = async (user_login) => {
    return await db.User.update(
        {
            user_status: 'blocked',
        },
        {
            where: {
                user_login,
                user_status: { [db.Sequelize.Op.ne]: 'blocked' },
            },
        },
    );
};

const getAccountByUserLogin = async (user_login) => {
    return db.User.findOne({ where: { user_login } });
};

module.exports = {
    createAccount,
    getAccountByUserId,
    getAllAccount,
    updateAccount,
    deleteAccount,
    blockAccount,
    getAccountByUserLogin,
};
