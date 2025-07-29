# Summary API Documentation

## Base URL

All endpoints are prefixed with: `/api/v1/projects/:projectId/summary`

## Authentication

All endpoints require:

- **Authentication**: User must be logged in
- **Project Membership**: User must be a member of the project

## Endpoints

### 1. Get Status Overview

**GET** `/api/v1/projects/:projectId/summary/status-overview`

**Description:**
Retrieves task status distribution for all active sprints in a project. Combines data from multiple active sprints into a single overview for dashboard visualization.

**Path Parameters:**

- `projectId` (number, required): The ID of the project

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "totalWorkItems": 15,
  "statusDistribution": {
    "ongoing": 5,
    "closed": 4,
    "underReview": 4,
    "overdue": 2,
    "rejected": 0
  }
}
```

**Response Fields:**

- `totalWorkItems` (number): Total number of tasks across all active sprints
- `statusDistribution` (object): Count of tasks by status
  - `ongoing` (number): Tasks currently in progress
  - `closed` (number): Completed tasks
  - `underReview` (number): Tasks under review
  - `overdue` (number): Tasks past their deadline
  - `rejected` (number): Rejected tasks

**Used for:** Status Overview donut chart in dashboard

---

### 2. Get Team Workload

**GET** `/api/v1/projects/:projectId/summary/team-workload`

**Description:**
Retrieves work distribution by assignee for all active sprints in a project. Shows how tasks are distributed among team members and unassigned tasks.

**Path Parameters:**

- `projectId` (number, required): The ID of the project

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "assignees": [
    {
      "id": 1,
      "name": "John Doe",
      "avatarUrl": "https://example.com/avatar.jpg",
      "workDistribution": 47,
      "taskCount": 7
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "avatarUrl": "https://example.com/avatar2.jpg",
      "workDistribution": 33,
      "taskCount": 5
    }
  ],
  "unassigned": {
    "workDistribution": 20,
    "taskCount": 3
  }
}
```

**Response Fields:**

- `assignees` (array): Array of team members with their work distribution
  - `id` (number): Project member ID
  - `name` (string): User's full name
  - `avatarUrl` (string|null): User's avatar URL
  - `workDistribution` (number): Percentage of work assigned to this member
  - `taskCount` (number): Number of tasks assigned to this member
- `unassigned` (object): Information about unassigned tasks
  - `workDistribution` (number): Percentage of unassigned work
  - `taskCount` (number): Number of unassigned tasks

**Used for:** Team Workload bar chart in dashboard

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Invalid project ID"
}
```

### 401 Unauthorized

```json
{
  "message": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "message": "Access denied - not a project member"
}
```

### 404 Not Found

```json
{
  "message": "Project not found"
}
```

### 500 Internal Server Error

```json
{
  "message": "Failed to get status overview"
}
```

or

```json
{
  "message": "Failed to get team workload"
}
```

---

## Data Aggregation Logic

### Status Overview

- **Data Source**: All active sprints in the project
- **Aggregation**: Combines tasks from multiple active sprints
- **Status Mapping**: Maps task statuses to dashboard categories
- **Empty States**: Returns zero counts when no active sprints exist

### Team Workload

- **Data Source**: All active sprints in the project
- **Aggregation**: Groups tasks by assignee across all active sprints
- **Percentage Calculation**: Work distribution calculated as (taskCount / totalTasks) \* 100
- **Unassigned Tasks**: Tasks without an assigned team member
- **Empty States**: Returns empty assignees array and zero unassigned when no tasks exist

---

## Dashboard Integration

### Status Overview Chart

```javascript
// Example frontend usage
const response = await fetch("/api/v1/projects/123/summary/status-overview");
const data = await response.json();

// Use for donut chart
const chartData = [
  {
    label: "Ongoing",
    value: data.statusDistribution.ongoing,
    color: "#FF6B6B",
  },
  { label: "Closed", value: data.statusDistribution.closed, color: "#4ECDC4" },
  {
    label: "Under Review",
    value: data.statusDistribution.underReview,
    color: "#45B7D1",
  },
  {
    label: "Overdue",
    value: data.statusDistribution.overdue,
    color: "#FFA07A",
  },
  {
    label: "Rejected",
    value: data.statusDistribution.rejected,
    color: "#FF8C42",
  },
];
```

### Team Workload Chart

```javascript
// Example frontend usage
const response = await fetch("/api/v1/projects/123/summary/team-workload");
const data = await response.json();

// Use for bar chart
const chartData = [
  ...data.assignees.map((assignee) => ({
    name: assignee.name,
    percentage: assignee.workDistribution,
    taskCount: assignee.taskCount,
    avatar: assignee.avatarUrl,
  })),
  {
    name: "Unassigned",
    percentage: data.unassigned.workDistribution,
    taskCount: data.unassigned.taskCount,
    avatar: null,
  },
];
```

---

## Multiple Active Sprints Handling

The summary endpoints are designed to handle projects with multiple active sprints:

### Scenario 1: Single Active Sprint

- Data comes from one active sprint
- Simple aggregation

### Scenario 2: Multiple Active Sprints

- Data combines from all active sprints
- Tasks from Sprint A and Sprint B are merged
- Provides unified view of all current work

### Example with Multiple Sprints

```
Sprint A (Active): 8 tasks (3 ongoing, 5 closed)
Sprint B (Active): 7 tasks (2 ongoing, 3 underReview, 2 overdue)

Combined Result:
- totalWorkItems: 15
- statusDistribution: { ongoing: 5, closed: 5, underReview: 3, overdue: 2, rejected: 0 }
```

---

## Performance Considerations

- **Database Queries**: Optimized to fetch all active sprints and their tasks in minimal queries
- **Memory Usage**: Efficient data aggregation using JavaScript array methods
- **Response Time**: Fast response times due to focused data retrieval
- **Caching**: Consider implementing caching for frequently accessed project summaries

---

## Security

- **Authentication Required**: All endpoints require valid user authentication
- **Project Membership**: Users must be members of the project to access summary data
- **Data Isolation**: Users can only access summary data for projects they're members of
- **Input Validation**: Project ID is validated to prevent injection attacks

---

## Rate Limiting

Consider implementing rate limiting for these endpoints:

- **Recommended**: 100 requests per minute per user
- **Burst**: Allow up to 10 requests per second
- **Reason**: Dashboard data is frequently refreshed

---

## Monitoring

Key metrics to monitor:

- **Response Time**: Average response time should be < 200ms
- **Error Rate**: Should be < 1% for 4xx and 5xx errors
- **Usage Patterns**: Track which projects have multiple active sprints
- **Data Volume**: Monitor projects with large numbers of tasks

---

## Future Enhancements

Potential improvements:

- **Caching**: Implement Redis caching for frequently accessed summaries
- **Real-time Updates**: WebSocket integration for live dashboard updates
- **Historical Data**: Add endpoints for trend analysis over time
- **Custom Time Ranges**: Allow filtering by date ranges
- **Export Functionality**: Add CSV/PDF export for summary reports
