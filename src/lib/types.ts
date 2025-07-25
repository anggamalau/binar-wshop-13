// User and Profile Types
export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  birthDate?: string;
  address?: string;
  bio?: string;
  longBio?: string;
  profilePictureUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileData {
  username?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  bio?: string;
  longBio?: string;
  address?: string;
  profilePictureUrl?: string;
}

export interface ProfileUpdateAudit {
  id: number;
  userId: number;
  updatedFields: Record<string, any>;
  createdAt: string;
}

// Todo Types
export interface Todo {
  id: number;
  userId: number;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed";
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  status?: "pending" | "in-progress" | "completed";
  dueDate?: string;
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  status?: "pending" | "in-progress" | "completed";
  dueDate?: string;
}

export interface TodoFilters {
  status?: string;
  priority?: string;
  search?: string;
  dueDate?: string;
}

export interface TodoPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TodoStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  lowPriority: number;
  mediumPriority: number;
  highPriority: number;
  completionRate: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: TodoPagination;
}

export interface TodoListResponse {
  data: PaginatedResponse<Todo>;
  stats: TodoStats;
}

// Form Validation Types
export interface ValidationErrors {
  [key: string]: string;
}

// File Upload Types
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

// Authentication Types
export interface AuthUser {
  userId: number;
  username: string;
  email: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Database Types
export interface DatabaseUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone_number?: string;
  birth_date?: string;
  address?: string;
  bio?: string;
  long_bio?: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTodo {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  priority: string;
  status: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

// Component Props Types
export interface TodoItemProps {
  todo: Todo;
  onUpdate: (todo: Todo) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: Todo["status"]) => void;
}

export interface TodoFormProps {
  todo?: Todo;
  onSubmit: (data: CreateTodoRequest | UpdateTodoRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface ProfileFormProps {
  user: User;
  onSubmit: (data: ProfileData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Utility Types
export type ApiMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface ApiRequestConfig {
  method: ApiMethod;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
}
