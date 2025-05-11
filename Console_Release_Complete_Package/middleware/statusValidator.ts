export const validateSystemStatus = () => {
  const envOk = !!process.env.NODE_ENV;
  const dbUrlOk = !!process.env.DB_URL;
  if (!envOk || !dbUrlOk) throw new Error('System status validation failed');
  return true;
};