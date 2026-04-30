"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

import { PrintButton } from "@/components/print-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TransferPrintPayload {
  mode: string;
  date: string;
  sourceService: string;
  destinationService: string;
  fromLabel: string;
  toLabel: string;
  notes: string;
  items: Array<{
    id: number;
    nom: string;
    n_inventaire: string;
    quantite: string;
  }>;
}

function decodePrintPayload(value: string): TransferPrintPayload | null {
  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as TransferPrintPayload;
    if (!parsed || !Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function formatDate(value?: string) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function buildReference(payload: TransferPrintPayload) {
  const firstItem = payload.items[0]?.id ?? 0;
  const datePart = formatDate(payload.date).replaceAll("/", "");
  return `TR-${datePart}-${String(firstItem).padStart(4, "0")}`;
}

export default function BonTransferPrintPage() {
  const searchParams = useSearchParams();
  const payloadParam = searchParams.get("payload") ?? "";
  const autoPrint = searchParams.get("autoprint") === "1";

  const payload = useMemo(() => decodePrintPayload(payloadParam), [payloadParam]);

  useEffect(() => {
    if (!autoPrint || !payload) return;
    const timer = window.setTimeout(() => window.print(), 250);
    return () => window.clearTimeout(timer);
  }, [autoPrint, payload]);

  if (!payload) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <Card>
          <CardHeader>
            <CardTitle>Bon de transfert</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Impossible de generer le document de transfert.</p>
            <div className="mt-4">
              <Button asChild variant="outline">
                <Link href="/dashboard/movements">Retour mouvements</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4 print:max-w-none print:p-0">
      <Card className="print:rounded-none print:shadow-none print:ring-0">
        <CardHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <CardTitle>Bon de transfert</CardTitle>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/dashboard/movements">Retour mouvements</Link>
              </Button>
              <PrintButton />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mx-auto w-full max-w-[820px] border border-black bg-white p-4 text-black print:max-w-none print:border-0 print:p-0">
                        <div className="mt-2 border-t border-black pt-2 text-center text-[11px]">
              <p className="font-medium">MINISTRY OF HIGHER EDUCATION AND SCIENTIFIC RESEARCH</p>
              <p dir="rtl">وزارة التعليم العالي والبحث العلمي</p>
              <br/>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[12px] leading-tight">
              <div className="space-y-1 text-left">
                <p className="font-semibold uppercase">UNIVERSITE ABOU-BEKR BELKAID</p>
                <p className="font-semibold uppercase">TLEMCEN</p>
                <p className="font-semibold uppercase">FACULTY OF LETTERS AND ARTS</p>
              </div>

              <div className="flex items-center justify-center">
                <img src="/logo.jpg" alt="University logo" className="h-16 w-16 object-contain" />
              </div>

              <div className="space-y-1 text-right" dir="rtl">
                <p className="font-semibold">جامعة ابو بكر بلقايد</p>
                <p className="font-semibold">تلمسان</p>
                <p className="font-semibold">كلية الاداب والفنون</p>
              </div>
            </div>



    

            <div className="mt-2 text-sm" dir="rtl">
              <p>
                حرر بتاريخ: <span className="font-semibold">{formatDate(payload.date)}</span>
              </p>
            </div>

            <h1 className="my-4 text-center text-4xl font-semibold" dir="rtl">تصريح باستلام</h1>

            <div className="mb-3 space-y-2 text-[14px]" dir="rtl">
              <p>
                انا الممضي(ة) اسفله السيد(ة): <span className="font-semibold"></span>
              </p>
              <p>
                اصرح بانني استلمت من السيد(ة): <span className="font-semibold"></span>
              </p>
  
              <p>
                المصلحة المصدر: <span className="font-semibold">{payload.sourceService}</span>
                <span className="mx-3">|</span>
                المصلحة المستقبلة: <span className="font-semibold">{payload.destinationService}</span>
              </p>
                <p>
                العتاد الحامل لارقام الجرد التالية:
              </p>
            </div>

            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-[10%] border border-black px-1 py-1 text-center" dir="rtl">الرقم</th>
                  <th className="w-[44%] border border-black px-1 py-1 text-center" dir="rtl">تعيين العتاد</th>
                  <th className="w-[12%] border border-black px-1 py-1 text-center" dir="rtl">العدد</th>
                  <th className="w-[19%] border border-black px-1 py-1 text-center" dir="rtl">رقم الجرد</th>
                  <th className="w-[15%] border border-black px-1 py-1 text-center" dir="rtl">الملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {payload.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="h-9 border border-black px-1 py-1 text-center">{String(index + 1).padStart(2, "0")}</td>
                    <td className="border border-black px-1 py-1 text-right" dir="rtl">{item.nom}</td>
                    <td className="border border-black px-1 py-1 text-center">{item.quantite}</td>
                    <td className="border border-black px-1 py-1 text-center">{item.n_inventaire || "/"}</td>
                    <td className="border border-black px-1 py-1 text-center">{payload.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>


            <div className="mt-8 grid grid-cols-3 gap-8 text-sm" dir="rtl">
                       <div className="text-center">
                <p className="font-semibold">الأمين العام</p>
                <div className="mx-auto mt-10 w-32 border-t border-black pt-1" />
              </div>
              <div className="text-center">
                <p className="font-semibold">المستلم</p>
                <div className="mx-auto mt-10 w-32 border-t border-black pt-1" />
              </div>
              <div className="text-center">
                <p className="font-semibold">المسلم</p>
                <div className="mx-auto mt-10 w-32 border-t border-black pt-1" />
              </div>
       
            </div>

            <div className="mt-auto flex-1 print:pt-12" />
  <br/>
              <br/>
                <br/>
              <br/>
              
            <div className="text-sm" dir="rtl">
              <p>
                نسخة إلى رئيس مصلحة الوسائل.
              </p>
            
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
