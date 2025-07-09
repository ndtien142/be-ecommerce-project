'use strict';

const ProductService = require('../services/product/product.service');
const { CREATED, SuccessResponse } = require('../core/success.response');

class ProductController {
    createProduct = async (req, res, next) => {
        new CREATED({
            message: 'Tạo sản phẩm thành công',
            metadata: await ProductService.createProduct(req.body),
        }).send(res);
    };

    getProductById = async (req, res, next) => {
        new SuccessResponse({
            metadata: await ProductService.getProductById(req.params.id),
        }).send(res);
    };

    getAllProducts = async (req, res, next) => {
        new SuccessResponse({
            metadata: await ProductService.getAllProducts(req.query),
        }).send(res);
    };

    updateProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Cập nhật sản phẩm thành công',
            metadata: await ProductService.updateProduct(
                req.params.id,
                req.body,
            ),
        }).send(res);
    };

    deleteProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Xóa sản phẩm thành công',
            metadata: await ProductService.deleteProduct(req.params.id),
        }).send(res);
    };

    getProductBySlug = async (req, res, next) => {
        new SuccessResponse({
            metadata: await ProductService.getProductBySlug(req.params.slug),
        }).send(res);
    };
}

module.exports = new ProductController();
