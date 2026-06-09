import { z } from 'zod';

// User Registration Schema
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['STUDENT', 'OWNER', 'GUEST']).default('STUDENT'),
  collegeEmail: z.string().email('Invalid college email format').optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
  collegeName: z.string().optional(),
  favoriteCollege: z.object({
    name: z.string(),
    lat: z.number(),
    lng: z.number(),
  }).optional(),
}).refine((data) => {
  if (data.role === 'STUDENT' && data.collegeEmail) {
    const domain = data.collegeEmail.split('@')[1].toLowerCase();
    const allowedEndings = ['.edu.in', '.ac.in', '.edu', '.res.in'];
    return allowedEndings.some(ending => domain.endsWith(ending));
  }
  return true;
}, {
  message: 'Students must use a valid institutional email (.edu.in, .ac.in, .edu, or .res.in)',
  path: ['collegeEmail'],
});

// Login Schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Listing Schema
export const listingSchema = z.object({
  listingType: z.enum(['handover', 'pg', 'roommate']).default('handover'),
  pgName: z.string().min(2, 'PG/Hostel name must be at least 2 characters').or(z.literal('')),
  roomDetails: z.string().min(10, 'Room details must be at least 10 characters').optional().or(z.literal('')),
  price: z.number().nonnegative('Price must be valid').optional(),
  availableDate: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'Invalid date format. Please use YYYY-MM-DD or ISO format.',
  }).optional().or(z.literal('')),
  legacyBundle: z.object({
    mattress: z.boolean().optional(),
    cooler: z.boolean().optional(),
    shelf: z.boolean().optional(),
    lamp: z.boolean().optional(),
    other: z.string().optional(),
  }).optional(),
  address: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  lat: z.number({ required_error: 'Latitude is required' }),
  lng: z.number({ required_error: 'Longitude is required' }),
  totalRooms: z.number().positive().optional(),
  availableRooms: z.number().min(0).optional(),
  sharingType: z.enum(['single', 'double', 'triple', 'multiple', '']).optional(),
  foodIncluded: z.boolean().optional(),
  billsIncluded: z.boolean().optional(),
  genderCategory: z.enum(['boys', 'girls', 'both', '']).optional(),
  images: z.array(z.string()).max(3, 'Maximum 3 images allowed').optional(),
  handoverMode: z.boolean().optional(),
});

// Review Schema
export const reviewSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
  rating: z.number().min(1).max(5),
  wifiRating: z.number().min(1).max(5).optional(),
  foodRating: z.number().min(1).max(5).optional(),
  securityRating: z.number().min(1).max(5).optional(),
  behaviorRating: z.number().min(1).max(5).optional(),
  backupRating: z.number().min(1).max(5).optional(),
  responsivenessRating: z.number().min(1).max(5).optional(),
  comment: z.string().min(5, 'Comment must be at least 5 characters'),
  lat: z.number({ required_error: 'Latitude is required to verify your location' }),
  lng: z.number({ required_error: 'Longitude is required to verify your location' }),
});

// Profile Update Schema
export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phoneNumber: z.string().refine((val) => !val || val.length >= 10, {
    message: 'Phone number must be at least 10 characters',
  }).optional().or(z.literal('')),
  hostelName: z.string().optional(),
  roomNumber: z.string().optional(),
  favoriteCollege: z.object({
    name: z.string(),
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

// Forgot Password Schema
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// Reset Password Schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Upgrade to Student Schema
export const upgradeToStudentSchema = z.object({
  collegeEmail: z.string().email('Invalid institutional email format'),
  collegeName: z.string().min(2, 'College name is required'),
  favoriteCollege: z.object({
    name: z.string(),
    lat: z.number(),
    lng: z.number(),
  }).optional(),
}).refine((data) => {
  const domain = data.collegeEmail.split('@')[1].toLowerCase();
  const allowedEndings = ['.edu.in', '.ac.in', '.edu', '.res.in'];
  return allowedEndings.some(ending => domain.endsWith(ending));
}, {
  message: 'Institutional email must end with .edu.in, .ac.in, .edu, or .res.in',
  path: ['collegeEmail'],
});
