'use strict';

const { BadRequestError, NotFoundError } = require('../../core/error.response');
const database = require('../../models');

// Helper to convert snake_case keys to camelCase recursively
function toCamel(obj) {
    if (Array.isArray(obj)) {
        return obj.map((v) => toCamel(v));
    } else if (obj && typeof obj === 'object') {
        return Object.entries(obj).reduce((acc, [key, value]) => {
            const camelKey = key.replace(/_([a-z])/g, (g) =>
                g[1].toUpperCase(),
            );
            acc[camelKey] = toCamel(value);
            return acc;
        }, {});
    }
    return obj;
}

class BrandService {
    static async createBrand({
        name,
        description,
        logoUrl,
        status = 'active',
    }) {
        if (!name || typeof name !== 'string') {
            throw new BadRequestError(
                'Brand name is required and must be a string',
            );
        }
        const existing = await database.Brand.findOne({ where: { name } });
        if (existing) throw new BadRequestError('Brand name already exists');
        const brand = await database.Brand.create({
            name,
            description,
            logo_url: logoUrl,
            status,
        });
        return toCamel(brand.toJSON());
    }

    static async getBrandById(id) {
        const brand = await database.Brand.findByPk(id);
        if (!brand) throw new NotFoundError('Brand not found');
        return toCamel(brand.toJSON());
    }

    static async getAllProducts({ page = 1, limit = 20 }) {
        limit = Number(limit) || 20;
        page = Number(page) || 1;
        const offset = (page - 1) * limit;

        const brands = await database.Brand.findAndCountAll({
            limit,
            offset,
        });

        const totalItems = brands.count;
        const totalPages = Math.ceil(totalItems / limit);

        return {
            items: brands.rows.map((b) => toCamel(b.toJSON())),
            meta: {
                currentPage: page,
                itemPerPage: limit,
                totalItems,
                totalPages,
            },
        };
    }

    static async updateBrand(id, updateData) {
        const mappedData = {};
        if (updateData.name !== undefined) mappedData.name = updateData.name;
        if (updateData.description !== undefined)
            mappedData.description = updateData.description;
        if (updateData.logoUrl !== undefined)
            mappedData.logo_url = updateData.logoUrl;
        if (updateData.status !== undefined)
            mappedData.status = updateData.status;

        const [affectedRows] = await database.Brand.update(mappedData, {
            where: { id },
        });
        if (!affectedRows)
            throw new NotFoundError('Brand not found or not updated');
        return await BrandService.getBrandById(id);
    }

    static async deleteBrand(id) {
        const [affectedRows] = await database.Brand.update(
            { status: 'inactive' },
            {
                where: {
                    id,
                    status: { [database.Sequelize.Op.ne]: 'inactive' },
                },
            },
        );
        if (!affectedRows)
            throw new NotFoundError('Brand not found or already deleted');
        return {
            message: 'Brand deleted (status set to inactive) successfully',
        };
    }
}

module.exports = BrandService;
