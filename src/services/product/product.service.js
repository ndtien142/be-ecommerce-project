'use strict';

const { BadRequestError, NotFoundError } = require('../../core/error.response');
const database = require('../../models');
const {
    getProductById,
    getAllProductsRepo,
    updateProductRepo,
    createProductRepo,
    getProductBySlugRepo,
    deleteImagesByProductId,
    deleteProductById,
} = require('../../repositories/product/product.repo');
const {
    getAllProductsFilterSchema,
    updateProductSchema,
    createProductSchema,
} = require('../../schema/product.schema');
const { toCamel } = require('../../utils/common.utils');

class ProductService {
    // Tạo sản phẩm - Admin
    static createProduct = async (payload) => {
        let { brandId, brand } = payload;

        if (
            (brandId === undefined || brandId === null) &&
            brand &&
            typeof brand === 'object' &&
            brand.id
        ) {
            brandId = brand.id;
        }

        const { error, value } = createProductSchema.validate(
            {
                ...payload,
                brandId,
                weight: payload.weight || 0,
                width: payload.width || 0,
                height: payload.height || 0,
                length: payload.length || 0,
            },
            { abortEarly: false },
        );

        const foundProductBySlug = await getProductBySlugRepo(value.slug);

        if (foundProductBySlug) {
            throw new BadRequestError(
                'Sản phẩm đã tồn tại, vui lòng sử dụng tên khác',
            );
        }

        if (error) {
            const message = error.details.map((d) => d.message).join(', ');
            throw new BadRequestError(`Dữ liệu không hợp lệ: ${message}`);
        }

        const transaction = await database.sequelize.transaction();
        try {
            const newProduct = await createProductRepo(value, transaction);
            if (
                Array.isArray(value.categories) &&
                value.categories.length > 0 &&
                newProduct.setCategories
            ) {
                await newProduct.setCategories(value.categories, {
                    transaction,
                });
            }
            if (Array.isArray(value.images) && value.images.length > 0) {
                const imageRecords = value.images.map((url, idx) => ({
                    product_id: newProduct.id,
                    image_url: url,
                    is_primary: idx === 0,
                    sort_order: idx,
                }));
                await database.ProductImage.bulkCreate(imageRecords, {
                    transaction,
                });
                await database.Product.update(
                    { thumbnail: value.images[0] },
                    { where: { id: newProduct.id }, transaction },
                );
            }
            await transaction.commit();

            // return toCamel(await getProductById(newProduct.id));
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    };

    // Lấy sản phẩm theo ID
    static async getProductById(id) {
        if (!id || isNaN(Number(id))) {
            throw new BadRequestError(
                'Dữ liệu truyền vào không đúng định dạng',
            );
        }
        const product = await getProductById(id);

        if (!product) throw new NotFoundError('Không tìm thấy sản phẩm');

        return toCamel(product.toJSON());
    }

    // Lấy tất cả sản phẩm
    // Phân trang theo page và limit
    static async getAllProducts(rawFilters) {
        const { error, value: filters } =
            getAllProductsFilterSchema.validate(rawFilters);

        if (error) throw new BadRequestError(error.message);

        const validSortFields = [
            'id',
            'name',
            'description',
            'product_type',
            'thumbnail',
            'slug',
            'status',
            'brand_id',
            'price',
            'flag',
            'stock',
            'min_stock',
            'weight',
            'width',
            'height',
            'length',
            'price_sale',
            'sold',
            'inventory_type',
            'create_time',
            'update_time',
        ];

        if (!validSortFields.includes(filters.sortBy)) {
            filters.sortBy = 'create_time';
        }

        const { items, totalItems, selectedCategory, includedCategoryIds } =
            await getAllProductsRepo(filters);

        const totalPages = Math.ceil(totalItems / filters.limit);

        const response = {
            items: items.map((p) => toCamel(p.toJSON())),
            meta: {
                currentPage: filters.page,
                itemPerPage: filters.limit,
                totalItems,
                totalPages,
                filters,
            },
        };

        if (selectedCategory) {
            response.category = toCamel(selectedCategory.toJSON());
            response.meta.includedCategoryIds = includedCategoryIds;
        }

        return response;
    }

    // Cập nhật sản phẩm
    static async updateProduct(id, payload) {
        const { error, value } = updateProductSchema.validate(payload);
        if (error) throw new BadRequestError(error.details[0].message);
        return await updateProductRepo(id, value);
    }

    // Xóa sản phẩm
    // Chỉ xóa sản phẩm chưa có đơn đặt hàng
    static async deleteProduct(id) {
        // Kiểm tra tồn tại sản phẩm
        const product = await getProductById(id);

        if (!product) {
            throw new NotFoundError('Không tìm thấy sản phẩm');
        }

        // Kiểm tra sản phẩm có trong đơn hàng chưa
        const orderCount = await database.OrderLineItem.count({
            where: { product_id: id },
        });
        if (orderCount > 0) {
            throw new BadRequestError(
                'Không thể xóa sản phẩm vì nó đã được sử dụng trong đơn hàng',
            );
        }

        const cartCount = await database.CartLineItem.count({
            where: { product_id: id },
        });
        if (cartCount > 0) {
            // Transaction để xóa hình ảnh và sản phẩm
            const transaction = await database.sequelize.transaction();
            try {
                await deleteImagesByProductId(id, transaction);
                await deleteProductById(id, transaction);
                await transaction.commit();
                return { message: 'Xóa sản phẩm thành công' };
            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        }
    }

    // Lấy sản phẩm theo slug
    static async getProductBySlug(slug) {
        const product = await getProductBySlugRepo(slug);

        if (!product) throw new NotFoundError('Không tìm thấy sản phẩm');
        if (product.status !== 'active') {
            throw new BadRequestError('Sản phẩm không hoạt động');
        }
        return toCamel(product.toJSON());
    }
}

module.exports = ProductService;
