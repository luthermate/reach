# Reach API Documentation

## Base URL
```
https://api.reach.local (development)
https://api.reach.app (production)
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer {jwt_token}
```

## Auth Endpoints

### POST /auth/register
Register a new user
```json
{
  "email": "user@example.com",
  "phone": "+260....",
  "password": "securePassword123",
  "first_name": "John",
  "last_name": "Doe"
}
```

### POST /auth/login
Login user
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### POST /auth/logout
Logout user (protected)

## User Endpoints

### GET /users/me
Get current user profile (protected)

### PUT /users/me
Update user profile (protected)
```json
{
  "first_name": "John",
  "bio": "Love coffee and hiking",
  "age": 28,
  "location": "Lusaka"
}
```

### GET /users/:id
Get user profile by ID

## Interests Endpoints

### GET /interests
Get all available interests

### POST /users/me/interests
Add interests to current user (protected)
```json
{
  "interest_ids": [1, 2, 3]
}
```

## Discovery Endpoints

### GET /discovery/matches
Get matched users based on interests (protected)
```
GET /discovery/matches?limit=10&offset=0
```

### GET /discovery/suggestions
Get user suggestions (protected)

## Matching Endpoints

### POST /matches/like
Like a user (protected)
```json
{
  "matched_user_id": 123
}
```

### POST /matches/reject
Reject a user (protected)

### GET /matches
Get all matches (protected)

## Messages Endpoints

### GET /messages/:user_id
Get message history with a user (protected)

### POST /messages
Send message (protected)
```json
{
  "recipient_id": 123,
  "content": "Hi there!"
}
```

### GET /messages/conversations
Get all conversations (protected)

## Subscription Endpoints

### GET /subscriptions/current
Get current user subscription (protected)

### POST /subscriptions/checkout
Create checkout session (protected)
```json
{
  "plan_type": "premium"
}
```

### POST /subscriptions/webhook
Stripe webhook for payment updates

## Error Responses

```json
{
  "error": "Error message",
  "status": 400
}
```
