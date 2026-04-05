# Agora Livre – Controle de Sobriedade

App mobile de recuperação de vícios (álcool e drogas) focado em redução de recaídas e uso diário.

---

## 📁 Estrutura do Projeto

```
agora-livre/
│
├── web-preview/
│   └── index.html              ← Prévia web responsiva (abre direto no navegador)
│
├── App.tsx                     ← Navegação raiz (Expo + React Navigation)
├── package.json
├── README.md
│
├── src/
│   ├── theme/index.ts          ← Cores, tipografia, espaçamento, sombras
│   ├── types/index.ts          ← Todos os tipos TypeScript
│   ├── i18n/index.ts           ← Traduções PT / EN / ES / NL / RO
│   │
│   ├── lib/
│   │   ├── supabase.ts         ← Cliente Supabase singleton
│   │   └── database.types.ts   ← Tipos gerados do schema
│   │
│   ├── hooks/
│   │   └── useCrisisMode.ts    ← Lógica completa do modo crise + timer
│   │
│   ├── components/
│   │   └── index.tsx           ← Componentes reutilizáveis (Button, Card, Pill…)
│   │
│   └── screens/
│       ├── HomeScreen.tsx
│       ├── CheckInScreen.tsx
│       ├── CrisisModeScreen.tsx
│       ├── ProgressScreen.tsx
│       ├── PremiumScreen.tsx
│       ├── RelapseRecordScreen.tsx
│       └── onboarding/
│           ├── Onboarding1Screen.tsx
│           ├── Onboarding2Screen.tsx
│           ├── Onboarding3Screen.tsx
│           ├── OnboardingDots.tsx
│           └── onboardingStore.ts   ← Zustand store
│
└── supabase/
    ├── schema.sql
    └── functions/
        ├── validate-purchase/index.ts
        └── expire-subscriptions/index.ts
```

---

## 🌐 Prévia Web (zero instalação)

```bash
# Opção 1 — abrir direto
# Dê dois cliques em: web-preview/index.html

# Opção 2 — servidor local Python
cd web-preview && python3 -m http.server 3000
# http://localhost:3000

# Opção 3 — Node
npx serve web-preview
```

---

## 📱 Rodar o App Expo

```bash
npm install

# Criar .env
echo "EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ..." > .env

# Fontes (baixe em fonts.google.com/specimen/Manrope)
# Coloque em assets/fonts/: Manrope-Regular.ttf, Manrope-Bold.ttf, Manrope-ExtraBold.ttf

npx expo start
```

---

## 🗄️ Supabase

```bash
# 1. Cole supabase/schema.sql no SQL Editor do Supabase

# 2. Gerar tipos (recomendado)
npx supabase gen types typescript --project-id SEU_ID > src/lib/database.types.ts

# 3. Deploy Edge Functions
supabase functions deploy validate-purchase
supabase functions deploy expire-subscriptions
supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON='{ ... }'
```

---

## 💳 Google Play Billing — SKUs

| SKU | Plano | Preço |
|-----|-------|-------|
| `agora_livre_premium_monthly` | Mensal | R$9,90/mês |
| `agora_livre_premium_annual`  | Anual  | R$47,99/ano |

---

## 🌍 Idiomas

| Código | País | Nome na store |
|--------|------|---------------|
| PT | Brasil | Agora Livre – Controle de Sobriedade |
| EN | EUA / Austrália | Now Free – Sobriety Control |
| ES | Espanha | Ahora Libre – Control de Sobriedad |
| NL | Holanda | Nu Vrij – Nuchterheidscontrole |
| RO | Romênia | Acum Liber – Control al Sobrietății |

---

## 🎨 Design System

| Token | Valor | Uso |
|-------|-------|-----|
| `--blue` | `#2563EB` | Primário, botões, destaques |
| `--red`  | `#EF4444` | **Exclusivo** botão de crise |
| `--green`| `#22C55E` | Progresso, conquistas |
| `--bg`   | `#F8FAFC` | Fundo geral |
| `--text` | `#1E293B` | Texto principal |

Tipografia: **Manrope 800** (display) + **Inter 400/600** (body)
