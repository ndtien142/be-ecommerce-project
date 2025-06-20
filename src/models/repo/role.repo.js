const db = require('../../models');

const createRole = async ({ roleName, roleDescription }) => {
    return await db.Role.create({
        role_name: roleName,
        role_description: roleDescription,
    });
};
const getRoleById = async (id) => {
    return await db.Role.findByPk(parseInt(id));
};
const getAllRoles = async () => {
    return await db.Role.findAll();
};
const updateRole = async ({ id, roleName, roleDescription }) => {
    return await db.Role.update(
        {
            role_name: roleName,
            role_description: roleDescription,
        },
        { where: { id: id } },
    );
};

const getRoleByName = async (roleName) => {
    return db.Role.findOne({ where: { role_name: roleName } });
};

module.exports = {
    createRole,
    getRoleById,
    getAllRoles,
    updateRole,
    getRoleByName,
};
