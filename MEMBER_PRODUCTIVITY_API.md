# Member Productivity API Documentation

This document provides comprehensive information about the Member Productivity API endpoints for frontend developers.

## Base URL

```
/api/v1/projects
```

## Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Get My Productivity Data

Get productivity analytics for the current authenticated user in a project.

**Endpoint:** `GET /:projectId/my-productivity`

**Parameters:**

- `projectId` (path): Project ID (must be a valid integer)
- `dateRange.startDate` (query, optional): Start date in ISO format (YYYY-MM-DD)
- `dateRange.endDate` (query, optional): End date in ISO format (YYYY-MM-DD)
- `timeRange` (query, optional): Time range filter - 'day', 'week', 'month', 'all'

**Example Request:**

```bash
GET /api/v1/projects/123/my-productivity?timeRange=week
```

**Response:**

```json
{
  "success": true,
  "data": {
    "memberId": 456,
    "memberName": "John Doe",
    "memberAvatar": "https://example.com/avatar.jpg",
    "projectId": 123,
    "projectName": "Project Alpha",
    "role": "developer",
    "position": "Senior Developer",
    "busyLevel": "medium",
    "taskPerformance": {
      "totalTasksAssigned": 15,
      "completedTasks": 12,
      "ongoingTasks": 2,
      "overdueTasks": 1,
      "taskCompletionRate": 80.0,
      "tasksUnderReview": 0,
      "rejectedTasks": 0,
      "tasksByPriority": {
        "high": 5,
        "middle": 7,
        "low": 3
      }
    },
    "timeTracking": {
      "totalTimeLogged": 28800,
      "totalTimeLoggedFormatted": "8h 0m 0s",
      "averageSessionDuration": 3600,
      "averageSessionDurationFormatted": "1h 0m 0s",
      "dailyTimeDistribution": [
        {
          "date": "2024-01-15",
          "totalTime": 28800,
          "sessions": 8
        }
      ],
      "weeklyTimeDistribution": [
        {
          "week": "2024-03",
          "totalTime": 144000,
          "averageDailyTime": 28800
        }
      ],
      "monthlyTimeDistribution": [
        {
          "month": "2024-01",
          "totalTime": 576000,
          "averageDailyTime": 28800
        }
      ],
      "timePerTask": [
        {
          "taskId": 789,
          "taskTitle": "Implement Login Feature",
          "totalTime": 7200,
          "averageTimePerSession": 1800
        }
      ],
      "productivityHours": [
        {
          "hour": 9,
          "totalTime": 7200,
          "sessions": 2
        }
      ]
    },
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  },
  "message": "Your productivity data retrieved successfully"
}
```

## Data Types

### MemberProductivityData

```typescript
interface MemberProductivityData {
  memberId: number;
  memberName: string;
  memberAvatar: string | null;
  projectId: number;
  projectName: string;
  role: string;
  position: string;
  busyLevel: "free" | "low" | "medium" | "high";
  taskPerformance: TaskPerformanceMetrics;
  timeTracking: TimeTrackingAnalytics;
  lastUpdated: Date;
}
```

### TaskPerformanceMetrics

```typescript
interface TaskPerformanceMetrics {
  totalTasksAssigned: number;
  completedTasks: number;
  ongoingTasks: number;
  overdueTasks: number;
  taskCompletionRate: number;
  tasksUnderReview: number;
  rejectedTasks: number;
  tasksByPriority: {
    high: number;
    middle: number;
    low: number;
  };
}
```

### TimeTrackingAnalytics

```typescript
interface TimeTrackingAnalytics {
  totalTimeLogged: number; // in seconds
  totalTimeLoggedFormatted: string; // formatted as "Xh Ym Zs"
  averageSessionDuration: number; // in seconds
  averageSessionDurationFormatted: string;
  dailyTimeDistribution: {
    date: string;
    totalTime: number;
    sessions: number;
  }[];
  weeklyTimeDistribution: {
    week: string;
    totalTime: number;
    averageDailyTime: number;
  }[];
  monthlyTimeDistribution: {
    month: string;
    totalTime: number;
    averageDailyTime: number;
  }[];
  timePerTask: {
    taskId: number;
    taskTitle: string;
    totalTime: number;
    averageTimePerSession: number;
  }[];
  productivityHours: {
    hour: number;
    totalTime: number;
    sessions: number;
  }[];
}
```

### MemberProductivityFilters

