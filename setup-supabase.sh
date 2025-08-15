#!/bin/bash

echo "🚀 Supabase Setup Script"
echo "========================"
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# Copy .env.example to .env
if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
else
    echo "❌ .env.example not found!"
    exit 1
fi

echo ""
echo "📝 Now you need to edit the .env file with your Supabase credentials:"
echo ""
echo "1. Go to https://app.supabase.com/"
echo "2. Create a new project or select an existing one"
echo "3. Go to Settings > API"
echo "4. Copy your Project URL and anon/public key"
echo "5. Edit the .env file and replace the placeholder values"
echo ""
echo "Your .env file is ready to edit:"
echo "$(pwd)/.env"
echo ""

# Ask if they want to open the file
read -p "Would you like to open the .env file now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Try different editors
    if command -v code &> /dev/null; then
        code .env
    elif command -v nano &> /dev/null; then
        nano .env
    elif command -v vim &> /dev/null; then
        vim .env
    else
        echo "Please edit .env manually with your preferred editor"
    fi
fi

echo ""
echo "🎉 Setup complete! Don't forget to add your actual Supabase credentials to .env"
