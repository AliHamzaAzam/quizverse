export const validateAdminOrigin = (req, res, next) => {
    const origin = req.get('origin');

    if (origin !== process.env.ADMIN_URL) {
        return res.status(403).json({
            message: 'Admin access requires valid origin'
        });
    }

    next();
};