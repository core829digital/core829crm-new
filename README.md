This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Data tools (Data → menu, solo amministratore)
- **Duplicates**: trova lead/clienti che sembrano la stessa persona (nome scritto in modo leggermente diverso, stessa email o telefono). Scegli il record da tenere e il nome corretto: progetti e servizi passano al record tenuto, i campi vuoti si completano, i doppioni vengono eliminati (con conferma).
- **Import from portal**: carica il file scaricato dal portale (Clienti → *Esporta per il CRM*). *Preview* non scrive nulla; *Import* crea/completa clienti, progetti, fatture e abbonamenti (come servizi). Non elimina mai nulla, è ripetibile (ogni record conserva l'id del portale) e non sovrascrive i dati già presenti. Le fatture senza progetto vanno nel progetto «General billing».
- Il file di esportazione contiene dati personali dei clienti: **non va mai salvato nel repository**.

## Cataloghi
`convex/lib/catalog.ts`: categorie di lavoro (Software, Marketing, AI, Event Digital Services, Hosting & Infrastructure, Design & Creative) e categorie/nicchie dei clienti (menu nei lead e nei clienti).

## Test
`npm test` (vitest + convex-test per unione, importazione ed eliminazioni; `node --test` per il riconoscimento dei doppioni).

## Sicurezza
Vedi `docs/SECURITY-SERVER.md` (accesso con token firmato, ruoli, chiavi, passi manuali).
