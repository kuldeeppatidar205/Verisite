import { z } from 'zod';

// User Registration Schema
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'pg_owner', 'guest']).default('student'),
  collegeEmail: z.string().email('Invalid college email format').optional().or(z.literal('')),
  studentId: z.string().optional().or(z.literal('')),
  hostelName: z.string().optional(),
  roomNumber: z.string().optional(),
  phoneNumber: z.string().optional(),
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
  roomDetails: z.string().min(10, 'Room details must be at least 10 characters'),
  price: z.number().positive('Price must be positive'),
  availableDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format. Please use YYYY-MM-DD or ISO format.',
  }),
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

// University Schema
export const universitySchema = z.object({
  name: z.string().min(3, 'University name is required'),
  emailDomains: z.array(z.string()).min(1, 'At least one email domain is required'),
});

export type UniversityInput = z.infer<typeof universitySchema>;
