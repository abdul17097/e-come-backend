export const roleMiddleware = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            throw new Error("User not found");
        }
        if (user.role !== "admin") {
            throw new Error("Unauthorized");
        }
        next();
    } catch (error) {
        throw new Error(error);
    }
}