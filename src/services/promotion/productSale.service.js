'use strict';

const {
    BadRequestError,
    NotFoundError,
    ConflictError,
} = require('../../core/error.response');
const { Op } = require('sequelize');
const database = require('../../models');
const { toCamel } = require('../../utils/common.utils');

class ProductSaleService {
    /**
     * Tạo đợt sale cho sản phẩm
     */
    static async createProductSale(data) {
        const {
            product_id,
            name,
            description,
            discount_type,
            discount_value,
            start_date,
            end_date,
            quantity_limit,
            min_quantity = 1,
            max_quantity_per_user,
            created_by,
            campaign_id,
            tags,
            priority = 1,
        } = data;

        // Validate input
        if (
            !product_id ||
            !name ||
            !discount_type ||
            !discount_value ||
            !start_date ||
            !end_date
        ) {
            throw new BadRequestError('Missing required fields');
        }

        if (!['percent', 'fixed'].includes(discount_type)) {
            throw new BadRequestError('Invalid discount type');
        }

        if (
            discount_type === 'percent' &&
            (discount_value < 0 || discount_value > 100)
        ) {
            throw new BadRequestError(
                'Percent discount must be between 0 and 100',
            );
        }

        if (discount_type === 'fixed' && discount_value < 0) {
            throw new BadRequestError('Fixed discount must be positive');
        }

        if (new Date(start_date) >= new Date(end_date)) {
            throw new BadRequestError('Start date must be before end date');
        }

        // Validate product exists
        const product = await database.Product.findByPk(product_id);
        if (!product) {
            throw new NotFoundError('Product not found');
        }

        // Check for overlapping sales
        const overlappingSale = await database.ProductSale.findOne({
            where: {
                product_id,
                is_active: true,
                [Op.or]: [
                    {
                        start_date: {
                            [Op.between]: [start_date, end_date],
                        },
                    },
                    {
                        end_date: {
                            [Op.between]: [start_date, end_date],
                        },
                    },
                    {
                        [Op.and]: [
                            { start_date: { [Op.lte]: start_date } },
                            { end_date: { [Op.gte]: end_date } },
                        ],
                    },
                ],
            },
        });

        if (overlappingSale) {
            throw new ConflictError(
                'Product already has an active sale in this time period',
            );
        }

        // Calculate sale price
        const original_price = product.price;
        let sale_price;

        if (discount_type === 'percent') {
            sale_price = original_price * (1 - discount_value / 100);
        } else {
            sale_price = original_price - discount_value;
        }

        if (sale_price < 0) {
            throw new BadRequestError('Sale price cannot be negative');
        }

        // Create product sale
        const productSale = await database.ProductSale.create({
            product_id,
            name,
            description,
            discount_type,
            discount_value,
            original_price,
            sale_price,
            start_date,
            end_date,
            quantity_limit,
            min_quantity,
            max_quantity_per_user,
            created_by,
            campaign_id,
            tags,
            priority,
        });

        return toCamel(productSale.toJSON());
    }

    /**
     * Lấy danh sách product sales
     */
    static async getProductSales(options = {}) {
        const {
            page = 1,
            limit = 10,
            product_id,
            is_active,
            campaign_id,
            start_date,
            end_date,
        } = options;

        const whereConditions = {};

        if (product_id) {
            whereConditions.product_id = product_id;
        }

        if (is_active !== undefined) {
            whereConditions.is_active = is_active;
        }

        if (campaign_id) {
            whereConditions.campaign_id = campaign_id;
        }

        if (start_date || end_date) {
            whereConditions[Op.and] = [];
            if (start_date) {
                whereConditions[Op.and].push({
                    end_date: { [Op.gte]: start_date },
                });
            }
            if (end_date) {
                whereConditions[Op.and].push({
                    start_date: { [Op.lte]: end_date },
                });
            }
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await database.ProductSale.findAndCountAll({
            where: whereConditions,
            include: [
                {
                    model: database.Product,
                    as: 'product',
                    attributes: ['id', 'name', 'price', 'image_url'],
                },
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [
                ['priority', 'DESC'],
                ['create_time', 'DESC'],
            ],
        });

        return {
            product_sales: toCamel(rows.map((row) => row.toJSON())),
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit),
            },
        };
    }

    /**
     * Lấy active sale của sản phẩm
     */
    static async getActiveProductSale(product_id) {
        const now = new Date();

        const productSale = await database.ProductSale.findOne({
            where: {
                product_id,
                is_active: true,
                start_date: { [Op.lte]: now },
                end_date: { [Op.gte]: now },
            },
            order: [
                ['priority', 'DESC'],
                ['create_time', 'DESC'],
            ],
        });

        return productSale ? toCamel(productSale.toJSON()) : null;
    }

