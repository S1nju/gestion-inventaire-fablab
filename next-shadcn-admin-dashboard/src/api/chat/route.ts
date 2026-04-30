import { NextRequest, NextResponse } from "next/server";

// ─── Config ────────────────────────────────────────────────────────────────
const QWEN_API_KEY = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;
const QWEN_ENDPOINT = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
const QWEN_MODEL = process.env.QWEN_MODEL || "qwen-plus";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_BACKEND_API_URL ??
  "http://localhost:8000/api";

const BEARER_TOKEN = process.env.BEARER;

// ─── Main handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message invalide" }, { status: 400 });
    }

    // 1. Fetch current inventory context (Top 50 items)
    const headers: HeadersInit = { Accept: "application/json" };
    if (BEARER_TOKEN) headers.Authorization = `Bearer ${BEARER_TOKEN}`;

    let inventoryContext = "Données d'inventaire non disponibles.";
    try {
      const url = `${BACKEND_API_URL.replace(/\/$/, "")}/items?per_page=50`;
      const res = await fetch(url, { headers, cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const items = data?.data?.data || [];
        inventoryContext = items
          .map((i: any) => `- ${i.nom}: ${i.quantite_en_stock} en stock ${i.description ? `(${i.description})` : ""}`)
          .join("\n");
      }
    } catch (err) {
      console.error("[Chat API] Inventory fetch error:", err);
    }

    // 2. Prepare System Prompt
    const systemPrompt = `Tu es l'assistant intelligent du FabLab "FabStock". 
Tu aides les étudiants à trouver du matériel et à gérer leurs projets.

CONTEXTE DE L'INVENTAIRE ACTUEL :
${inventoryContext}

CONSIGNES :
- Réponds en français.
- Sois concis, amical et professionnel.
- Utilise les données d'inventaire ci-dessus pour confirmer la disponibilité si on te pose des questions sur des composants.
- Si un composant n'est pas dans la liste, suggère de vérifier manuellement dans l'onglet "Inventaire".
- Encourage les étudiants à créer une "Demande" pour emprunter du matériel.`;

    // 3. Call Qwen LLM directly
    if (!QWEN_API_KEY) {
      return NextResponse.json({
        reply: "Le service AI n'est pas configuré (Clé API manquante). Veuillez contacter l'administrateur."
      });
    }

    const aiRes = await fetch(QWEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${QWEN_API_KEY}`,
      },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[Chat API] LLM Error:", errText);
      return NextResponse.json({ reply: "Désolé, l'IA rencontre une difficulté technique." });
    }

    const aiData = await aiRes.json();
    const reply = aiData?.choices?.[0]?.message?.content || "Je n'ai pas pu générer de réponse.";

    return NextResponse.json({ reply });

  } catch (err) {
    console.error("[Chat API] Unexpected error:", err);
    return NextResponse.json(
      { reply: "Une erreur est survenue lors du traitement de votre message." },
      { status: 200 }
    );
  }
}
