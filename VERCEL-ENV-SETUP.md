# Environment Variables for Vercel Deployment

## Required Environment Variables

You need to set these in your Vercel dashboard:

### MongoDB Connection
```
MONGODB_URI=your_mongodb_atlas_connection_string
```
Example: `mongodb+srv://username:password@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority`

### JWT Secret
```
JWT_SECRET=your-super-secret-jwt-key-here
```

### Redis Connection (Optional - for caching)
```
REDIS_URL=your_redis_connection_string
REDIS_PASSWORD=your_redis_password
```

### Frontend URL (Optional)
```
FRONTEND_URL=https://your-vercel-app.vercel.app
```

## How to Set Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Go to Settings → Environment Variables
3. Add each variable with its value
4. Make sure to set them for Production, Preview, and Development environments
5. Redeploy your application

## Critical Notes

- **Never commit .env files to Git**
- Use MongoDB Atlas (cloud) for production, not local MongoDB
- Generate a strong JWT_SECRET (use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- Redis is optional but recommended for production caching
