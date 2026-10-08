"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Languages, Globe, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TranslationItem {
  entity_type?: string;
  entity_id?: string;
  field_name?: string;
  content?: string;
}

interface TranslationsClientProps {
  initialItems: TranslationItem[];
  currentLocale: string;
}

export function TranslationsClient({ initialItems, currentLocale }: TranslationsClientProps) {
  const t = useTranslations();
  const [selectedLocale, setSelectedLocale] = useState(currentLocale);
  const [search, setSearch] = useState("");

  const filtered = initialItems.filter((it) => {
    const s = search.toLowerCase();
    return (
      (it.entity_type?.toLowerCase() || "").includes(s) ||
      (it.field_name?.toLowerCase() || "").includes(s) ||
      (it.content?.toLowerCase() || "").includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-3 py-1 font-mono">
            <Globe className="w-3.5 h-3.5 mr-1 inline" />
            Locale: {selectedLocale.toUpperCase()}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {filtered.length} terjemahan termuat
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Cari entitas, field, atau teks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-border/80 bg-background/80 px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary w-64"
          />
        </div>
      </div>

      <Card variant="glass" className="border-border/60 shadow-lg">
        <CardHeader className="border-b border-border/40 py-3.5 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Languages className="w-4 h-4 text-primary" />
              Daftar Terjemahan Multibahasa (F-22)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/40 bg-muted/40 text-muted-foreground uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-5 py-3">Tipe Entitas</th>
                  <th className="px-5 py-3">Field</th>
                  <th className="px-5 py-3">Konten Terjemahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-muted-foreground">
                      Tidak ada data terjemahan.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-primary font-medium">
                        {item.entity_type || "-"}
                      </td>
                      <td className="px-5 py-3 font-mono text-muted-foreground">
                        {item.field_name || "-"}
                      </td>
                      <td className="px-5 py-3 font-medium text-foreground max-w-md break-words">
                        {item.content || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
