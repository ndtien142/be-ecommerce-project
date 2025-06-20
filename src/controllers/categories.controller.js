'use strict';

const CategoriesService = require('../services/categories/categories.service');
const { CREATED, SuccessResponse } = require('../core/success.response');

class CategoriesController {
    createCategory = async (req, res, next) => {
        new CREATED({
            message: 'Category created successfully',
            metadata: await CategoriesService.createCategory(req.body),
        }).send(res);
    };

    getCategoryById = async (req, res, next) => {
        new SuccessResponse({
            metadata: await CategoriesService.getCategoryById(req.params.id),
        }).send(res);
    };

    getAllCategories = async (req, res, next) => {
        new SuccessResponse({
            metadata: await CategoriesService.getAllCategories(req.query),
        }).send(res);
    };

    updateCategory = async (req, res, next) => {
        new SuccessResponse({
            message: 'Category updated successfully',
            metadata: await CategoriesService.updateCategory(
                req.params.id,
                req.body,
            ),
        }).send(res);
    };

    deleteCategory = async (req, res, next) => {
        new SuccessResponse({
            message: 'Category deleted successfully',
            metadata: await CategoriesService.deleteCategory(req.params.id),
        }).send(res);
    };
}

module.exports = new CategoriesController();
