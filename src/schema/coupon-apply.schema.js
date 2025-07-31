const Joi = require('joi');

const orderItemSchema = Joi.object({
    product_id: Joi.number().required(),
    quantity: Joi.number().integer().min(1).required(),
});

const validateCouponInputSchema = Joi.object({
    code: Joi.string().required(),
    user_id: Joi.number().optional(),
    orderData: Joi.object({
        subtotal: Joi.number().required(),
        shipping_fee: Joi.number().optional(),
        items: Joi.array().items(orderItemSchema).min(1).required(),
    }).required(),
});

const discountDataSchema = Joi.object({
    discountValue: Joi.number().required(),
    discountAmount: Joi.number().required(),
    orderSubtotal: Joi.number().required(),
    shippingFee: Joi.number().required(),
    shippingDiscount: Joi.number().default(0),
    couponCode: Joi.string().required(),
    discountType: Joi.string()
        .valid('percent', 'fixed', 'free_shipping')
        .required(),
    appliedProducts: Joi.array()
        .items(
            Joi.object({
                productId: Joi.number().required(),
                quantity: Joi.number().integer().min(1).required(),
                price: Joi.number().min(0).required(),
            }),
        )
        .default([]),
    conditionsMet: Joi.object().default({}),
});

module.exports = {
    validateCouponInputSchema,
    discountDataSchema,
};
