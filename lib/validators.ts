import { z } from 'zod';

// User Registration Schema
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['STUDENT', 'OWNER', 'GUEST']).default('STUDENT'),
  collegeEmail: z.string().email('Invalid college email format').optional().or(z.literal('')),
  studentId: z.string().optional().or(z.literal('')),
  idCardImageUrl: z.string().optional().or(z.literal('')),
  hostelName: z.string().optional(),
  roomNumber: z.string().optional(),
  phoneNumber: z.string().optional(),
  collegeName: z.string().optional(),
}).refine((data) => {
  if (data.role === 'STUDENT' && data.collegeEmail) {
    const domain = data.collegeEmail.split('@')[1].toLowerCase();
    return domain.endsWith('.edu.in') || 
           domain.endsWith('.ac.in') || 
           domain.endsWith('.edu') || 
           domain.endsWith('.res.in');
  }
  return true;
}, {
  message: 'Students must use a valid educational email (.edu.in, .ac.in, .edu, etc.)',
  path: ['collegeEmail'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Login Schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Listing Schema
export const listingSchema = z.object({
  listingType: z.enum(['handover', 'pg']).default('handover'),
  pgName: z.string().min(2, 'PG/Hostel name must be at least 2 characters').optional().or(z.literal('')),
  roomDetails: z.string().min(10, 'Room details must be at least 10 characters'),
  price: z.number().positive('Price must be positive'),
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
  handoverMode: z.boolean().optional().default(false),
});

export type ListingInput = z.infer<typeof listingSchema>;

// Review Schema
export const reviewSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
  rating: z.number().min(1).max(5),
  comment: z.string().min(5, 'Comment must be at least 5 characters'),
  lat: z.number({ required_error: 'Latitude is required to verify your location' }),
  lng: z.number({ required_error: 'Longitude is required to verify your location' }),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

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

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
