export const fixQuery = (query: string) => {
  if (/^SELECT/i.test(query) && !query.includes('LIMIT')) {
    return query.trim() + ' LIMIT 100';
  }
  return query;
};