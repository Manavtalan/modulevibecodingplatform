# Ask Edge Function

Secure chat pipeline with OpenAI, 10 AI prompt templates for web app generation, RLS-enforced DB operations, rate limiting, and error handling.

## Testing

### 1. Health Check (GET)
```bash
curl -X GET "https://ryhhskssaplqakovldlp.supabase.co/functions/v1/ask"
```

**Expected Response:**
```json
{
  "status": "ok"
}
```

### 2. List Available Templates (GET)
```bash
curl -X GET "https://ryhhskssaplqakovldlp.supabase.co/functions/v1/ask/templates"
```

**Expected Response:**
```json
{
  "templates": [
    { "id": "landing_page", "name": "Landing Page Generator" },
    { "id": "saas_dashboard", "name": "SaaS Dashboard" },
    { "id": "ecommerce_product", "name": "E-commerce Product Page" },
    { "id": "blog_platform", "name": "Blog/Content Platform" },
    { "id": "ai_chat_interface", "name": "AI-Powered Chat Interface" },
    { "id": "auth_system", "name": "Authentication System" },
    { "id": "admin_panel", "name": "Admin Panel / CMS" },
    { "id": "portfolio_website", "name": "Portfolio Website" },
    { "id": "booking_system", "name": "Booking/Reservation System" },
    { "id": "analytics_dashboard", "name": "Analytics Dashboard with API Integration" }
  ]
}
```

### 3. Chat Request (POST)

Replace `<SUPABASE_USER_JWT>` with a valid user access token from your Supabase auth session.

**Legacy mode request (explain/debug/project):**
```bash
curl -X POST "https://ryhhskssaplqakovldlp.supabase.co/functions/v1/ask" \
  -H "Authorization: Bearer <SUPABASE_USER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_message": "Explain this Python error: NameError: name '\''x'\'' is not defined",
    "mode": "debug"
  }'
```

**Template request (landing page):**
```bash
curl -X POST "https://ryhhskssaplqakovldlp.supabase.co/functions/v1/ask" \
  -H "Authorization: Bearer <SUPABASE_USER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_message": "Create a landing page for my AI writing assistant with blue color scheme",
    "template_id": "landing_page"
  }'
```

**Template request (SaaS dashboard):**
```bash
curl -X POST "https://ryhhskssaplqakovldlp.supabase.co/functions/v1/ask" \
  -H "Authorization: Bearer <SUPABASE_USER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_message": "Build a dashboard showing user growth, revenue, and active sessions",
    "template_id": "saas_dashboard"
  }'
```

**With existing conversation:**
```bash
curl -X POST "https://ryhhskssaplqakovldlp.supabase.co/functions/v1/ask" \
  -H "Authorization: Bearer <SUPABASE_USER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_message": "Can you suggest a better approach?",
    "conversation_id": "<EXISTING_CONVERSATION_UUID>",
    "mode": "explain"
  }'
```

## Example Responses

### Success (200)
```json
{
  "conversation_id": "123e4567-e89b-12d3-a456-426614174000",
  "assistant_message": "This error occurs when you try to use a variable before defining it...",
  "message_id": "987fcdeb-51a2-43d1-b789-123456789abc",
  "model_used": "openai:gpt-4o-mini"
}
```

### Bad Request (400)
```json
{
  "code": "BAD_REQUEST",
  "message": "user_message is required"
}
```

### Unauthorized (401)
```json
{
  "code": "UNAUTHORIZED"
}
```

### Forbidden (403)
```json
{
  "code": "FORBIDDEN",
  "message": "Conversation not found or access denied"
}
```

### Rate Limited (429)
```json
{
  "code": "RATE_LIMIT",
  "message": "Daily message limit reached (10/day)"
}
```

### Server Error (500)
```json
{
  "code": "SERVER_ERROR",
  "message": "An unexpected error occurred"
}
```

## Modes & Templates

### Legacy Modes (backward compatible)
- **explain**: Friendly coding tutor explaining concepts with examples
- **debug**: Expert debugging assistant identifying root causes and fixes
- **project**: Mentor suggesting 3 project ideas with steps and MVP features

### Prompt Templates (10 Web App Generators)
Use `template_id` instead of `mode` to select these:

1. **landing_page** - Landing Page Generator
   - Hero section, features, testimonials, pricing, CTA
   - Mobile-responsive with animations

2. **saas_dashboard** - SaaS Dashboard
   - Sidebar nav, KPI cards, data tables, charts
   - Dark mode, fully responsive

3. **ecommerce_product** - E-commerce Product Page
   - Image gallery, variants, reviews, related products
   - Conversion-optimized

4. **blog_platform** - Blog/Content Platform
   - Article listing, rich text, comments, search
   - Clean typography

5. **ai_chat_interface** - AI-Powered Chat Interface
   - Message bubbles, markdown support, history
   - Settings panel

6. **auth_system** - Authentication System
   - Login, signup, password reset, profile
   - Social login, validation

7. **admin_panel** - Admin Panel / CMS
   - CRUD operations, search, filters, bulk actions
   - Image upload, role management

8. **portfolio_website** - Portfolio Website
   - Project gallery, case studies, timeline
   - Animated hero, contact form

9. **booking_system** - Booking/Reservation System
   - Calendar, availability, customer form
   - Admin panel, notifications

10. **analytics_dashboard** - Analytics Dashboard with API Integration
    - KPI cards, charts, date filters, CSV export
    - Real-time updates, API integration

**Note:** `template_id` takes priority over `mode`. If both provided, template is used.

## Rate Limiting

- **Limit**: 10 messages per conversation per day
- **Scope**: Per-conversation (not per-user globally)
- **Reset**: Daily at 00:00 UTC

## Configuration

### Environment Variables
Required secrets (already configured in Supabase):
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### CORS
Currently set to `*` (all origins). To restrict to your app only, update the `corsHeaders` object in `index.ts`:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-app-domain.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

## Deployment

The function is automatically deployed with the rest of your code. No manual deployment needed.

If deploying manually via Supabase CLI:
```bash
supabase functions deploy ask
```

JWT verification is **enabled** by default (configured in `supabase/config.toml`).

## Security Features

- ✅ JWT validation via Supabase auth
- ✅ RLS-enforced database queries (uses anon key + user JWT)
- ✅ Input truncation (10k chars max)
- ✅ Rate limiting (10 msg/day per conversation)
- ✅ No API keys or secrets exposed to client
- ✅ Error messages don't leak internal details

## LLM Configuration

- **Model**: `gpt-4o-mini` (OpenAI)
- **Max Tokens**: 512
- **Temperature**: 0.2
- **Context**: Last 10 messages from conversation
