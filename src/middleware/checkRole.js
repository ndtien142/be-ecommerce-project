// Middleware to check user role
module.exports = function checkRole([...allowedRoles]) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res
                .status(401)
                .json({ message: 'Unauthorized: No user or role found' });
        }
        if (!allowedRoles.includes(String(req.user.role.name))) {
            return res.status(403).json({ message: 'Lỗi quyền truy cập' });
        }
        next();
    };
};
