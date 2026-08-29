# REVIVE AI Backend API

Base URL:
http://localhost:5000

## Users

### Get all users
GET /api/users

## Transactions

### Get all transactions
GET /api/transactions

### Create transaction
POST /api/transactions

Body:
{
  "userId": 1,
  "amount": 2000,
  "category": "Sales",
  "description": "Second test sale",
  "currency": "INR",
  "status": "completed"
}

### Update transaction
PUT /api/transactions/:id

## Alerts

### Get all alerts
GET /api/alerts

### Create alert
POST /api/alerts

## Revenue Analysis

### Get analysis
GET /api/analysis/:userId

### Get analysis summary
GET /api/analysis/:userId/summary

### Generate automatic alert
POST /api/analysis/:userId/alerts

## Dashboard

### Get dashboard
GET /api/dashboard/:userId

## AI

### Get AI financial insight
GET /api/ai/:userId

### AI Chat
POST /api/ai/chat

Body:
{
  "userId": 1,
  "message": "Why has my revenue decreased?"
}

## Health

GET /api/health