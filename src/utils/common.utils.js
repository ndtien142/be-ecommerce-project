export const getUnSelectData = (unSelect = []) => {
    return Object.fromEntries(unSelect.map((el) => [el, 0]));
};

export const removeUndefinedObject = (obj) => {
    Object.keys(obj).forEach((k) => {
        if (obj[k] == null || obj[k] === undefined) {
            delete obj[k];
        }
    });

    return obj;
};

export const getKeyByValue = (object, value) => {
    return Object.keys(object).find((key) => object[key] === value);
};

export const toCamel = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map((v) => toCamel(v));
    } else if (obj && typeof obj === 'object') {
        // Prevent recursion on Date objects
        if (obj instanceof Date) {
            return obj;
        }
        return Object.entries(obj).reduce((acc, [key, value]) => {
            const camelKey = key.replace(/_([a-z])/g, (g) =>
                g[1].toUpperCase(),
            );
            acc[camelKey] = toCamel(value);
            return acc;
        }, {});
    }
    return obj;
};
