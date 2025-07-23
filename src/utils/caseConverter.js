'use strict';

const toSnake = (obj) => {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => toSnake(item));
    }

    const snakeObj = {};
    Object.keys(obj).forEach((key) => {
        const snakeKey = key.replace(
            /[A-Z]/g,
            (letter) => `_${letter.toLowerCase()}`,
        );
        snakeObj[snakeKey] = toSnake(obj[key]);
    });

    return snakeObj;
};

const toCamel = (obj) => {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => toCamel(item));
    }

    const camelObj = {};
    Object.keys(obj).forEach((key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
            letter.toUpperCase(),
        );
        camelObj[camelKey] = toCamel(obj[key]);
    });

    return camelObj;
};

module.exports = { toSnake, toCamel };
