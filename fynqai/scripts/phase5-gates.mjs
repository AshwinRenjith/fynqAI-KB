#!/usr/bin/env node

import fs from 'node:fs';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const WORKSPACE_ID = process.env.WORKSPACE_ID || process.env.PHASE_WORKSPACE_ID || '';
const COOKIE = process.env.COOKIE || process.env.PHASE_COOKIE || '';
const PROJECT_REF = process.env.PROJECT_REF || '';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';

if (!WORKSPACE_ID || !COOKIE) {
  console.error('Missing required env. Set WORKSPACE_ID and COOKIE.');
  process.exit(1);
}

function pass(label) {
  console.log(`PASS: ${label}`);
}

function fail(label, details = '') {
  console.error(`FAIL: ${label}${details ? ` -> ${details}` : ''}`);
}

async function streamChat(query) {
  const response = await fetch(`${APP_URL}/api/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: COOKIE,
    },
    body: JSON.stringify({ query, workspace_id: WORKSPACE_ID }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }

  return text;
}

function extractEvents(sseText) {
  return sseText
    .split('\n\n')
    .map((frame) => frame.trim())
    .filter(Boolean)
    .filter((frame) => frame.startsWith('data: '))
    .map((frame) => frame.replace(/^data:\s*/, ''))
    .map((payload) => {
      try {
        return JSON.parse(payload);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

async function runSql(query) {
  if (!PROJECT_REF || !SUPABASE_ACCESS_TOKEN) {
    return null;
  }

  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(`SQL failed: ${JSON.stringify(json)}`);
  }

  return json;
}

async function main() {
  const results = [];

  try {
    const normalSse = await streamChat('What are the payment terms?');
    fs.writeFileSync('/tmp/phase5_gate_normal.sse', normalSse);
    const normalEvents = extractEvents(normalSse);

    const tokenText = normalEvents
      .filter((event) => event.type === 'token')
      .map((event) => event.content)
      .join('');

    const doneEvent = normalEvents.find((event) => event.type === 'done');
    const citationsEvent = normalEvents.find((event) => event.type === 'citations');

    if (tokenText.length > 0) {
      pass('SSE returns token stream');
      results.push(true);
    } else {
      fail('SSE returns token stream');
      results.push(false);
    }

    if (/\[SOURCE\s+\d+\]/.test(tokenText)) {
      pass('Response contains [SOURCE N] markers');
      results.push(true);
    } else {
      fail('Response contains [SOURCE N] markers');
      results.push(false);
    }

    if (doneEvent?.session_id) {
      pass('Done event includes session_id');
      results.push(true);
    } else {
      fail('Done event includes session_id');
      results.push(false);
    }

    if (Array.isArray(citationsEvent?.citations)) {
      pass('Citations event is present');
      results.push(true);
    } else {
      fail('Citations event is present');
      results.push(false);
    }

    const emptySse = await streamChat('What is our office wifi password?');
    fs.writeFileSync('/tmp/phase5_gate_empty.sse', emptySse);
    const emptyEvents = extractEvents(emptySse);
    const emptyTokenText = emptyEvents
      .filter((event) => event.type === 'token')
      .map((event) => event.content)
      .join('');

    if (emptyTokenText.includes("I couldn't find this in your knowledge base.")) {
      pass('No-hit fallback phrase is correct');
      results.push(true);
    } else {
      fail('No-hit fallback phrase is correct', emptyTokenText);
      results.push(false);
    }

    if (PROJECT_REF && SUPABASE_ACCESS_TOKEN && doneEvent?.session_id) {
      const rows = await runSql(
        `select role, had_contradiction, citations is not null as has_citations from chat_messages where session_id = '${doneEvent.session_id}' order by created_at asc;`
      );

      if (Array.isArray(rows) && rows.length >= 2) {
        pass('chat_messages persisted user + assistant rows');
        results.push(true);
      } else {
        fail('chat_messages persisted user + assistant rows');
        results.push(false);
      }
    } else {
      console.log('SKIP: DB persistence checks (set PROJECT_REF and SUPABASE_ACCESS_TOKEN to enable)');
    }
  } catch (error) {
    fail('Phase 5 gate script execution', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  const allPassed = results.every(Boolean);
  if (!allPassed) {
    process.exit(1);
  }

  console.log('Phase 5 gate checks passed.');
}

main();
