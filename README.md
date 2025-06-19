# QRFarm Database

This repository contains the database schema and related files for the QRFarm project.

## Overview

QRFarm is a database system designed to manage farm-related data, including QR code tracking for agricultural products.

## Structure

- `/schema`: Contains SQL schema definitions
- `/migrations`: Database migration scripts
- `/queries`: Common SQL queries for the application
- `/scripts`: Utility scripts for database maintenance

## Setup

1. Clone this repository
2. Install required dependencies
3. Run initialization scripts

```bash
# Example setup commands
git clone https://github.com/yourusername/QRFarm_db.git
cd QRFarm_db
# Additional setup steps
```

## Usage
1. Install dependencies

   ```bash
   npm install
   ```

2. Configure the database
example .env file:

MONGODB_URI=mongodb+srv://ngocgiang1832004:<urpassword>@qrfarm.qdvnbak.mongodb.net/QRFarm?retryWrites=true&w=majority&appName=QRFarm
PORT=5000
HUGGINGFACE_API_KEY=<HUGGINGFACE_API_KEY_FOR_AI_CALL>

3. Start the app

   ```bash
   npm start
    or 
   npm run dev

