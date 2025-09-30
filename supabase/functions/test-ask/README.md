# Test Suite for `/api/ask` Edge Function

Automated testing helper that validates the `/api/ask` edge function functionality.

## Features Tested

1. ✅ Unauthorized request rejection (no JWT)
2. ✅ Invalid JWT rejection
3. ✅ Valid request creates conversation and messages
4. ✅ Requests with existing conversation
5. ✅ Rate limiting (10 requests per user per day)
6. ✅ requests_log table updates with correct data
7. ✅ Template listing endpoint
8. ✅ Conversation last_active timestamp updates
9. ✅ Messages saved to database correctly
10. ✅ Token estimation in logs

## Running the Tests

### Quick Test (GET)

```bash
curl https://ryhhskssaplqakovldlp.supabase.co/functions/v1/test-ask
```

This will execute all test cases and return a JSON report.

### Expected Output Format

```json
{
  "total": 7,
  "passed": 7,
  "failed": 0,
  "timestamp": "2025-01-30T12:34:56.789Z",
  "tests": [
    {
      "name": "Test 1: Unauthorized Request (No JWT)",
      "status": "PASS",
      "message": "Correctly rejected request without authorization"
    },
    {
      "name": "Test 2: Unauthorized Request (Invalid JWT)",
      "status": "PASS",
      "message": "Correctly rejected request with invalid JWT"
    },
    {
      "name": "Test 3: Valid Request Creates Conversation & Messages",
      "status": "PASS",
      "message": "Conversation, messages, and request log created successfully",
      "details": {
        "conversation_id": "uuid-here",
        "message_count": 2,
        "log_entry": {
          "user_id": "uuid",
          "model": "openai:gpt-4o-mini",
          "tokens_est": 123,
          "created_at": "timestamp"
        }
      }
    },
    {
      "name": "Test 4: Request with Existing Conversation",
      "status": "PASS",
      "message": "Successfully added to existing conversation",
      "details": {
        "message_count": 4
      }
    },
    {
      "name": "Test 5: Rate Limiting (10 req/day)",
      "status": "PASS",
      "message": "Correctly enforced 10 requests per day limit",
      "details": {
        "code": "RATE_LIMIT",
        "message": "Daily free credits exhausted. Upgrade to premium to continue."
      }
    },
    {
      "name": "Test 6: Verify requests_log Entries",
      "status": "PASS",
      "message": "All request logs have correct structure",
      "details": {
        "total_logs": 10,
        "sample": {
          "user_id": "uuid",
          "model": "openai:gpt-4o-mini",
          "tokens_est": 234,
          "created_at": "timestamp"
        }
      }
    },
    {
      "name": "Test 7: Template Listing",
      "status": "PASS",
      "message": "All 10 templates available",
      "details": {
        "template_count": 10
      }
    }
  ]
}
```

## Test Details

### Test 1 & 2: Authentication
- **Purpose**: Verify unauthorized requests are rejected
- **Expected**: HTTP 401 with `{"code": "UNAUTHORIZED"}`
- **Tests**: Missing JWT and invalid JWT

### Test 3: New Conversation Creation
- **Purpose**: Verify new conversations and messages are created
- **Verifies**:
  - Conversation created in `conversations` table
  - User and assistant messages saved to `messages` table
  - Request logged in `requests_log`
  - All fields populated correctly (user_id, model, tokens_est, timestamps)

### Test 4: Existing Conversation
- **Purpose**: Verify messages are added to existing conversations
- **Verifies**:
  - Same conversation_id used
  - Message count increases correctly
  - `last_active` timestamp updated

### Test 5: Rate Limiting
- **Purpose**: Verify 10 requests per user per day limit
- **Process**:
  1. Makes 10 successful requests
  2. 11th request should return 429
- **Expected**: `{"code": "RATE_LIMIT", "message": "Daily free credits exhausted..."}`

### Test 6: Request Logging
- **Purpose**: Verify all requests are logged correctly
- **Verifies**:
  - Exactly 10 log entries created
  - Each entry has:
    - `user_id` (matches test user)
    - `model` (e.g., "openai:gpt-4o-mini")
    - `tokens_est` (positive integer)
    - `created_at` (valid timestamp)

