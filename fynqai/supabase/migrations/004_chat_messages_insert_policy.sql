-- Phase 5 - Enable authenticated inserts for chat messages

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'chat_messages'
      AND policyname = 'chat_messages_insert'
  ) THEN
    CREATE POLICY chat_messages_insert ON chat_messages
      FOR INSERT
      WITH CHECK (
        session_id IN (
          SELECT id FROM chat_sessions WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;
