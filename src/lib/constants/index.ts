// App Constants
export const APP_NAME = "RojaDesk";
export const APP_DESCRIPTION = "Modern Agency Management & Automation";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Auth Constants
export const AUTH_ROUTES = ["/login", "/register"];
export const PROTECTED_ROUTES = ["/dashboard"];

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// File Upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];

// API Configuration
export const API_BASE_URL = APP_URL + "/api/v1";
export const API_TIMEOUT = 30000; // 30 seconds
