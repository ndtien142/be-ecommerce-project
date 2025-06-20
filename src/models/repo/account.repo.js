const db = require('../../models');

const createAccount = async ({
    userCode,
    username,
    password,
    roleId,
    isActive = true,
    isBlock = false,
}) => {
    const createTimestamp = new Date();
    const updateTimestamp = new Date();
    const result = await db.Account.create({
        user_code: userCode,
        username: username,
        password: password,
        role_id: roleId,
        is_active: isActive,
        is_block: isBlock,
        create_time: createTimestamp,
        update_time: updateTimestamp,
    });
    console.log(result);
    return result;
};
const getAccountByUserCode = async (user_code) => {
    return await db.Account.findByPk(user_code);
};
const getAllAccount = async () => {
    return await db.Account.findAll();
};
const updateAccount = async ({
    userCode,
    password,
    isBlock,
    isActive,
    roleId,
}) => {
    return await db.Role.update(
        {
            roleId: roleId,
            password: password,
            is_block: isBlock,
            is_active: isActive,
        },
        { where: { user_code: userCode } },
    );
};
const deleteAccount = async (userCode) => {
    return await db.Account.update(
        {
            is_active: false,
        },
        { where: { user_code: userCode, is_active: true } },
    );
};
const blockAccount = async (userCode) => {
    return await db.Account.update(
        {
            is_block: true,
        },
        { where: { user_code: user_code, is_block: false, is_active: true } },
    );
};

const getAccountByUsername = async (username) => {
    return db.Account.findOne({ where: { username } });
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
