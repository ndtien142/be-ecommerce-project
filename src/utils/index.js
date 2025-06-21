const _ = require('lodash');
const { Types } = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const generateUserId = () => {
    return uuidv4().replace(/-/g, '').slice(0, 20);
};

const convertToObjectIdMongodb = (id) => new Types.ObjectId(id);

const toCamelCase = (key) => {
    const withoutPrefix = key.replace(/^fk_/, '');
    return withoutPrefix.replace(/_([a-z])/g, (match, letter) =>
        letter.toUpperCase(),
    );
};

const getInfoData = ({ fields = [], object = {} }) => {
    const pickedData = _.pick(object, fields);

    const transformedData = {};
    Object.keys(pickedData).forEach((key) => {
        transformedData[toCamelCase(key)] = pickedData[key];
    });

    return transformedData;
};

// convert ['a', 'b'] => {a: 1, b: 1}
const getSelectData = (select = []) => {
    return Object.fromEntries(select.map((el) => [el, 1]));
};

const getUnSelectData = (unSelect = []) => {
    return Object.fromEntries(unSelect.map((el) => [el, 0]));
};

const removeUndefinedObject = (obj) => {
    Object.keys(obj).forEach((k) => {
        if (obj[k] == null || obj[k] === undefined) {
            delete obj[k];
        }
    });

    return obj;
};
/**
    In mongoose have 100 nested objects.
    {
        a : 1,
        c : {
            b : 2,
            d: 3
        }
    }

    will convert to 

    {
        a: 1,
        'c.b' : 2,
        'c.d' : 3
    }

 */

const updateNestedObject = (obj) => {
    const final = {};
    Object.keys(obj || {}).forEach((key) => {
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            const response = updateNestedObject(obj[key]);
            Object.keys(response || {}).forEach((k) => {
                final[`${key}.${k}`] = response[k];
            });
        } else {
            final[key] = obj[key];
        }
    });
    return final;
};

const getKeyByValue = (object, value) => {
    return Object.keys(object).find((key) => object[key] === value);
};

module.exports = {
    getInfoData,
    getSelectData,
    getUnSelectData,
    removeUndefinedObject,
    updateNestedObject,
    convertToObjectIdMongodb,
    generateUserId,
    getKeyByValue,
};
