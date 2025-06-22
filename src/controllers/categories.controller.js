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

    getCategoryTree = async (req, res, next) => {
        new SuccessResponse({
            metadata: await CategoriesService.getCategoryTree(),
        }).send(res);
    };

    reorderCategory = async (req, res, next) => {
        const { categoryId, newParentId, orderedSiblingIds } = req.body;
        new SuccessResponse({
            message: 'Category reordered successfully',
            metadata: await CategoriesService.updateCategoryParentAndOrder(
                categoryId,
                newParentId,
                orderedSiblingIds,
            ),
        }).send(res);
    };

    reorderAllCategories = async (req, res, next) => {
        new SuccessResponse({
            message: 'All categories reordered successfully',
            metadata: await CategoriesService.reorderFullCategoryTree(req.body),
        }).send(res);
    };
}

module.exports = new CategoriesController();
