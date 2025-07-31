'use strict';

const Joi = require('joi');

const createOrderSchema = Joi.object({
    userId: Joi.number().required(),
    cart: Joi.object({
        lineItems: Joi.array()
            .items(
                Joi.object({
                    productId: Joi.number().required(),
                    quantity: Joi.number().min(1).required(),
                    price: Joi.number().min(0).required(),
                }),
            )
            .min(1)
            .required(),
    }).required(),
    addressId: Joi.number().required(),
    shippingMethodId: Joi.number().required(),
    note: Joi.string().allow('', null),
    shippingFee: Joi.number().min(0).default(0),
    orderedDate: Joi.date().default(() => new Date(), 'current date'),
    couponCode: Joi.string().allow('', null),
});

module.exports = {
    createOrderSchema,
};
