'use strict';

const getCategoryAndChildrenIds = async (categorySlug) => {
    const selectedCategory = await Category.findOne({
        where: { slug: categorySlug, status: 'active' },
    });

    if (!selectedCategory) return { selectedCategory: null, categoryIds: [] };

    async function getChildIds(parentId) {
        const children = await Category.findAll({
            where: { parent_id: parentId, status: 'active' },
            attributes: ['id'],
        });

        const ids = children.map((c) => c.id);
        for (const child of children) {
            const more = await getChildIds(child.id);
            ids.push(...more);
        }
        return ids;
    }

    const childIds = await getChildIds(selectedCategory.id);
    return {
        selectedCategory,
        categoryIds: [selectedCategory.id, ...childIds],
    };
};

module.exports = {
    getCategoryAndChildrenIds,
};
