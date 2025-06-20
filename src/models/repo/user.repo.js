const db = require('..');

const createAccount = async ({
    user_login,
    user_pass,
    user_nickname,
    user_email,
    user_url,
    user_registered,
    user_status = 0,
    user_date_of_birth,
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
    });
    console.log(result);
    return result;
};

const getAccountByUserCode = async (user_login) => {
    return await db.User.findByPk(user_login);
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

const getAccountByUsername = async (user_login) => {
    return db.User.findOne({ where: { user_login } });
};

module.exports = {
    createAccount,
    getAccountByUserCode,
    getAllAccount,
    updateAccount,
    deleteAccount,
    blockAccount,
    getAccountByUsername,
};
