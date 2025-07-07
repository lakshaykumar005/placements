# Logging Middleware

Reusable logging middleware package for both backend and frontend applications.

## Requirements
- Implement a function: `Log(stack, level, package, message)`
- Makes an API call to: `http://20.244.56.144/evaluation-service/logs`
- Use TypeScript/JavaScript
- Must be reusable and importable by both backend and frontend

## Usage Example
```js
Log("backend", "error", "handler", "received string, expected bool")
```

## Notes
- Do not include your name or company name anywhere in the code, README, or commits.
- Follow production-grade coding standards and best practices. 