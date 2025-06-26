const database = require('../../models');
const { toCamel } = require('../../utils/common.utils');

class AccountService {
    static async getProfile(userId) {
        const profile = await database.Profile.findOne({
            where: { user_id: userId },
            include: [
                {
                    model: database.User,
                    as: 'user',
                    attributes: ['user_nickname', 'user_date_of_birth'],
                },
            ],
        });
        if (!profile) return null;
        // Format result to merge user fields at top level
        const result = profile.toJSON();
        if (result.user) {
            result.nickname = result.user.user_nickname;
            result.dateOfBirth = result.user.user_date_of_birth;
            delete result.user;
        }
        return toCamel(result);
    }

    static async updateProfile(userId, params) {
        // Destructure camelCase params from FE
        const {
            phoneNumber,
            firstName,
            lastName,
            fullName,
            avatarUrl,
            address,
            province,
            district,
            ward,
            postalCode,
            bio,
            gender,
            nickname,
            dateOfBirth,
        } = params;

        // Map to snake_case for DB
        const profileData = {
            phone_number: phoneNumber,
            first_name: firstName,
            last_name: lastName,
            full_name: fullName,
            avatar_url: avatarUrl,
            address,
            province,
            district,
            ward,
            postal_code: postalCode,
            bio,
            gender,
        };

        const accountData = {
            user_nickname: nickname,
            user_date_of_birth: dateOfBirth,
        };

        // Remove undefined or null fields
        Object.keys(profileData).forEach(
            (key) =>
                (profileData[key] === undefined || profileData[key] === null) &&
                delete profileData[key],
        );

        Object.keys(accountData).forEach(
            (key) =>
                (accountData[key] === undefined || accountData[key] === null) &&
                delete accountData[key],
        );

        let profile = await database.Profile.findOne({
            where: { user_id: userId },
        });

        let account = await database.User.findOne({
            where: { id: userId },
        });

        if (account) {
            await account.update(accountData);
        }

        if (profile) {
            await profile.update(profileData);
        } else {
            profile = await database.Profile.create({
                user_id: userId,
                ...profileData,
            });
        }
        return toCamel(profile);
    }
}

module.exports = AccountService;
