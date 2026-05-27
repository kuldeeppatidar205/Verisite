# 🚀 Getting Started with Verisite

Welcome to the Verisite developer guide. Verisite is a student-first accommodation platform built to bring transparency to student housing through a verified "Truth Ledger" and geofenced review system.

## 🏗️ Project Architecture

Verisite is built using a modern full-stack architecture:

- **Frontend & API**: [Next.js (App Router)](https://nextjs.org/) for both UI and serverless backend logic.
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) for modeling.
- **Validation**: [Zod](https://zod.dev/) for schema-first type safety and validation.
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) for rapid, utility-first UI development.
- **Security**: Strict **CSP** headers, **JWT** authentication, and **institutional email verification**.

### Key Directories
- `/app`: Next.js pages and API routes.
- `/components`: Reusable UI components.
- `/lib`: Core logic, models, database connection, and utility functions.
- `/public`: Static assets (images, icons).
- `/scripts`: Database maintenance and standalone utility scripts.

---

## 🧪 Core Workflows

### 📍 Geofence Verification
To verify a review, the user must be within 25 meters of the property. This is calculated using the **Haversine formula** in `lib/utils/geo.ts`. During development, you can mock coordinates in the browser's DevTools to test this.

### 📧 Email Verification
The app uses **Nodemailer** to send verification links. In development, if Gmail credentials aren't set, the verification link will be printed to the server console for testing.

### 🖼️ Image Processing
Images are resized and compressed using **Sharp** before being uploaded to **Cloudinary**. This ensures performance and low storage costs.

---

## 🚀 Deployment

Verisite is optimized for [Vercel](https://vercel.com/):
---

## 🤝 Contributing

1. Create a new branch: `git checkout -b feature/your-feature-name`.
2. Make your changes and commit: `git commit -m 'Add some feature'`.
3. Push to the branch: `git push origin feature/your-feature-name`.
4. Open a Pull Request.

---