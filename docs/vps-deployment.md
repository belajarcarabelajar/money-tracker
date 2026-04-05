# VPS Deployment Guide

## VPS Info
- **Provider**: Azure
- **IP**: 57.158.24.135
- **SSH**: `ssh -i "C:\Users\Tedi Rahmat\BCB_key.pem" belajarcarabelajar@57.158.24.135`
- **App path**: `/app/money-tracker`

## Nginx Setup (One-time)

Create `/etc/nginx/sites-enabled/money-tracker`:

```nginx
server {
    listen 80;
    server_name app.belajarcarabelajar.com;
    return 301 https://app.belajarcarabelajar.com$request_uri;
}

server {
    listen 443 ssl;
    server_name app.belajarcarabelajar.com;

    ssl_certificate /etc/ssl/certs/cloudflare-origin.crt;
    ssl_certificate_key /etc/ssl/private/cloudflare-origin.key;

    client_max_body_size 10M;

    root /app/money-tracker/src/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        alias /app/money-tracker/uploads/;
        expires 7d;
    }
}
```

Then:
```bash
# Remove conflicting configs
sudo rm /etc/nginx/sites-enabled/moneytracker.disabled 2>/dev/null
sudo rm /etc/nginx/sites-enabled/moneytracker 2>/dev/null

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

## Deployment Steps

1. Push to GitHub:
```bash
git add . && git commit -m "..." && git push origin main
```

2. On VPS:
```bash
cd /app/money-tracker
git pull origin main

# If migration/schema changes:
sudo docker compose down -v && sudo docker compose up -d

# Otherwise (no schema change):
sudo docker compose up -d --build
```

3. Pull Ollama model (if new/changed):
```bash
sudo docker exec moneytracker_ollama ollama pull gemma4:31b-cloud
sudo docker exec moneytracker_ollama ollama pull nomic-embed-text
```

## Common Issues

### DB auth failed
Delete postgres volume and restart:
```bash
sudo docker compose down -v && sudo docker compose up -d
```

### Ollama model not available
```bash
sudo docker exec moneytracker_ollama ollama list
sudo docker exec moneytracker_ollama ollama pull gemma4:31b-cloud
```

### Nginx 404 on API
Check nginx config is loaded:
```bash
grep -r 'app.belajarcarabelajar.com' /etc/nginx/sites-enabled/
```

### Container port conflict
```bash
sudo fuser -k 3000/tcp
```
