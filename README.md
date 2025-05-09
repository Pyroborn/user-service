# User Service

A microservice that provides user management for the microservice architecture.

## Main Objectives

- Provides user identity for tickets
- No real authentication (simulated via X-User-Id header)
- Stores basic user info like id, name, and roles
- Allows other services to validate user existence
- Provides minimal user lookup
- Uses JSON files for persistence

## API Endpoints

### GET /users
Returns a list of all users.

### GET /users/:id
Returns a single user by ID.

### POST /users
Creates a new user.

**Request Body:**
```json
{
  "id": "optional_custom_id",
  "name": "User Name",
  "role": "user"
}
```

### GET /users/validate/user
Validates a user from the X-User-Id header.

**Headers Required:**
- X-User-Id: The ID of the user to validate

## Integration for Other Services

Other services should:
1. Read X-User-Id from headers
2. Call GET http://user-service/users/:id to validate
3. Use name or role in outputs

## Development

### Running Locally

```
npm install
npm run dev
```

### Building Docker Image

```
docker build -t user-service .
```

### Running Docker Container

```
docker run -p 3003:3003 user-service
``` 