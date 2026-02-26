import { z } from "zod";

// --- Hostel Validations ---
// We use a passthrough schema on incoming data to safely accept varied frontend field names, 
// while ensuring critical fields like emails and minimum lengths are correct if provided.
export const hostelValidationSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    hostelname: z.string().min(2, "Hostel name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email format").optional().or(z.literal("")),
    floors: z.preprocess((v) => Number(v) || 0, z.number().min(0).optional()),
    floorCount: z.preprocess((v) => Number(v) || 0, z.number().min(0).optional()),
    rooms: z.preprocess((v) => Number(v) || 0, z.number().min(0).optional()),
    roomCount: z.preprocess((v) => Number(v) || 0, z.number().min(0).optional()),
    monthlyRent: z.preprocess((v) => Number(v) || 0, z.number().min(0).optional()),
    montlyrent: z.preprocess((v) => Number(v) || 0, z.number().min(0).optional()),
    perNightRent: z.preprocess((v) => Number(v) || 0, z.number().min(0).optional()),
    pernightrent: z.preprocess((v) => Number(v) || 0, z.number().min(0).optional()),
    cleaningInterval: z.preprocess((v) => Number(v) || 24, z.number().min(0).optional()),
    laundryInterval: z.preprocess((v) => Number(v) || 48, z.number().min(0).optional()),
}).passthrough();


// --- User Validations ---
export const userValidationSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email format").optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    cnic: z.string().optional(),
    phone: z.string().optional(),
    role: z.enum(["ADMIN", "WARDEN", "GUEST", "USER", "STAFF", "MANAGER"]).optional(),
}).passthrough();

// --- General ID validation ---
export const idValidationSchema = z.object({
    id: z.string().min(1, "ID is required"),
}).passthrough();
