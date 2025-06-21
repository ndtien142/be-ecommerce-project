const db = require('../../models');

const createRole = async ({ name, description }) => {
    return await db.Role.create({
        name,
        description,
    });
};
const getRoleById = async (id) => {
    return await db.Role.findByPk(parseInt(id));
};
const getAllRoles = async () => {
    return await db.Role.findAll();
};
const updateRole = async ({ id, name, description }) => {
    return await db.Role.update(
        {
            name,
            description,
        },
        { where: { id } },
    );
};

const getRoleByName = async (name) => {
    return db.Role.findOne({ where: { name } });
};

module.exports = {
    createRole,
    getRoleById,
    getAllRoles,
    updateRole,
    getRoleByName,
};
