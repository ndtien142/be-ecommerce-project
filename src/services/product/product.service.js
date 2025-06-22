'use strict';

const { BadRequestError, NotFoundError } = require('../../core/error.response');
const database = require('../../models');
const { toCamel } = require('../../utils/common.utils');

class ProductService {
    static async createProduct({
        name,
        description,
        slug,
        images = [],
        status = 'active',
        brand,
        brandId,
        price,
        stock,
        minStock,
        weight,
        width,
        height,
        length,
        priceSale,
        sold,
        inventoryType,
        productType,
        flag,
        tags = [],
        meta = [],
    }) {
        // Extract brandId from brand object if not provided
        if (
            (brandId === undefined || brandId === null) &&
            brand &&
            typeof brand === 'object' &&
            brand.id
        ) {
            brandId = brand.id;
        }
        // Validation
        if (!name || typeof name !== 'string') {
            throw new BadRequestError(
                'Product name is required and must be a string',
            );
        }
        if (!slug || typeof slug !== 'string') {
            throw new BadRequestError(
                'Product slug is required and must be a string',
            );
        }
        if (
            brandId !== undefined &&
            brandId !== null &&
            isNaN(Number(brandId))
        ) {
            throw new BadRequestError('brandId must be a number');
        }
        // Validate inventoryType length (adjust max length as per your DB schema)
        if (
            inventoryType !== undefined &&
            inventoryType !== null &&
            typeof inventoryType === 'string' &&
            inventoryType.length > 20
        ) {
            throw new BadRequestError(
                'inventoryType is too long (max 20 chars)',
            );
        }
        // Check if slug already exists
        const existing = await database.Product.findOne({ where: { slug } });
        if (existing) throw new BadRequestError('Product slug already exists');
        // Check if brand exists if brandId is provided
        let brandObj = null;
        if (brandId !== undefined && brandId !== null) {
            brandObj = await database.Brand.findByPk(brandId);
            if (!brandObj) throw new BadRequestError('Brand not found');
        }

        // Validate and create product images if provided
        let imageRecords = [];
        if (
            Array.isArray(images) &&
            images.length > 0 &&
            database.ProductImage
        ) {
            // Validate each image (basic: must be string, non-empty)
            for (const img of images) {
                if (typeof img !== 'string' || !img.trim()) {
                    throw new BadRequestError(
                        'Each image must be a non-empty string',
                    );
                }
            }
            // Prepare image records with correct fields
            imageRecords = images.map((imgUrl, idx) => ({
                image_url: imgUrl,
                is_primary: idx === 0,
                sort_order: idx,
            }));
        }

        // Start transaction
        const transaction = await database.sequelize.transaction();
        try {
            // Create product
            const product = await database.Product.create(
                {
                    name,
                    description,
                    thumbnail: images[0] || null,
                    slug,
                    status,
                    brand_id: brandId,
                    price,
                    stock,
                    min_stock: minStock,
                    weight,
                    width,
                    height,
                    length,
                    price_sale: priceSale,
                    sold,
                    inventory_type: inventoryType,
                    product_type: productType,
                    flag,
                },
                { transaction },
            );
            // Set tags if provided
            if (Array.isArray(tags) && tags.length > 0 && product.setTags) {
                await product.setTags(tags, { transaction });
            }
            // Create meta data if provided
            if (
                Array.isArray(meta) &&
                meta.length > 0 &&
                database.ProductMeta
            ) {
                const metaList = meta.map(({ metaKey, metaValue }) => ({
                    product_id: product.id,
                    meta_key: metaKey,
                    meta_value: metaValue,
                }));
                await database.ProductMeta.bulkCreate(metaList, {
                    transaction,
                });
            }
            // Create images if provided
            if (imageRecords.length > 0 && database.ProductImage) {
                const imagesToCreate = imageRecords.map((img) => ({
                    ...img,
                    product_id: product.id,
                }));
                await database.ProductImage.bulkCreate(imagesToCreate, {
                    transaction,
                });
            }
            // Commit transaction
            await transaction.commit();

            return toCamel(
                await database.Product.findByPk(product.id, {
                    include: [
                        { model: database.Brand, as: 'brand' },
                        { model: database.ProductImage, as: 'images' },
                        { model: database.ProductMeta, as: 'meta' },
                        { model: database.Tag, as: 'tags' },
                    ],
                }).then((p) => p && p.toJSON()),
            );
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    static async getProductById(id) {
        const product = await database.Product.findByPk(id, {
            include: [
                { model: database.Brand, as: 'brand' },
                { model: database.ProductImage, as: 'images' },
                { model: database.Category, as: 'categories' },
                { model: database.ProductMeta, as: 'meta' },
                { model: database.Tag, as: 'tags' },
            ],
        });
        if (!product) throw new NotFoundError('Product not found');
        return toCamel(product.toJSON());
    }

    static async getAllProducts({ page = 1, limit = 20 } = {}) {
        limit = Number(limit) || 20;
        page = Number(page) || 1;
        const offset = (page - 1) * limit;
        const products = await database.Product.findAndCountAll({
            limit,
            offset,
            include: [
                { model: database.Brand, as: 'brand' },
                { model: database.ProductImage, as: 'images' },
                { model: database.Category, as: 'categories' },
                { model: database.ProductMeta, as: 'meta' },
                { model: database.Tag, as: 'tags' },
            ],
        });
        const totalItems = products.count;
        const totalPages = Math.ceil(totalItems / limit);
        return {
            items: products.rows.map((p) => toCamel(p.toJSON())),
            meta: {
                currentPage: page,
                itemPerPage: limit,
                totalItems,
                totalPages,
            },
        };
    }

    static async updateProduct(id, updateData) {
        // Map camelCase to snake_case for update
        const mappedData = {};
        if (updateData.name !== undefined) mappedData.name = updateData.name;
        if (updateData.description !== undefined)
            mappedData.description = updateData.description;
        if (updateData.thumbnail !== undefined)
            mappedData.thumbnail = updateData.thumbnail;
        if (updateData.slug !== undefined) mappedData.slug = updateData.slug;
        if (updateData.status !== undefined)
            mappedData.status = updateData.status;
        if (updateData.brandId !== undefined)
            mappedData.brand_id = updateData.brandId;
        if (updateData.price !== undefined) mappedData.price = updateData.price;
        if (updateData.stock !== undefined) mappedData.stock = updateData.stock;
        if (updateData.minStock !== undefined)
            mappedData.min_stock = updateData.minStock;
        if (updateData.weight !== undefined)
            mappedData.weight = updateData.weight;
        if (updateData.width !== undefined) mappedData.width = updateData.width;
        if (updateData.height !== undefined)
            mappedData.height = updateData.height;
        if (updateData.length !== undefined)
            mappedData.length = updateData.length;
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
            throw new NotFoundError('Product not found or not updated');
        // Optionally update meta
        if (Array.isArray(updateData.meta) && database.ProductMeta) {
            // Remove old meta and insert new
            await database.ProductMeta.destroy({ where: { product_id: id } });
            const metaList = updateData.meta.map(({ metaKey, metaValue }) => ({
                product_id: id,
                meta_key: metaKey,
                meta_value: metaValue,
            }));
            await database.ProductMeta.bulkCreate(metaList);
        }
        // Optionally update tags
        if (Array.isArray(updateData.tags)) {
            const product = await database.Product.findByPk(id);
            if (product && product.setTags) {
                await product.setTags(updateData.tags);
            }
        }
        return await ProductService.getProductById(id);
    }

    static async deleteProduct(id) {
        if (database.ProductMeta) {
            await database.ProductMeta.destroy({ where: { product_id: id } });
        }
        const product = await database.Product.findByPk(id);
        if (product && product.setTags) {
            await product.setTags([]);
        }
        const deleted = await database.Product.destroy({ where: { id } });
        if (!deleted)
            throw new NotFoundError('Product not found or already deleted');
        return { message: 'Product deleted successfully' };
    }

    static async getProductBySlug(slug) {
        const product = await database.Product.findOne({
            where: { slug },
            include: [
                { model: database.Brand, as: 'brand' },
                { model: database.ProductImage, as: 'images' },
                { model: database.Category, as: 'categories' },
                { model: database.ProductMeta, as: 'meta' },
                { model: database.Tag, as: 'tags' },
            ],
        });
        if (!product) throw new NotFoundError('Product not found');
        return toCamel(product.toJSON());
    }
}

module.exports = ProductService;
