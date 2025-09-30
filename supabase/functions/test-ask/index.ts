import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  message: string;
  details?: any;
}

interface TestReport {
  total: number;
  passed: number;
  failed: number;
  tests: TestResult[];
  timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing required environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for setup and verification
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const report: TestReport = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: [],
      timestamp: new Date().toISOString()
    };

    const addTest = (result: TestResult) => {
      report.tests.push(result);
      report.total++;
      if (result.status === 'PASS') report.passed++;
      else report.failed++;
    };

    // Helper to create test user
    const createTestUser = async (email: string) => {
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password: 'TestPassword123!',
        email_confirm: true
      });
      return { data, error };
    };

    // Helper to get user JWT
    const getUserJWT = async (email: string, password: string) => {
      const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data, error } = await anonClient.auth.signInWithPassword({ email, password });
      return { session: data.session, error };
    };

    // Helper to cleanup test data
    const cleanupTestUser = async (userId: string) => {
      try {
        await adminClient.from('messages').delete().eq('conversation_id', userId);
        await adminClient.from('conversations').delete().eq('user_id', userId);
        await adminClient.from('requests_log').delete().eq('user_id', userId);
        await adminClient.auth.admin.deleteUser(userId);
      } catch (e) {
        console.error('Cleanup error:', e);
      }
    };

    // Test 1: Unauthorized request (no JWT)
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_message: 'test' })
      });
      
      if (response.status === 401) {
        addTest({
          name: 'Test 1: Unauthorized Request (No JWT)',
          status: 'PASS',
          message: 'Correctly rejected request without authorization'
        });
      } else {
        addTest({
          name: 'Test 1: Unauthorized Request (No JWT)',
          status: 'FAIL',
          message: `Expected 401, got ${response.status}`,
          details: await response.text()
        });
      }
    } catch (error) {
      addTest({
        name: 'Test 1: Unauthorized Request (No JWT)',
        status: 'FAIL',
        message: `Error: ${error.message}`
      });
    }

    // Test 2: Unauthorized request (invalid JWT)
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ask`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid-token-12345',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_message: 'test' })
      });
      
      if (response.status === 401) {
        addTest({
          name: 'Test 2: Unauthorized Request (Invalid JWT)',
          status: 'PASS',
          message: 'Correctly rejected request with invalid JWT'
        });
      } else {
        addTest({
          name: 'Test 2: Unauthorized Request (Invalid JWT)',
          status: 'FAIL',
          message: `Expected 401, got ${response.status}`
        });
      }
    } catch (error) {
      addTest({
        name: 'Test 2: Unauthorized Request (Invalid JWT)',
        status: 'FAIL',
        message: `Error: ${error.message}`
      });
    }

    // Create test user for remaining tests
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    let testUserId: string | null = null;
    let testJWT: string | null = null;

    const userResult = await createTestUser(testEmail);
    if (userResult.error || !userResult.data.user) {
      addTest({
        name: 'Setup: Create Test User',
        status: 'FAIL',
        message: `Failed to create test user: ${userResult.error?.message}`
      });
      
      return new Response(JSON.stringify(report), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    testUserId = userResult.data.user.id;
    
    const sessionResult = await getUserJWT(testEmail, testPassword);
    if (sessionResult.error || !sessionResult.session) {
      addTest({
        name: 'Setup: Get User JWT',
        status: 'FAIL',
        message: `Failed to get JWT: ${sessionResult.error?.message}`
      });
      await cleanupTestUser(testUserId);
      return new Response(JSON.stringify(report), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    testJWT = sessionResult.session.access_token;

    // Test 3: Valid request creates conversation and messages
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ask`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testJWT}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_message: 'What is 2+2?',
          mode: 'explain'
        })
      });

      const data = await response.json();

      if (response.status === 200 && data.conversation_id && data.assistant_message && data.message_id) {
        // Verify conversation created
        const { data: conv } = await adminClient
          .from('conversations')
          .select('*')
          .eq('id', data.conversation_id)
          .single();

        // Verify messages created
        const { data: messages } = await adminClient
          .from('messages')
          .select('*')
          .eq('conversation_id', data.conversation_id)
          .order('created_at', { ascending: true });

        // Verify request logged
        const { data: logs } = await adminClient
          .from('requests_log')
          .select('*')
          .eq('user_id', testUserId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (conv && messages && messages.length === 2 && logs && logs.length === 1) {
          addTest({
            name: 'Test 3: Valid Request Creates Conversation & Messages',
            status: 'PASS',
            message: 'Conversation, messages, and request log created successfully',
            details: {
              conversation_id: data.conversation_id,
              message_count: messages.length,
              log_entry: logs[0]
            }
          });
        } else {
          addTest({
            name: 'Test 3: Valid Request Creates Conversation & Messages',
            status: 'FAIL',
            message: 'Missing expected database entries',
            details: {
              has_conversation: !!conv,
              message_count: messages?.length || 0,
              has_log: logs?.length > 0
            }
          });
        }
      } else {
        addTest({
          name: 'Test 3: Valid Request Creates Conversation & Messages',
          status: 'FAIL',
          message: `Unexpected response: ${response.status}`,
          details: data
        });
      }
    } catch (error) {
      addTest({
        name: 'Test 3: Valid Request Creates Conversation & Messages',
        status: 'FAIL',
        message: `Error: ${error.message}`
      });
    }

    // Test 4: Request with existing conversation
    try {
      const { data: conversations } = await adminClient
        .from('conversations')
        .select('id')
        .eq('user_id', testUserId)
        .limit(1);

      if (conversations && conversations.length > 0) {
        const conversationId = conversations[0].id;
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/ask`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testJWT}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_message: 'Follow-up question',
            conversation_id: conversationId,
            mode: 'explain'
          })
        });

        const data = await response.json();

        if (response.status === 200 && data.conversation_id === conversationId) {
          // Check message count increased
          const { count } = await adminClient
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conversationId);

          if (count === 4) { // 2 from test 3 + 2 new
            addTest({
              name: 'Test 4: Request with Existing Conversation',
              status: 'PASS',
              message: 'Successfully added to existing conversation',
              details: { message_count: count }
            });
          } else {
            addTest({
              name: 'Test 4: Request with Existing Conversation',
              status: 'FAIL',
              message: `Expected 4 messages, got ${count}`
            });
          }
        } else {
          addTest({
            name: 'Test 4: Request with Existing Conversation',
            status: 'FAIL',
            message: `Unexpected response: ${response.status}`,
            details: data
          });
        }
      }
    } catch (error) {
      addTest({
        name: 'Test 4: Request with Existing Conversation',
        status: 'FAIL',
        message: `Error: ${error.message}`
      });
    }

    // Test 5: Rate limiting (10 messages per day)
    try {
      // Make 8 more requests (already made 2, need 8 more to reach 10)
      for (let i = 0; i < 8; i++) {
        await fetch(`${SUPABASE_URL}/functions/v1/ask`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testJWT}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_message: `Test message ${i + 3}`,
            mode: 'explain'
          })
        });
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      }

      // 11th request should be rate limited
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ask`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testJWT}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_message: 'This should be rate limited',
          mode: 'explain'
        })
      });

      const data = await response.json();

      if (response.status === 429 && data.code === 'RATE_LIMIT') {
        addTest({
          name: 'Test 5: Rate Limiting (10 req/day)',
          status: 'PASS',
          message: 'Correctly enforced 10 requests per day limit',
          details: data
        });
      } else {
        addTest({
          name: 'Test 5: Rate Limiting (10 req/day)',
          status: 'FAIL',
          message: `Expected 429, got ${response.status}`,
          details: data
        });
      }
    } catch (error) {
      addTest({
        name: 'Test 5: Rate Limiting (10 req/day)',
        status: 'FAIL',
        message: `Error: ${error.message}`
      });
    }

    // Test 6: Verify requests_log entries
    try {
      const { data: logs, count } = await adminClient
        .from('requests_log')
        .select('*', { count: 'exact' })
        .eq('user_id', testUserId);

      if (logs && count === 10) {
        const allValid = logs.every(log => 
          log.user_id === testUserId &&
          log.model &&
          log.tokens_est > 0 &&
          log.created_at
        );

        if (allValid) {
          addTest({
            name: 'Test 6: Verify requests_log Entries',
            status: 'PASS',
            message: 'All request logs have correct structure',
            details: {
              total_logs: count,
              sample: logs[0]
            }
          });
        } else {
          addTest({
            name: 'Test 6: Verify requests_log Entries',
            status: 'FAIL',
            message: 'Some logs have invalid structure',
            details: { logs }
          });
        }
      } else {
        addTest({
          name: 'Test 6: Verify requests_log Entries',
          status: 'FAIL',
          message: `Expected 10 logs, got ${count}`
        });
      }
    } catch (error) {
      addTest({
        name: 'Test 6: Verify requests_log Entries',
        status: 'FAIL',
        message: `Error: ${error.message}`
      });
    }

    // Test 7: Template selection
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ask/templates`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.status === 200 && data.templates && data.templates.length === 10) {
        addTest({
          name: 'Test 7: Template Listing',
          status: 'PASS',
          message: 'All 10 templates available',
          details: { template_count: data.templates.length }
        });
      } else {
        addTest({
          name: 'Test 7: Template Listing',
          status: 'FAIL',
          message: `Expected 10 templates, got ${data.templates?.length || 0}`
        });
      }
    } catch (error) {
      addTest({
        name: 'Test 7: Template Listing',
        status: 'FAIL',
        message: `Error: ${error.message}`
      });
    }

    // Cleanup
    if (testUserId) {
      await cleanupTestUser(testUserId);
    }

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Test suite error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
