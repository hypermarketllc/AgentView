export function requirePermission(permission: string) {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !user.rolePermissions || !user.rolePermissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}