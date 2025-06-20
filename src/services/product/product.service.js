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
        productType,
        thumbnail,
        slug,
        status = 'active',
        brand,
        brandId,
        skus = [],
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
        if (
            !productType ||
            !['simple', 'product_variants'].includes(productType)
        ) {
            throw new BadRequestError(
                'productType is required and must be "simple" or "product_variants"',
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
        if (!Array.isArray(skus)) {
            throw new BadRequestError('skus must be an array');
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
            product_type: productType,
            thumbnail,
            slug,
            status,
            brand_id: brandId,
        });

        // Create SKUs and their images
        if (productType === 'simple') {
            if (!skus[0])
                throw new BadRequestError(
                    'SKU data required for simple product',
                );
            const { images, ...skuData } = skus[0];
            const sku = await database.SKU.create({
                ...skuData,
                product_id: product.id,
            });
            if (Array.isArray(images) && images.length > 0) {
                const imageList = images.map((img) => ({
                    ...img,
                    sku_id: sku.id,
                }));
                await database.ProductImage.bulkCreate(imageList);
            }
        } else if (productType === 'product_variants') {
            if (!Array.isArray(skus) || skus.length === 0) {
                throw new BadRequestError(
                    'SKU list required for product variants',
                );
            }
            for (const skuInput of skus) {
                const { images, ...skuData } = skuInput;
                const sku = await database.SKU.create({
                    ...skuData,
                    product_id: product.id,
                });
                if (Array.isArray(images) && images.length > 0) {
                    const imageList = images.map((img) => ({
                        ...img,
                        sku_id: sku.id,
                    }));
                    await database.ProductImage.bulkCreate(imageList);
                }
            }
        }

        return toCamel(product.toJSON());
    }

    static async getProductById(id) {
        const product = await database.Product.findByPk(id, {
            include: [
                { model: database.Brand, as: 'brand' },
                {
                    model: database.SKU,
                    as: 'skus',
                    include: [{ model: database.ProductImage, as: 'images' }],
                },
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
                {
                    model: database.SKU,
                    as: 'skus',
                    include: [{ model: database.ProductImage, as: 'images' }],
                },
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
        if (updateData.productType !== undefined)
            mappedData.product_type = updateData.productType;
        if (updateData.thumbnail !== undefined)
            mappedData.thumbnail = updateData.thumbnail;
        if (updateData.slug !== undefined) mappedData.slug = updateData.slug;
        if (updateData.status !== undefined)
            mappedData.status = updateData.status;
        if (updateData.brandId !== undefined)
            mappedData.brand_id = updateData.brandId;

        const [affectedRows] = await database.Product.update(mappedData, {
            where: { id },
        });
        if (!affectedRows)
            throw new NotFoundError('Product not found or not updated');
        return await ProductService.getProductById(id);
    }

    static async deleteProduct(id) {
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
                {
                    model: database.SKU,
                    as: 'skus',
                    include: [{ model: database.ProductImage, as: 'images' }],
                },
            ],
        });
        if (!product) throw new NotFoundError('Product not found');
        return toCamel(product.toJSON());
    }
}

module.exports = ProductService;
