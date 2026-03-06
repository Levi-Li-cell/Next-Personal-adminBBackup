import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { db } from "@/db";
import { chatMessages } from "@/db/schema/chat";
import { getSystemPrompt } from "@/lib/knowledge";
import { desc, eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const DISABLE_CHAT_DB = true;

async function ensureChatMessagesTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id serial PRIMARY KEY,
      session_id varchar(255) NOT NULL,
      role text NOT NULL,
      content text NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    )
  `);
}

export async function POST(req: NextRequest) {
  let sessionId = "";
  try {
    const body = await req.json();
    const { message } = body;
    sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "消息内容不能为空", sessionId },
        { status: 400 }
      );
    }

    if (!sessionId) {
      sessionId = uuidv4();
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "AI 服务暂未配置，请稍后重试。", sessionId },
        { status: 503 }
      );
    }

    let historyMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
    let canPersist = !DISABLE_CHAT_DB;

    if (canPersist) {
      try {
      await ensureChatMessagesTable();

      await db.insert(chatMessages).values({
        sessionId,
        role: "user",
        content: message,
      });

      const historyData = await db.query.chatMessages.findMany({
        where: eq(chatMessages.sessionId, sessionId),
        orderBy: [desc(chatMessages.createdAt)],
        limit: 20,
      });

      historyMessages = historyData.reverse().map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));
      } catch (dbError) {
        canPersist = false;
        console.error("Chat DB unavailable, fallback to stateless mode:", dbError);
      }
    }

    const systemPrompt = getSystemPrompt();
    const messages = [
      { role: "system", content: systemPrompt },
      ...historyMessages,
      { role: "user", content: message },
    ];

    const openai = new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey,
    });

    const primaryModel = process.env.OPENAI_MODEL || "gemini-2.5-flash-cli";
    const fallbackModels = (process.env.OPENAI_MODEL_FALLBACKS || "gemini-2.5-pro-cli,gemini-2.5-flash-cli")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const modelCandidates = Array.from(new Set([primaryModel, ...fallbackModels]));

    let completion: Awaited<ReturnType<typeof openai.chat.completions.create>> | null = null;
    let lastError: unknown = null;

    for (const model of modelCandidates) {
      try {
        completion = await openai.chat.completions.create({
          model,
          messages: messages as any,
          temperature: 0.7,
          max_tokens: 2048,
        });
        break;
      } catch (error: any) {
        lastError = error;
        const canRetry = error?.status === 503 || error?.code === "model_not_found";
        if (!canRetry) {
          throw error;
        }
      }
    }

    if (!completion) {
      throw lastError || new Error("No available model channel");
    }

    const responseContent = completion.choices[0].message.content || "";

    if (canPersist) {
      try {
        await db.insert(chatMessages).values({
          sessionId,
          role: "assistant",
          content: responseContent,
        });
      } catch (dbError) {
        console.error("Chat response persistence failed:", dbError);
      }
    }

    return NextResponse.json({
      success: true,
      message: responseContent,
      sessionId,
    });
  } catch (error) {
    console.error("Chat Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "抱歉，我暂时无法回答您的问题，请稍后再试。",
        sessionId,
      },
      { status: 500 }
    );
  }
}
