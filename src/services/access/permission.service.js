'use strict';

const { BadRequestError } = require('../../core/error.response');
const database = require('../../models');

class PermissionService {
    static async createPermission({
        permissionName,
        permissionDescription,
        slug,
    }) {
        // Check if permission already exists
        const existing = await database.Permission.findOne({
            where: { permission_name: permissionName },
        });
        if (existing) {
            throw new BadRequestError('Permission name already exists');
        }

        // Check if slug already exists
        if (slug) {
            const existingSlug = await database.Permission.findOne({
                where: { slug },
            });
            if (existingSlug) {
                throw new BadRequestError('Permission slug already exists');
            }
        }

        const permission = await database.Permission.create({
            permission_name: permissionName,
            permission_description: permissionDescription,
            slug: slug,
        });

        return {
            code: 200,
            message: 'Permission created successfully',
            data: {
                id: permission.id,
                permissionName: permission.permission_name,
                permissionDescription: permission.permission_description,
                slug: permission.slug,
            },
        };
    }

    static async updatePermission({
        id,
        permissionName,
        permissionDescription,
        slug,
    }) {
        const permission = await database.Permission.findByPk(id);
        if (!permission) {
            throw new BadRequestError('Permission not found');
        }

        if (permissionName) permission.permission_name = permissionName;
        if (permissionDescription !== undefined)
            permission.permission_description = permissionDescription;
        if (slug !== undefined) {
            // Check if slug already exists for another permission
            const existingSlug = await database.Permission.findOne({
                where: { slug, id: { [database.Sequelize.Op.ne]: id } },
            });
            if (existingSlug) {
                throw new BadRequestError('Permission slug already exists');
            }
            permission.slug = slug;
        }

        await permission.save();

        return {
            code: 200,
            message: 'Permission updated successfully',
            data: {
                id: permission.id,
                permissionName: permission.permission_name,
                permissionDescription: permission.permission_description,
                slug: permission.slug,
            },
        };
    }

    static async deletePermission(id) {
        const permission = await database.Permission.findByPk(id);
        if (!permission) {
            throw new BadRequestError('Permission not found');
        }

        await permission.destroy();

        return {
            code: 200,
            message: 'Permission deleted successfully',
        };
    }

    static async getAllPermissions({ page = 1, limit = 20 }) {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const result = await database.Permission.findAndCountAll({
            limit: parseInt(limit),
            offset,
            order: [['id', 'ASC']],
        });

        return {
            code: 200,
            message: 'Get all permissions successfully',
            metadata: result.rows.map((p) => ({
                id: p.id,
                name: p.permission_name,
                description: p.permission_description,
                slug: p.slug,
            })),
            meta: {
                currentPage: parseInt(page),
                itemPerPage: parseInt(limit),
                totalItems: result.count,
                totalPages: Math.ceil(result.count / limit),
            },
        };
    }

    static async getPermissionById(id) {
        const permission = await database.Permission.findByPk(id);
        if (!permission) {
            throw new BadRequestError('Permission not found');
        }

        return {
            code: 200,
            message: 'Get permission by ID successfully',
            metadata: {
                id: permission.id,
                name: permission.permission_name,
                description: permission.permission_description,
                slug: permission.slug,
            },
        };
    }
}

module.exports = PermissionService;
