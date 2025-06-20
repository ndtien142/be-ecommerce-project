'use strict';

const { BadRequestError, NotFoundError } = require('../../core/error.response');
const database = require('../../models');

// Helper to convert snake_case keys to camelCase recursively
function toCamel(obj) {
    if (Array.isArray(obj)) {
        return obj.map((v) => toCamel(v));
    } else if (obj && typeof obj === 'object') {
        return Object.entries(obj).reduce((acc, [key, value]) => {
            const camelKey = key.replace(/_([a-z])/g, (g) =>
                g[1].toUpperCase(),
            );
            acc[camelKey] = toCamel(value);
            return acc;
        }, {});
    }
    return obj;
}

class CategoriesService {
    static async createCategory({
        name,
        description,
        slug,
        parentId,
        status = 'active',
    }) {
        if (!name || typeof name !== 'string') {
            throw new BadRequestError(
                'Category name is required and must be a string',
            );
        }
        if (!slug || typeof slug !== 'string') {
            throw new BadRequestError(
                'Category slug is required and must be a string',
            );
        }
        const existing = await database.Category.findOne({ where: { slug } });
        if (existing) throw new BadRequestError('Category slug already exists');
        let parent_id = parentId;
        if (parentId !== undefined && parentId !== null) {
            const parent = await database.Category.findByPk(parentId);
            if (!parent) throw new BadRequestError('Parent category not found');
        }
        const category = await database.Category.create({
            name,
            description,
            slug,
            parent_id,
            status,
        });
        return toCamel(category.toJSON());
    }

    static async getCategoryById(id) {
        const category = await database.Category.findByPk(id, {
            include: [
                { model: database.Category, as: 'parent' },
                { model: database.Category, as: 'children' },
                { model: database.Product, as: 'products' },
            ],
        });
        if (!category) throw new NotFoundError('Category not found');
        return toCamel(category.toJSON());
    }

    static async getAllCategories({ page = 1, limit = 20 } = {}) {
        limit = Number(limit) || 20;
        page = Number(page) || 1;
        const offset = (page - 1) * limit;

        const categories = await database.Category.findAndCountAll({
            limit,
            offset,
            include: [
                { model: database.Category, as: 'parent' },
                { model: database.Category, as: 'children' },
            ],
        });

        const totalItems = categories.count;
        const totalPages = Math.ceil(totalItems / limit);

        return {
            items: categories.rows.map((c) => toCamel(c.toJSON())),
            meta: {
                currentPage: page,
                itemPerPage: limit,
                totalItems,
                totalPages,
            },
        };
    }

    static async updateCategory(id, updateData) {
        const mappedData = {};
        if (updateData.name !== undefined) mappedData.name = updateData.name;
        if (updateData.description !== undefined)
            mappedData.description = updateData.description;
        if (updateData.slug !== undefined) mappedData.slug = updateData.slug;
        if (updateData.parentId !== undefined)
            mappedData.parent_id = updateData.parentId;
        if (updateData.status !== undefined)
            mappedData.status = updateData.status;

        const [affectedRows] = await database.Category.update(mappedData, {
            where: { id },
        });
        if (!affectedRows)
            throw new NotFoundError('Category not found or not updated');
        return await CategoriesService.getCategoryById(id);
    }

    static async deleteCategory(id) {
        const [affectedRows] = await database.Category.update(
            { status: 'inactive' },
            {
                where: {
                    id,
                    status: { [database.Sequelize.Op.ne]: 'inactive' },
                },
            },
        );
        if (!affectedRows)
            throw new NotFoundError('Category not found or already deleted');
        return {
            message: 'Category deleted (status set to inactive) successfully',
        };
    }
}

module.exports = CategoriesService;
