import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(100),
  email: z.string().trim().email("E-mail inválido.").max(255),
  company: z.string().trim().max(120).optional().default(""),
  subject: z.string().trim().min(3, "Informe um assunto.").max(150),
  message: z.string().trim().min(10, "Escreva ao menos 10 caracteres.").max(3000),
  website: z.string().max(0).optional().default(""), // honeypot
  elapsed: z.number().min(0),
});

export type ContactResult = { ok: true } | { ok: false; error: string };

/**
 * Forwards the message to the endpoint in CONTACT_WEBHOOK_URL (e.g. a Formspree
 * form endpoint) as JSON. Without it configured, the form reports an error.
 */
export const sendContact = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => contactSchema.parse(d))
  .handler(async ({ data }): Promise<ContactResult> => {
    // Spam: honeypot filled or submitted too fast — pretend success silently.
    if (data.website || data.elapsed < 2500) return { ok: true };

    const endpoint = process.env['CONTACT_WEBHOOK_URL'];
    if (!endpoint) {
      console.error("CONTACT_WEBHOOK_URL is not configured");
      return { ok: false, error: "O envio de mensagens ainda não está configurado. Tente novamente em breve." };
    }
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          company: data.company,
          subject: data.subject,
          message: data.message,
          _replyto: data.email,
        }),
      });
      if (!res.ok) {
        console.error(`Contact endpoint failed [${res.status}]: ${await res.text()}`);
        return { ok: false, error: "Não foi possível enviar agora. Tente novamente em instantes." };
      }
      return { ok: true };
    } catch (e) {
      console.error(e);
      return { ok: false, error: "Falha de conexão ao enviar. Tente novamente." };
    }
  });
