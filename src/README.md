# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Teachers can log in to register or unregister students
- Teacher-only registration management via the web UI
- Teacher credentials stored in a local JSON file

## Getting Started

1. Install the dependencies:

   ```
   pip install -r ../requirements.txt
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## Teacher Accounts

Teacher credentials are stored in `teachers.json`.

Sample accounts:

- `teacher.alvarez` / `mergington-math`
- `coach.carter` / `go-tigers`
- `ms.lin` / `robotics-2026`

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| GET    | `/auth/session`                                                   | Check whether a teacher is currently logged in                      |
| POST   | `/auth/login`                                                     | Log in as a teacher                                                 |
| POST   | `/auth/logout`                                                    | Log out the current teacher                                         |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Register a student for an activity as a teacher                     |
| DELETE | `/activities/{activity_name}/unregister?email=student@...`        | Unregister a student from an activity as a teacher                  |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

Activities and registrations are still stored in memory, which means data will be reset when the server restarts.
Teacher credentials are read from `teachers.json`.
