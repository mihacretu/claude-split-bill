# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [https://app.supabase.com/](https://app.supabase.com/)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization and fill in project details
5. Wait for the project to be created (usually takes 2-3 minutes)

## 2. Get Your Project Credentials

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (something like `https://your-project-id.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## 3. Configure Your App with Environment Variables

1. Open the `.env` file in your project root (create it from `.env.example` if it doesn't exist)
2. Replace the placeholder values with your actual credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## 3. Alternative: Quick Setup Script

You can also set your credentials using these commands in your terminal:

```bash
# Replace with your actual values
echo "EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co" > .env
echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." >> .env
```

## 4. Enable Email Authentication (Optional but Recommended)

1. In your Supabase project dashboard, go to **Authentication** > **Settings**
2. Under **Auth Providers**, make sure **Email** is enabled
3. Configure email templates if desired
4. Set up email confirmation (recommended for production)

## 5. Set up Row Level Security (RLS) - Optional

For production apps, you should enable Row Level Security on your tables:

1. Go to **Database** > **Tables**
2. Create your app-specific tables (bills, users, etc.)
3. Enable RLS and create appropriate policies

## 6. Test the Integration

1. Start your Expo development server: `npm start`
2. Try signing up with a test email
3. Check the **Authentication** > **Users** section in Supabase to see if the user was created

## Troubleshooting

- **"Invalid JWT"**: Check that your anon key is correct and hasn't expired
- **CORS errors**: Make sure you're using the correct Supabase URL
- **Email not sending**: Check your email provider settings in Supabase Auth settings
