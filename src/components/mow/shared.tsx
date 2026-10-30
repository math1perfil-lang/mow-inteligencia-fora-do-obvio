import { useEffect, useRef, type ReactNode } from "react";
import logo from "@/assets/mow-logo.png.asset.json";
import { cn } from "@/lib/utils";

export const NAV = [
  { href: "#inicio", label: "Início" },
  { href: "#o-que-fazemos", label: "O que fazemos" },
  { href: "#projetos", label: "Projetos" },
  { href: "#sobre", label: "Sobre" },
  { href: "#contato", label: "Contato" },
] as const;

/** Official MOW logo. `tone="dark"` renders it black for light backgrounds. */
export function Logo({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <img
      src={logo.url}
      alt="MOW"
      width={600}
      height={166}
      className={cn("h-auto w-auto select-none", tone === "dark" && "invert", className)}
      draggable={false}
    />
  );
}

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li" | "article";
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-visible");
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={cn("reveal", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("eyebrow text-muted-foreground", className)}>{children}</p>;
}

export function CtaLink({
  href,
  children,
  variant = "solid",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "solid" | "ghost";
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "group inline-flex h-12 items-center justify-center gap-2 border px-6 text-sm font-medium tracking-tight transition-colors duration-300",
        variant === "solid"
          ? "border-foreground bg-foreground text-background hover:bg-transparent hover:text-foreground"
          : "border-border text-foreground hover:border-foreground",
        className,
      )}
    >
      {children}
    </a>
  );
}
