import { NextResponse } from "next/server";

type ChatMessage = { role: "user" | "assistant"; content: string };
type RequestBody = { message?: string; history?: ChatMessage[]; profile?: { targetRole?: string; readiness?: number; topGap?: string } };

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Career Coach is not configured yet. Add GEMINI_API_KEY on the server to enable it." }, { status: 503 });
  try {
    const body = await request.json() as RequestBody; const message = body.message?.trim();
    if (!message) return NextResponse.json({ error: "Enter a message for your Career Coach." }, { status: 400 });
    const history = (body.history ?? []).slice(-12).filter((item): item is ChatMessage => (item.role === "user" || item.role === "assistant") && typeof item.content === "string" && Boolean(item.content.trim())).map((item) => ({ role: item.role === "assistant" ? "model" : "user", parts: [{ text: item.content.trim() }] }));
    const profile = body.profile ?? {};
    const systemInstruction = `You are Aira, Skillora's career coach. Be warm and directly answer greetings naturally. Help students with career preparation, learning, interviews, and role readiness. Use their current context when relevant: target role ${profile.targetRole ?? "not set"}, readiness ${profile.readiness ?? "not available"}%, top gap ${profile.topGap ?? "not available"}. Do not claim you completed an activity or accessed data not provided. Keep responses practical and concise.`;
    const gemini = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent", { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey }, body: JSON.stringify({ system_instruction: { parts: [{ text: systemInstruction }] }, contents: history.length ? history : [{ role: "user", parts: [{ text: message }] }], generationConfig: { temperature: 0.55, maxOutputTokens: 450 } }) });
    const payload = await gemini.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } }; const response = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!gemini.ok || !response) return NextResponse.json({ error: payload.error?.message || "Career Coach could not generate a response." }, { status: gemini.status || 502 });
    return NextResponse.json({ response });
  } catch { return NextResponse.json({ error: "Career Coach could not process that message. Please retry." }, { status: 500 }); }
}