### Test 7: Template Listing
- **Purpose**: Verify template endpoint works
- **Expected**: 10 templates with id and name

## Manual Testing Commands

### Test Unauthorized (No JWT)
```bash
curl -X POST "https://ryhhskssaplqakovldlp.supabase.co/functions/v1/ask" \
  -H "Content-Type: application/json" \
  -d '{"user_message": "test"}'
```

Expected: `{"code":"UNAUTHORIZED"}` with HTTP 401

### Test Invalid JWT
```bash
curl -X POST "https://ryhhskssaplqakovldlp.supabase.co/functions/v1/ask" \
  -H "Authorization: Bearer invalid-token-12345" \
  -H "Content-Type: application/json" \
  -d '{"user_message": "test"}'
```

Expected: `{"code":"UNAUTHORIZED"}` with HTTP 401

### Test Valid Request (requires real JWT)
```bash
# First, get a JWT by logging in through your app
# Then use it here:
curl -X POST "https://ryhhskssaplqakovldlp.supabase.co/functions/v1/ask" \
  -H "Authorization: Bearer YOUR_REAL_JWT_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "user_message": "What is React?",
    "mode": "explain"
  }'
```

Expected: 
```json
{
  "conversation_id": "uuid",
  "assistant_message": "React is...",
  "message_id": "uuid",
  "model_used": "openai:gpt-4o-mini"
}
```

### Test Rate Limiting
Run the valid request 11 times in a row. The 11th should return:
```json
{
  "code": "RATE_LIMIT",
  "message": "Daily free credits exhausted. Upgrade to premium to continue."
}
```
with HTTP 429

### Test Template Listing
```bash
curl https://ryhhskssaplqakovldlp.supabase.co/functions/v1/ask/templates
```

Expected:
```json
{
  "templates": [
    {"id": "landing_page", "name": "Landing Page Generator"},
    {"id": "saas_dashboard", "name": "SaaS Dashboard"},
    ...
  ]
}
```

## Verifying Database State

### Check requests_log
```sql
-- View all requests for a user
SELECT * FROM requests_log 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;

-- Count today's requests
SELECT COUNT(*) 
FROM requests_log 
WHERE user_id = 'YOUR_USER_ID' 
AND created_at::date = CURRENT_DATE;
```

### Check conversations
```sql
-- View conversations
SELECT * FROM conversations 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY last_active DESC;
```

### Check messages
```sql
-- View messages for a conversation
SELECT * FROM messages 
WHERE conversation_id = 'YOUR_CONVERSATION_ID'
ORDER BY created_at ASC;
```

## Continuous Integration

To run this test suite in CI/CD:

```bash
# In your CI pipeline
curl -f https://ryhhskssaplqakovldlp.supabase.co/functions/v1/test-ask || exit 1
```

The `-f` flag makes curl fail on HTTP errors, suitable for CI/CD pipelines.

## Test Cleanup

The test suite automatically:
1. Creates a temporary test user
2. Runs all tests
3. Deletes the test user and all associated data (conversations, messages, logs)

No manual cleanup required.

## Troubleshooting

### All tests failing
- Check that `OPENAI_API_KEY` is set in Supabase secrets
- Verify edge functions are deployed
- Check edge function logs for errors

### Rate limit test failing
- Ensure RLS policies allow SELECT on requests_log for authenticated users
- Check that the rate limit query is working correctly

### Message creation tests failing
- Verify RLS policies on conversations and messages tables
- Check that triggers are working (conversation message count update)

### Request log tests failing
- Ensure RLS policy allows INSERT on requests_log
- Verify user_id is being passed correctly

## Success Criteria

✅ All 7 tests pass  
✅ Test user is created and cleaned up automatically  
✅ Database state is verified at each step  
✅ Rate limiting works correctly  
✅ Authentication is properly enforced  
✅ All data structures match expectations

## Links

- [Ask Function Logs](https://supabase.com/dashboard/project/ryhhskssaplqakovldlp/functions/ask/logs)
- [Test Function Logs](https://supabase.com/dashboard/project/ryhhskssaplqakovldlp/functions/test-ask/logs)
