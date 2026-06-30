# 🌌 Aurora — Foco & Hábitos (PWA)

Um Progressive Web App **offline-first** para produtividade pessoal, sem nenhuma dependência externa (HTML + CSS + JS puro). Instalável no celular e no desktop.

🔗 **Acesse:** https://pwa.sabemostec.com.br

## ✨ Funcionalidades

- **⏳ Foco (Pomodoro)** — timer com anel de progresso, modos Foco / Pausa / Pausa longa, alerta sonoro e vibração, contador de sessões e minutos do dia.
- **✅ Tarefas** — adicionar, concluir e excluir, com persistência local.
- **🔥 Hábitos** — marque o hábito do dia, veja a sequência (streak) e os últimos 7 dias.
- **🎨 Tema claro/escuro** com fundo aurora animado (glassmorphism).
- **📲 Instalável** (Web App Manifest + ícones maskable) e **funciona offline** via Service Worker.
- **💾 100% local** — seus dados ficam no `localStorage` do seu dispositivo.

## 🛠️ Stack

Vanilla JS · CSS moderno · Service Worker (cache offline-first) · Web App Manifest. Sem build, sem framework.

## 🚀 Rodar localmente

```bash
# qualquer servidor estático serve (service worker exige http/https, não file://)
python3 -m http.server 8080
# abra http://localhost:8080
```

## 📁 Estrutura

```
index.html              # markup do app
css/styles.css          # estilos + tema
js/app.js               # lógica (timer, tarefas, hábitos, install, SW)
manifest.webmanifest    # metadados PWA
sw.js                   # service worker (offline)
icons/                  # ícones 192/512 + maskable + favicon
```

## 🌐 Deploy

Servido por nginx na VPS e exposto via Cloudflare (HTTPS no edge) em `pwa.sabemostec.com.br`.

---
Feito com 💜 — escolha do design, código e infra por Claude Code.
