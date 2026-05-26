# Verisite - Quick Start Guide

## 🚀 Getting Started

### 1. **Install Dependencies**
Ensure you are in the project root directory:
```bash
npm install
```

### 2. **Configure Environment**
Create a `.env.local` file in the root directory and add the following keys:

```env
# Database
MONGODB_URI=your_mongodb_atlas_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d

# Image Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail SMTP)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_specific_password

# API
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

### 3. **Start Development Server**
```bash
npm run dev
```
The app will be available at: **http://localhost:3000**

---

## 🏗️ Core Architecture

### Key Models
- **User:** Handles authentication, verification status, and favorite college location.
- **Listing:** Unified model for 'handover', 'pg', and 'roommate' posts. Includes images, geo-coordinates, and accommodation specs (Sharing, Food, Bills, Gender).
- **Review:** Integrated into PG listings to power the Student Truth Ledger.

### Image Pipeline
1.  **Selection:** User picks up to 3 images (validated for type and size on frontend).
2.  **Compression:** Backend `/api/upload` uses **Sharp** to resize to 1200px and compress to 80% quality.
3.  **Storage:** Compressed buffers are streamed to **Cloudinary**.
4.  **Database:** Secure URLs are stored in the listing document.

---

## 🔧 Essential Commands

```bash
# Start development (Webpack mode)
npm run dev

# Full production build
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

---

## 📋 Developer Notes
*   **Mapping:** Leaflet CSS is imported dynamically; no Google Maps API keys are required.
*   **Authentication:** Students must use educational emails. In development mode, check the server console for the verification URL.
*   **Image Compression:** Requires `sharp` binary. If you face installation issues on Windows, run `npm install --include=optional sharp`.
*   **UI Icons:** Powered by `lucide-react`.

---

**Happy coding! 🚀 Verisite is now optimized and ready for scaling.**
