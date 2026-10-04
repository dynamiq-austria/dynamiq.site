# dynamiq. Website

Statische, responsive Website mit [Eleventy](https://www.11ty.dev/) und Netlify Forms. Die fertige Seite landet in `_site/` und kann direkt von Netlify veröffentlicht werden.

## Entwicklung

Voraussetzung: Node.js 20 oder neuer.

```bash
npm install
npm run dev
```

Eleventy startet einen lokalen Entwicklungsserver und aktualisiert die Seite bei Änderungen automatisch.

## Produktions-Build

```bash
npm run build
```

Der Build leert zuerst `_site/` und erzeugt anschließend eine vollständige, deploybare Website.

## Struktur

- `src/index.njk` – Aufbau der Startseite
- `src/monitoring.njk` – Monitoring-Landingpage mit Signal-Feed und Pipeline
- `src/_data/monitoring.json` – Signale, Prozess, Quellen und Outputs der Monitoring-Seite
- `src/_data/monitoring_en.json` – englische Inhalte der Monitoring-Seite
- `src/_data/monitoringPages.js` – gemeinsame Seitenvorlage für `/monitoring/` und `/en/monitoring/`
- `src/_data/site.json` – globale Navigation, Kontaktdaten und Markenangaben
- `src/_data/home.json` – Leistungen, Prozess, Referenzen und Team der Startseite
- `src/_includes/layouts/base.njk` – gemeinsames HTML-Grundlayout und Metadaten
- `src/_includes/components/` – wiederverwendbare Header-, Footer- und CTA-Komponenten
- `src/danke.njk` – Danke-Seite für das Kontaktformular
- `src/impressum.njk` und `src/datenschutz.njk` – rechtliche Platzhalter
- `src/sitemap.njk` und `src/robots.njk` – technische SEO-Basis
- `styles.css` – Layout und responsive Gestaltung
- `script.js` – ausschließlich Mobile-Navigation und Headerzustand
- `assets/` – Bilder, WebP-Variante, Favicon und Open-Graph-Bild
- `eleventy.config.js` – Eleventy-Konfiguration und Umgebungsdaten
- `netlify.toml` – Build-, Header- und Publish-Einstellungen

## URLs

- `/` – Startseite
- `/monitoring/` – Monitoring für Web, Social Media, Communities und Daten
- `/en/monitoring/` – englische Monitoring-Landingpage
- `/danke/` – Bestätigung nach Formularversand
- `/impressum/` – Impressum
- `/datenschutz/` – Datenschutz
- `/sitemap.xml` – XML-Sitemap
- `/robots.txt` – Crawler-Konfiguration

Alte Links auf `impressum.html` und `datenschutz.html` werden über `_redirects` dauerhaft auf die sauberen URLs weitergeleitet.

## Deployment auf Netlify

Repository mit Netlify verbinden. Die Einstellungen werden aus `netlify.toml` übernommen:

- Build command: `npm run build`
- Publish directory: `_site`
- Node.js: 22

Netlify stellt beim Build die Variable `URL` bereit. Daraus erzeugt Eleventy Canonical URLs, Social-Media-Metadaten, strukturierte Daten, Sitemap und `robots.txt`. Für Deploy Previews wird `DEPLOY_PRIME_URL` verwendet.

Das Formular `projektanfrage` wird durch `data-netlify="true"` erkannt, verwendet einen Honeypot und leitet nach erfolgreichem Versand auf `/danke/` weiter.

## Vor dem Livegang

1. Impressum und Datenschutz rechtlich prüfen und alle Platzhalter vervollständigen.
2. Netlify Forms und E-Mail-Benachrichtigungen im Netlify-Projekt aktiv prüfen.
3. Mailbox und Zustellung für `oliver@dynamiq.agency` beim E-Mail-Anbieter einrichten und testen.
4. Finale Domain und Social-Media-Vorschau im produktiven Deployment kontrollieren.
5. Zahlen, Formulierungen und Freigaben der drei Referenzen vor Veröffentlichung final prüfen.
6. Foto für Cornelia unter `assets/persons/cornelia.webp` ergänzen und die vorbereitete Team-Referenz aktivieren.
7. Aussagen zu Erfahrung, Kompetenzen und Leistungsumfang vor Veröffentlichung final freigeben.
