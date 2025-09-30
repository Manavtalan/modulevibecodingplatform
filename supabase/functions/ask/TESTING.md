# Testing Logging & Cost Controls

This document describes how to test the rate limiting and logging features of the `/api/ask` edge function.

## Overview

The edge function implements:
- **Rate limiting**: 10 requests per user per day
- **Token limiting**: Max 512 tokens per AI response
- **Request logging**: Every request logged to `requests_log` table

## Prerequisites

1. Valid Supabase user authentication token
2. Access to Supabase SQL Editor to check `requests_log` table
3. curl or Postman for making requests

## Test 1: Verify Request Logging

### Steps

1. Make a chat request:
```bash
curl -X POST "https://ryhhskssaplqakovldlp.supabase.co/functions/v1/ask" \
  -H "Authorization: Bearer <YOUR_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_message": "Hello, this is a test message",
    "mode": "explain"
  }'
```

2. Check the `requests_log` table in Supabase SQL Editor:
```sql
SELECT * FROM requests_log 
WHERE user_id = auth.uid() 
ORDER BY created_at DESC 
LIMIT 1;
```

### Expected Results

- One new row in `requests_log`
- `user_id` matches your authenticated user ID
- `model` is "openai:gpt-4o-mini"
- `tokens_est` is a positive integer (rough estimate)
- `created_at` is today's timestamp

## Test 2: Rate Limit Enforcement

### Steps

1. Make 10 successful requests (use a loop or Postman):
```bash
for i in {1..10}; do
  curl -X POST "https://ryhhskssaplqakovldlp.supabase.co/functions/v1/ask" \
    -H "Authorization: Bearer <YOUR_JWT>" \
    -H "Content-Type: application/json" \
    -d "{\"user_message\": \"Test message $i\", \"mode\": \"explain\"}"
  echo "\nRequest $i completed"
  sleep 2
done
```

2. Make the 11th request:
```bash
curl -X POST "https://ryhhskssaplqakovldlp.supabase.co/functions/v1/ask" \
  -H "Authorization: Bearer <YOUR_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"user_message": "This should be rate limited", "mode": "explain"}'
```

### Expected Results

- First 10 requests: HTTP 200 success
- 11th request: HTTP 429 with response:
```json
{
  "code": "RATE_LIMIT",
  "message": "Daily free credits exhausted. Upgrade to premium to continue."
}
```

3. Verify in database:
```sql
SELECT COUNT(*) 
FROM requests_log 
WHERE user_id = auth.uid() 
AND created_at::date = CURRENT_DATE;
```
Should return exactly 10 (the 11th was rejected before logging).

## Test 3: Token Limit (Max 512)

### Steps

1. Check the edge function code confirms `max_tokens: 512` in OpenAI call
2. Make a request with a very long prompt:
```bash
curl -X POST "https://ryhhskssaplqakovldlp.supabase.co/functions/v1/ask" \
  -H "Authorization: Bearer <YOUR_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_message": "Explain in extreme detail with examples, code samples, and thorough documentation about React hooks, state management, component lifecycle, and best practices...",
    "mode": "explain"
  }'
```

### Expected Results

- AI response is cut off at approximately 512 tokens
- Response doesn't contain extremely long outputs
- Check `tokens_est` in `requests_log` - should be reasonable

## Test 4: RLS Policy Verification

### Steps

1. Try to query another user's logs (should fail):
```sql
-- This should return 0 rows (RLS prevents seeing other users' data)
SELECT * FROM requests_log 
WHERE user_id != auth.uid();
```

2. Try to insert a log for another user (should fail):
```sql
-- This should fail with RLS policy violation
INSERT INTO requests_log (user_id, model, tokens_est)
VALUES ('00000000-0000-0000-0000-000000000000', 'test', 100);
```

### Expected Results

- Query returns 0 rows (can't see other users' logs)
- Insert fails with permission denied error

## Test 5: Rate Limit Reset

### Steps

1. Wait until next day (or manually update `created_at` in database for testing)
2. Make a new request

### Expected Results

- Request succeeds (rate limit counter reset)
- New entry in `requests_log` with today's date

## Test 6: Cross-Conversation Rate Limit

### Steps

1. Make 5 requests in conversation A
2. Make 5 requests in conversation B (new conversation)
3. Make 1 more request in either conversation

### Expected Results

- First 10 requests succeed (5 in A, 5 in B)
- 11th request is rate limited (because limit is per-user, not per-conversation)
- Confirms rate limit applies across all conversations

## Debugging

### Check Edge Function Logs

View logs in Supabase Dashboard:
```
https://supabase.com/dashboard/project/ryhhskssaplqakovldlp/functions/ask/logs
```

Look for:
- "Rate limit check failed" - indicates DB query error
- "Failed to log request" - indicates logging error
- Any other error messages

### Check requests_log Table

```sql
-- View all your logs today
SELECT * FROM requests_log 
WHERE user_id = auth.uid() 
AND created_at::date = CURRENT_DATE
ORDER BY created_at DESC;

-- Count total requests today
SELECT COUNT(*) as today_requests
FROM requests_log 
WHERE user_id = auth.uid() 
AND created_at::date = CURRENT_DATE;

-- View token usage
SELECT 
  SUM(tokens_est) as total_tokens,
  AVG(tokens_est) as avg_tokens,
  MAX(tokens_est) as max_tokens
FROM requests_log 
WHERE user_id = auth.uid() 
AND created_at::date = CURRENT_DATE;
```

## Common Issues

### Issue: Rate limit not working
**Solution**: Check that `requests_log` RLS policies allow SELECT and INSERT for authenticated users.

### Issue: Logging not happening
**Solution**: 
1. Check Edge Function logs for errors
2. Verify `user_id` is being passed correctly
3. Ensure RLS policy allows INSERT

### Issue: Token count seems wrong
**Solution**: Token estimation is approximate (`Math.ceil((promptChars + replyChars)/4)`). This is expected and sufficient for cost tracking.

### Issue: Can bypass rate limit with new account
**Solution**: This is expected behavior - rate limit is per user. Consider implementing IP-based limiting or other anti-abuse measures if needed.

## Success Criteria

✅ Every request creates an entry in `requests_log`  
✅ After 10 requests, 11th request returns 429  
✅ Rate limit resets daily  
✅ Token estimates are logged correctly  
✅ RLS prevents users from seeing/manipulating other users' logs  
✅ Rate limit applies across all conversations (per-user, not per-conversation)
