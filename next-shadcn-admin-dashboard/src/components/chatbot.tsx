"use client";

import { useState, useRef, useEffect } from "react";

// Helper to call the internal chat API route
async function fetchAIResponse(prompt: string): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: prompt }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = await res.json();
  return data?.reply || "Désolé, je n'ai pas pu générer une réponse.";
}
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      content: "Bonjour! Je suis l'assistant IA de l'application de Gestion d'Inventaire Universitaire. Comment puis-je vous aider aujourd'hui?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    const lowerInput = userMsg.content.toLowerCase();
    const isComponentQuery =
      lowerInput.includes("composant") ||
      lowerInput.includes("article") ||
      lowerInput.includes("item") ||
      lowerInput.includes("matériel");

    if (!isComponentQuery) {
      // Normal question workflow: use internal AI chat API
      fetchAIResponse(userMsg.content)
        .then((aiResponse) => {
          const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "bot",
            content: aiResponse,
          };
          setMessages((prev) => [...prev, botMsg]);
        })
        .catch(() => {
          const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "bot",
            content: "Désolé, une erreur est survenue. Veuillez réessayer.",
          };
          setMessages((prev) => [...prev, botMsg]);
        })
        .finally(() => setIsTyping(false));
      return;
    }

    // Component/Item workflow
    try {
      // Extract a potential search term (very simplified)
      const words = lowerInput.split(" ");
      const keywordIndex = words.findIndex(w => w.includes("composant") || w.includes("article"));
      const searchKeyword = words.length > keywordIndex + 1 ? words[keywordIndex + 1] : "";

      // Step 1: Prompt Assiste - Information gathering
      const infoMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: `[Prompt Assisté - Étape 1] Analyse de votre demande concernant les composants. Recherche d'informations sur : ${searchKeyword || "matériel général"}...`,
      };
      setMessages((prev) => [...prev, infoMsg]);

      // Step 2: Database Check
      const apiBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiBaseUrl}/items?search=${searchKeyword}`, {
        headers: { "Accept": "application/json" }
      });

      let dbResultText = "";
      let items: any[] = [];

      if (res.ok) {
        const data = await res.json();
        items = data?.data?.data || [];
        if (items.length > 0) {
          dbResultText = `J'ai trouvé ${items.length} article(s) dans la base de données.\n`;
          items.slice(0, 3).forEach(item => {
            dbResultText += `- ${item.nom} (Stock: ${item.quantite_en_stock})\n`;
          });
        } else {
          dbResultText = `Aucun article ne correspond exactement à "${searchKeyword}" dans notre inventaire actuel.`;
        }
      } else {
        dbResultText = "Erreur lors de la connexion à la base de données d'inventaire.";
      }

      setTimeout(() => {
        const dbMsg: Message = {
          id: (Date.now() + 2).toString(),
          role: "bot",
          content: `[Prompt Assisté - Étape 2] Vérification en base de données :\n${dbResultText}`,
        };
        setMessages((prev) => [...prev, dbMsg]);

        // Step 3: Propose components based on project
        setTimeout(() => {
          let proposalText = `[Prompt Assisté - Étape 3] Basé sur votre profil étudiant et vos projets en cours, je vous propose également :\n- Kit Arduino Uno (Disponible)\n- Capteurs de température (Disponibles)\n\nSouhaitez-vous faire une demande d'emprunt pour ces composants ?`;

          if (items.length > 0) {
            proposalText = `[Prompt Assisté - Étape 3] Ces composants sont parfaits pour vos projets enregistrés. Souhaitez-vous générer une demande de composant pour ${items[0].nom} ?`;
          }

          const proposalMsg: Message = {
            id: (Date.now() + 3).toString(),
            role: "bot",
            content: proposalText,
          };
          setMessages((prev) => [...prev, proposalMsg]);
          setIsTyping(false);
        }, 2000);

      }, 1500);

    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: "Désolé, une erreur est survenue lors de l'exécution du workflow Assistant.",
      };
      setMessages((prev) => [...prev, errorMsg]);
      setIsTyping(false);
    }
  };


  // AI responses handled via /api/chat route (Qwen via DashScope)

  return (
    <>
      {/* Floating Action Button */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl transition-transform hover:scale-110 z-50 animate-bounce"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-[350px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] flex flex-col shadow-2xl z-50 border-primary/20 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <CardHeader className="bg-primary text-primary-foreground p-4 rounded-t-xl flex flex-row items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-primary-foreground/20 p-2 rounded-full">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-base font-medium">Assistant Inventaire</CardTitle>
                <span className="text-xs text-primary-foreground/80 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-400"></span>
                  En ligne
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/20 -mr-2"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden relative bg-muted/30">
            <ScrollArea className="h-full p-4">
              <div className="flex flex-col gap-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 w-full ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <Avatar className="h-8 w-8 shrink-0 mt-1 shadow-sm">
                      {msg.role === "bot" ? (
                        <AvatarFallback className="bg-primary/10 text-primary border border-primary/20"><Bot className="h-4 w-4" /></AvatarFallback>
                      ) : (
                        <AvatarFallback className="bg-secondary text-secondary-foreground border border-secondary/20"><User className="h-4 w-4" /></AvatarFallback>
                      )}
                    </Avatar>
                    <div
                      className={`px-4 py-2 rounded-2xl max-w-[75%] text-sm shadow-sm ${msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-background border rounded-tl-sm text-foreground"
                        }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-2 w-full flex-row">
                    <Avatar className="h-8 w-8 shrink-0 mt-1 shadow-sm">
                      <AvatarFallback className="bg-primary/10 text-primary border border-primary/20"><Bot className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="px-4 py-3 rounded-2xl bg-background border rounded-tl-sm shadow-sm flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                )}

                <div ref={scrollRef} className="h-1" />
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-3 border-t bg-background rounded-b-xl">
            <form
              className="flex w-full gap-2 items-center"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <Input
                placeholder="Écrivez un message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 rounded-full border-muted-foreground/20 focus-visible:ring-primary/50"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputValue.trim() || isTyping}
                className="rounded-full shrink-0 h-10 w-10 shadow-sm"
              >
                <Send className="h-4 w-4 ml-0.5" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
