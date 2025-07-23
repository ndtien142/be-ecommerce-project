'use strict';

const { BadRequestError, NotFoundError } = require('../../core/error.response');
const database = require('../../models');
const { toCamel } = require('../../utils/common.utils');

class CategoriesService {
    static async createCategory({
        name,
        description,
        slug,
        parentId,
        status = 'active',
        sortOrder = 0,
        imageUrl = null,
    }) {
        if (!name || typeof name !== 'string') {
            throw new BadRequestError(
                'Tên danh mục là bắt buộc và phải là chuỗi',
            );
        }
        if (!slug || typeof slug !== 'string') {
            throw new BadRequestError(
                'Slug danh mục là bắt buộc và phải là chuỗi',
            );
        }
        const existing = await database.Category.findOne({ where: { slug } });
        if (existing) throw new BadRequestError('Slug danh mục đã tồn tại');
        let parent_id = parentId;
        if (parentId !== undefined && parentId !== null && parentId !== 0) {
            const parent = await database.Category.findByPk(parentId);
            if (!parent)
                throw new BadRequestError('Không tìm thấy danh mục cha');
        }
        const category = await database.Category.create({
            name,
            description,
            slug,
            parent_id: !parentId ? null : parentId,
            status,
            sort_order: sortOrder,
            image_url: imageUrl,
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
        if (!category) throw new NotFoundError('Không tìm thấy danh mục');
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
        if (updateData.parentId === 0) {
            mappedData.parent_id = null;
        }
        if (updateData.status !== undefined)
            mappedData.status = updateData.status;
        if (updateData.sortOrder !== undefined)
            mappedData.sort_order = updateData.sortOrder;
        if (updateData.imageUrl !== undefined)
            mappedData.image_url = updateData.imageUrl;

        const [affectedRows] = await database.Category.update(mappedData, {
            where: { id },
        });
        if (!affectedRows)
            throw new NotFoundError(
                'Không tìm thấy danh mục hoặc không được cập nhật',
            );
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
            throw new NotFoundError('Không tìm thấy danh mục hoặc đã bị xóa');
        return {
            message: 'Category deleted (status set to inactive) successfully',
        };
    }

    /**
     * Update a category's parent and reorder siblings.
     * @param {number} categoryId - The category to move.
     * @param {number|null} newParentId - The new parent category ID (null for root).
     * @param {number[]} orderedSiblingIds - Array of sibling category IDs in the desired order (including the moved category).
     */
    static async updateCategoryParentAndOrder(
        categoryId,
        newParentId,
        orderedSiblingIds,
    ) {
        // Update the parent_id of the category
        const [affectedRows] = await database.Category.update(
            { parent_id: newParentId },
            { where: { id: categoryId } },
        );
        if (!affectedRows) throw new NotFoundError('Không tìm thấy danh mục');

        // Reorder siblings (including the moved category)
        if (Array.isArray(orderedSiblingIds) && orderedSiblingIds.length > 0) {
            const updatePromises = orderedSiblingIds.map((id, idx) =>
                database.Category.update(
                    { sort_order: idx },
                    { where: { id, parent_id: newParentId } },
                ),
            );
            await Promise.all(updatePromises);
        }

        return await CategoriesService.getCategoryById(categoryId);
    }

    /**
     * Get all categories as a tree structure.
     * @returns {Promise<Array>} Array of root categories with nested children.
     */
    static async getCategoryTree() {
        const categories = await database.Category.findAll({
            order: [['sort_order', 'ASC']],
            where: {
                status: 'active',
            },
            raw: true,
        });

        // Convert snake_case to camelCase for all categories
        const items = categories.map(toCamel);

        // Build a map for quick lookup
        const map = {};
        items.forEach((cat) => {
            cat.children = [];
            map[cat.id] = cat;
        });

        const roots = [];
        items.forEach((cat) => {
            if (cat.parentId && map[cat.parentId]) {
                map[cat.parentId].children.push(cat);
            } else {
                roots.push(cat);
            }
        });
        return roots;
    }

    static async reorderFullCategoryTree(treeData) {
        if (!Array.isArray(treeData)) {
            throw new BadRequestError('Cấu trúc cây không hợp lệ');
        }

        const updates = [];

        const walk = (nodes, parentId = null) => {
            nodes.forEach((node, index) => {
                updates.push({
                    id: node.id,
                    parent_id: parentId,
                    sort_order: index,
                });

                if (Array.isArray(node.children) && node.children.length > 0) {
                    walk(node.children, node.id);
                }
            });
        };

        walk(treeData);

        // Use transaction for atomic updates
        const sequelize = database.sequelize || database.Sequelize;
        const transaction = await sequelize.transaction();

        try {
            const updatePromises = updates.map((item) =>
                database.Category.update(
                    {
                        parent_id: item.parent_id,
                        sort_order: item.sort_order,
                    },
                    {
                        where: { id: item.id },
                        transaction,
                    },
                ),
            );

            await Promise.all(updatePromises);

            await transaction.commit();

            return { message: 'Category tree reordered successfully' };
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }
}

module.exports = CategoriesService;
