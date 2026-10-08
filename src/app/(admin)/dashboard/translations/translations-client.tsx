"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Languages, Globe, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface TranslationItem {
  id?: string;
  entity_type?: string;
  entity_id?: string;
  field?: string;
  field_name?: string;
  value?: string;
  content?: string;
  locale?: string;
}

interface TranslationsClientProps {
  initialItems: TranslationItem[];
}

export function TranslationsClient({ initialItems }: TranslationsClientProps) {
  const t = useTranslations();
  const [selectedLocale, setSelectedLocale] = useState<"all" | "id" | "en">("all");
  const [search, setSearch] = useState("");

  const filtered = initialItems.filter((it) => {
    if (selectedLocale !== "all" && it.locale !== selectedLocale) {
      return false;
    }
    const s = search.toLowerCase();
    const entity = it.entity_type?.toLowerCase() || "";
    const field = (it.field || it.field_name || "").toLowerCase();
    const text = (it.value || it.content || "").toLowerCase();
    return entity.includes(s) || field.includes(s) || text.includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter locale pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            Bahasa:
          </span>
          <button
            type="button"
            onClick={() => setSelectedLocale("all")}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
              selectedLocale === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            Semua ({initialItems.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedLocale("id")}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
              selectedLocale === "id"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            🇮🇩 ID ({initialItems.filter((i) => i.locale === "id").length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedLocale("en")}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
              selectedLocale === "en"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            🇬🇧 EN ({initialItems.filter((i) => i.locale === "en").length})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari entitas, field, teks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-full border border-border/80 bg-background/80 pl-8 pr-4 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary w-64"
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
            <span className="text-xs text-muted-foreground">
              Menampilkan {filtered.length} baris
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/40 bg-muted/40 text-muted-foreground uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-5 py-3">Locale</th>
                  <th className="px-5 py-3">Tipe Entitas</th>
                  <th className="px-5 py-3">Field</th>
                  <th className="px-5 py-3">Konten Terjemahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                      Tidak ada data terjemahan.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, idx) => {
                    const fieldName = item.field || item.field_name || "-";
                    const contentVal = item.value || item.content || "-";
                    const isId = item.locale === "id";
                    return (
                      <tr key={item.id || idx} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3">
                          <Badge
                            variant={isId ? "secondary" : "outline"}
                            className="text-[10px] uppercase font-mono px-2 py-0.5"
                          >
                            {item.locale || "-"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 font-mono text-primary font-medium">
                          {item.entity_type || "-"}
                        </td>
                        <td className="px-5 py-3 font-mono text-muted-foreground">
                          {fieldName}
                        </td>
                        <td className="px-5 py-3 font-medium text-foreground max-w-lg break-words">
                          {contentVal}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
