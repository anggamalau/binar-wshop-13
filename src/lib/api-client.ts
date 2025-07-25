import { forceLogout } from "./auth-utils";

interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  code?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "/api") {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): HeadersInit {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();

    // Handle token expiration
    if (response.status === 401) {
      if (data.code === "TOKEN_EXPIRED" || data.code === "TOKEN_INVALID") {
        console.log("Token expired or invalid, forcing logout...");
        forceLogout();
        return {
          message: "Session expired. Please log in again.",
          code: data.code,
        };
      }
    }

    return data;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      console.error("API GET error:", error);
      return { message: "Network error occurred", code: "NETWORK_ERROR" };
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      console.error("API POST error:", error);
      return { message: "Network error occurred", code: "NETWORK_ERROR" };
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      console.error("API PUT error:", error);
      return { message: "Network error occurred", code: "NETWORK_ERROR" };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      console.error("API DELETE error:", error);
      return { message: "Network error occurred", code: "NETWORK_ERROR" };
    }
  }
}

export const apiClient = new ApiClient();
