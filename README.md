# Verisite - Student Housing Marketplace & Truth Ledger

Verisite is a secure, professional platform designed for students to discover verified accommodations and share honest experiences. It bridges the gap between PG owners and students while providing a "Truth Ledger" for transparent room handovers and roommate searches.

## 🌟 Key Features

### 🏢 Accommodation Discovery
*   **Verified Marketplace:** Direct listings from PG owners with detailed specs (available rooms, total capacity).
*   **Student Truth Ledger:** Anonymous reviews and ratings from students who have actually lived in the properties.
*   **Room Handover:** Students can list their current rooms and items (mattresses, coolers, etc.) for the next tenant.
*   **Roommate Finder:** Dedicated mode for finding compatible roommates with direct email contact.

### 🗺️ Precision Search & Mapping
*   **Interactive Map Picker:** Precise pin-dropping using Leaflet to mark exact room locations.
*   **Smart Proximity Filter:** Instantly sort listings by their distance to your specific college or university.
*   **Advanced Filtering:** Sort by "Newest", "Lowest Price", or "Proximity to Institution".

### 📸 Visual & Professional UI
*   **Compressed Room Images:** Upload up to 3 room images, automatically optimized and compressed using Sharp and stored on Cloudinary.
*   **Full-Screen Viewer:** Immersive lightbox for viewing room details in high resolution.
*   **Modern Branding:** Clean, circular branding and professional Lucide iconography.
*   **Dark Mode Support:** Fully responsive and optimized for both light and dark environments.

## 🔑 User Roles & Security

### 1. Students (Educational Email Required)
*   **Verification:** Must use a valid `.edu.in`, `.ac.in`, or `.edu` email.
*   **Capabilities:** Post room handovers, find roommates, and contribute to the "Truth Ledger" (PG ratings).
*   **Privacy:** Identity is protected for PG ratings but visible for room-sharing to facilitate contact.

### 2. PG Owners
*   **Capabilities:** List properties, manage availability, and showcase amenities.
*   **Restrictions:** Strictly prohibited from providing reviews or ratings to ensure marketplace integrity.

### 3. Guests
*   **Capabilities:** Browse all listings and read student reviews with read-only access.

---

## 🔒 Security & Performance
*   **JWT Authentication:** Secure sessions with an extended 30-day token expiry.
*   **Backend Compression:** High-performance image processing with Sharp.
*   **Data Integrity:** Unique location enforcement to prevent duplicate property listings.
*   **Privacy First:** Strict anonymity for student review authors.

## 🛠️ Tech Stack
*   **Frontend:** Next.js 16 (Webpack), React 19, Tailwind CSS.
*   **Backend:** Next.js API Routes, Node.js.
*   **Database:** MongoDB Atlas with Mongoose ORM.
*   **Storage:** Cloudinary (Optimized Image CDN).
*   **Mapping:** Leaflet & OpenStreetMap.
*   **Icons:** Lucide React.
