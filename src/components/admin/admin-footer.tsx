import Link from "next/link";

export function AdminFooter() {
  return (
    <footer className="border-t border-sidebar-border/60 px-4 py-4">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()}{" "}
          <span className="font-semibold text-brand-gradient">EHOS</span> — Swiss-Belhotel International Indonesia.
        </p>
        <div className="flex items-center gap-3">
          <Link href="#" data-no-link-hover className="link-hover">Kebijakan Privasi</Link>
          <Link href="#" data-no-link-hover className="link-hover">Kontak</Link>
        </div>
      </div>
    </footer>
  );
}