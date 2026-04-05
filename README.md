# Money Tracker

Personal financial tracker dengan AI chatbot powered by Ollama.

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL 18.3
- **AI**: Ollama (gemma4:31b-cloud + nomic-embed-text)
- **Frontend**: Vanilla JS (modular)

## Features

- Track income & expenses dengan kategori
- AI Financial Advisor chatbot (GET: query data, POST: add transaction)
- Receipt image analysis (drag & drop + CTRL+V paste)
- Interactive charts (category breakdown + 7-day trend)
- Backup & restore (JSON export/import)
- Dark mode
- Mobile-first responsive design

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (untuk PostgreSQL & Ollama)

### Setup

```bash
# Clone repository
git clone <repo-url>
cd money-tracker

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start PostgreSQL & Ollama
docker-compose up -d postgres ollama

# Pull Ollama models
docker exec moneytracker_ollama ollama pull gemma4:31b-cloud
docker exec moneytracker_ollama ollama pull nomic-embed-text

# Run migrations (optional - docker-compose auto-migrates)
npm run migrate

# Start development server
npm run dev
```

Buka http://localhost:3000

### First-time Setup

1. Set 4-6 digit PIN saat pertama kali buka
2. PIN disimpan di localStorage untuk identifikasi data

## API Endpoints

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List transactions |
| POST | `/api/transactions` | Create transaction |
| DELETE | `/api/transactions/:id` | Delete single |
| DELETE | `/api/transactions` | Clear all |
| GET | `/api/transactions/balance` | Balance summary |
| GET | `/api/transactions/stats` | Chart stats |

### Chat (AI)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Chat + optional image |

### Backup
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/backup/export` | Export JSON |
| POST | `/api/backup/import` | Import JSON |

## Deployment (VPS)

### 1. Server Requirements

- Ubuntu 20.04+ / Debian 11+
- 2GB RAM minimum
- Docker + Docker Compose

### 2. Install

```bash
# SSH to server
ssh -i "your-key.pem" root@57.158.24.135

# Clone repository
git clone <repo-url> /app/money-tracker
cd /app/money-tracker

# Configure environment
cp .env.example .env
nano .env  # Set secure passwords

# Pull Ollama models
docker-compose up -d ollama
docker exec moneytracker_ollama ollama pull gemma4:31b-cloud
docker exec moneytracker_ollama ollama pull nomic-embed-text

# Build & start
docker-compose up -d

# Setup Nginx
sudo cp nginx.conf /etc/nginx/sites-available/money-tracker
sudo ln -s /etc/nginx/sites-available/money-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 3. Environment Variables

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=moneytracker
DB_USER=postgres
DB_PASSWORD=your_secure_password
PORT=3000
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma4:31b-cloud
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

## AI Chatbot Usage

### GET (Query Data)
- "What is my current balance?"
- "Show my expenses this month"
- "Give me financial analysis of the last 7 days"

### POST (Add Transaction)
- "I spent 10,000 on Nasi Padang"
- Attach receipt image via drag & drop or CTRL+V

### Image Support
- **Drag & drop**: Drop image onto chat window
- **Paste**: CTRL+V to paste from clipboard
- **File select**: Click attachment button

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Alt + C | Toggle chatbot |
| Alt + N | Focus amount input |
| Alt + D | Focus description |
| Ctrl + Enter | Submit form |
| Esc | Close chatbot/modal |

## Project Structure

```
money-tracker/
├── src/
│   ├── server/
│   │   ├── index.js           # Express entry
│   │   ├── routes/            # API routes
│   │   ├── db/                # PostgreSQL connection
│   │   ├── ai/                # Ollama integration
│   │   └── middleware/        # Error handling
│   └── frontend/
│       ├── index.html         # Entry point
│       ├── css/styles.css     # Styles
│       └── js/
│           ├── app.js         # Main logic
│           ├── api.js         # API client
│           ├── store.js       # State management
│           └── components/    # UI components
├── uploads/                   # Chat attachments
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
└── .env.example
```

## License

MIT - Iwan Kurniawan (BCB Academy)
