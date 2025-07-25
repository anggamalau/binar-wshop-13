"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { TokenExpirationWarning } from "@/components/TokenExpirationWarning";
import { SessionTimer } from "@/components/SessionTimer";
import { Todo, CreateTodoRequest, TodoStats, TodoFilters } from "@/lib/types";

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [stats, setStats] = useState<TodoStats | null>(null);
  const [loading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [filters, setFilters] = useState<TodoFilters>({
    status: "",
    priority: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [newTodo, setNewTodo] = useState<CreateTodoRequest>({
    title: "",
    description: "",
    priority: "medium",
    status: "pending",
    dueDate: "",
  });
  const { requireAuth } = useAuth();

  useEffect(() => {
    requireAuth("/login");
  }, [requireAuth]);

  useEffect(() => {
    fetchTodos();
    fetchStats();
  }, [filters, pagination.page]);

  const fetchTodos = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await fetch(`/api/todos?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTodos(data.data.data);
        setPagination((prev) => ({
          ...prev,
          total: data.data.pagination.total,
          totalPages: data.data.pagination.totalPages,
        }));
      } else {
        toast.error("Failed to load todos");
      }
    } catch (error) {
      console.error("Fetch todos error:", error);
      toast.error("Failed to load todos");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/todos/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error("Fetch stats error:", error);
    }
  };

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTodo),
      });

      if (response.ok) {
        const data = await response.json();
        setTodos((prev) => [data.data, ...prev]);
        setNewTodo({
          title: "",
          description: "",
          priority: "medium",
          status: "pending",
          dueDate: "",
        });
        setShowCreateForm(false);
        toast.success("Todo created successfully");
        fetchStats();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to create todo");
      }
    } catch (error) {
      console.error("Create todo error:", error);
      toast.error("Failed to create todo");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTodo = async (todo: Todo) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(todo),
      });

      if (response.ok) {
        const data = await response.json();
        setTodos((prev) => prev.map((t) => (t.id === todo.id ? data.data : t)));
        setEditingTodo(null);
        toast.success("Todo updated successfully");
        fetchStats();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update todo");
      }
    } catch (error) {
      console.error("Update todo error:", error);
      toast.error("Failed to update todo");
    }
  };

  const handleDeleteTodo = async (id: number) => {
    if (!confirm("Are you sure you want to delete this todo?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setTodos((prev) => prev.filter((t) => t.id !== id));
        toast.success("Todo deleted successfully");
        fetchStats();
      } else {
        toast.error("Failed to delete todo");
      }
    } catch (error) {
      console.error("Delete todo error:", error);
      toast.error("Failed to delete todo");
    }
  };

  const handleStatusChange = async (id: number, status: Todo["status"]) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/todos/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const data = await response.json();
        setTodos((prev) => prev.map((t) => (t.id === id ? data.data : t)));
        toast.success("Status updated successfully");
        fetchStats();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update status");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading todos...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <TokenExpirationWarning />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Todos</h1>
                <p className="mt-2 text-gray-600">
                  Manage your tasks and stay organized
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <SessionTimer />
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Add Todo
                </button>
              </div>
            </div>

            {/* Statistics */}
            {stats && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-2xl font-bold text-indigo-600">
                    {stats.total}
                  </div>
                  <div className="text-sm text-gray-600">Total Tasks</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.pending}
                  </div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.inProgress}
                  </div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.completed}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search todos..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() =>
                    setFilters({ status: "", priority: "", search: "" })
                  }
                  className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Create Todo Form */}
          {showCreateForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Create New Todo
              </h3>
              <form onSubmit={handleCreateTodo} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={newTodo.title}
                      onChange={(e) =>
                        setNewTodo((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter todo title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={newTodo.dueDate}
                      onChange={(e) =>
                        setNewTodo((prev) => ({
                          ...prev,
                          dueDate: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={newTodo.priority}
                      onChange={(e) =>
                        setNewTodo((prev) => ({
                          ...prev,
                          priority: e.target.value as any,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={newTodo.status}
                      onChange={(e) =>
                        setNewTodo((prev) => ({
                          ...prev,
                          status: e.target.value as any,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={newTodo.description}
                    onChange={(e) =>
                      setNewTodo((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter todo description"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Creating..." : "Create Todo"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Todos List */}
          <div className="bg-white rounded-lg shadow">
            {todos.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">
                  No todos found. Create your first todo!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {todos.map((todo) => (
                  <div key={todo.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {editingTodo?.id === todo.id ? (
                              <input
                                type="text"
                                value={editingTodo.title}
                                onChange={(e) =>
                                  setEditingTodo((prev) =>
                                    prev
                                      ? { ...prev, title: e.target.value }
                                      : null
                                  )
                                }
                                className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            ) : (
                              todo.title
                            )}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                              todo.priority
                            )}`}
                          >
                            {todo.priority}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              todo.status
                            )}`}
                          >
                            {todo.status}
                          </span>
                          {todo.dueDate && isOverdue(todo.dueDate) && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              Overdue
                            </span>
                          )}
                        </div>

                        {editingTodo?.id === todo.id ? (
                          <textarea
                            value={editingTodo.description || ""}
                            onChange={(e) =>
                              setEditingTodo((prev) =>
                                prev
                                  ? { ...prev, description: e.target.value }
                                  : null
                              )
                            }
                            className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mb-2"
                            rows={2}
                          />
                        ) : (
                          <p className="text-gray-600 mb-2">
                            {todo.description}
                          </p>
                        )}

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>
                            Created:{" "}
                            {new Date(todo.createdAt).toLocaleDateString()}
                          </span>
                          {todo.dueDate && (
                            <span>
                              Due: {new Date(todo.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {editingTodo?.id === todo.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateTodo(editingTodo)}
                              className="text-green-600 hover:text-green-800"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingTodo(null)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingTodo(todo)}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              Edit
                            </button>
                            <select
                              value={todo.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  todo.id,
                                  e.target.value as Todo["status"]
                                )
                              }
                              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="pending">Pending</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                            <button
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <nav className="flex space-x-2">
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
