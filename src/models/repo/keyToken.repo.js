const db = require('../../models');

const createKeyToken = async ({
    userId,
    privateKey,
    publicKey,
    refreshToken = '',
}) => {
    try {
        const foundTokens = await db.KeyToken.findOne({
            where: { user_id: userId },
        });
        if (foundTokens) {
            await updateKeyToken({
                id: foundTokens.id,
                privateKey,
                publicKey,
                refreshToken,
            });
            return foundTokens;
        }

        const tokens = await db.KeyToken.create({
            privateKey,
            publicKey,
            refreshToken,
            user_id: userId,
        });

        return tokens ? tokens.publicKey : null;
    } catch (err) {
        return err;
    }
};

const updateKeyToken = async ({
    id,
    privateKey,
    publicKey,
    refreshToken = '',
}) => {
    return await db.KeyToken.update(
        {
            privateKey,
            publicKey,
            refreshToken,
        },
        { where: { id } },
    );
};

const findKeyTokenByUserId = async (userId) => {
    return await db.KeyToken.findOne({ where: { user_id: userId } });
};

const removeKeyTokenByUserId = async (userId) => {
    const result = await db.KeyToken.destroy({
        where: { user_id: userId },
    });
    return result;
};

module.exports = {
    createKeyToken,
    findKeyTokenByUserId,
    removeKeyTokenByUserId,
    updateKeyToken,
};
