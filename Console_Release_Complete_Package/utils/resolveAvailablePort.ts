import net from 'net';

export const resolveAvailablePort = (start = 5005) => {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(start, () => {
      server.once('close', () => resolve(start));
      server.close();
    });
    server.on('error', () => resolve(resolveAvailablePort(start + 1)));
  });
};