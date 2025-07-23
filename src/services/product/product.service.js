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
        categories = [],
        inventoryType,
        productType,
        flag,
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
            throw new BadRequestError('brandId phải là số');
        }
        // Validate inventoryType length (adjust max length as per your DB schema)
        if (
            inventoryType !== undefined &&
            inventoryType !== null &&
            typeof inventoryType === 'string' &&
            inventoryType.length > 20
        ) {
            throw new BadRequestError(
                'inventoryType quá dài (tối đa 20 ký tự)',
            );
        }
        // Check if slug already exists
        const existing = await database.Product.findOne({ where: { slug } });
        if (existing) throw new BadRequestError('Slug sản phẩm đã tồn tại');
        // Check if brand exists if brandId is provided
        let brandObj = null;
        if (brandId !== undefined && brandId !== null) {
            brandObj = await database.Brand.findByPk(brandId);
            if (!brandObj)
                throw new BadRequestError('Không tìm thấy thương hiệu');
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

        // Validate categories
        if (categories !== undefined && categories !== null) {
            if (!Array.isArray(categories)) {
                throw new BadRequestError('categories must be an array');
            }
            for (const catId of categories) {
                if (isNaN(Number(catId))) {
                    throw new BadRequestError(
                        'Each category id must be a number',
                    );
                }
            }
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
            // Set categories if provided
            if (
                Array.isArray(categories) &&
                categories.length > 0 &&
                product.setCategories
            ) {
                await product.setCategories(categories, { transaction });
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
            ],
        });
        if (!product) throw new NotFoundError('Product not found');
        return toCamel(product.toJSON());
    }

    static async getAllProducts({
        page = 1,
        limit = 20,
        categorySlug = null,
        status = 'active',
        brandId = null,
        minPrice = null,
        maxPrice = null,
        flag = null,
        search = null,
        sortBy = 'create_time',
        sortOrder = 'DESC',
    } = {}) {
        // Validate and convert parameters
        limit = Number(limit) || 20;
        page = Number(page) || 1;
        const offset = (page - 1) * limit;

        // Valid sortable columns for Product model
        const validSortColumns = [
            'id',
            'name',
            'description',
            'product_type',
            'thumbnail',
            'slug',
            'status',
            'brand_id',
            'price',
            'flag',
            'stock',
            'min_stock',
            'weight',
            'width',
            'height',
            'length',
            'price_sale',
            'sold',
            'inventory_type',
            'create_time',
            'update_time',
        ];

        // Validate sortBy parameter
        if (!validSortColumns.includes(sortBy)) {
            // Default to create_time if invalid sortBy is provided
            sortBy = 'create_time';
        }

        // Validate sortOrder parameter
        const validSortOrders = ['ASC', 'DESC'];
        if (!validSortOrders.includes(sortOrder.toUpperCase())) {
            sortOrder = 'DESC';
        }

        // Build the base query
        const queryOptions = {
            limit,
            offset,
            include: [
                { model: database.Brand, as: 'brand' },
                { model: database.ProductImage, as: 'images' },
                { model: database.Category, as: 'categories' },
            ],
            where: {},
            order: [[sortBy, sortOrder.toUpperCase()]],
        };

        // Add status filter if provided
        if (status) {
            queryOptions.where.status = status;
        }

        // Add brand filter
        if (brandId && !isNaN(Number(brandId))) {
            queryOptions.where.brand_id = Number(brandId);
        }

        // Add price range filter
        if (minPrice && !isNaN(Number(minPrice))) {
            queryOptions.where.price = queryOptions.where.price || {};
            queryOptions.where.price[database.Sequelize.Op.gte] =
                Number(minPrice);
        }
        if (maxPrice && !isNaN(Number(maxPrice))) {
            queryOptions.where.price = queryOptions.where.price || {};
            queryOptions.where.price[database.Sequelize.Op.lte] =
                Number(maxPrice);
        }

        // Add flag filter
        if (flag) {
            queryOptions.where.flag = flag;
        }

        // Add search filter (name and description)
        if (search && typeof search === 'string') {
            queryOptions.where[database.Sequelize.Op.or] = [
                {
                    name: {
                        [database.Sequelize.Op.like]: `%${search}%`,
                    },
                },
                {
                    description: {
                        [database.Sequelize.Op.like]: `%${search}%`,
                    },
                },
            ];
        }

        let selectedCategory = null;
        let allCategoryIds = [];

        // If category filter is provided, handle category filtering
        if (categorySlug && typeof categorySlug === 'string') {
            // Find the category by slug
            selectedCategory = await database.Category.findOne({
                where: { slug: categorySlug, status: 'active' },
            });

            if (!selectedCategory) {
                throw new NotFoundError('Category not found');
            }

            // Helper function to get all child category IDs recursively
            const getAllChildCategoryIds = async (parentId) => {
                const children = await database.Category.findAll({
                    where: { parent_id: parentId, status: 'active' },
                    attributes: ['id'],
                });

                let allIds = children.map((child) => child.id);

                // Recursively get children of children
                for (const child of children) {
                    const grandChildren = await getAllChildCategoryIds(
                        child.id,
                    );
                    allIds = allIds.concat(grandChildren);
                }

                return allIds;
            };

            // Get all child category IDs
            const childCategoryIds = await getAllChildCategoryIds(
                selectedCategory.id,
            );

            // Include the parent category ID and all child category IDs
            allCategoryIds = [selectedCategory.id, ...childCategoryIds];

            // Add category filter to the include
            queryOptions.include = queryOptions.include.map((inc) => {
                if (inc.as === 'categories') {
                    return {
                        ...inc,
                        where: {
                            id: { [database.Sequelize.Op.in]: allCategoryIds },
                        },
                        through: { attributes: [] },
                    };
                }
                return inc;
            });
        }

        // Fix duplicate count issue with many-to-many joins
        // Use separate queries for count and data to avoid pagination issues

        // Create count query (without limit/offset)
        const countOptions = { ...queryOptions };
        delete countOptions.limit;
        delete countOptions.offset;
        delete countOptions.order;
        countOptions.distinct = true;
        countOptions.subQuery = false;

        // Create data query (with limit/offset but no distinct to avoid pagination issues)
        const dataOptions = { ...queryOptions };
        dataOptions.distinct = false;
        dataOptions.subQuery = true;

        // Execute both queries
        const [countResult, dataResult] = await Promise.all([
            database.Product.count(countOptions),
            database.Product.findAll(dataOptions),
        ]);

        const totalItems = countResult;
        const totalPages = Math.ceil(totalItems / limit);

        const response = {
            items: dataResult.map((p) => toCamel(p.toJSON())),
            meta: {
                currentPage: page,
                itemPerPage: limit,
                totalItems,
                totalPages,
                filters: {
                    categorySlug,
                    status,
                    brandId,
                    minPrice,
                    maxPrice,
                    flag,
                    search,
                    sortBy,
                    sortOrder,
                },
            },
        };

        // Add category info if filtering by category
        if (selectedCategory) {
            response.category = toCamel(selectedCategory.toJSON());
            response.meta.includedCategoryIds = allCategoryIds;
        }

        return response;
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

        // Note: images are handled separately after the main product update

        const [affectedRows] = await database.Product.update(mappedData, {
            where: { id },
        });
        if (!affectedRows)
            throw new NotFoundError('Product not found or not updated');

        // Optionally update images
        if (Array.isArray(updateData.images) && database.ProductImage) {
            // Validate each image URL
            for (const img of updateData.images) {
                if (typeof img !== 'string' || !img.trim()) {
                    throw new BadRequestError(
                        'Each image must be a non-empty string URL',
                    );
                }
            }

            // Start transaction for image updates
            const transaction = await database.sequelize.transaction();
            try {
                // Remove all existing images for this product
                await database.ProductImage.destroy({
                    where: { product_id: id },
                    transaction,
                });

                // Create new image records if any images provided
                if (updateData.images.length > 0) {
                    const imageRecords = updateData.images.map(
                        (imgUrl, idx) => ({
                            product_id: id,
                            image_url: imgUrl,
                            is_primary: idx === 0, // First image is primary
                            sort_order: idx,
                        }),
                    );

                    await database.ProductImage.bulkCreate(imageRecords, {
                        transaction,
                    });

                    // Update product thumbnail to first image
                    await database.Product.update(
                        { thumbnail: updateData.images[0] },
                        { where: { id }, transaction },
                    );
                } else {
                    // If no images provided, clear thumbnail
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

        return await ProductService.getProductById(id);
    }

    static async deleteProduct(id) {
        const product = await database.Product.findByPk(id);
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
            ],
        });
        if (!product) throw new NotFoundError('Product not found');
        return toCamel(product.toJSON());
    }
}

module.exports = ProductService;
