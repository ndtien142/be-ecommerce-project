'use strict';

const { OK, CREATED } = require('../utils/httpStatusCode');
const {
    SuccessResponse,
    CreatedResponse,
} = require('../core/success.response');
const { asyncHandler } = require('../helpers/asyncHandler');
const ProductSaleService = require('../services/promotion/productSale.service');

class ProductSaleController {
    /**
     * Tạo đợt sale cho sản phẩm
     */
    createProductSale = asyncHandler(async (req, res) => {
        const productSale = await ProductSaleService.createProductSale({
            ...req.body,
            created_by: req.user.id,
        });

        new CreatedResponse({
            message: 'Product sale created successfully',
            metadata: { product_sale: productSale },
        }).send(res);
    });

    /**
     * Lấy danh sách product sales
     */
    getProductSales = asyncHandler(async (req, res) => {
        const result = await ProductSaleService.getProductSales(req.query);

        new SuccessResponse({
            message: 'Get product sales successfully',
            metadata: result,
        }).send(res);
    });

    /**
     * Lấy active sale của sản phẩm
     */
    getActiveProductSale = asyncHandler(async (req, res) => {
        const { product_id } = req.params;
        const productSale =
            await ProductSaleService.getActiveProductSale(product_id);

        new SuccessResponse({
            message: 'Get active product sale successfully',
            metadata: { product_sale: productSale },
        }).send(res);
    });

    /**
     * Lấy danh sách sản phẩm đang sale
     */
    getProductsOnSale = asyncHandler(async (req, res) => {
        const result = await ProductSaleService.getProductsOnSale(req.query);

        new SuccessResponse({
            message: 'Get products on sale successfully',
            metadata: result,
        }).send(res);
    });

    /**
     * Cập nhật product sale
     */
    updateProductSale = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const productSale = await ProductSaleService.updateProductSale(
            id,
            req.body,
        );

        new SuccessResponse({
            message: 'Product sale updated successfully',
            metadata: { product_sale: productSale },
        }).send(res);
    });

    /**
     * Xóa product sale
     */
    deleteProductSale = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const result = await ProductSaleService.deleteProductSale(id);

        new SuccessResponse({
            message: 'Product sale deleted successfully',
            metadata: result,
        }).send(res);
    });

    /**
     * Tạo bulk sales cho campaign
     */
    createBulkSales = asyncHandler(async (req, res) => {
        const productSales = await ProductSaleService.createBulkSales({
            ...req.body,
            created_by: req.user.id,
        });

        new CreatedResponse({
            message: 'Bulk sales created successfully',
            metadata: {
                product_sales: productSales,
                count: productSales.length,
            },
        }).send(res);
    });

    /**
     * Lấy thống kê sale
     */
    getSaleStatistics = asyncHandler(async (req, res) => {
        const statistics = await ProductSaleService.getSaleStatistics(
            req.query,
        );

        new SuccessResponse({
            message: 'Get sale statistics successfully',
            metadata: { statistics },
        }).send(res);
    });
}

module.exports = new ProductSaleController();
