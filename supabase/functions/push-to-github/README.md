# Push to GitHub Edge Function

This edge function handles pushing Module projects to GitHub.

## Features

- Creates a new GitHub repository under the user's account
- Supports both private and public repositories
- Pushes all project files with a single commit
- Handles authentication via GitHub OAuth

## Authentication

This function requires:
1. Valid Supabase authentication
2. GitHub OAuth connection (user must have linked their GitHub account)
3. GitHub access token with `repo` scope

## Request Body

```json
{
  "project_id": "string",
  "repo_name": "string",
  "visibility": "private" | "public",
  "branch": "string",
  "commit_message": "string"
}
```

## Response

Success:
```json
{
  "success": true,
  "repo_url": "https://github.com/username/repo-name",
  "message": "Project successfully pushed to GitHub"
}
```

Error:
```json
{
  "error": "Error message"
}
```

## Error Handling

- `Unauthorized`: User not authenticated
- `GitHub account not connected`: User hasn't linked GitHub OAuth
- `Repository already exists`: A repo with that name already exists
- `Failed to create repository`: GitHub API error

## Usage

The function is called automatically from the Module Studio UI when a user clicks "Push to GitHub" in the chat settings.

## Notes

- Currently pushes a default project structure
- In production, this should fetch actual generated files from the database
- Files are committed in a single commit to the specified branch
- The function uses GitHub's Git Data API for maximum control
