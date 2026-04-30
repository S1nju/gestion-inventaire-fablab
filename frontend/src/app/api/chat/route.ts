import { NextRequest, NextResponse } from "next/server";

const QWEN_API_KEY = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;
// Use international endpoint — change to dashscope.aliyuncs.com for China region
const QWEN_ENDPOINT =
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
// Available models: qwen-turbo (fast/cheap), qwen-plus (balanced), qwen-max (best)
const QWEN_MODEL = process.env.QWEN_MODEL || "qwen-plus";

const SYSTEM_PROMPT = `Tu es un assistant IA pour une application de gestion d'inventaire universitaire (FabLab). 
Tu aides les étudiants et les gestionnaires à :
- Trouver des composants et du matériel disponible
- Comprendre les procédures d'emprunt
- Gérer les demandes de matériel
- Répondre aux questions sur l'inventaire et les stocks
Réponds toujours en français, de manière concise et professionnelle.`;

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message invalide" }, { status: 400 });
    }

    // If Qwen / DashScope API key is configured, use it
    if (QWEN_API_KEY) {
      const qwenRes = await fetch(QWEN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${QWEN_API_KEY}`,
        },
        body: JSON.stringify({
          model: QWEN_MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: message },
          ],
          max_tokens: 512,
          temperature: 0.7,
        }),
      });

      if (!qwenRes.ok) {
        const errBody = await qwenRes.text();
        console.error("[Chat API] Qwen error:", errBody);
        // Fall through to rule-based fallback
      } else {
        const qwenData = await qwenRes.json();
        const reply =
          qwenData?.choices?.[0]?.message?.content?.trim() ||
          fallbackResponse(message);
        return NextResponse.json({ reply });
      }
    } else {
      console.warn(
        "[Chat API] No QWEN_API_KEY set. Using rule-based fallback. " +
        "Add QWEN_API_KEY (DashScope key) to .env.local to enable Qwen AI."
      );
    }

    // No API key or Qwen error — use rule-based fallback
    return NextResponse.json({ reply: fallbackResponse(message) });
  } catch (err) {
    console.error("[Chat API] Unexpected error:", err);
    return NextResponse.json(
      { reply: "Désolé, une erreur interne est survenue. Veuillez réessayer." },
      { status: 200 }
    );
  }
}

function fallbackResponse(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("bonjour") ||
    lower.includes("salut") ||
    lower.includes("hello")
  ) {
    return "Bonjour ! Comment puis-je vous aider avec la gestion de l'inventaire aujourd'hui ?";
  }
  if (
    lower.includes("stock") ||
    lower.includes("quantité") ||
    lower.includes("disponible")
  ) {
    return "Pour consulter les stocks disponibles, rendez-vous dans la section **Inventaire** du tableau de bord. Vous pouvez y filtrer par catégorie et voir les quantités en temps réel.";
  }
  if (
    lower.includes("emprunt") ||
    lower.includes("emprunter") ||
    lower.includes("réservation")
  ) {
    return "Pour effectuer un emprunt, allez dans la section **Demandes** et créez une nouvelle demande. Précisez le matériel souhaité et les dates d'utilisation. Un gestionnaire validera votre demande.";
  }
  if (
    lower.includes("composant") ||
    lower.includes("arduino") ||
    lower.includes("raspberry") ||
    lower.includes("capteur")
  ) {
    return "Nos composants électroniques sont listés dans l'inventaire. Vous pouvez rechercher par nom ou catégorie. Pour emprunter un composant, créez une demande dans la section dédiée.";
  }
  if (lower.includes("retour") || lower.includes("rendre")) {
    return "Pour retourner du matériel emprunté, signalez le retour dans votre tableau de bord sous **Mes emprunts**. Un gestionnaire confirmera la réception.";
  }
  if (
    lower.includes("aide") ||
    lower.includes("comment") ||
    lower.includes("?")
  ) {
    return "Je peux vous aider avec :\n• Consulter l'inventaire et les stocks\n• Faire une demande d'emprunt\n• Suivre vos emprunts en cours\n• Retourner du matériel\n\nQue souhaitez-vous faire ?";
  }

  return "Je suis l'assistant de l'application de gestion d'inventaire universitaire. Posez-moi des questions sur les stocks, les emprunts, ou le matériel disponible.";
}
