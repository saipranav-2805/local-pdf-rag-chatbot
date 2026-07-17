import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/langgraph-server';
import { retrievalAssistantStreamConfig } from '@/constants/graphConfigs';

// Use nodejs runtime (60s timeout) instead of edge (30s).
// Render's free tier cold-starts can take 50–90s; edge would timeout and
// silently drop the connection before Render even responds.
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { message, threadId } = await req.json();

    if (!message) {
      return new NextResponse(
        JSON.stringify({ error: 'Message is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (!threadId) {
      return new NextResponse(
        JSON.stringify({ error: 'Thread ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const assistantId =
      process.env.LANGGRAPH_RETRIEVAL_ASSISTANT_ID || 'retrieval_graph';
    try {
      const serverClient = createServerClient();

      const stream = await serverClient.client.runs.stream(
        threadId,
        assistantId,
        {
          input: { query: message },
          streamMode: ['messages', 'updates'],
          config: {
            configurable: {
              ...retrievalAssistantStreamConfig,
            },
          },
        },
      );

      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          // Send an initial heartbeat so the browser knows the connection is
          // alive even while Render cold-starts (can take 30–60 s).
          controller.enqueue(encoder.encode(': ping\n\n'));

          try {
            for await (const chunk of stream) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
              );
            }
          } catch (error) {
            console.error('Streaming error:', error);
            // Surface the error to the client so the frontend can show it.
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  event: 'error',
                  data: {
                    message:
                      error instanceof Error
                        ? error.message
                        : 'Streaming error occurred',
                  },
                })}\n\n`,
              ),
            );
          } finally {
            controller.close();
          }
        },
      });

      return new Response(customReadable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    } catch (error) {
      console.error('Stream initialization error:', error);
      return new NextResponse(
        JSON.stringify({
          error: 'Failed to connect to the AI backend.',
          details: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  } catch (error) {
    console.error('Route error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
