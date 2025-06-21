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

module.exports = {
    createAccount,
    getAccountByUserId,
    getAllAccount,
    updateAccount,
    deleteAccount,
    blockAccount,
    getAccountByUserLogin,
};
