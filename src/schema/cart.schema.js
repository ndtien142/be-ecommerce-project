const Joi = require('joi');

// Tạo cart
const createCartSchema = Joi.object({
    userId: Joi.number().required(),
    status: Joi.string().valid('active', 'inactive').default('active'),
    totalAmount: Joi.number().min(0).default(0),
    lineItems: Joi.array()
        .items(
            Joi.object({
                skuId: Joi.number().required(),
                quantity: Joi.number().min(1).required(),
                price: Joi.number().min(0).required(),
                total: Joi.number().min(0).required(),
            }),
        )
        .default([]),
});

// Thêm sản phẩm vào cart
const addToCartSchema = Joi.object({
    userId: Joi.number().required(),
    productId: Joi.number().required(),
    quantity: Joi.number().min(1).default(1),
    price: Joi.number().min(0).required(),
});

// Cập nhật cart (status, totalAmount, lineItems)
const updateCartSchema = Joi.object({
    status: Joi.string().valid('active', 'inactive'),
    totalAmount: Joi.number().min(0),
    lineItems: Joi.array().items(
        Joi.object({
            skuId: Joi.number().required(),
            quantity: Joi.number().min(1).required(),
            price: Joi.number().min(0).required(),
            total: Joi.number().min(0).required(),
        }),
    ),
});

// Thay đổi số lượng sản phẩm (cộng/trừ)
const itemQuantitySchema = Joi.object({
    userId: Joi.number().required(),
    productId: Joi.number().required(),
    quantity: Joi.number().min(1).required(),
});

// Xóa sản phẩm khỏi cart
const removeItemSchema = Joi.object({
    userId: Joi.number().required(),
    productId: Joi.number().required(),
});

module.exports = {
    createCartSchema,
    addToCartSchema,
    updateCartSchema,
    itemQuantitySchema,
    removeItemSchema,
};
