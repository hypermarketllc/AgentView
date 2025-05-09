# Docker Deployment Guide for MyAgentView CRM

This guide provides comprehensive instructions for deploying the MyAgentView CRM application using Docker. We've created different deployment options to accommodate various needs:

1. **Production Deployment** (Recommended): A full-stack deployment with both frontend and backend services, along with a PostgreSQL database.
2. **Nginx Static Deployment**: A lightweight deployment that serves only the frontend static files using Nginx.
3. **Local Development Deployment**: A development setup with hot-reloading and debugging capabilities.

## Option 1: Production Deployment (Recommended)

This deployment option includes both the frontend and backend services, along with a PostgreSQL database. It's designed for production use with proper security, performance, and reliability considerations.

### Files

- `Dockerfile.backend`: Dockerfile for the backend server
- `server-docker.js`: Backend server implementation using Express.js
- `docker-compose.prod.yml`: Docker Compose configuration for the production deployment
- `run-prod.sh` / `run-prod.bat`: Helper scripts for Unix/Windows

### Deployment Steps

1. **Start the production Docker containers**:

   **For Windows:**
   ```
   .\run-prod.bat
   ```

   **For Unix-based systems (Linux/macOS):**
   ```bash
   chmod +x run-prod.sh
   ./run-prod.sh
   ```

2. **Access the application**:
   
   Open your browser and navigate to:
   ```
   http://localhost:3000/crm
   ```

3. **Default admin account**:
   ```
   Email: admin@example.com
   Password: Admin123!
   ```

4. **View logs**:
   ```
   docker-compose -f docker-compose.prod.yml logs -f app
   ```

5. **Stop the application**:
   ```
   docker-compose -f docker-compose.prod.yml down
   ```

## Option 2: Nginx Static Deployment

This deployment option serves the frontend static files using Nginx. It's lightweight and fast, but doesn't include a backend server.

### Files

- `Dockerfile.nginx`: Multi-stage Dockerfile that builds the frontend and serves it using Nginx
- `nginx.conf`: Nginx configuration file
- `docker-compose.nginx.yml`: Docker Compose configuration for the Nginx deployment
- `run-nginx.sh` / `run-nginx.bat`: Helper scripts for Unix/Windows

### Deployment Steps

1. **Start the Nginx Docker container**:

   **For Windows:**
   ```
   .\run-nginx.bat
   ```

   **For Unix-based systems (Linux/macOS):**
   ```bash
   chmod +x run-nginx.sh
   ./run-nginx.sh
   ```

2. **Access the application**:
   
   Open your browser and navigate to:
   ```
   http://localhost/crm
   ```

3. **View logs**:
   ```
   docker-compose -f docker-compose.nginx.yml logs -f nginx
   ```

4. **Stop the application**:
   ```
   docker-compose -f docker-compose.nginx.yml down
   ```

## Option 3: Local Development Deployment

This deployment option is designed for local development with hot-reloading and debugging capabilities.

### Files

- `Dockerfile.local`: Dockerfile for the local development deployment
- `docker-compose.local.yml`: Docker Compose configuration for the local development deployment
- `run-local.sh` / `run-local.bat`: Helper scripts for Unix/Windows

### Deployment Steps

1. **Start the local development Docker containers**:

   **For Windows:**
   ```
   .\run-local.bat
   ```

   **For Unix-based systems (Linux/macOS):**
   ```bash
   chmod +x run-local.sh
   ./run-local.sh
   ```

2. **Access the application**:
   
   Open your browser and navigate to:
   ```
   http://localhost:3000/crm
   ```

3. **View logs**:
   ```
   docker-compose -f docker-compose.local.yml logs -f app
   ```

4. **Stop the application**:
   ```
   docker-compose -f docker-compose.local.yml down
   ```

## Production Deployment Considerations

For deploying to a production environment, consider the following:

1. **Security**:
   
   - Use strong, unique passwords for the database and JWT secret
   - Update the `docker-compose.prod.yml` file to use environment variables for sensitive information:
     ```yaml
     environment:
       POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
       JWT_SECRET: ${JWT_SECRET}
     ```
   - Use Docker secrets for sensitive information in a swarm deployment
   - Configure SSL/TLS for secure communication

2. **Performance**:
   
   - Adjust the PostgreSQL configuration for better performance based on your server's resources
   - Consider using a reverse proxy like Nginx or Traefik in front of the application
   - Implement caching strategies for frequently accessed data

3. **Reliability**:
   
   - Set up regular database backups
   - Implement monitoring and alerting
   - Configure proper logging and log rotation
   - Use Docker's restart policies for automatic recovery

4. **Scaling**:
   
   - Consider using Docker Swarm or Kubernetes for orchestration
   - Implement load balancing for horizontal scaling
   - Use a separate database server for high-traffic applications

## SSL/TLS Configuration

For production deployments, you should configure SSL/TLS for secure communication. Here's how to do it:

1. **Obtain SSL certificates**:
   
   You can use Let's Encrypt to obtain free SSL certificates:
   
   ```bash
   certbot certonly --standalone -d your-domain.com
   ```

2. **Update the Docker Compose file**:
   
   ```yaml
   volumes:
     - /etc/letsencrypt:/etc/letsencrypt
   ports:
     - "443:3000"
   ```

3. **Configure the application to use HTTPS**:
   
   Update the `server-docker.js` file to use HTTPS:
   
   ```javascript
   import https from 'https';
   import fs from 'fs';
   
   const options = {
     key: fs.readFileSync('/etc/letsencrypt/live/your-domain.com/privkey.pem'),
     cert: fs.readFileSync('/etc/letsencrypt/live/your-domain.com/fullchain.pem')
   };
   
   https.createServer(options, app).listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

## Troubleshooting

### Common Issues

1. **Port conflicts**:
   
   If you have port conflicts (e.g., port 80 or 3000 is already in use), modify the port mappings in the Docker Compose file:
   
   ```yaml
   ports:
     - "8080:3000"  # Map container port 3000 to host port 8080
   ```

2. **Database connection issues**:
   
   If you're having database connection issues, check the database logs:
   
   ```
   docker-compose -f docker-compose.prod.yml logs -f db
   ```

3. **Container fails to start**:
   
   Check the logs:
   
   ```
   docker-compose -f docker-compose.prod.yml logs
   ```

4. **Volume permissions**:
   
   If you encounter permission issues with volumes:
   
   ```bash
   # Fix permissions for PostgreSQL data directory
   docker-compose -f docker-compose.prod.yml down
   sudo chown -R $USER:$USER ./postgres-data-prod
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Docker Commands Reference

- **Build and start containers**:
  ```
  docker-compose -f docker-compose.prod.yml up -d --build
  ```

- **Stop containers**:
  ```
  docker-compose -f docker-compose.prod.yml down
  ```

- **View logs**:
  ```
  docker-compose -f docker-compose.prod.yml logs -f
  ```

- **Check container status**:
  ```
  docker-compose -f docker-compose.prod.yml ps
  ```

- **Execute command in container**:
  ```
  docker-compose -f docker-compose.prod.yml exec app sh
  ```

- **Restart container**:
  ```
  docker-compose -f docker-compose.prod.yml restart app
  ```

## Conclusion

This guide provides comprehensive instructions for deploying the MyAgentView CRM application using Docker. If you encounter any issues or have questions, please refer to the troubleshooting section or contact the development team.