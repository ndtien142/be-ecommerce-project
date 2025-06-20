import { v4 as uuidv4 } from 'uuid';
export const generateUserCode = () => {
  return uuidv4().replace(/-/g, '').slice(0, 20);
};

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
