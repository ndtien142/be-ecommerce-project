const Joi = require('joi');

const couponTypeEnum = ['percent', 'fixed', 'free_shipping'];

const createCouponSchema = Joi.object({
    code: Joi.string().max(50).required(),
    name: Joi.string().max(150).required(),
    description: Joi.string().allow('', null),
    type: Joi.string()
        .valid(...couponTypeEnum)
        .required(),
    value: Joi.when('type', {
        is: Joi.valid('free_shipping'),
        then: Joi.number().valid(0).default(0),
        otherwise: Joi.number().min(0).required(),
    }),
    isActive: Joi.boolean().default(true),
    minOrderAmount: Joi.number().min(0).allow(null),
    maxDiscountAmount: Joi.number().min(0).allow(null),
    usageLimit: Joi.number().integer().min(1).allow(null),
    usageLimitPerUser: Joi.number().integer().min(1).default(1),
    startDate: Joi.date().allow(null),
    endDate: Joi.date().allow(null),
    applicableProducts: Joi.array().items(Joi.number().integer()).allow(null),
    applicableCategories: Joi.array().items(Joi.number().integer()).allow(null),
    excludedProducts: Joi.array().items(Joi.number().integer()).allow(null),
    excludedCategories: Joi.array().items(Joi.number().integer()).allow(null),
    firstOrderOnly: Joi.boolean().default(false),
    applicableUserGroups: Joi.array().items(Joi.number().integer()).allow(null),
    createdBy: Joi.number().integer().allow(null),
    usedCount: Joi.number().integer().min(0).default(0),
});

const updateCouponSchema = Joi.object({
    id: Joi.number().integer().required(),
    code: Joi.string().max(50).required(),
    name: Joi.string().max(150).required(),
    description: Joi.string().allow('', null),
    type: Joi.string()
        .valid(...couponTypeEnum)
        .required(),
    value: Joi.when('type', {
        is: Joi.valid('free_shipping'),
        then: Joi.number().valid(0).default(0),
        otherwise: Joi.number().min(0).required(),
    }),
    isActive: Joi.boolean().default(true),
    minOrderAmount: Joi.number().min(0).allow(null),
    maxDiscountAmount: Joi.number().min(0).allow(null),
    usageLimit: Joi.number().integer().min(1).allow(null),
    usageLimitPerUser: Joi.number().integer().min(1).default(1),
    startDate: Joi.date().allow(null),
    endDate: Joi.date().allow(null),
    applicableProducts: Joi.array().items(Joi.number().integer()).allow(null),
    applicableCategories: Joi.array().items(Joi.number().integer()).allow(null),
    excludedProducts: Joi.array().items(Joi.number().integer()).allow(null),
    excludedCategories: Joi.array().items(Joi.number().integer()).allow(null),
    firstOrderOnly: Joi.boolean().default(false),
    applicableUserGroups: Joi.array().items(Joi.number().integer()).allow(null),
    createdBy: Joi.number().integer().allow(null),
    usedCount: Joi.number().integer().min(0).default(0),
    createTime: Joi.string().allow(null),
    updateTime: Joi.string().allow(null),
});

module.exports = {
    createCouponSchema,
    updateCouponSchema,
};
