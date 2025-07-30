'use strict';

const database = require('../../models/index');
const Sequelize = require('sequelize');
const { getCategoryAndChildrenIds } = require('../categories/categories.repo');

const getProductById = async (id) => {
    return await database.Product.findByPk(id, {
        include: [
            { model: database.Brand, as: 'brand' },
            { model: database.ProductImage, as: 'images' },
            { model: database.Category, as: 'categories' },
        ],
    });
};

const getAllProductsRepo = async (filters) => {
    const {
        page,
        limit,
        status,
        brandId,
        minPrice,
        maxPrice,
        flag,
        search,
        sortBy,
        sortOrder,
        categorySlug,
    } = filters;

    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (brandId) where.brand_id = brandId;
    if (minPrice) where.price = { [Sequelize.Op.gte]: minPrice };
    if (maxPrice) {
        where.price = where.price || {};
        where.price[Sequelize.Op.lte] = maxPrice;
    }
    if (flag) where.flag = flag;
    if (search) {
        where[Sequelize.Op.or] = [
            { name: { [Sequelize.Op.like]: `%${search}%` } },
            { description: { [Sequelize.Op.like]: `%${search}%` } },
        ];
    }

    const include = [
        { model: database.Brand, as: 'brand' },
        { model: database.ProductImage, as: 'images' },
        { model: database.Category, as: 'categories' },
    ];

    let selectedCategory = null;
    let includedCategoryIds = [];

    if (categorySlug) {
        const { selectedCategory: cat, categoryIds } =
            await getCategoryAndChildrenIds(categorySlug);
        if (!cat) throw new Error('Category not found');
        selectedCategory = cat;
        includedCategoryIds = categoryIds;

        include.forEach((inc, idx) => {
            if (inc.as === 'categories') {
                include[idx] = {
                    ...inc,
                    where: { id: { [Sequelize.Op.in]: includedCategoryIds } },
                    through: { attributes: [] },
                };
            }
        });
    }

    const baseOptions = {
        where,
        include,
        order: [[sortBy, sortOrder.toUpperCase()]],
    };

    const [totalItems, items] = await Promise.all([
        database.Product.count({ ...baseOptions, distinct: true }),
        database.Product.findAll({ ...baseOptions, limit, offset }),
    ]);

    return {
        items,
        totalItems,
        selectedCategory,
        includedCategoryIds,
    };
};

const createProductRepo = async (payload, transaction) => {
    return await database.Product.create(
        {
            ...payload,
            min_stock: payload.minStock || 0,
            weight: payload.weight || 0,
            width: payload.width || 0,
            height: payload.height || 0,
            length: payload.length || 0,
            thumbnail: payload.images?.[0] || null,
            status: payload.status || 'active',
            brand_id: payload.brandId || null,
        },
        { transaction },
    );
};

const updateProductRepo = async (id, updateData) => {
    const mappedData = {};
    if (updateData.name !== undefined) mappedData.name = updateData.name;
    if (updateData.description !== undefined)
        mappedData.description = updateData.description;
    if (updateData.thumbnail !== undefined)
        mappedData.thumbnail = updateData.thumbnail;
    if (updateData.slug !== undefined) mappedData.slug = updateData.slug;
    if (updateData.status !== undefined) mappedData.status = updateData.status;
    if (updateData.brandId !== undefined)
        mappedData.brand_id = updateData.brandId;
    if (updateData.price !== undefined) mappedData.price = updateData.price;
    if (updateData.stock !== undefined) mappedData.stock = updateData.stock;
    if (updateData.minStock !== undefined)
        mappedData.min_stock = updateData.minStock;
    if (updateData.weight !== undefined) mappedData.weight = updateData.weight;
    if (updateData.width !== undefined) mappedData.width = updateData.width;
    if (updateData.height !== undefined) mappedData.height = updateData.height;
    if (updateData.length !== undefined) mappedData.length = updateData.length;
    if (updateData.priceSale !== undefined)
        mappedData.price_sale = updateData.priceSale;
    if (updateData.sold !== undefined) mappedData.sold = updateData.sold;
    if (updateData.inventoryType !== undefined)
        mappedData.inventory_type = updateData.inventoryType;
    if (updateData.productType !== undefined)
        mappedData.product_type = updateData.productType;
    if (updateData.flag !== undefined) mappedData.flag = updateData.flag;

    const [affectedRows] = await database.Product.update(mappedData, {
        where: { id },
    });
    if (!affectedRows)
        throw new NotFoundError(
            'Sản phẩm không tồn tại hoặc không được cập nhật',
        );

    if (Array.isArray(updateData.images)) {
        const transaction = await database.sequelize.transaction();
        try {
            await database.ProductImage.destroy({
                where: { product_id: id },
                transaction,
            });
            if (updateData.images.length > 0) {
                const imageRecords = updateData.images.map((url, idx) => ({
                    product_id: id,
                    image_url: url,
                    is_primary: idx === 0,
                    sort_order: idx,
                }));
                await database.ProductImage.bulkCreate(imageRecords, {
                    transaction,
                });
                await database.Product.update(
                    { thumbnail: updateData.images[0] },
                    { where: { id }, transaction },
                );
            } else {
                await database.Product.update(
                    { thumbnail: null },
                    { where: { id }, transaction },
                );
            }
            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }
    return await database.Product.findByPk(id, {
        include: [
            { model: database.Brand, as: 'brand' },
            { model: database.ProductImage, as: 'images' },
            { model: database.Category, as: 'categories' },
        ],
    });
};

const getProductBySlugRepo = async (slug) => {
    return await database.Product.findOne({
        where: { slug },
        include: [
            { model: database.Brand, as: 'brand' },
            { model: database.ProductImage, as: 'images' },
            { model: database.Category, as: 'categories' },
        ],
    });
};

const deleteImagesByProductId = async (productId, transaction) => {
    return await database.ProductImage.destroy({
        where: { product_id: productId },
        transaction,
    });
};

const deleteProductById = async (productId, transaction) => {
    return await database.Product.destroy({
        where: { id: productId },
        transaction,
    });
};

module.exports = {
    getProductById,
    getAllProductsRepo,
    createProductRepo,
    updateProductRepo,
    getProductBySlugRepo,
    deleteImagesByProductId,
    deleteProductById,
};