    /**
     * Lấy danh sách sản phẩm đang sale
     */
    static async getProductsOnSale(options = {}) {
        const {
            page = 1,
            limit = 10,
            category_id,
            campaign_id,
            min_discount,
            max_discount,
        } = options;

        const now = new Date();
        const whereConditions = {
            is_active: true,
            start_date: { [Op.lte]: now },
            end_date: { [Op.gte]: now },
        };

        if (campaign_id) {
            whereConditions.campaign_id = campaign_id;
        }

        if (min_discount || max_discount) {
            if (min_discount) {
                whereConditions.discount_value = { [Op.gte]: min_discount };
            }
            if (max_discount) {
                whereConditions.discount_value = {
                    ...whereConditions.discount_value,
                    [Op.lte]: max_discount,
                };
            }
        }

        const productInclude = {
            model: database.Product,
            as: 'product',
            attributes: ['id', 'name', 'price', 'image_url', 'description'],
        };

        // Add category filter if specified
        if (category_id) {
            productInclude.include = [
                {
                    model: database.Category,
                    as: 'categories',
                    where: { id: category_id },
                    through: { attributes: [] },
                },
            ];
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await database.ProductSale.findAndCountAll({
            where: whereConditions,
            include: [productInclude],
            limit: parseInt(limit),
            offset: offset,
            order: [
                ['priority', 'DESC'],
                ['discount_value', 'DESC'],
            ],
        });

        return {
            products_on_sale: toCamel(rows.map((row) => row.toJSON())),
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit),
            },
        };
    }

    /**
     * Cập nhật product sale
     */
    static async updateProductSale(id, data) {
        const productSale = await database.ProductSale.findByPk(id);
        if (!productSale) {
            throw new NotFoundError('Product sale not found');
        }

        // Validate overlapping if dates are being updated
        if (data.start_date || data.end_date) {
            const start_date = data.start_date || productSale.start_date;
            const end_date = data.end_date || productSale.end_date;

            if (new Date(start_date) >= new Date(end_date)) {
                throw new BadRequestError('Start date must be before end date');
            }

            const overlappingSale = await database.ProductSale.findOne({
                where: {
                    product_id: productSale.product_id,
                    is_active: true,
                    id: { [Op.ne]: id },
                    [Op.or]: [
                        {
                            start_date: {
                                [Op.between]: [start_date, end_date],
                            },
                        },
                        {
                            end_date: {
                                [Op.between]: [start_date, end_date],
                            },
                        },
                        {
                            [Op.and]: [
                                { start_date: { [Op.lte]: start_date } },
                                { end_date: { [Op.gte]: end_date } },
                            ],
                        },
                    ],
                },
            });

            if (overlappingSale) {
                throw new ConflictError(
                    'Product already has an active sale in this time period',
                );
            }
        }

        // Recalculate sale price if discount is updated
        if (data.discount_type || data.discount_value) {
            const discount_type =
                data.discount_type || productSale.discount_type;
            const discount_value =
                data.discount_value || productSale.discount_value;
            const original_price = productSale.original_price;

            let sale_price;
            if (discount_type === 'percent') {
                sale_price = original_price * (1 - discount_value / 100);
            } else {
                sale_price = original_price - discount_value;
            }

            if (sale_price < 0) {
                throw new BadRequestError('Sale price cannot be negative');
            }

            data.sale_price = sale_price;
        }

        await productSale.update(data);
        return toCamel(productSale.toJSON());
    }

    /**
     * Xóa product sale
     */
    static async deleteProductSale(id) {
        const productSale = await database.ProductSale.findByPk(id);
        if (!productSale) {
            throw new NotFoundError('Product sale not found');
        }

        await productSale.destroy();
        return { message: 'Product sale deleted successfully' };
    }

    /**
     * Tạo bulk sales cho campaign
     */
    static async createBulkSales(data) {
        const {
            product_ids,
            campaign_id,
            name,
            description,
            discount_type,
            discount_value,
            start_date,
            end_date,
            quantity_limit,
            min_quantity = 1,
            max_quantity_per_user,
            created_by,
            tags,
            priority = 1,
        } = data;

        if (!product_ids || product_ids.length === 0) {
            throw new BadRequestError('No products specified');
        }

        // Get products with their prices
        const products = await database.Product.findAll({
            where: { id: product_ids },
            attributes: ['id', 'name', 'price'],
        });

        if (products.length !== product_ids.length) {
            throw new BadRequestError('Some products not found');
        }

        const salesData = products.map((product) => {
            let sale_price;
            if (discount_type === 'percent') {
                sale_price = product.price * (1 - discount_value / 100);
            } else {
                sale_price = product.price - discount_value;
            }

            return {
                product_id: product.id,
                name: `${name} - ${product.name}`,
                description,
                discount_type,
                discount_value,
                original_price: product.price,
                sale_price,
                start_date,
                end_date,
                quantity_limit,
                min_quantity,
                max_quantity_per_user,
                created_by,
                campaign_id,
                tags,
                priority,
            };
        });

        const productSales = await database.ProductSale.bulkCreate(salesData);
        return toCamel(productSales.map((sale) => sale.toJSON()));
    }

    /**
     * Lấy thống kê sale
     */
    static async getSaleStatistics(options = {}) {
        const { campaign_id, start_date, end_date, product_id } = options;

        const whereConditions = {};

        if (campaign_id) {
            whereConditions.campaign_id = campaign_id;
        }

        if (product_id) {
            whereConditions.product_id = product_id;
        }

        if (start_date || end_date) {
            whereConditions[Op.and] = [];
            if (start_date) {
                whereConditions[Op.and].push({
                    end_date: { [Op.gte]: start_date },
                });
            }
            if (end_date) {
                whereConditions[Op.and].push({
                    start_date: { [Op.lte]: end_date },
                });
            }
        }

        const totalSales = await database.ProductSale.count({
            where: whereConditions,
        });

        const activeSales = await database.ProductSale.count({
            where: {
                ...whereConditions,
                is_active: true,
                start_date: { [Op.lte]: new Date() },
                end_date: { [Op.gte]: new Date() },
            },
        });

        const totalSoldQuantity = await database.ProductSale.sum(
            'sold_quantity',
            {
                where: whereConditions,
            },
        );

        const avgDiscountValue = await database.ProductSale.aggregate(
            'discount_value',
            'avg',
            {
                where: whereConditions,
            },
        );

        return {
            total_sales: totalSales,
            active_sales: activeSales,
            total_sold_quantity: totalSoldQuantity || 0,
            avg_discount_value: Math.round((avgDiscountValue || 0) * 100) / 100,
        };
    }
}

module.exports = ProductSaleService;
