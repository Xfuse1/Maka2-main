# MakaStore - E-commerce Platform

A modern e-commerce platform built with Next.js 15, featuring Arabic RTL support, payment integration with Kashier, and comprehensive product management.

## 🚀 Features

- **Multi-language Support**: Full Arabic RTL interface with English fallbacks
- **Product Categories**: Abayas, Cardigans, Dresses, Suits, and more
- **Shopping Cart**: Zustand-powered state management with persistent storage  
- **Payment Integration**: 
  - Cash on Delivery (COD)
  - Kashier Payment Gateway (Palestinian payment processor)
- **Admin Dashboard**: Complete product and order management
- **Database**: Supabase PostgreSQL with comprehensive schema
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Type Safety**: Full TypeScript implementation

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payment**: Kashier Gateway
- **Deployment Ready**: Vercel, Netlify compatible

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/MakaStore.git
cd MakaStore
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Kashier Payment Gateway
KASHIER_API_KEY=your_kashier_api_key
KASHIER_MERCHANT_ID=your_merchant_id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Run the development server:
```bash
npm run dev
```

## 🎯 Usage

### Customer Flow
- Browse products by category
- Add items to cart with size/color selection  
- Proceed to checkout with shipping details
- Choose payment method (COD or Kashier)
- Complete order and receive confirmation

### Admin Flow
- Access admin dashboard at `/admin`
- Manage products, categories, and orders
- View analytics and sales reports

## 🔧 Development

For payment testing, set `KASHIER_DEV_BYPASS=true` in your `.env.local` to bypass payment gateway issues.

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests for any improvements.
