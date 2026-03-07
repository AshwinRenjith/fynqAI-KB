import { NextResponse } from 'next/server';

import { parseCitations, streamChatAnswer } from '@/lib/ai/chat';
import { hybridSearch } from '@/lib/search/hybrid';
import { createServerClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database.types';

export const runtime = 'nodejs';
export const maxDuration = 120;

interface StreamPayload {
  query?: string;
  session_id?: string;
  workspace_id?: string;
}

interface ContradictionRow {
  id: string;
  value_a: string;
  value_b: string;
  document_a_id: string;
  document_b_id: string;
}

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as StreamPayload;
  const query = body.query?.trim();

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  let workspaceId = body.workspace_id;

  if (!workspaceId) {
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .maybeSingle();

    workspaceId = membership?.workspace_id;
  }

  if (!workspaceId) {
    return NextResponse.json({ error: 'No workspace membership found' }, { status: 403 });
  }

  const chunks = await hybridSearch(query, workspaceId);

  let contradiction: ContradictionRow | null = null;

  if (chunks.length > 0) {
    const chunkIds = chunks.map((chunk) => chunk.id).join(',');
    const { data } = await supabase
      .from('contradictions')
      .select('id, value_a, value_b, document_a_id, document_b_id')
      .or(`chunk_a_id.in.(${chunkIds}),chunk_b_id.in.(${chunkIds})`)
      .eq('status', 'open')
      .in('severity', ['critical', 'warning'])
      .limit(1);

    contradiction = ((data ?? [])[0] as ContradictionRow | undefined) ?? null;
  }

  const hasContradiction = Boolean(contradiction);

  let chatSessionId = body.session_id;

  if (!chatSessionId) {
    const { data: newSession, error: sessionInsertError } = await supabase
      .from('chat_sessions')
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        title: query.slice(0, 60),
      })
      .select('id')
      .single();

    if (sessionInsertError || !newSession) {
      return NextResponse.json({ error: 'Failed to create chat session' }, { status: 500 });
    }

    chatSessionId = newSession.id;
  }

  const { error: userMessageError } = await supabase.from('chat_messages').insert({
    session_id: chatSessionId,
    workspace_id: workspaceId,
    role: 'user',
    content: query,
  });

  if (userMessageError) {
    return NextResponse.json({ error: 'Failed to save user message' }, { status: 500 });
  }

  if (chunks.length === 0) {
    const fallback = "I couldn't find this in your knowledge base.";
    const fallbackCitations: Json = [];

    const { error: fallbackInsertError } = await supabase.from('chat_messages').insert({
      session_id: chatSessionId,
      workspace_id: workspaceId,
      role: 'assistant',
      content: fallback,
      citations: fallbackCitations,
      had_contradiction: false,
      contradiction_ids: [],
    });

    if (fallbackInsertError) {
      return NextResponse.json({ error: 'Failed to save assistant message' }, { status: 500 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'token', content: fallback })}\n\n`)
        );
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'citations', citations: [] })}\n\n`)
        );
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'done',
              session_id: chatSessionId,
              had_contradiction: false,
              contradiction_ids: [],
            })}\n\n`
          )
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  const encoder = new TextEncoder();
  let fullContent = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const contradictionData = contradiction
          ? {
              valueA: contradiction.value_a,
              docA: contradiction.document_a_id,
              valueB: contradiction.value_b,
              docB: contradiction.document_b_id,
            }
          : undefined;

        const generator = streamChatAnswer(query, chunks, hasContradiction, contradictionData);

        for await (const token of generator) {
          fullContent += token;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`)
          );
        }

        const citations = parseCitations(fullContent, chunks);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'citations', citations })}\n\n`)
        );

        const { error: assistantMessageError } = await supabase.from('chat_messages').insert({
          session_id: chatSessionId,
          workspace_id: workspaceId,
          role: 'assistant',
          content: fullContent,
          citations: citations as unknown as Json,
          had_contradiction: hasContradiction,
          contradiction_ids: contradiction ? [contradiction.id] : [],
        });

        if (assistantMessageError) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', message: 'Failed to save assistant message' })}\n\n`
            )
          );
          controller.close();
          return;
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'done',
              session_id: chatSessionId,
              had_contradiction: hasContradiction,
              contradiction_ids: contradiction ? [contradiction.id] : [],
            })}\n\n`
          )
        );
        controller.close();
      } catch {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: 'Generation failed' })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
