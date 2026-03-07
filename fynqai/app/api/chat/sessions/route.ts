import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, workspace_id } = await request.json();

    let workspaceId = workspace_id;
    if (!workspaceId) {
        const { data: membership } = await supabase
            .from('workspace_members')
            .select('workspace_id')
            .eq('user_id', user.id)
            .maybeSingle();
        workspaceId = membership?.workspace_id;
    }

    if (!workspaceId) {
        return NextResponse.json({ error: 'Workspace required' }, { status: 400 });
    }

    const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert({
            user_id: user.id,
            workspace_id: workspaceId,
            title: title || 'New Conversation'
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ session });
}
