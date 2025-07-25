"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";

// Bad practice: global variable for API URL
const API_URL = "http://localhost:3000/api/users";

// Bad practice: no proper TypeScript interfaces
interface UserData {
  id: number;
  username: string;
  fullName: string;
  email: string;
  birthDate: string;
  bio: string;
  longBio: string;
  address: string;
  division: string;
  createdAt: string;
  updatedAt: string;
  totalUsers: number;
  newerUsers: number;
}

// Bad practice: component with poor naming and no optimization
export default function UsersPageComponent() {
  // Add performance monitoring
  usePerformanceMonitor("UsersPage", "users");

  // Bad practice: multiple state variables instead of useReducer
  const [usersData, setUsersData] = useState<UserData[]>([]);
  const [loadingState, setLoadingState] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [divisionFilter, setDivisionFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date());
  const [fetchCount, setFetchCount] = useState<number>(0);

  const { requireAuth } = useAuth();

  // Bad practice: checking auth on every render
  useEffect(() => {
    requireAuth("/login");
  }, [requireAuth]);

  // Bad practice: hardcoded fetch function with no error handling optimization
  const fetchUsersData = async () => {
    console.time("Users Page Fetch");
    setLoadingState(true);
    setErrorMessage("");

    try {
      // Bad practice: no timeout, no retry logic
      const url =
        divisionFilter !== "all"
          ? `${API_URL}?division=${divisionFilter}`
          : API_URL;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Bad practice: no validation of response data
      setUsersData(data.users || []);
      setTotalCount(data.total || 0);
      setLastFetchTime(new Date());
      setFetchCount((prev) => prev + 1);
    } catch (error) {
      // Bad practice: generic error handling
      console.error("Fetch error:", error);
      setErrorMessage("Failed to load users data");
    } finally {
      setLoadingState(false);
      console.timeEnd("Users Page Fetch");
    }
  };

  // Bad practice: useEffect with no dependencies array optimization
  useEffect(() => {
    fetchUsersData();
  }, [divisionFilter]);

  // Bad practice: inefficient filtering and sorting logic
  const getFilteredAndSortedUsers = () => {
    let filteredUsers = [...usersData];

    // Bad practice: nested if-else statements
    if (searchTerm) {
      filteredUsers = filteredUsers.filter((user) => {
        if (user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) {
          return true;
        } else if (
          user.username.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return true;
        } else if (
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return true;
        } else if (
          user.bio &&
          user.bio.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return true;
        } else if (
          user.address &&
          user.address.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return true;
        } else {
          return false;
        }
      });
    }

    // Bad practice: inefficient sorting with multiple conditions
    if (sortBy === "createdAt") {
      filteredUsers.sort((a, b) => {
        if (new Date(a.createdAt) > new Date(b.createdAt)) {
          return -1;
        } else if (new Date(a.createdAt) < new Date(b.createdAt)) {
          return 1;
        } else {
          return 0;
        }
      });
    } else if (sortBy === "fullName") {
      filteredUsers.sort((a, b) => {
        if (a.fullName.toLowerCase() < b.fullName.toLowerCase()) {
          return -1;
        } else if (a.fullName.toLowerCase() > b.fullName.toLowerCase()) {
          return 1;
        } else {
          return 0;
        }
      });
    } else if (sortBy === "username") {
      filteredUsers.sort((a, b) => {
        if (a.username.toLowerCase() < b.username.toLowerCase()) {
          return -1;
        } else if (a.username.toLowerCase() > b.username.toLowerCase()) {
          return 1;
        } else {
          return 0;
        }
      });
    } else if (sortBy === "division") {
      filteredUsers.sort((a, b) => {
        if (
          (a.division || "").toLowerCase() < (b.division || "").toLowerCase()
        ) {
          return -1;
        } else if (
          (a.division || "").toLowerCase() > (b.division || "").toLowerCase()
        ) {
          return 1;
        } else {
          return 0;
        }
      });
    }

    return filteredUsers;
  };

  // Bad practice: inefficient pagination calculation
  const getPaginatedUsers = () => {
    const filteredUsers = getFilteredAndSortedUsers();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };

  // Bad practice: inefficient pagination info calculation
  const getPaginationInfo = () => {
    const filteredUsers = getFilteredAndSortedUsers();
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, filteredUsers.length);

    return {
      totalPages,
      startIndex,
      endIndex,
      totalItems: filteredUsers.length,
    };
  };

  // Bad practice: inefficient date formatting
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  };
  // sudah di refactor menajdi better : lebih efisien

  // UserCard component with performance monitoring
  const UserCard = ({ user, index }: { user: UserData; index: number }) => {
    usePerformanceMonitor("UserCard", "users");

    const cardStyle = {
      border: "1px solid #ddd",
      borderRadius: "8px",
      padding: "16px",
      margin: "8px 0",
      backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#ffffff",
    };

    return (
      <div key={user.id} style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              {user.fullName}
            </h3>
            <p style={{ margin: "0 0 4px 0", color: "#666" }}>
              <strong>Username:</strong> {user.username}
            </p>
            <p style={{ margin: "0 0 4px 0", color: "#666" }}>
              <strong>Email:</strong> {user.email}
            </p>
            {user.birthDate && (
              <p style={{ margin: "0 0 4px 0", color: "#666" }}>
                <strong>Birth Date:</strong> {user.birthDate}
              </p>
            )}
            {user.division && (
              <p style={{ margin: "0 0 4px 0", color: "#666" }}>
                <strong>Division:</strong> {user.division}
              </p>
            )}
            {user.address && (
              <p style={{ margin: "0 0 4px 0", color: "#666" }}>
                <strong>Address:</strong> {user.address}
              </p>
            )}
            {user.bio && (
              <p style={{ margin: "0 0 4px 0", color: "#666" }}>
                <strong>Bio:</strong> {user.bio}
              </p>
            )}
            {user.longBio && (
              <p style={{ margin: "0 0 4px 0", color: "#666" }}>
                <strong>Long Bio:</strong> {user.longBio.substring(0, 100)}...
              </p>
            )}
            <p style={{ margin: "0 0 4px 0", color: "#999", fontSize: "12px" }}>
              <strong>Created:</strong> {formatDate(user.createdAt)}
            </p>
            <p style={{ margin: "0 0 4px 0", color: "#999", fontSize: "12px" }}>
              <strong>Updated:</strong> {formatDate(user.updatedAt)}
            </p>
          </div>
          <div style={{ textAlign: "right", fontSize: "12px", color: "#999" }}>
            <div>Total Users: {user.totalUsers}</div>
            <div>Newer Users: {user.newerUsers}</div>
          </div>
        </div>
      </div>
    );
  };

  // Bad practice: inefficient user card rendering
  const renderUserCard = (user: UserData, index: number) => {
    return <UserCard key={user.id} user={user} index={index} />;
  };

  // Bad practice: inefficient pagination controls
  const renderPaginationControls = () => {
    const paginationInfo = getPaginationInfo();

    if (paginationInfo.totalPages <= 1) {
      return null;
    }

    const pageNumbers = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(
      1,
      currentPage - Math.floor(maxVisiblePages / 2)
    );
    const endPage = Math.min(
      paginationInfo.totalPages,
      startPage + maxVisiblePages - 1
    );

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div
        style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}
      >
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            margin: "0 4px",
            padding: "8px 12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            backgroundColor: currentPage === 1 ? "#f5f5f5" : "#fff",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
          }}
        >
          Previous
        </button>

        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            onClick={() => setCurrentPage(pageNumber)}
            style={{
              margin: "0 4px",
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              backgroundColor: currentPage === pageNumber ? "#007bff" : "#fff",
              color: currentPage === pageNumber ? "#fff" : "#333",
              cursor: "pointer",
            }}
          >
            {pageNumber}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === paginationInfo.totalPages}
          style={{
            margin: "0 4px",
            padding: "8px 12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            backgroundColor:
              currentPage === paginationInfo.totalPages ? "#f5f5f5" : "#fff",
            cursor:
              currentPage === paginationInfo.totalPages
                ? "not-allowed"
                : "pointer",
          }}
        >
          Next
        </button>
      </div>
    );
  };

  // Bad practice: inefficient filter controls
  const renderFilterControls = () => {
    return (
      <div
        style={{
          margin: "20px 0",
          padding: "16px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontWeight: "bold",
              }}
            >
              Search:
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              style={{
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                width: "200px",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontWeight: "bold",
              }}
            >
              Sort By:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                width: "150px",
              }}
            >
              <option value="createdAt">Created Date</option>
              <option value="fullName">Full Name</option>
              <option value="username">Username</option>
              <option value="division">Division</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontWeight: "bold",
              }}
            >
              Division Filter:
            </label>
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                width: "150px",
              }}
            >
              <option value="all">All Divisions</option>
              <option value="Tech">Tech</option>
              <option value="QA">QA</option>
              <option value="HR">HR</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
              <option value="Sales">Sales</option>
              <option value="Operations">Operations</option>
              <option value="Legal">Legal</option>
              <option value="Design">Design</option>
              <option value="Product">Product</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontWeight: "bold",
              }}
            >
              Items Per Page:
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              style={{
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                width: "100px",
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <button
            onClick={() => {
              setIsRefreshing(true);
              fetchUsersData();
              setTimeout(() => setIsRefreshing(false), 1000);
            }}
            disabled={isRefreshing}
            style={{
              padding: "8px 16px",
              backgroundColor: "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: isRefreshing ? "not-allowed" : "pointer",
              opacity: isRefreshing ? 0.6 : 1,
            }}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
    );
  };

  if (loadingState) {
    return (
      <>
        <Navbar />
        <div style={{ padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "16px" }}>
            Loading users...
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>
            Please wait while we fetch the data
          </div>
        </div>
      </>
    );
  }

  if (errorMessage) {
    return (
      <>
        <Navbar />
        <div style={{ padding: "20px", textAlign: "center" }}>
          <div
            style={{ fontSize: "24px", color: "#dc3545", marginBottom: "16px" }}
          >
            Error: {errorMessage}
          </div>
          <button
            onClick={fetchUsersData}
            style={{
              padding: "8px 16px",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </>
    );
  }

  const paginatedUsers = getPaginatedUsers();
  const paginationInfo = getPaginationInfo();

  return (
    <>
      <Navbar />
      <div style={{ padding: "20px" }}>
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>Users List</h1>
          <p style={{ color: "#666", marginBottom: "16px" }}>
            Total: {totalCount} users | Showing: {paginationInfo.startIndex}-
            {paginationInfo.endIndex} of {paginationInfo.totalItems} filtered
            results
          </p>
          <p style={{ color: "#999", fontSize: "12px" }}>
            Last fetched: {lastFetchTime.toLocaleString()} | Fetch count:{" "}
            {fetchCount}
          </p>
        </div>

        {renderFilterControls()}

        <div style={{ marginBottom: "20px" }}>
          {paginatedUsers.map((user, index) => renderUserCard(user, index))}
        </div>

        {renderPaginationControls()}

        <div style={{ marginTop: "20px", textAlign: "center", color: "#666" }}>
          <p>
            This page demonstrates poor performance practices for refactoring
            practice.
          </p>
          <p>Check the console for timing information.</p>
        </div>
      </div>
    </>
  );
}
