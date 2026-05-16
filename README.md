# Verisite - Task List & Project Requirements

This document outlines the core functional requirements and user roles for the Verisite student hostel and PG management platform.

## 🔑 Core Login Methods & User Roles

### 1. PG Owner Login
*   **Purpose:** For landlords and PG management.
*   **Capabilities:**
    *   List PG details (e.g., number of available rooms, specific facilities, pricing).
    *   Manage and update listing information.
*   **Restrictions:**
    *   **Strictly prohibited** from providing reviews or ratings for any listed rooms or PGs (including their own).

### 2. Student Login (School Gmail Only)
*   **Purpose:** For verified students.
*   **Requirements:** Must authenticate using a school-issued Gmail account (`.edu` or institutional domain).
*   **Capabilities:**
    *   List rooms (e.g., for handover or finding roommates).
    *   Rate and review rooms/PGs they have lived in that were posted by PG Owners.

### 3. Guest Login
*   **Purpose:** For casual browsing.
*   **Capabilities:**
    *   View all listed rooms and PGs.
    *   View ratings and reviews.
*   **Restrictions:**
    *   Read-only access; cannot list rooms or post reviews.

---

## 🔒 Privacy & Anonymous Reviews
*   **Anonymity:** When displaying reviews and ratings, the system must **never** show the name or identity of the user who provided the review.
*   **Visibility:** All users (Owners, Students, and Guests) can see the feedback content, but the author remains anonymous to everyone.

---

## 🛠️ Implementation TODOs
- [ ] Implement OAuth2 for Google (School Gmail) authentication.
- [ ] Create Role-Based Access Control (RBAC) middleware for Owner, Student, and Guest.
- [ ] Develop listing forms with fields for room count and facilities.
- [ ] Build the review/rating system with "Anonymous" author masking.
- [ ] Implement logic to prevent Owners from accessing review submission endpoints.
