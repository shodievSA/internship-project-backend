# Team API Documentation

## Base URL

All endpoints are prefixed with: `/teams`

## Endpoints

### 1. Create Team

**POST** `/teams`

**Request Body:**

```json
{
  "name": "string" // Required - Team name
}
```

**Response (201 Created):**

```json
{
  "id": "clxxxxxxxxxxxxxx",
  "name": "Development Team",
  "createdAt": "2025-06-29T12:00:00.000Z",
  "updatedAt": "2025-06-29T12:00:00.000Z",
  "members": [],
  "projectTeams": [],
  "_count": {
    "members": 0,
    "projectTeams": 0
  }
}
```

---

### 2. Get All Teams (with Pagination & Filtering)

**GET** `/teams`

**Query Parameters:**

- `page`, `limit`: Pagination
- `search`: Search in team name and member user info
- `createdAfter`, `createdBefore`: Filter by creation date
- `hasMembers`: Filter teams with/without members
- `memberCountMin`, `memberCountMax`: Filter by member count
- `projectId`: Filter by project

**Response (200 OK):**

```json
{
  "data": [
    /* array of teams */
  ],
  "pagination": {
    /* pagination info */
  }
}
```

---

### 3. Get Team by ID

**GET** `/teams/:id`

**Response (200 OK):**

```json
{
  "id": "clxxxxxxxxxxxxxx",
  "name": "Development Team",
  "createdAt": "2025-06-29T12:00:00.000Z",
  "updatedAt": "2025-06-29T12:00:00.000Z",
  "members": [
    /* array of team members */
  ],
  "projectTeams": [
    /* array of project teams */
  ],
  "_count": { "members": 1, "projectTeams": 1 }
}
```

---

### 4. Update Team

**PATCH** `/teams/:id`

**Request Body:**

```json
{
  "name": "string" // Optional - New team name
}
```

**Response (200 OK):**

```json
{
  "id": "clxxxxxxxxxxxxxx",
  "name": "Updated Team Name",
  "createdAt": "2025-06-29T12:00:00.000Z",
  "updatedAt": "2025-06-29T12:30:00.000Z",
  "members": [],
  "projectTeams": [],
  "_count": { "members": 0, "projectTeams": 0 }
}
```

---

### 5. Delete Team

**DELETE** `/teams/:id`

**Response (204 No Content):**
_No response body_

---

### 6. Add Team Member (Direct Add)

**POST** `/teams/:teamId/members`

**Request Body:**

```json
{
  "userId": "string", // Required - User ID (must exist)
  "roleId": "string", // Required - Role ID
  "status": "ACTIVE" // Optional - Member status, defaults to "ACTIVE"
}
```

**Response (201 Created):**

```json
{
  "id": "clmemberxxxxxx",
  "teamId": "clxxxxxxxxxxxxxx",
  "userId": "cluserxxxxxxx",
  "roleId": "clrolexxxxxxx",
  "status": "ACTIVE",
  "createdAt": "2025-06-29T12:00:00.000Z",
  "user": {
    "id": "cluserxxxxxxx",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  },
  "role": {
    "id": "clrolexxxxxxx",
    "name": "Developer",
    "description": "Software developer role"
  }
}
```

---

### 7. Invite Team Member by Email

**POST** `/teams/:teamId/invite`

**Request Body:**

```json
{
  "email": "newuser@example.com", // Required - Email address to invite
  "roleId": "string" // Required - Role ID
}
```

**Response (200 OK):**

```json
{
  "message": "Invitation sent!"
}
```

**What happens:**

- The backend will:
  - Find or create a user with the given email
  - Generate an invite token and expiry (24 hours)
  - Create a TeamMember with status `INVITED`, storing the token and expiry
  - Send an invitation email to the user with a link containing the token
- **In development, the invite link will be:**
  `http://localhost:3005/accept-invite?token=THE_TOKEN`
