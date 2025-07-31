const Joi = require('joi');

const getAllProductsFilterSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).default(20),
    categorySlug: Joi.string().allow(null, ''),
    status: Joi.string().valid('active', 'inactive').default('active'),
    brandId: Joi.number().integer().allow(null),
    minPrice: Joi.number().min(0).allow(null),
    maxPrice: Joi.number().min(0).allow(null),
    flag: Joi.string().allow(null, ''),
    search: Joi.string().allow(null, ''),
    sortBy: Joi.string().default('create_time'),
    sortOrder: Joi.string().valid('ASC', 'DESC').insensitive().default('DESC'),
});

const createProductSchema = Joi.object({
    name: Joi.string().required().messages({
        'string.base': 'Tên sản phẩm phải là chuỗi',
        'any.required': 'Tên sản phẩm là bắt buộc',
    }),
    description: Joi.string().allow(null, '').optional(),
    slug: Joi.string().required().messages({
        'string.base': 'Slug phải là chuỗi',
        'any.required': 'Slug là bắt buộc',
    }),
    images: Joi.array()
        .items(
            Joi.string().uri().required().messages({
                'string.uri': 'URL hình ảnh không hợp lệ',
            }),
        )
        .optional(),
    status: Joi.string().valid('active', 'inactive').default('active'),
    brand: Joi.object().optional(),
    brandId: Joi.number().integer().allow(null).optional(),
    price: Joi.number().positive().required(),
    priceSale: Joi.number().allow(null).optional(),
    stock: Joi.number().integer().min(0).optional(),
    minStock: Joi.number().integer().min(0).optional(),
    weight: Joi.number().optional(),
    width: Joi.number().optional(),
    height: Joi.number().optional(),
    length: Joi.number().optional(),
    sold: Joi.number().integer().min(0).optional(),
    categories: Joi.array().items(Joi.number().integer()).optional(),
    inventoryType: Joi.string().max(20).optional(),
    productType: Joi.string().optional(),
    flag: Joi.string().allow(null, '').optional(),
});

const updateProductSchema = createProductSchema.fork(
    Object.keys(createProductSchema.describe().keys),
    (schema) => schema.optional(),
);

module.exports = {
    getAllProductsFilterSchema,
    createProductSchema,
    updateProductSchema,
};
