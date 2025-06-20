'use strict';

const BrandService = require('../services/product/brand.service');
const { CREATED, SuccessResponse } = require('../core/success.response');

class BrandController {
    createBrand = async (req, res, next) => {
        new CREATED({
            message: 'Brand created successfully',
            metadata: await BrandService.createBrand(req.body),
        }).send(res);
    };

    getBrandById = async (req, res, next) => {
        new SuccessResponse({
            metadata: await BrandService.getBrandById(req.params.id),
        }).send(res);
    };

    getAllBrands = async (req, res, next) => {
        new SuccessResponse({
            metadata: await BrandService.getAllBrands(req.query),
        }).send(res);
    };

    updateBrand = async (req, res, next) => {
        new SuccessResponse({
            message: 'Brand updated successfully',
            metadata: await BrandService.updateBrand(req.params.id, req.body),
        }).send(res);
    };

    deleteBrand = async (req, res, next) => {
        new SuccessResponse({
            message: 'Brand deleted successfully',
            metadata: await BrandService.deleteBrand(req.params.id),
        }).send(res);
    };
}

module.exports = new BrandController();
