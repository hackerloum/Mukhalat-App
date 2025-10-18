# Mukhallat App - Web Version

A React TypeScript web application for perfume inventory management, built to work alongside the Flutter mobile app using the same Supabase backend.

## Features

- **Authentication**: Sign in/Sign up with email and password
- **Role-based Access**: Admin, Manager, and Staff roles
- **Inventory Management**: View perfume inventory with cost, sell, and store prices
- **Real-time Data**: Connected to the same Supabase database as the mobile app
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Search & Filter**: Search through perfume inventory
- **Stock Management**: Track low stock and out-of-stock items

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Supabase** for backend services
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the web directory:
   ```bash
   cd web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
web/
├── src/
│   ├── components/          # React components
│   │   ├── AuthScreen.tsx   # Authentication UI
│   │   └── Dashboard.tsx     # Main dashboard
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx  # Authentication context
│   ├── lib/                 # Utilities and configurations
│   │   └── supabase.ts      # Supabase client and types
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # App entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Database Schema

The web app uses the same Supabase database as the Flutter app:

- **app_users**: User accounts with roles
- **perfumes**: Perfume inventory with cost, sell, and store prices
- **orders**: Customer orders
- **order_items**: Items within orders

## Authentication

The app supports three user roles:

- **Admin**: Full access to all features
- **Manager**: Can manage inventory and view reports
- **Staff**: Can view inventory and process orders

## Features Comparison with Mobile App

| Feature | Mobile App | Web App |
|---------|------------|---------|
| Authentication | ✅ | ✅ |
| Inventory View | ✅ | ✅ |
| Add/Edit Products | ✅ | 🔄 (Coming Soon) |
| Orders Management | ✅ | 🔄 (Coming Soon) |
| Reports | ✅ | 🔄 (Coming Soon) |
| Image Upload | ✅ | 🔄 (Coming Soon) |

## Development

### Adding New Features

1. Create components in `src/components/`
2. Add types to `src/lib/supabase.ts`
3. Update the dashboard or create new pages
4. Test with different user roles

### Styling

The app uses Tailwind CSS with a custom design system. Colors and components are defined in `tailwind.config.js`.

### State Management

Authentication state is managed using React Context (`AuthContext`). For more complex state, consider adding Redux Toolkit or Zustand.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Netlify

1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify

### Self-hosted

1. Build the project: `npm run build`
2. Serve the `dist` folder with any static file server

## Environment Variables

The Supabase configuration is currently hardcoded in `src/lib/supabase.ts`. For production, consider using environment variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Mukhallat App ecosystem.


