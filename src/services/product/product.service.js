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

class ProductService {
    static async createProduct({
        name,
        description,
        thumbnail,
        slug,
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
        meta = [], // array of {metaKey, metaValue}
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
        // Check if slug already exists
        const existing = await database.Product.findOne({ where: { slug } });
        if (existing) throw new BadRequestError('Product slug already exists');
        // Check if brand exists if brandId is provided
        let brandObj = null;
        if (brandId !== undefined && brandId !== null) {
            brandObj = await database.Brand.findByPk(brandId);
            if (!brandObj) throw new BadRequestError('Brand not found');
        }
        // Create product
        const product = await database.Product.create({
            name,
            description,
            thumbnail,
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
        });
        // Create meta data if provided
        if (Array.isArray(meta) && meta.length > 0) {
            const metaList = meta.map(({ metaKey, metaValue }) => ({
                product_id: product.id,
                meta_key: metaKey,
                meta_value: metaValue,
            }));
            await database.ProductMeta.bulkCreate(metaList);
        }
        return toCamel(
            await database.Product.findByPk(product.id, {
                include: [
                    { model: database.Brand, as: 'brand' },
                    { model: database.ProductImage, as: 'images' },
                    { model: database.ProductMeta, as: 'meta' },
                ],
            }).then((p) => p && p.toJSON()),
        );
    }

    static async getProductById(id) {
        const product = await database.Product.findByPk(id, {
            include: [
                { model: database.Brand, as: 'brand' },
                { model: database.ProductImage, as: 'images' },
                { model: database.Category, as: 'categories' },
                { model: database.ProductMeta, as: 'meta' },
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
        const [affectedRows] = await database.Product.update(mappedData, {
            where: { id },
        });
        if (!affectedRows)
            throw new NotFoundError('Product not found or not updated');
        // Optionally update meta
        if (Array.isArray(updateData.meta)) {
            // Remove old meta and insert new
            await database.ProductMeta.destroy({ where: { product_id: id } });
            const metaList = updateData.meta.map(({ metaKey, metaValue }) => ({
                product_id: id,
                meta_key: metaKey,
                meta_value: metaValue,
            }));
            await database.ProductMeta.bulkCreate(metaList);
        }
        return await ProductService.getProductById(id);
    }

    static async deleteProduct(id) {
        await database.ProductMeta.destroy({ where: { product_id: id } });
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
            ],
        });
        if (!product) throw new NotFoundError('Product not found');
        return toCamel(product.toJSON());
    }
}

module.exports = ProductService;