- **The sender email is:** `youcrackman@gmail.com`

**Example invitation link:**

```
http://localhost:3005/accept-invite?token=THE_TOKEN
```

---

### 8. Accept Team Invitation

**POST** `/teams/accept-invite`

**Request Body:**

```json
{
  "token": "string", // Required - Invite token from email link
  "firstName": "string", // Required - User's first name
  "lastName": "string", // Required - User's last name
  "password": "string" // Required - User's password
}
```

**Note:** The email is NOT required in the request body. The backend will look up the user by the token.

**Response (200 OK):**

```json
{
  "message": "Invitation accepted!",
  "user": {
    "id": "cluserxxxxxxx",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith"
    // ...other user fields...
  }
}
```

**Response (400 Bad Request):**

```json
{
  "message": "Invalid or expired token"
}
```

**After a successful invitation acceptance, the user should be redirected to the login page (`/login`) to log in with their new credentials.**

---

### 9. Get Team Members (with Pagination & Filtering)

**GET** `/teams/:teamId/members`

**Query Parameters:**

- `status` (optional): Filter by member status (`ACTIVE`, `INVITED`, `REMOVED`)
- `roleId` (optional): Filter by role ID
- `search` (optional): Search in user information (firstName, lastName, email)
- `page`, `limit`: Pagination

**Response (200 OK):**

```json
{
  "data": [
    /* array of team members */
  ],
  "pagination": {
    /* pagination info */
  }
}
```

---

### 10. Get Team Member by ID

**GET** `/teams/members/:memberId`

**Response (200 OK):**

```json
{
  "id": "clmemberxxxxxx",
  "teamId": "clxxxxxxxxxxxxxx",
  "userId": "cluserxxxxxxx",
  "roleId": "clrolexxxxxxx",
  "status": "ACTIVE",
  "createdAt": "2025-06-29T12:00:00.000Z",
  "user": {
    "id": "cluserxxxxxxx",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  },
  "role": {
    "id": "clrolexxxxxxx",
    "name": "Developer",
    "description": "Software developer role"
  }
}
```

---

### 11. Update Team Member

**PATCH** `/teams/members/:memberId`

**Request Body:**

```json
{
  "roleId": "string", // Optional - New role ID
  "status": "ACTIVE" // Optional - New status
}
```

**Response (200 OK):**

```json
{
  "id": "clmemberxxxxxx",
  "teamId": "clxxxxxxxxxxxxxx",
  "userId": "cluserxxxxxxx",
  "roleId": "clrolexxxxxxx",
  "status": "ACTIVE",
  "createdAt": "2025-06-29T12:00:00.000Z",
  "user": {
    "id": "cluserxxxxxxx",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  },
  "role": {
    "id": "clrolexxxxxxx",
    "name": "Developer",
    "description": "Software developer role"
  }
}
```

---

### 12. Remove Team Member

**DELETE** `/teams/members/:memberId`

**Response (204 No Content):**
_No response body_

---

### 13. Get Available Roles

**GET** `/teams/roles`

**Response (200 OK):**

```json
[
  {
    "id": "clrolexxxxxxx",
    "name": "Admin",
    "description": "Team administrator with full permissions"
  },
  {
    "id": "clrolexxxxxxx2",
    "name": "Developer",
    "description": "Software developer role"
  },
  {
    "id": "clrolexxxxxxx3",
    "name": "Designer",
    "description": "UI/UX designer role"
  }
]
```

---

### 14. Get Role by ID

**GET** `/teams/roles/:roleId`

**Response (200 OK):**

```json
{
  "id": "clrolexxxxxxx",
  "name": "Developer",
  "description": "Software developer role"
}
```

**Response (404 Not Found):**

```json
{
  "message": "Role not found"
}
```

---

### 15. Get All Team Members (All Teams)

**GET** `/teams/members`

**Description:**
Returns all team members across all teams, including user, role, and team info.

