# Verisite - Student Housing Marketplace & Truth Ledger

Verisite is a secure, high-performance platform designed for students to discover verified accommodations and share honest, geofenced experiences. It bridges the gap between PG owners and students while providing a "Truth Ledger" for transparent room handovers and roommate searches.

## 🌟 Key Features

### 🏢 Accommodation Discovery
*   **Verified Marketplace:** Direct listings from PG owners with real-time availability tracking.
*   **Student Truth Ledger:** Anonymous, geofence-verified reviews from students who actually live in the properties.
*   **Three-Mode Student Posting:** 
    *   **PG Rating:** Share honest feedback on current housing.
    *   **Room Handover:** Pass your room and items (mattresses, coolers, etc.) to the next student.
    *   **Roommate Finder:** Find compatible roommates with secure contact options.

### 🗺️ Precision Mapping & Proximity
*   **Interactive Map Picker:** Precise pin-dropping using Leaflet/OSM to mark exact room locations.
*   **Smart Proximity Sorting:** Instantly sort listings by distance to your specific campus or institution.
*   **Unique Location Enforcement:** Automated duplicate detection prevents multiple listings for the same building within a 50m radius.

### 📸 High-Performance Visuals
*   **Authentic Room Photos:** Optimized for real student-captured photos. The professional stock photo library has been removed to maintain the "Truth Ledger" integrity.
*   **Cloudinary Integration:** Images are automatically optimized and compressed using **Sharp** before being stored on Cloudinary's CDN.
*   **Immersive Gallery:** Full-screen lightbox for detailed room inspections.

### 🤖 Smart Assistance
*   **AI Chat Assistant:** Integrated AI chatbot (Gemini-powered) to help users navigate the platform, understand listing requirements, and troubleshoot issues.

## 🔑 User Roles & Security

### 1. Students (Two-Step Verification)
*   **Initial Registration:** Join as a Student with any personal email to browse listings and community data.
*   **Institutional Verification:** To unlock the "Truth Ledger" features (posting reviews, listing handovers, or finding roommates), students must verify their identity using a valid `.edu.in`, `.ac.in`, `.edu`, or `.res.in` email in their profile.
*   **Privacy:** Complete anonymity is maintained for review authors to ensure honest feedback without repercussions.

### 2. PG Owners
*   **Capabilities:** Professional property listing management, amenity showcases, and coordinate updates for accurate mapping.
*   **Restrictions:** Strictly prohibited from posting reviews or ratings to ensure community-driven data integrity.

### 3. Administrators
*   **Capabilities:** Full platform oversight, content moderation, and user management through the Admin Central panel.

---

## 🔒 Technical Specifications
*   **Auth:** JWT-secured sessions with 30-day persistence.
*   **Location:** Geofence verification for review authenticity.
*   **UI/UX:** Fully responsive, accessible, and features a built-in **Dark Mode**.

## 🛠️ Tech Stack
*   **Frontend:** Next.js 16 (Webpack), React 19, Tailwind CSS.
*   **Backend:** Next.js API Routes (Serverless ready).
*   **Database:** MongoDB Atlas with Mongoose ORM.
*   **Storage:** Cloudinary (Optimized Image CDN).
*   **Mapping:** Leaflet & OpenStreetMap.
*   **Icons:** Lucide React.