```typescript
interface MemberProductivityFilters {
  projectId?: number;
  memberId?: number;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  timeRange?: "day" | "week" | "month" | "all";
}
```

### MemberProductivityResponse

```typescript
interface MemberProductivityResponse {
  success: boolean;
  data: MemberProductivityData;
  message: string;
}
```

## Error Responses

### 400 - Invalid Project ID

```json
{
  "success": false,
  "message": "Invalid project ID"
}
```

### 404 - Member Not Found

```json
{
  "success": false,
  "message": "Member not found in this project",
  "statusCode": 404
}
```

### 401 - Unauthorized

```json
{
  "success": false,
  "message": "Access denied. Please log in.",
  "statusCode": 401
}
```

### 403 - Forbidden

```json
{
  "success": false,
  "message": "You don't have permission to access this resource",
  "statusCode": 403
}
```

### 500 - Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error",
  "statusCode": 500
}
```

## Frontend Integration Examples

### React Hook Example

```typescript
import { useState, useEffect } from "react";

interface UseMyProductivityProps {
  projectId: number;
  filters?: MemberProductivityFilters;
}

export const useMyProductivity = ({
  projectId,
  filters,
}: UseMyProductivityProps) => {
  const [data, setData] = useState<MemberProductivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductivity = async () => {
      try {
        setLoading(true);
        const endpoint = `/api/v1/projects/${projectId}/my-productivity`;

        const queryParams = new URLSearchParams();
        if (filters?.dateRange) {
          queryParams.append(
            "dateRange.startDate",
            filters.dateRange.startDate
          );
          queryParams.append("dateRange.endDate", filters.dateRange.endDate);
        }
        if (filters?.timeRange) {
          queryParams.append("timeRange", filters.timeRange);
        }

        const response = await fetch(`${endpoint}?${queryParams}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch productivity data");
        }

        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProductivity();
  }, [projectId, filters]);

  return { data, loading, error };
};
```

### Service Class Example

```typescript
class MyProductivityService {
  private baseUrl = "/api/v1/projects";
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getMyProductivity(
    projectId: number,
    filters?: MemberProductivityFilters
  ): Promise<MemberProductivityResponse> {
    const queryParams = new URLSearchParams();
    if (filters?.dateRange) {
      queryParams.append("dateRange.startDate", filters.dateRange.startDate);
      queryParams.append("dateRange.endDate", filters.dateRange.endDate);
    }
    if (filters?.timeRange) {
      queryParams.append("timeRange", filters.timeRange);
    }

    return this.request<MemberProductivityResponse>(
      `/${projectId}/my-productivity?${queryParams}`
    );
  }
}

// Usage
const productivityService = new MyProductivityService(
  localStorage.getItem("token") || ""
);

// Get current user productivity
const myData = await productivityService.getMyProductivity(123, {
  timeRange: "week",
});
```

## Recent Updates & Fixes

### v1.1.0 - Latest Improvements

1. **Enhanced Error Handling**: Added comprehensive parameter validation and better error messages
2. **Fixed Route Conflicts**: Resolved routing issues that were causing "Invalid project ID" errors
3. **Improved Data Safety**: Added null/undefined checks and safe number parsing to prevent NaN errors
4. **Association Fixes**: Corrected Sequelize associations to properly handle User and Project relationships
5. **Column Name Corrections**: Fixed Project model field references (using `title` instead of `name`)

### Technical Improvements

- **Parameter Validation**: All numeric parameters are now validated before processing
- **Safe Aggregations**: Database aggregation functions now handle null values gracefully
- **Route Optimization**: Fixed duplicate route mounting and improved route order
- **Type Safety**: Enhanced TypeScript types and error handling throughout the service

## Notes

1. **Time Format**: All time values are returned in seconds and include a formatted string version for display
2. **Date Ranges**: When no date range is provided, the system returns data for the last 30 days
3. **Permissions**: Users can only access their own productivity data
4. **Real-time Updates**: Data is calculated in real-time based on the latest task and time entry records
5. **Performance**: For large datasets, consider using the timeRange filter to limit the data scope
6. **Personal Dashboard**: This endpoint is designed for personal productivity dashboards where users can view their own performance metrics
7. **Error Recovery**: The API now provides clear error messages for invalid parameters and handles edge cases gracefully
8. **Data Integrity**: All calculations include safety checks to prevent division by zero and handle missing data
