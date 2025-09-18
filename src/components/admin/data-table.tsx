"use client";

import React from "react";
import CavableTableDefault, {
  CavableTable as CavableTableNamed,
  CavableStatusPill,
  type CavableColumn,
  type CavableFilterChip,
  type CavableTableProps,
  type CavableToneKey,
} from "@incodiy/cavable";
import { useLanguage } from "@/context/LanguageContext";

const BaseCavableTable = (CavableTableNamed || CavableTableDefault) as <T extends object>(
  props: CavableTableProps<T>
) => React.ReactElement;

export type Column<T> = CavableColumn<T>;
export type FilterChip<T = object> = CavableFilterChip<T>;
export type ToneKey = CavableToneKey;
export type DataTableProps<T extends object = object> = CavableTableProps<T>;

export const StatusPill = CavableStatusPill;

/**
 * EHOS Admin DataTable — wrapper tipis @incodiy/cavable.
 * Menyuntikkan locale aktif (next-intl A2) ke prop `language` package (Constraint I2/I6).
 * Import langsung dari package — tanpa salinan lokal.
 */
export function DataTable<T extends object>(props: DataTableProps<T>) {
  const { language } = useLanguage();

  return <BaseCavableTable language={props.language || language} {...props} />;
}

export { BaseCavableTable as CavableTable };