[![Codecov](https://codecov.io/gh/BINAR-Learning/demo-repository/graph/badge.svg?token=A9U236VZ3Q)](https://codecov.io/gh/BINAR-Learning/demo-repository)

# 🛠 Workshop Project - Sesi 11 & 12

A Next.js application demonstrating JWT authentication, database integration, and legacy code examples for refactoring workshops.

## 🚀 Features

- **JWT Authentication**: Secure login with JWT tokens
- **Password Hashing**: bcrypt for secure password storage
- **Database Integration**: PostgreSQL with raw SQL queries
- **Indonesian User Data**: 1000 realistic Indonesian users
- **Protected APIs**: JWT middleware for secure routes
- **Legacy Code Examples**: Poor practices for refactoring demo
- **Performance Benchmarking**: console.time for performance tracking
- **Complex Data Structure**: Multiple tables with relationships
- **Data Quality Issues**: NULL and DUPLICATE data for ETL practice
- **User Profile Management**: Complete profile with address, phone, birth date
- **Division Filtering**: Real-time filtering by division with poor performance
- **Enhanced User List**: Display address and division information
- **Prometheus Metrics**: Real-time monitoring with custom metrics
- **Grafana Cloud Integration**: Remote write to Grafana Cloud for monitoring
- **Automated Testing**: Jest unit tests and Playwright E2E performance tests

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn
- Prometheus (for monitoring)
- Grafana Cloud account (for dashboard)

## 🔧 Environment Variables

### Required Variables

| Variable      | Description               | Default       | Example                     |
| ------------- | ------------------------- | ------------- | --------------------------- |
| `DB_USER`     | PostgreSQL username       | `postgres`    | `postgres`                  |
| `DB_HOST`     | PostgreSQL host           | `localhost`   | `localhost`                 |
| `DB_NAME`     | Database name             | `workshop_db` | `workshop_db`               |
| `DB_PASSWORD` | PostgreSQL password       | `admin123`    | `your_password`             |
| `DB_PORT`     | PostgreSQL port           | `5432`        | `5432`                      |
| `JWT_SECRET`  | Secret key for JWT tokens | -             | `your-super-secret-jwt-key` |

### Optional Variables

| Variable              | Description      | Default                 | Example                |
| --------------------- | ---------------- | ----------------------- | ---------------------- |
| `NODE_ENV`            | Environment mode | `development`           | `production`           |
| `NEXT_PUBLIC_APP_URL` | Application URL  | `http://localhost:3000` | `https://your-app.com` |

### Environment File Setup

For **local development**, use `.env.local`:

```bash
# Create environment file
cp .env.example .env.local

# Or create manually
touch .env.local
```

**File Priority** (Next.js):

1. `.env.local` (highest priority, ignored by Git)
2. `.env.development` (development only)
3. `.env` (lowest priority)

## 🛠 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd demo-repository
   git fetch
   git checkout Module-5-6-final-project
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**

   ```bash
   # Start PostgreSQL service first
   # Windows: Start from Services
   # macOS: brew services start postgresql
   # Ubuntu: sudo systemctl start postgresql
   ```

4. **Configure environment variables**
   Create a `.env.local` file in the root directory:

   ```env
   # Database Configuration
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=workshop_db
   DB_PASSWORD=admin123
   DB_PORT=5432

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-for-workshop

   # Application Configuration (Optional)
   NODE_ENV=development
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

   **Note**: Use `.env.local` for local development. This file is automatically ignored by Git for security.

5. **Create and seed the database**

   ```bash
   npm run db-create
   ```

   This script will:

   - Create the `workshop_db` database if it doesn't exist
   - Create all required tables with proper schema
   - Seed 10,000 Indonesian users with realistic data using faker
   - Create 3 fixed accounts for testing:
     - aku123@gmail.com / password123
     - kamu123@yopmail.com / password123
     - user123@test.com / password123
   - All other users have password: `User123@`

## 🗂️ Database Structure

The project uses a normalized database structure with 6 main tables:

### 1. `auth` Table

```sql
CREATE TABLE auth (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. `users` Table (Updated Structure)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  auth_id INTEGER REFERENCES auth(id),
  full_name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  birth_date DATE,
  bio TEXT,
  long_bio TEXT,
  profile_json JSON,
  address TEXT,
  phone_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. `user_roles` Table

```sql
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. `user_logs` Table

```sql
CREATE TABLE user_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. `user_divisions` Table

```sql
CREATE TABLE user_divisions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  division_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🗄️ Database Management

### Available Scripts

```bash
# Create database and seed data
npm run db-create

# Drop database completely
npm run db-drop

# Reset database (drop + create)
npm run db-reset
```

## 🔌 API Endpoints

### Authentication

- `POST /api/login` - User login
- `POST /api/password` - Update password

### User Management

- `GET /api/users` - Get all users (with division filter)
- `GET /api/user/:id` - Get specific user
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update current user profile

### API Features

#### Division Filtering

The users API supports division filtering via query parameter:

```bash
# Get all users
GET /api/users

# Get users from specific division
GET /api/users?division=Tech
GET /api/users?division=Marketing
GET /api/users?division=HR
```

**Available Divisions**: HR, Tech, Finance, Ops

#### Profile API Response

The profile API returns comprehensive user data including new fields:

```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "user123",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "081234567890",
    "birthDate": "1990-01-01",
    "address": "Jl. Sudirman No. 123, Jakarta",
    "division": "Tech",
    "role": "user",
    "bio": "Software developer...",
    "longBio": "Detailed bio...",
    "profileJson": {
      /* complex JSON data */
    }
  }
}
```

## 🎯 New Features for Refactor Practice

### 1. Enhanced Profile Management

**Added Fields**:

- `address`: User's full address (text)
- `phoneNumber`: Contact number (10-15 digits)
- `birthDate`: Date of birth (date picker)
- `longBio`: Detailed bio for ETL practice (max 2000 characters)

**Default Values**: All new fields are populated from the API response when editing profile.

**Long Bio Purpose**: Designed specifically for Sesi 12 ETL practice with complex text data.

### 2. Division Filtering

**Frontend Implementation**:

- Dropdown filter for division selection
- Real-time filtering without debouncing
- Direct API calls on filter change
- No pagination or optimization

**Backend Implementation**:

- Query parameter support: `?division=Tech`
- Intentionally poor performance practices:
  - No indexing on division_name
  - Manual JOIN operations
  - No LIMIT clause
  - Complex subqueries
  - String concatenation in WHERE clause

**Example Bad Query**:

```sql
SELECT * FROM users
JOIN user_divisions ON users.id = user_divisions.user_id
WHERE user_divisions.division_name = 'Marketing'
```

### 3. Enhanced User List Display

**New Fields Displayed**:

- Address information
- Division assignment
- Phone number (if available)

**Performance Issues for Practice**:

- Multiple state variables
- Inefficient filtering logic
- No memoization
- Complex sorting algorithms
- Unnecessary re-renders

## 🚀 Running the Application

1. **Start the development server**

   ```bash
   npm run dev
   ```

2. **Access the application**

   - **Main Page**: http://localhost:3000
   - **Login**: http://localhost:3000/login
   - **Profile**: http://localhost:3000/profile
   - **Users List**: http://localhost:3000/users

3. **Test the new features**

   - **Profile Update**: Edit address, phone, birth date
   - **Division Filter**: Use dropdown to filter users by division
   - **Performance**: Check console for timing information

## 🔍 Performance Monitoring

The application includes comprehensive monitoring with Prometheus metrics and Grafana Cloud integration.

### Prometheus Metrics

The application exposes custom metrics at `/api/metrics`:

- **HTTP Metrics**: Request count, duration, status codes
- **Database Metrics**: Query duration, connection stats
- **JWT Metrics**: Token generation time
- **System Metrics**: CPU, memory, heap usage

### Console Timing

- `Profile Get Execution`: Time to fetch user profile
- `Profile Update Execution`: Time to update profile
- `Users API Execution`: Time to fetch users list
- `Users Page Fetch`: Frontend fetch timing

### Performance Issues to Address

1. **Database Queries**: Complex joins, subqueries, no indexing
2. **Frontend Logic**: Inefficient filtering, sorting, state management
3. **API Design**: No pagination, no caching, no optimization
4. **Component Structure**: Poor separation of concerns

## 📊 Monitoring Setup

### Quick Start

1. **Start the application**

   ```bash
   npm run dev
   ```

2. **Setup Prometheus**

   - Download from https://prometheus.io/download/
   - Copy `prometheus.yml.template` to Prometheus folder
   - Update with your Grafana Cloud credentials
   - Run: `prometheus.exe --config.file=prometheus.yml`

3. **View metrics**
   - Local: http://localhost:3000/api/metrics
   - Prometheus UI: http://localhost:9090
   - Grafana Cloud: Your workspace dashboard

### Available Metrics

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration
- `database_query_duration_seconds` - Database query time
- `jwt_token_generation_duration_seconds` - JWT generation time
- `process_cpu_seconds_total` - CPU usage
- `process_resident_memory_bytes` - Memory usage

For detailed setup instructions, see [PROMETHEUS_SETUP.md](./PROMETHEUS_SETUP.md).

## 🧪 Testing

The project includes comprehensive automated testing with Jest (unit tests) and Playwright (E2E tests).

### Unit Tests (Jest)

```bash
# Run all unit tests
npm test

# Run specific test files
npm test -- --testPathPattern=api-login.test.ts
npm test -- --testPathPattern=profile.test.tsx

# Run API stability tests
npm run test:api-stability
npm run test:api-stability:run
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run performance tests with metrics to Prometheus/Grafana
npm run test:e2e:performance

# Run with specific browser
npx playwright test --project=chromium

# Run with browser visible (like Cypress)
npx playwright test --headed

# Run with interactive UI mode (recommended for development)
npx playwright test --ui

# Debug specific test
npx playwright test --debug

# Run specific test file
npx playwright test e2e/login.spec.ts
npx playwright test e2e/users-stability-performance.spec.ts
```

### Playwright Test Modes

| Mode         | Command                        | Description                                 |
| ------------ | ------------------------------ | ------------------------------------------- |
| **Headless** | `npm run test:e2e`             | Browser runs in background (fastest)        |
| **Headed**   | `npx playwright test --headed` | Browser visible, automated execution        |
| **UI Mode**  | `npx playwright test --ui`     | Interactive mode like Cypress (recommended) |
| **Debug**    | `npx playwright test --debug`  | Step-by-step debugging with browser         |

### Available E2E Tests

1. **`login.spec.ts`** - Authentication flow testing

   - Valid login with demo credentials
   - Invalid login rejection
   - Redirect validation

2. **`users-stability-performance.spec.ts`** - Performance testing
   - 20 iterations of /users page loading
   - Metrics sent to Prometheus/Grafana
   - Performance analysis and reporting

### Test Coverage

- **API Tests**: Login, profile, users endpoints
- **Component Tests**: Login form, profile page, user list
- **Performance Tests**: Load time measurement for before/after refactoring
- **Stability Tests**: 100 consecutive API calls validation

## 📊 Performance Monitoring Scripts

The project includes dedicated scripts for continuous performance monitoring and load testing.

### Available Performance Scripts

```bash
# React Component Performance Monitoring
npm run generate-react-data

# Database Performance Testing
npm run generate-db-metrics

# API Performance Testing
npm run generate-api-metrics
```

### 1. React Component Performance Monitoring

**Script**: `scripts/generate-consistent-react-data.js`

**Purpose**: Monitor React component render performance over time

**Features**:

- **Duration**: 30 minutes continuous monitoring
- **Interval**: Metrics sent every 5 seconds
- **Components**: UsersPage and UserCard components
- **Metrics**: `react_component_render_duration_seconds`
- **Realistic Data**: Simulated render times (0.01-0.06s)

**Usage**:

```bash
npm run generate-react-data
```

**Output**:

```
🚀 Generating Consistent React Metrics Data...
📊 Will generate data for 30 minutes
⏱️  Sending metrics every 5 seconds
🎯 Target components: UsersPage, UserCard
[14:30:15] Sent 3 metrics (UsersPage: 0.045s, 2 UserCards: ~0.025s each)
```

### 2. Database Performance Testing

**Script**: `scripts/generate-database-metrics.js`

**Purpose**: Test database performance through API endpoints

**Features**:

- **Load**: 20 requests with 3 concurrent requests per batch
- **Endpoint**: `/api/users` (database-heavy endpoint)
- **Metrics**:
  - `api_response_duration_seconds`
  - `api_requests_total`
  - `database_query_duration_seconds`
- **Analysis**: Average, min, max response times

**Usage**:

```bash
npm run generate-db-metrics
```

**Output**:

```
🚀 Starting Database Query Metrics Generation
📊 Target: 20 requests to /api/users
⚡ Concurrency: 3 requests per batch
✅ Request 1: 0.85s, Users: 1000, DB Query: 0.68s
📊 Database Query Metrics Results:
📈 Success Rate: 20/20 (100.0%)
⏱️  API Response Time:
   - Average: 0.92s
   - Min: 0.75s
   - Max: 1.25s
```

### 3. API Performance Testing

**Script**: `scripts/generate-api-metrics.js`

**Purpose**: Test API endpoints performance

**Features**:

- **Endpoints**: `/api/users`, `/api/metrics`
- **Load**: 20 requests per endpoint with 3 concurrent
- **Metrics**:
  - `api_response_duration_seconds`
  - `api_requests_total`
- **Multi-endpoint**: Tests multiple API endpoints

**Usage**:

```bash
npm run generate-api-metrics
```

**Output**:

```
🚀 Starting API Metrics Generation for Prometheus/Grafana...
📊 Metrics Generation Configuration:
   - Total Requests: 20
   - Concurrent Requests: 3
   - Endpoints: 2
🎯 Generating metrics for Users API (GET /api/users)
✅ Request 1/20 - 0.245s (Status: 200)
📊 Users API Metrics Generated:
   - Successful Requests: 20/20
   - Failed Requests: 0/20
   - Metrics Sent: 40
```

### Performance Testing Comparison

| Script Type    | Purpose                      | Load Level   | Concurrent   | Duration    |
| -------------- | ---------------------------- | ------------ | ------------ | ----------- |
| **React Data** | UI Performance Monitoring    | Very Light   | Sequential   | 30 minutes  |
| **Database**   | Database Performance Testing | Light-Medium | 3 concurrent | ~5 minutes  |
| **API**        | API Endpoint Testing         | Light-Medium | 3 concurrent | ~5 minutes  |
| **E2E**        | Full System Testing          | Medium       | Sequential   | ~10 minutes |

### Performance Testing

The E2E performance test (`users-stability-performance.spec.ts`) is designed for:

- **Before/After Comparison**: Measure performance before and after refactoring
- **Load Testing**: 20 iterations to validate stability
- **Metrics to Prometheus**: Sends metrics to `/api/metrics/record`
- **Grafana Dashboard Updates**: Real-time metrics in dashboard
- **Authentication**: Includes login flow before testing
- **Metrics Generated**:
  - `e2e_page_load_duration_seconds` - Page load time
  - `e2e_user_count` - Number of users loaded
  - `e2e_test_iteration_total` - Test iteration count
  - `e2e_test_summary_*` - Summary statistics
- **Output**: Console logs + Prometheus/Grafana metrics

**Expected Output**:

```
🚀 Starting Performance Test with Metrics - 20 iterations
🔐 Logging in user...
✅ Login successful, redirected to /users
🔄 Iterasi ke-1: Loading halaman /users...
✅ Iterasi ke-1: Load time: 115ms, Users: 1 - Metrics sent
📊 Performance Test Results:
📈 Success Rate: 20/20 (100.0%)
⏱️  Page Load Time:
   - Average: 125.50ms
   - Min: 95.00ms
   - Max: 180.00ms
🎯 Performance Analysis:
   - ✅ Excellent performance (< 1s average)
```

## 🔑 Demo Credentials

For testing and automation, use these credentials:

### Default Test Users

All seeded users have the same password: `User123@`

**Note**: For automated testing, use the fixed test accounts below as they are guaranteed to work.

**Example Users**:

- `aku123@gmail.com` / `password123` ⭐ **Recommended for testing**
- `kamu123@yopmail.com` / `password123`
- `user123@test.com` / `password123`

### Fixed Test Accounts

These accounts are created during database seeding:

- `aku123@gmail.com` / `password123` ⭐ **Recommended for automation testing**
- `kamu123@yopmail.com` / `password123`
- `user123@test.com` / `password123`

## 🤖 Automation Testing Setup

### Recommended Test Account

For all automated testing (Playwright, performance scripts), use:

- **Email**: `aku123@gmail.com`
- **Password**: `password123`

This account is guaranteed to work and is used in all test scripts.

## 🚀 Quick Start Guide

### 1. Setup and Run

```bash
# Install dependencies
npm install

# Setup database
npm run db-create

# Start development server
npm run dev
```

### 2. Test the Application

```bash
# Run unit tests
npm test

# Run E2E tests with browser visible
npx playwright test --headed

# Run performance monitoring
npm run generate-react-data
```

### 3. Monitor Performance

```bash
# Database performance testing
npm run generate-db-metrics

# API performance testing
npm run generate-api-metrics

# E2E performance testing
npm run test:e2e:performance
```

### 4. Development with UI Testing

```bash
# Interactive Playwright UI (like Cypress)
npx playwright test --ui

# Debug specific test
npx playwright test --debug
```

For detailed testing documentation, see [API_STABILITY_TESTING.md](./API_STABILITY_TESTING.md).

## 📊 Code Coverage with Codecov

The project uses [Codecov](https://codecov.io) for comprehensive code coverage tracking and quality assurance.

### 🎯 Coverage Requirements

- **Project Coverage**: 90% minimum overall project coverage
- **Patch Coverage**: 80% minimum for new code in PRs (more realistic)
- **Strict PR Blocking**: Pull requests cannot be merged if:
  - Overall project coverage drops below 90%
  - New code coverage is below 80%
  - Coverage drops more than 1% from base branch
  - Any coverage regression is detected
- **Coverage Regression Detection**: Automatic blocking when coverage drops by 1% or more
- **Base Branch Comparison**: Compares against main/master branch to prevent regression
- **Smart Exclusions**: Test files, configs, and documentation are excluded from coverage
- **Guaranteed Comments**: Every PR gets detailed Codecov comments and notifications

### 🚀 Codecov Features

#### **Automatic Coverage Analysis**

- **Branch Coverage**: Tracks conditional logic coverage
- **Function Coverage**: Monitors individual function coverage
- **Method/Class Coverage**: Object-oriented coverage tracking
- **Line Coverage**: Detailed line-by-line coverage analysis

#### **GitHub Integration**

- **PR Annotations**: Shows coverage directly in pull request diffs
- **Required Status Checks**: Automatically blocks merges on coverage failures (required: true)
- **Rich Comments**: Detailed coverage reports in PR comments (guaranteed on every PR)
- **Coverage Trends**: Historical coverage tracking and visualization
- **Always Post Comments**: Every PR gets Codecov comments regardless of coverage changes
- **Enhanced Annotations**: Line, function, branch, and method coverage in PR diffs
- **Coverage Regression Comments**: Explains why PRs are blocked due to coverage drops
- **Base Branch Comparison**: Shows coverage difference from main/master branch

#### **Smart File Management**

```yaml
# Excluded from coverage:
- Test files (*.test.ts, *.test.tsx, *.spec.ts, *.spec.tsx)
- Configuration files (*.config.*, jest.config.js, etc.)
- Documentation (*.md files)
- Scripts and utilities
- Type definitions (*.d.ts)
- Public assets and static files

# Included in coverage:
- Source code (src/**/*.ts, src/**/*.tsx)
- API routes and components
- Utility functions and hooks
```

#### **Coverage Flags**

The project uses separate coverage tracking for different code areas:

- **Frontend**: Components, pages, and hooks (`src/components/`, `src/app/`, `src/hooks/`)
- **API**: Backend routes and handlers (`src/app/api/`)
- **Library**: Utility functions and helpers (`src/lib/`)

#### **Notifications & Alerts**

- **Slack Integration**: Real-time coverage notifications
- **Email Alerts**: Coverage drop notifications
- **PR Comments**: Automatic coverage reports
- **Coverage Drop Alerts**: Immediate notifications for 1%+ drops
- **Coverage Regression Alerts**: Automatic blocking and comments for any coverage drop
- **Base Branch Comparison Alerts**: Notifications when coverage drops below base branch

### 📈 Coverage Reports

#### **Available Reports**

- **Cobertura**: XML format for CI/CD integration
- **LCOV**: Standard coverage format
- **HTML**: Detailed web-based reports
- **Trend Graphs**: Historical coverage visualization
- **Heatmaps**: Visual coverage density analysis

#### **Coverage Visualization**

- **Coverage Graphs**: Trend analysis over time
- **Heatmaps**: Visual representation of coverage density
- **File Coverage**: Per-file coverage breakdown
- **Function Coverage**: Individual function coverage tracking

### 🔧 Configuration

The Codecov configuration is defined in `codecov.yml` with the following key settings:

```yaml
# Coverage thresholds
coverage:
  minimum: 90
  status:
    project:
      target: 90%
      threshold: 1%
    patch:
      target: 80% # More realistic for new code
      threshold: 1% # Strict threshold for regression detection
      informational: false # Blocks PRs

# Comment configuration
comment:
  require_changes: false # Always post comments
  require_base: false # Don't require base coverage
  require_head: false # Don't require head coverage

# Coverage comparison and regression detection
comparison:
  base: auto # Compare against base branch
  regression:
    enabled: true # Detect coverage regression
    threshold: 0% # Any drop blocks merge
    fail: true # Block merges on regression
    comment: true # Post comments on regression

# GitHub status checks
github_checks:
  status:
    project:
      required: true # Must pass to merge
    patch:
      required: true # Must pass to merge
    changes:
      required: true # Must pass to merge

# Smart exclusions
ignore:
  - "**/*.test.ts"
  - "**/*.config.*"
  - "**/*.md"
  - "**/scripts/**"

# Advanced features
advanced:
  branch_coverage: true
  function_coverage: true
  conditional_coverage: true
```

### 🎯 Quality Assurance

#### **Coverage Enforcement**

- **90% Project Minimum**: Overall project must maintain 90% coverage
- **80% Patch Minimum**: New code in PRs must have 80% coverage (more realistic)
- **Strict PR Blocking**: Automatic merge blocking for any coverage regression
- **1% Drop Detection**: Blocks PRs when coverage drops by 1% or more
- **Base Branch Comparison**: Prevents coverage regression from main/master
- **Required Status Checks**: All coverage checks must pass to merge PR
- **Quality Gates**: Multiple coverage checks (project, patch, changes)
- **Guaranteed Feedback**: Every PR gets Codecov comments and status checks

#### **Performance Optimization**

- **Caching**: Faster coverage processing
- **Parallel Processing**: Optimized performance
- **Incremental Coverage**: Efficient coverage tracking
- **Carryforward**: Maintains coverage history

### 📊 Monitoring Coverage

#### **Local Coverage Testing**

```bash
# Run tests with coverage
npm test -- --coverage

# Generate coverage report
npm run test:coverage

# View coverage in browser
npm run test:coverage:view
```

#### **Coverage Dashboard**

- **Codecov Dashboard**: https://codecov.io/gh/[username]/[repo]
- **Coverage Badge**: ![Codecov](https://codecov.io/gh/[username]/[repo]/graph/badge.svg)
- **PR Coverage**: Automatic coverage reports in pull requests
- **Historical Trends**: Coverage evolution over time

### 🚨 Coverage Alerts

#### **Automatic Alerts**

- **Coverage < 90%**: Automatic PR comments and merge blocking
- **1% Coverage Drop**: Immediate alerts and notifications
- **New Uncovered Code**: Detection of untested new features
- **Coverage Regression**: Historical comparison alerts

#### **Alert Channels**

- **GitHub Comments**: Direct feedback in pull requests
- **Slack Notifications**: Team channel alerts
- **Email Notifications**: Coverage drop emails
- **Status Checks**: GitHub status check failures

### 📚 Best Practices

#### **Maintaining High Coverage**

1. **Write Tests First**: Follow TDD practices
2. **Cover Edge Cases**: Test error conditions and boundaries
3. **Mock External Dependencies**: Isolate unit tests
4. **Regular Coverage Reviews**: Monitor coverage trends
5. **Fix Coverage Gaps**: Address uncovered code promptly

#### **Coverage Strategy**

- **Unit Tests**: High coverage for individual functions
- **Integration Tests**: Cover API endpoints and workflows
- **E2E Tests**: Critical user journey coverage
- **Performance Tests**: Coverage for performance-critical code

For more information about Codecov features and configuration, visit [Codecov Documentation](https://docs.codecov.io/).

## 📊 Monitoring & Observability

### Prometheus & Grafana Setup

This project includes comprehensive monitoring with Prometheus and Grafana Cloud integration for real-time performance tracking.

#### **Features**

- **API Response Time Monitoring**: Track API endpoint performance
- **React Component Render Time**: Monitor frontend component performance
- **Request Rate Monitoring**: Track API usage patterns
- **Memory & CPU Usage**: System resource monitoring
- **Custom Metrics**: Application-specific performance indicators

#### **Architecture**

```
Application → Prometheus → Grafana Cloud → Dashboard
```

### 🚀 Quick Start Monitoring

#### **1. Start Application**

```bash
npm run dev
```

#### **2. Start Prometheus**

```bash
# Using the provided config
prometheus --config.file=prometheus.yml
```

#### **3. Access Monitoring**

- **Application**: http://localhost:3000
- **Prometheus**: http://localhost:9090
- **Metrics Endpoint**: http://localhost:3000/api/metrics
- **Grafana Dashboard**: Your Grafana Cloud URL

### 📈 Available Metrics

#### **API Metrics**

- `api_response_duration_seconds` - API response time
- `api_requests_total` - Total API requests
- `http_request_duration_seconds` - HTTP request duration
- `http_requests_total` - Total HTTP requests

#### **React Component Metrics**

- `react_component_render_duration_seconds` - Component render time
- Component names: `UsersPage`, `UserCard`
- Pages: `users`, `login`, `profile`

#### **System Metrics**

- `process_cpu_seconds_total` - CPU usage (seconds)
- `process_resident_memory_bytes` - Memory usage (bytes)
- `nodejs_heap_size_total_bytes` - Heap size (bytes)

#### **E2E Test Metrics**

- `e2e_page_load_duration_seconds` - Page load time in E2E tests
- `e2e_user_count` - Number of users loaded in E2E tests
- `e2e_test_iteration_total` - Total E2E test iterations
- `e2e_test_summary_avg_load_time_seconds` - Average load time summary
- `e2e_test_summary_min_load_time_seconds` - Minimum load time summary
- `e2e_test_summary_max_load_time_seconds` - Maximum load time summary
- `e2e_test_summary_success_rate` - E2E test success rate percentage

#### **Database Metrics**

- `database_query_duration_seconds` - Database query execution time
- Query types: `users_query` (for /api/users endpoint)
- Labels: `query_type` for specific query identification

### 🎯 Grafana Dashboard Panels

#### **1. React Component Average Render Time**

```promql
rate(react_component_render_duration_seconds_sum[5m]) / rate(react_component_render_duration_seconds_count[5m])
```

#### **2. React Component Render Count**

```promql
rate(react_component_render_duration_seconds_count[5m])
```

#### **3. React Component 95th Percentile**

```promql
histogram_quantile(0.95, rate(react_component_render_duration_seconds_bucket[5m]))
```

#### **4. API Average Response Time**

```promql
rate(api_response_duration_seconds_sum[5m]) / rate(api_response_duration_seconds_count[5m])
```

#### **5. API 95th Percentile Response Time**

```promql
histogram_quantile(0.95, rate(api_response_duration_seconds_bucket[5m]))
```

#### **6. E2E Page Load Time**

```promql
e2e_page_load_duration_seconds{test_type="playwright"}
```

#### **7. E2E Test Success Rate**

```promql
rate(e2e_test_iteration_total{test_type="playwright", status="success"}[5m]) / rate(e2e_test_iteration_total{test_type="playwright"}[5m]) * 100
```

#### **8. E2E User Count**

```promql
e2e_user_count{test_type="playwright"}
```

#### **9. Database Query Duration - /api/users**

```promql
# Average database query duration for /api/users
rate(database_query_duration_seconds_sum{query_type="users_query"}[5m]) / rate(database_query_duration_seconds_count{query_type="users_query"}[5m])
```

#### **10. Database Query 95th Percentile - /api/users**

```promql
# 95th percentile database query duration for /api/users
histogram_quantile(0.95, rate(database_query_duration_seconds_bucket{query_type="users_query"}[5m]))
```

#### **11. Database Query Count - /api/users**

```promql
# Total database queries for /api/users
rate(database_query_duration_seconds_count{query_type="users_query"}[5m])
```

#### **12. CPU Usage (Corrected)**

```promql
# CPU usage as percentage
rate(process_cpu_seconds_total[5m]) * 100
```

#### **13. Memory Usage (MB)**

```promql
# Memory usage in megabytes
process_resident_memory_bytes / 1024 / 1024
```

### 🔧 Configuration Files

#### **Prometheus Configuration** (`prometheus.yml`)

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "update-profile"
    static_configs:
      - targets: ["localhost:3000"]
    metrics_path: "/api/metrics"
```

#### **Grafana Configuration** (`grafana-config.json`)

```json
{
  "dashboard": {
    "title": "Workshop Update Profile Project",
    "panels": [
      {
        "title": "React Component Average Render Time",
        "type": "timeseries"
      }
    ]
  }
}
```

### 📊 Generating Test Data

#### **React Component Metrics**

```bash
# Generate consistent React metrics data
node scripts/generate-consistent-react-data.js
```

#### **API Metrics**

```bash
# Generate API metrics for Prometheus/Grafana
node scripts/generate-api-metrics.js
```

#### **Database Query Metrics**

```bash
# Generate database query metrics for /api/users
node scripts/generate-database-metrics.js
```

#### **E2E Test Metrics**

```bash
# E2E test with metrics to Prometheus/Grafana
npm run test:e2e:performance
```

**Script Differences:**

**`generate-api-metrics.js` (API Metrics Generation):**

- Tests public endpoints: `/api/users`, `/api/metrics`
- 20 total requests with 3 concurrent requests per batch
- Sends metrics to `/api/metrics/record` endpoint
- Generates `api_response_duration_seconds` and `api_requests_total` metrics
- **Updates Prometheus/Grafana dashboard**
- Note: `/api/profile` excluded (requires authentication)

**`generate-database-metrics.js` (Database Query Metrics):**

- Tests `/api/users` endpoint specifically for database performance
- 20 total requests with 3 concurrent requests per batch
- Sends metrics to `/api/metrics/record` endpoint
- Generates `database_query_duration_seconds` with `query_type="users_query"`
- **Updates Prometheus/Grafana dashboard** with database-specific panels
- Simulates database query timing (80% of API response time)

**E2E Test with Metrics:**

**`users-stability-performance.spec.ts` (E2E with Metrics):**

- 20 iterations of loading `/users` page
- Sends metrics to `/api/metrics/record` endpoint
- Generates E2E-specific metrics:
  - `e2e_page_load_duration_seconds` - Page load time
  - `e2e_user_count` - Number of users loaded
  - `e2e_test_iteration_total` - Test iteration count
  - `e2e_test_summary_*` - Summary statistics
- **Updates Prometheus/Grafana dashboard**

### 🎨 Dashboard Customization

#### **Adding Database Query Panels**

To add database query performance panels to your Grafana dashboard:

1. **Add New Panel** → **Time series**
2. **Query Editor** → **PromQL**
3. **Use these queries:**

**Panel 1: Database Query Average Duration**

```promql
rate(database_query_duration_seconds_sum{query_type="users_query"}[5m]) / rate(database_query_duration_seconds_count{query_type="users_query"}[5m])
```

- **Title**: "Database Query Duration - /api/users"
- **Unit**: seconds
- **Legend**: "{{query_type}}"

**Panel 2: Database Query 95th Percentile**

```promql
histogram_quantile(0.95, rate(database_query_duration_seconds_bucket{query_type="users_query"}[5m]))
```

- **Title**: "Database Query 95th Percentile - /api/users"
- **Unit**: seconds
- **Legend**: "95th percentile"

**Panel 3: Database Query Count**

```promql
rate(database_query_duration_seconds_count{query_type="users_query"}[5m])
```

- **Title**: "Database Query Count - /api/users"
- **Unit**: queries/sec
- **Legend**: "Queries per second"

**Panel 4: CPU Usage (Corrected)**

```promql
rate(process_cpu_seconds_total[5m]) * 100
```

- **Title**: "CPU Usage"
- **Unit**: percent (0-100)
- **Legend**: "CPU Usage (%)"

**Panel 5: Memory Usage (MB)**

```promql
process_resident_memory_bytes / 1024 / 1024
```

- **Title**: "Memory Usage"
- **Unit**: megabytes
- **Legend**: "Memory (MB)"

#### **Legend Format**

Since custom legend format is not available in all Grafana versions, use query comments:

```promql
# For UsersPage component
rate(react_component_render_duration_seconds_count{component_name="UsersPage"}[5m]) # UsersPage (users)

# For UserCard component
rate(react_component_render_duration_seconds_count{component_name="UserCard"}[5m]) # UserCard (users)
```

#### **Panel Settings**

- **Time Range**: Last 1 hour or Last 6 hours
- **Refresh**: 10s for real-time updates
- **Legend**: Auto mode
- **Tooltip**: All series visible

### 🔍 Troubleshooting

#### **No Data in Grafana**

1. **Check Prometheus Targets**: http://localhost:9090/targets
2. **Verify Metrics Endpoint**: http://localhost:3000/api/metrics
3. **Generate Test Data**: Run test scripts
4. **Check Time Range**: Ensure sufficient time range

#### **React Metrics Not Appearing**

1. **Verify Hook Implementation**: Check `usePerformanceMonitor` usage
2. **Check Network Requests**: Browser DevTools → Network tab
3. **Test Metrics Endpoint**: Direct API calls to `/api/metrics/record`
4. **Generate Data**: Run React metrics test script

#### **Query Issues**

1. **Basic Query Test**: `react_component_render_duration_seconds`
2. **Check Labels**: Verify component_name and page labels
3. **Time Range**: Ensure data exists in selected time range
4. **Prometheus Direct**: Test queries in Prometheus UI

### 🧪 Testing & Quality Assurance

### Test Structure

```
├── __tests__/                    # Jest Unit Tests
│   ├── api-stability.test.ts     # API stability (100 requests)
│   ├── api-login.test.ts         # Login API tests
│   ├── api-profile.test.ts       # Profile API tests
│   ├── login.test.tsx            # Login component tests
│   ├── profile.test.tsx          # Profile component tests
│   └── update-password.test.tsx  # Password update tests
├── e2e/                          # Playwright E2E Tests
│   └── users-stability-performance.spec.ts  # Performance testing (20 iterations)
└── scripts/
    └── run-api-stability-test.js # Test runner script
```

### 🚀 Quick Test Commands

```bash
# Run all unit tests
npm test

# Run all E2E tests
npm run test:e2e

# Run specific test suites
npm run test:api-stability        # API stability (Jest)
npm run test:e2e:performance      # Performance testing (Playwright)

# Run with verbose output
npm run test:api-stability:run    # With detailed logging
```

### 📊 Test Coverage

#### **API Testing**

- ✅ Login endpoint validation
- ✅ Profile CRUD operations
- ✅ Users list with filtering
- ✅ API stability under load (100 requests)
- ✅ Response structure validation

#### **Component Testing**

- ✅ Login form functionality
- ✅ Profile update forms
- ✅ Password change forms
- ✅ User list rendering

#### **Performance Testing**

- ✅ Page load time measurement
- ✅ Before/after refactoring comparison
- ✅ Stability validation (20 iterations)
- ✅ Performance classification

### 🎯 API Stability Testing

#### **Test Features**

- **Response Stability**: Ensures all requests return status 200
- **Data Consistency**: Validates response data consistency across requests
- **Performance Metrics**: Measures response times and identifies bottlenecks
- **Concurrent Handling**: Tests multiple simultaneous requests
- **Error Handling**: Monitors and reports any failures

#### **Test Configuration**

- **Total Requests**: 100 consecutive requests
- **Concurrent Requests**: 10 simultaneous requests
- **Timeout**: 5 minutes for main test, 1 minute for concurrent test
- **Success Rate Threshold**: 90% minimum success rate
- **Response Time Limit**: 10 seconds maximum per request

#### **Expected Results**

```
📊 Test Results Summary:
📈 Success Rate: 100/100 (100.00%)
❌ Failed Requests: 0
⏱️  Response Time Statistics:
   - Average: 245.32ms
   - Min: 180ms
   - Max: 320ms
📊 Data Length Statistics:
   - Average: 15.00 users
   - Min: 15 users
   - Max: 15 users
```

### 📈 Performance Metrics

The E2E performance test provides:

- **Load Time Statistics**: Average, min, max
- **Success Rate**: Percentage of successful iterations
- **Performance Classification**:
  - ✅ Excellent (< 5s average)
  - ⚠️ Moderate (5-15s average)
  - ❌ Poor (> 15s average)

### 🔧 Test Configuration

#### **Jest Configuration**

- **Test Environment**: jsdom
- **Coverage**: Enabled with multiple reporters
- **Timeout**: 30 seconds default

#### **Playwright Configuration**

- **Browser**: Chromium (with Chrome fallback)
- **Timeout**: 1 hour for performance tests
- **Base URL**: http://localhost:3000
- **Auto-start**: Next.js dev server

## 🔐 Token Expiration & Auto-Logout

### Features

#### **Token Expiration Monitoring**

- ✅ Monitor token expiration secara real-time
- ✅ Warning 5 menit sebelum expired
- ✅ Auto logout ketika token expired
- ✅ Countdown timer untuk user

#### **Components**

- **`TokenExpirationWarning.tsx`**: Modal warning dengan countdown timer
- **`SessionTimer.tsx`**: Display session time remaining dengan color coding
- **`useTokenExpiration.ts`**: Hook untuk monitor token expiration

### Implementation

#### **Token Monitoring**

```typescript
const { timeRemaining, isExpired, showWarningModal } = useTokenExpiration({
  warningThreshold: 300, // 5 menit
  checkInterval: 10000, // 10 detik
  autoLogout: true,
});
```

#### **User Experience**

- **Timer Hijau**: Session masih lama
- **Timer Kuning**: Session akan expired dalam 15 menit
- **Timer Merah**: Session akan expired dalam 5 menit
- **Warning Modal**: Muncul 5 menit sebelum expired dengan countdown 60 detik

#### **Security Features**

- **Token Validation**: Check expiration time setiap request
- **Auto Cleanup**: Clear localStorage dan sessionStorage
- **API Protection**: 401 responses dengan specific error codes

## ☁️ Render Database Setup

### Environment Variables untuk Render

```bash
# Render Database Configuration
DB_HOST=your-render-db-host.render.com
DB_PORT=5432
DB_USER=your-render-db-user
DB_PASSWORD=your-render-db-password
DB_NAME=your-render-db-name

# JWT Configuration
JWT_SECRET=super-secret-key-for-workshop-demo-only
```

### Commands untuk Render

```bash
# Create Database di Render
npm run db-create-render

# Test Connection
npm run db-test
```

### Cara Dapatkan Render Database Credentials

1. **Buka Render Dashboard**: https://dashboard.render.com
2. **Copy Connection String**: External Database URL
3. **Parse ke Environment Variables**:
   ```bash
   # Dari: postgres://user:password@host:port/database
   # Ke .env.local:
   DB_HOST=host
   DB_PORT=port
   DB_USER=user
   DB_PASSWORD=password
   DB_NAME=database
   ```

### Render Database Limitations

- **Tidak Bisa Create Database**: Render database sudah pre-created
- **Connection Limits**: Free tier: 1 connection, Paid tier: multiple connections
- **Data Size**: Free tier: 1GB, Paid tier: lebih besar
- **Script Differences**: 100 users (reduced dari 1000) untuk Render

### Troubleshooting Render

#### **SSL Error**

```bash
# Error: SSL/TLS required
# Solution: Script sudah diupdate dengan SSL config
npm run db-create-render
```

#### **Connection Issues**

- Check database status di Render dashboard
- Verify host dan port
- Check firewall settings
- Verify username dan password

## 📚 Workshop Materials

### Session 11 - Refactoring Practice

**Topics Covered**:

- Database query optimization
- Frontend performance improvements
- API design patterns
- Component refactoring
- State management optimization

**Practice Areas**:

1. **Database**: Index creation, query optimization, JOIN strategies
2. **Frontend**: React optimization, memoization, state management
3. **API**: Pagination, caching, response optimization
4. **Architecture**: Code organization, separation of concerns

### Session 12 - Query Optimization

**Focus Areas**:

- SQL query performance analysis
- Index strategy development
- Query execution plan optimization
- Database schema improvements

## 🐛 Troubleshooting

### Database Connection Issues

1. **Password Authentication Failed**

   ```bash
   # Check PostgreSQL service
   # Windows: Services > PostgreSQL
   # macOS: brew services list
   # Ubuntu: sudo systemctl status postgresql
   ```

2. **Database Does Not Exist**

   ```bash
   # Drop and recreate
   npm run db-drop
   npm run db-create
   ```

3. **Connection Refused**
   ```bash
   # Check PostgreSQL is running
   # Verify port 5432 is open
   # Check firewall settings
   ```

### Environment Variables

1. **Variables Not Loading**

   ```bash
   # Ensure .env.local exists
   # Restart development server
   npm run dev
   ```

2. **Wrong Database Credentials**
   ```bash
   # Update .env.local with correct credentials
   # Default: postgres/admin123
   ```

### Application Issues

1. **JWT Token Errors**

   ```bash
   # Clear browser storage
   # Re-login to get new token
   ```

2. **API 500 Errors**
   ```bash
   # Check database connection
   # Verify table structure
   # Check console for detailed errors
   ```

## 📝 Development Notes

### Code Quality

- **Intentional Bad Practices**: Used for workshop demonstration
- **Performance Issues**: Designed for refactoring practice
- **Legacy Patterns**: Demonstrates real-world problems

### Workshop Goals

1. **Identify Performance Bottlenecks**
2. **Practice Query Optimization**
3. **Learn Refactoring Techniques**
4. **Understand Best Practices**

### Future Improvements

- Add proper indexing
- Implement pagination
- Add caching layer
- Optimize React components
- Improve API design

## 📄 License

This project is for educational purposes only.

---

**Note**: This project intentionally contains poor practices for workshop demonstration. In production, follow industry best practices for security, performance, and maintainability.
