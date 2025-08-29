# AI Fashion Stylist

Snap your wardrobe, set the vibe, and get shoppable outfits—styled for your body, occasion, weather, and budget.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 16+ with pgvector extension
- AWS S3 bucket (for image storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-fashion-stylist
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   Edit `.env.local` with your configuration:
   - Database connection string
   - AWS S3 credentials
   - API keys for external services

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗️ Architecture

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** with custom design tokens
- **shadcn/ui** components
- **Radix UI** primitives

### Backend
- **Next.js API Routes** for server actions
- **Prisma** ORM with PostgreSQL
- **pgvector** for embeddings storage
- **AWS S3** for image storage

### AI/ML Pipeline
- **OpenCV** for face blur and image processing
- **NSFW.js** for content moderation
- **CLIP** embeddings for similarity search
- **Custom models** for fashion classification

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── upload/            # Upload page
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility libraries
│   ├── db.ts            # Database client
│   ├── s3.ts            # S3 utilities
│   ├── utils.ts         # General utilities
│   ├── face-blur.ts     # Face blur utilities
│   └── nsfw-filter.ts   # Content moderation
└── types/               # TypeScript types
```

## 🎨 Design System

### Colors
- **Primary**: Fashion-focused gradient palette
- **Fashion Pink**: `hsl(350, 100%, 88%)`
- **Fashion Purple**: `hsl(262, 83%, 58%)`
- **Fashion Mint**: `hsl(168, 76%, 42%)`
- **Fashion Gold**: `hsl(45, 100%, 51%)`

### Components
- **Button**: Multiple variants including fashion gradient
- **Card**: Fashion-themed cards with hover effects
- **UploadZone**: Drag & drop file upload with preview
- **ThemeToggle**: Dark/light mode switching

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests
npm run type-check   # TypeScript type checking
```

### Database Management

```bash
npx prisma studio    # Open Prisma Studio
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
npx prisma migrate dev # Create and apply migrations
```

## 🧪 Testing

```bash
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm run start
   ```

## 🔒 Security & Privacy

- **Face Blur**: Enabled by default for privacy
- **NSFW Filter**: Automatic content moderation
- **RLS**: Row-level security in database
- **Signed URLs**: Secure S3 uploads
- **GDPR Compliance**: Data export/deletion endpoints

## 📊 Performance

- **Image Processing**: < 2.5s p95
- **Outfit Generation**: < 1.5s p95
- **Upload Speed**: 100MB+ support
- **Caching**: Redis for session data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@aifashionstylist.com or join our Discord community.

---

Built with ❤️ by the AI Fashion Stylist team
