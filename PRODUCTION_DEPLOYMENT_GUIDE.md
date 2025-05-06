# Production Docker Deployment Guide for MyAgentView CRM

This guide provides comprehensive instructions for deploying the MyAgentView CRM application to a production Linux server using Docker and Docker Compose after successful local testing.

## Prerequisites

- Linux server with Docker Engine (20.10+) and Docker Compose (2.0+) installed
- Domain name pointing to your server (for SSL setup)
- At least 4GB RAM and 2 CPU cores recommended
- Ports 80 and 443 available for web traffic

## Deployment Steps

### 1. Prepare the Server

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker if not already installed
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose if not already installed
sudo apt install -y docker-compose-plugin
```

### 2. Transfer Files to the Server

Transfer all necessary files to your production server:

```bash
# Create a deployment directory on your local machine
mkdir -p deployment

# Copy necessary files to the deployment directory
cp Dockerfile docker-compose.yml .dockerignore .env.production nginx-crm.conf setup-db-permissions.sql deployment/

# Copy application files
cp -r src dist supabase-export deployment/

# Transfer the deployment directory to your server
scp -r deployment user@your-server-ip:/opt/crm
```

Alternatively, if you're using Git:

```bash
# On your server
git clone https://your-repository-url.git /opt/crm
cd /opt/crm
```

### 3. Configure Environment Variables

Create a `.env` file on your production server:

```bash
# SSH into your server
ssh user@your-server-ip

# Navigate to the application directory
cd /opt/crm

# Create the .env file
cat > .env << EOL
# Production environment variables
NODE_ENV=production
BASE_URL=https://your-domain.com/crm

# Database connection
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=crm_db
POSTGRES_USER=crm_user
POSTGRES_PASSWORD=your_strong_password_here

# Supabase credentials (if using Supabase)
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
EOL
```

Replace the placeholder values with your actual configuration.

### 4. Configure Nginx

Update the `nginx-crm.conf` file to include your domain name:

```bash
# Edit the Nginx configuration file
nano nginx-crm.conf
```

Ensure the server_name directive is set to your domain:

```nginx
server_name your-domain.com;
```

### 5. Set Up SSL Certificates

```bash
# Create directories for certbot
mkdir -p ./certbot/conf
mkdir -p ./certbot/www

# Obtain SSL certificate
docker-compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot \
  --email your-email@example.com -d your-domain.com --agree-tos --no-eff-email
```

### 6. Start the Services

```bash
# Start all services in detached mode
docker-compose up -d

# Check if all services are running
docker-compose ps
```

### 7. Verify the Deployment

Access your application at `https://your-domain.com/crm`

You can also check the API health endpoint at `https://your-domain.com/crm/api/health`

## Monitoring and Maintenance

### Viewing Logs

```bash
# View logs for all services
docker-compose logs

# View logs for a specific service
docker-compose logs app
docker-compose logs db
docker-compose logs nginx

# Follow logs in real-time
docker-compose logs -f
```

### Updating the Application

When you need to update the application:

```bash
# Pull the latest changes (if using Git)
git pull

# Rebuild and restart the containers
docker-compose build
docker-compose up -d
```

### Database Backup and Restore

```bash
# Create a backup of the database
docker-compose exec db pg_dump -U crm_user -d crm_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from a backup
cat backup_file.sql | docker-compose exec -T db psql -U crm_user -d crm_db
```

### SSL Certificate Renewal

Certbot will automatically attempt to renew certificates that are close to expiration. You can manually trigger a renewal with:

```bash
docker-compose run --rm certbot renew
```

## Troubleshooting

### 1. Container Fails to Start

Check the logs:

```bash
docker-compose logs app
```

### 2. Database Connection Issues

Verify database connection:

```bash
docker-compose exec app node -e "const { Pool } = require('pg'); const pool = new Pool({host: 'db', port: 5432, database: 'crm_db', user: 'crm_user', password: process.env.POSTGRES_PASSWORD}); pool.query('SELECT NOW()', (err, res) => { console.log(err, res); pool.end(); });"
```

### 3. Nginx Configuration Issues

Check Nginx configuration:

```bash
docker-compose exec nginx nginx -t
```

### 4. SSL Certificate Issues

Check Certbot logs:

```bash
docker-compose logs certbot
```

## Security Considerations

1. **Environment Variables**: Never commit sensitive environment variables to version control.

2. **Database Passwords**: Use strong, unique passwords for your database.

3. **Regular Updates**: Keep your Docker images and containers updated with security patches.

4. **Firewall Configuration**: Configure your server firewall to only allow necessary ports (80, 443).

5. **Backup Strategy**: Implement regular backups of your database and application data.

## Performance Optimization

The Docker Compose file includes resource constraints for each service. Adjust these limits in the `docker-compose.yml` file based on your server capabilities:

```yaml
deploy:
  resources:
    limits:
      cpus: '1'  # Limit to 1 CPU core
      memory: 1G  # Limit to 1GB RAM
    reservations:
      cpus: '0.25'  # Reserve 0.25 CPU cores
      memory: 512M  # Reserve 512MB RAM
```

## Scaling Considerations

For higher traffic loads, consider:

1. **Horizontal Scaling**: Deploy multiple application containers behind a load balancer.
2. **Database Optimization**: Tune PostgreSQL for better performance.
3. **Caching**: Implement Redis or another caching solution.
4. **CDN**: Use a Content Delivery Network for static assets.