**Response (200 OK):**

```json
[
  {
    "id": "clmemberxxxxxx",
    "teamId": "clxxxxxxxxxxxxxx",
    "userId": "cluserxxxxxxx",
    "roleId": "clrolexxxxxxx",
    "status": "ACTIVE",
    "createdAt": "2025-06-29T12:00:00.000Z",
    "user": {
      "id": "cluserxxxxxxx",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    },
    "role": {
      "id": "clrolexxxxxxx",
      "name": "Developer",
      "description": "Software developer role"
    },
    "team": {
      "id": "clxxxxxxxxxxxxxx",
      "name": "Development Team"
    }
  }
  // ... more team members ...
]
```

---

### 16. Get Team Productivity Trend

**GET** `/time-tracking/team-productivity`

**Query Parameters:**

- `teamIds`: Comma-separated list of team IDs (e.g., `team1,team2`)
- `startDate`: Start date (ISO string, required)
- `endDate`: End date (ISO string, required)

**Description:**
Returns the total productivity (sum of durations) for each team, grouped by day, for the given date range.

**Example Request:**

```
GET /time-tracking/team-productivity?teamIds=team1,team2&startDate=2024-07-01&endDate=2024-07-07
```

**Example Response:**

```json
{
  "team1": [
    { "date": "2024-07-01", "totalSeconds": 3600 },
    { "date": "2024-07-02", "totalSeconds": 5400 }
  ],
  "team2": [
    { "date": "2024-07-01", "totalSeconds": 1800 },
    { "date": "2024-07-02", "totalSeconds": 7200 }
  ]
}
```

---

### 17. Get Team Activity Heatmap

**GET** `/time-tracking/team-activity-heatmap`

**Query Parameters:**

- `teamId`: Team ID (required)
- `startDate`: Start date (ISO string, required)
- `endDate`: End date (ISO string, required)

**Description:**
Returns a 7x24 array (days x hours) of total durations (in seconds) for each day of the week and hour of the day, representing team activity heatmap for the given date range.

**Example Request:**

```
GET /time-tracking/team-activity-heatmap?teamId=team1&startDate=2024-07-01&endDate=2024-07-07
```

**Example Response:**

```json
[
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Sunday
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Monday
  ...
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]  // Saturday
]
```

**Notes:**

- Each row is a day of the week (0=Sunday, 6=Saturday).
- Each column is an hour of the day (0-23).
- Each cell is the total duration (in seconds) of all time entries started in that hour on that day.

---

## Error Responses

### 400 Bad Request

```json
{
  "message": "Error message",
  "errors": ["Detailed error information"]
}
```

### 404 Not Found

```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "message": "Internal server error"
}
```

---

## Invitation Flow

1. **Admin/manager enters email and selects role, submits to `/teams/:teamId/invite`.**
2. **Backend finds or creates user, generates token/expiry, creates TeamMember with status `INVITED`, sends email from `youcrackman@gmail.com`.**
3. **User receives email, clicks link (e.g., `http://localhost:3005/accept-invite?token=THE_TOKEN`), completes registration via `/teams/accept-invite` (enters first name, last name, password), and is activated in the team.**
4. **After accepting the invite, the user should log in via `/login`.**

---

## Data Validation

- `name`: Required for team creation, must be a non-empty string
- `userId`, `roleId`: Required for adding team members, must be valid IDs
- `token`, `firstName`, `lastName`, `password`: Required for accepting an invite

---

## Database Relationships

- **Team → TeamMember**: One-to-Many (a team can have multiple members)
- **TeamMember → User**: Many-to-One (each member is a user)
- **TeamMember → Role**: Many-to-One (each member has a role)
- **Role → TeamMember**: One-to-Many (a role can be assigned to multiple members)

---

## Status Enum

- `ACTIVE`: User is an active team member
- `INVITED`: User has been invited but not yet accepted
- `REMOVED`: User was removed from the team
