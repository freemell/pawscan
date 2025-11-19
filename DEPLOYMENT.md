# Deployment Guide

## Vercel Deployment

### Environment Variables

**IMPORTANT**: You must configure the following environment variable in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variable:

```
MORALIS_API_KEY=your_moralis_api_key_here
```

4. Make sure to add it for **Production**, **Preview**, and **Development** environments
5. After adding, **redeploy** your application for the changes to take effect

### Why it's not working on the site

If the API works on localhost but not on the deployed site, it's almost certainly because:
- The `MORALIS_API_KEY` environment variable is not set in Vercel
- The variable was added but the app wasn't redeployed
- The variable name is incorrect (should be `MORALIS_API_KEY`, not `VITE_MORALIS_API_KEY`)

### Quick Fix

1. Get your Moralis API key from [Moralis Dashboard](https://admin.moralis.io/)
2. In Vercel: **Settings** → **Environment Variables** → **Add New**
3. Name: `MORALIS_API_KEY`
4. Value: `your_api_key_here`
5. Select all environments (Production, Preview, Development)
6. Click **Save**
7. Go to **Deployments** tab and click **Redeploy** on the latest deployment

### Verifying

After redeploying, check the Vercel function logs:
- Go to **Deployments** → Click on the latest deployment → **Functions** tab
- Check for any errors mentioning "Missing MORALIS_API_KEY"

If you see that error, the environment variable is still not set correctly.


