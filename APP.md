# APP.md — Specvora: mapa completo do código

> Documento de referência para quem precisa entender o app inteiro **sem explorar o repositório**.
> Cada arquivo do projeto é explicado linha a linha (ou bloco a bloco, para arquivos JSON grandes).
> Os números de linha referem-se ao estado do repositório em `main` (commit `b90e41c`).
> Problemas encontrados e o que deve ser mudado estão em **Update.md** — este arquivo apenas DESCREVE.

---

## 1. Visão geral

**Specvora** é um app mobile (React Native + Expo) de inteligência competitiva automotiva para a Ford.
O usuário:

1. Faz login (Firebase Authentication);
2. Em até 2 "slots" de comparação, escolhe **Marca → Modelo → Versão** (cascata com busca);
3. Define **livremente** quais **atributos/equipamentos técnicos** deseja ver (283 atributos em 15 categorias, com busca e multi-seleção);
4. Recebe uma **tabela padronizada** de especificações (mesmos campos para todo veículo, valores inexistentes aparecem como `N/A`) e um **gráfico radar** 0–100 como visualização complementar.

**Stack:** Expo SDK 53 · React Native 0.79 · React 19 · Expo Router 5 (rotas por arquivo) · TypeScript · NativeWind 4 (Tailwind 3.4) · Firebase Auth (e-mail/senha + AsyncStorage) · react-native-svg (radar).

**Dados:** não há backend real. O "banco" são dois JSONs embutidos no bundle (`data/vehicles.json` + `data/specSchema.json`). Existe uma camada de serviço que *imita* uma API REST (`services/vehicleService.ts`), mas a URL da API fica vazia e tudo cai no fallback local.

**Como rodar:** `npm install` → `npm run start` → `i`/`a`/`w`. O app é responsivo: layout de celular (`width < 768`) e de tablet/desktop (`width >= 768`), com painel lateral fixo no tablet.

---

## 2. Checklist de conformidade com `Pedido_Desafio.txt`

| Requisito do desafio | Status | Onde está no código |
|---|---|---|
| Ferramenta que recebe dados da concorrência por entrada simples e gera lista padronizada | ✅ | `app/home.tsx` + `data/*` + `components/ComparisonTable.tsx` |
| Abordagem técnica livre | ✅ | App mobile com catálogo local + resolução por herança (`data/vehicles.ts:resolveVehicles`) |
| Usuário define livremente a lista de equipamentos/atributos | ✅ | `components/AttributeSelector.tsx` (283 atributos, busca, multi-select, "selecionar todos") |
| Entrada: Marca | ✅ | `components/VehicleSelector.tsx` (SearchSelect "Marca") |
| Entrada: Modelo | ✅ | `components/VehicleSelector.tsx` (SearchSelect "Modelo") |
| Entrada: Versão | ✅ | `components/VehicleSelector.tsx` (SearchSelect "Versão") |
| Saída: lista de especificações técnicas | ⚠️ **PARCIAL** | `data/vehicles.ts:getComparisonRows` existe, MAS a tela só a exibe com **2 veículos** selecionados (`components/ComparisonTable.tsx:28`, `data/vehicles.ts:346-348`) |
| Formato sempre o mesmo, independentemente do veículo | ✅ | `data/specSchema.json` (283 chaves fixas) — toda linha da tabela vem do schema |
| Campos claros, organizados, comparáveis | ✅ | Tabela com coluna "Item" + coluna por veículo, agrupada por categoria |
| Informação inexistente explícita (vazio/N/A) | ✅ | `data/vehicles.ts:displaySpecValue` (linhas 240-245) → `N/A` para `null`/`undefined`/`''`; `false` → `Não` |
| Validação com a Ford Ranger Raptor | ⚠️ **PARCIAL** | O dado existe (`data/vehicles.json:889-921`, `Ranger Raptor` / `3.0 V6 EcoBoost`) e resolve para 283 campos — MAS (a) a UI não mostra a lista com 1 veículo só, e (b) os valores são mockados e precisam ser conferidos contra o slide oficial (o slide não está no repositório). Detalhes em Update.md |

**Conclusão:** o esqueleto do desafio está implementado; o bloqueio principal para a validação é que a saída obrigatória (a lista) só aparece comparando 2 veículos, e o caso de validação pedido é um veículo único (Ranger Raptor).

---

## 3. Arquitetura e fluxo de dados

```
                         ┌────────────────────────────────────────────────┐
                         │                  app/ (rotas)                  │
                         │  index (Login) · register · forgot-password    │
                         │  home (tela principal) · details (órfã)        │
                         └───────┬───────────────────────────┬────────────┘
                     usa          │                           │        usa
              ┌───────────────────▼──────────┐   ┌───────────▼────────────────────┐
              │  services/authService.ts     │   │  services/vehicleService.ts    │
              │  (Firebase Auth)             │   │  request() → API_BASE_URL=''   │
              └──────────────────────────────┘   │  → sempre null → fallback local│
                                                  └───────────┬────────────────────┘
              ┌───────────────────────────────┐       ┌──────▼───────────────────┐
              │  firebase/config.ts           │       │  data/vehicles.ts        │
              │  (app Firebase + auth RN)     │       │  tipos + funções puras   │
              └───────────────────────────────┘       │  (resolve, filters, rows)│
                                                      └──────┬───────────────────┘
                                        lê JSONs             │
                       ┌─────────────────────────────────────▼──────────────┐
                       │  data/specSchema.json  (catálogo de 283 atributos)  │
                       │  data/vehicles.json    (10 veículos, herança de id) │
                       └─────────────────────────────────────────────────────┘
```

Fluxo da tela Home:

1. `HomeScreen` monta → `waitForAuthState()`; sem usuário → `router.replace('/')`.
2. Com usuário → `listVehicleCategories()` → lista de tipos de veículo (Hatch, Picape, Sedan, SUV).
3. Cada `VehicleSelector` (slots A e B) carrega marcas → modelos → versões em cascata.
4. Quando um slot fica completo (marca+modelo+versão), o `useEffect [slots]` chama `findVehicle(...)` e popula `vehicles[]`.
5. `getRadarMetrics(vehicle)` → série do radar; `getComparisonRows(vehicles, selectedAttributes)` → linhas da tabela.
6. `ComparisonTable` e `RadarChart` renderizam (só com **2** veículos — ver §2).

---

## 4. Mapa de arquivos

```
Specvora/
├── index.ts                      # Entry point (1 linha)
├── app.json                      # Config Expo (nome, ícones, splash, plugins)
├── package.json                  # Dependências e scripts
├── tsconfig.json                 # Extende expo/tsconfig.base + mapping do Firebase RN
├── babel.config.js               # Presets Babel (Expo + NativeWind)
├── metro.config.js               # Metro + NativeWind (input styles/global.css)
├── tailwind.config.js            # Tailwind/NativeWind (content, preset, theme)
├── nativewind-env.d.ts           # Reference de tipos do NativeWind (raiz)
├── types/nativewind-env.d.ts     # IDÊNTICO ao anterior (duplicado)
├── App.tsx.bkp                   # Backup do boilerplate NativeWind (NÃO é compilado)
├── Pedido_Desafio.txt            # Enunciado do desafio (ford)
├── README.md                     # Leia-me do grupo
├── app/                          # ROTAS (Expo Router)
│   ├── _layout.tsx               # Stack global, sem header
│   ├── index.tsx                 # Login
│   ├── register.tsx              # Cadastro
│   ├── forgot-password.tsx       # Recuperação de senha
│   ├── home.tsx                  # Tela principal (325 linhas, celular+tablet)
│   └── details.tsx               # ÓRFÃ — só redireciona (login ou home)
├── components/
│   ├── VehicleSelector.tsx       # Slot Marca/Modelo/Versão (cascata)
│   ├── SearchSelect.tsx          # Dropdown com busca (modal)
│   ├── Dropdown.tsx              # OUTRO dropdown, tema escuro — NÃO USADO
│   ├── AttributeSelector.tsx     # Multi-seleção de atributos (modal + busca)
│   ├── ComparisonTable.tsx       # Tabela padronizada de specs
│   ├── RadarChart.tsx            # Gráfico radar SVG
│   ├── VehicleLegend.tsx         # Legenda do radar
│   ├── VehicleTypeDrawer.tsx     # Drawer modal de tipo (celular)
│   └── VehicleTypePanel.tsx      # Painel lateral de tipo (tablet)
├── services/
│   ├── authService.ts            # Firebase Auth (login/cadastro/senha/logout)
│   └── vehicleService.ts         # "API" mockada + CRUD local não usado
├── data/
│   ├── specSchema.json           # Catálogo: 15 categorias, 283 atributos
│   ├── vehicles.json             # 10 veículos (Ford) com specs + herança
│   └── vehicles.ts               # Tipos + lógica pura (resolve, filtros, rows)
├── firebase/
│   └── config.ts                 # Config Firebase + auth com persistence RN
├── styles/
│   ├── global.css                # 3 diretivas @tailwind (input do NativeWind)
│   ├── colors.ts                 # Paleta (não usada pelos componentes)
│   └── fontFamily.ts             # Roboto (fontes não carregadas — não usado)
├── assets/                       # Ícones (icon, adaptive, splash, favicon)
└── .expo/                        # Metadados locais do Expo (devices.json)
```

---

## 5. Walkthrough do código (arquivo por arquivo)

### 5.1 `index.ts` (raiz) — 1 linha

```ts
1  import 'expo-router/entry';
```
- **L1:** entry point do app (referenciado por `"main": "index.ts"` no package.json). Importar `expo-router/entry` inicializa o roteador por arquivo: cada arquivo de `app/` vira uma rota (`app/index.tsx` → `/`, `app/home.tsx` → `/home`, etc.). Não há `App.tsx` — o arquivo `App.tsx.bkp` é só um backup morto.

### 5.2 `app.json` — configuração Expo

```jsonc
{ "expo": {
    "name": "Specvora",            // nome exibido no app
    "slug": "specvora",            // identificador (EAS/OTA)
    "version": "1.0.0",
    "orientation": "default",      // segue o aparelho
    "icon": "./assets/icon.png",   // ícone Android/iOS
    "userInterfaceStyle": "light", // força tema claro (o app não tem dark mode)
    "newArchEnabled": true,        // habilita a New Architecture do RN 0.79
    "scheme": "specvora",           // deep links: specvora://...
    "splash": { "image": "./assets/splash-icon.png", "resizeMode": "contain", "backgroundColor": "#ffffff" },
    "ios":     { "supportsTablet": true },        // app roda em iPad (relevante: há layout tablet)
    "android": { "adaptiveIcon": { "foregroundImage": "./assets/adaptive-icon.png", "backgroundColor": "#ffffff" },
                 "edgeToEdgeEnabled": true },
    "web":     { "favicon": "./assets/favicon.png" },
    "plugins": ["expo-router"]     // plug-in obrigatório para o roteador por arquivo
} }
```

### 5.3 `package.json`

Dependências em uso:
- `expo ~53.0.22` / `react-native 0.79.6` / `react 19.0.0` — base;
- `expo-router ~5.1.11` — rotas por arquivo (`useRouter`, `Stack`);
- `nativewind ^4.1.23` + `tailwindcss ^3.4.17` (dev) — classes Tailwind no RN via `className`;
- `firebase ^12.13.0` — Authentication;
- `@react-native-async-storage/async-storage 2.1.2` — persistência da sessão Firebase;
- `react-native-svg 15.11.2` — desenha o radar;
- `react-native-reanimated ~3.17.4`, `react-native-worklets ^0.7.4`, `react-native-screens ~4.11.1`, `react-native-safe-area-context 5.4.0` — dependências de transição do Expo/NativeWind (nenhuma animação Reanimated é feita no código atual);
- `expo-status-bar ~2.2.3` — **instalada mas nunca importada** (morte de código).

Scripts: `start`/`android`/`ios`/`web` → `expo start [--plataforma]`.

### 5.4 `tsconfig.json`

```jsonc
{ "compilerOptions": {
    "paths": {
      // Mapeia os tipos do módulo @firebase/auth para o build React Native
      // (evita tipos que dependem de DOM do navegador e quebram a compilação no RN)
      "@firebase/auth": ["./node_modules/@firebase/auth/dist/index.rn.d.ts"]
    }
  },
  "extends": "expo/tsconfig.base"   // strict, JSX react-jsx, resolveJsonModule etc. vêm daqui
}
```
O `resolveJsonModule` (herdado da base) é o que permite `import vehiclesDb from './vehicles.json'`.

### 5.5 `babel.config.js`

```js
module.exports = function (api) {
  api.cache(true);                                   // cacheia a configuração
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }], // transpila JSX para o RN
      "nativewind/babel",                              // intercepta o atributo className e vira style
    ],
  };
};
```
- **L4-6:** `babel-preset-expo` com `jsxImportSource: "nativewind"` — faz o JSX resolver componentes "amigos de NativeWind" (que aceitam `className`).
- **L7:** `nativewind/babel` — compila as classes (ex.: `bg-[#F5F8FC]`) em objetos de estilo nativos em tempo de compilação.

### 5.6 `metro.config.js`

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const config = getDefaultConfig(__dirname)
module.exports = withNativeWind(config, { input: './styles/global.css' })
```
- **L4-5:** envolve o bundle do Metro no plugin do NativeWind, dizendo onde está o CSS de entrada (`styles/global.css`). Sem isso, `className` não funciona.

### 5.7 `tailwind.config.js`

```js
import { colors } from "./styles/colors"        // paleta nomeada (twilight, fordBlue, ...)
import { fontFamily } from "./styles/fontFamily" // Roboto regular/bold/medium

module.exports = {
  content: ["./App.tsx", "./**/*.{ts,tsx}"],    // ./App.tsx NÃO existe (só o .bkp) — inofensivo
  presets: [require("nativewind/preset")],      // preset do NativeWind
  theme: { extend: { colors, fontFamily } },    // registra tokens, mas NENHUM componente usa
  plugins: [],
}
```
⚠️ Os componentes usam valores arbitrários em hex (`bg-[#F5F8FC]`, `text-[#00142E]`) em vez dos tokens (`bg-aero`, `text-twilight`). Os tokens existem mas estão ociosos.

### 5.8 `nativewind-env.d.ts` (raiz) e `types/nativewind-env.d.ts`

Ambos contêm exatamente: `/// <reference types="nativewind/types" />`
- Serve para o TypeScript aceitar `className` em componentes RN (`View`, `Text`, ...).
- Estão **duplicados** (raiz e `types/`) — sobra de configuração.

### 5.9 `styles/global.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
- Três diretivas do Tailwind; este arquivo é **input do pipeline NativeWind/Metro** (§5.6), não um CSS renderizado.

### 5.10 `styles/colors.ts`

```ts
export const colors = {
  twilight: '#00142E',   // azul-marinho profundo (títulos, fundo do painel de tipos)
  fordBlue: '#00095B',   // azul Ford (botões, destaques)
  fordGrabber: '#1700F4',// azul-violeta vibrante (2ª série do radar)
  sky: '#2A6BAC',        // azul médio (declarado, não usado)
  aero: '#F5F8FC',       // fundo claro geral do app
  line: '#D8E3F2',       // cor das bordas
  muted: '#517198',      // texto secundário/marcadores
  white: '#FFFFFF',
};
```
Usado apenas pelo `tailwind.config.js`; nenhum componente importa.

### 5.11 `styles/fontFamily.ts`

```ts
export const fontFamily = {
  regular: "Roboto_400Regular",   // nomes de fontes que NÃO são carregadas
  bold:    "Roboto_700Bold",      // (não há expo-font nem loadAsync no app)
  medium:  "Roboto_500Medium",
}
```
Configuração morta: sem `expo-font` nenhuma dessas famílias existe no runtime.

### 5.12 `App.tsx.bkp`

Backup do boilerplate do NativeWind (tela "Bem-vindo ao seu projeto"). Referencia `./assets/react-icon.png`, que também não existe. **Não é compilado** (entry é `index.ts`). Resíduo do início do projeto.

### 5.13 `firebase/config.ts` (31 linhas)

```ts
1  import { getApp, getApps, initializeApp } from 'firebase/app';
2-5  import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
6  import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

8-15 const firebaseConfig = {
16   apiKey: "AIzaSyD90N9HA2NFE6rhlGnLMRXy1FKnADYtAIc",
17   authDomain: "specvoraauth.firebaseapp.com",
18   projectId: "specvoraauth",
19   storageBucket: "specvoraauth.firebasestorage.app",
20   messagingSenderId: "245567251936",
21   appId: "1:245567251936:web:ea1b511787b6bd6136b785"
22 };

24 const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
25-30 const auth = (() => {
31     try {
32       return initializeAuth(app, {
33         persistence: getReactNativePersistence(ReactNativeAsyncStorage),
34       });
35     } catch {
36       return getAuth(app);
37     }
38   })();
40 export { auth };
```
- **L1-6:** imports do Firebase (app, auth) e do AsyncStorage.
- **L8-15:** credenciais do projeto `specvoraauth` (chave pública, ok para client-side; note que `appId` tem sufixo `:web:` — é o app web do console Firebase sendo reutilizado).
- **L24:** evita inicializar o app Firebase duas vezes (ex.: em hot reload) — usa o já inicializado se existir.
- **L25-30:** inicializa o `auth` com persistência nativa (a sessão sobrevive a restart do app via AsyncStorage); o `try/catch` é a padronização do Firebase RN: `initializeAuth` lança se o auth já existir, aí cai em `getAuth`.
- **L40:** exporta o singleton `auth` usado pelo `authService`.

### 5.14 `data/specSchema.json` (1511 linhas)

Catálogo único de atributos técnicos. Estrutura:

```jsonc
{
  "schemaVersion": 1,
  "description": "Catálogo único de atributos técnicos. Para adicionar um novo atributo, cadastre aqui uma vez e depois preencha o valor em vehicles.json.",
  "categories": [
    { "id": "engine_transmission", "name": "Engine & Transmission",
      "specs": [
        { "key": "potencia", "label": "Potência", "type": "number" },   // key = slug estável (id na tabela/specs)
        { "key": "transmissao_automatica", "label": "Transmissão Automática", "type": "boolean" },
        ...
      ] },
    ...
  ]
}
```
- Cada **spec** tem `key` (identificador snake_case usado nos `specs{}` dos veículos e como `key` de React nas listas), `label` (texto exibido, em PT) e `type` (`text` | `number` | `boolean`).
- `type` é **informativo apenas**: o código lê os valores como string/number/boolean sem validar contra o tipo (e há valores numéricos guardados como string — ver Update.md).
- Os **15 grupos** (na ordem do arquivo):

| # | id | name (exibido na UI) | nº de specs |
|---|---|---|---|
| 1 | engine_transmission | Engine & Transmission | 18 |
| 2 | wheels | Wheels | 8 |
| 3 | connectivity | Connectivity | 29 |
| 4 | ice_line_up | Ice Line Up | 23 |
| 5 | air_conditioning | Air Conditioning | 3 |
| 6 | safety | Safety | 14 |
| 7 | high_tech | High Tech | 33 |
| 8 | global_closing | Global Closing | 12 |
| 9 | trim | Trim | 8 |
| 10 | sunroof | Sunroof | 3 |
| 11 | seats | Seats | 16 |
| 12 | lights | Lights | 18 |
| 13 | 4x4 | 4X4 | 22 |
| 14 | others | Others | 55 |
| 15 | inmetro_pbev | INMETRO / PBEV | 21 |
| **Total** | | | **283** |

- `label` é único em todo o schema (verificado) — isso é importante: `data/vehicles.ts:findSpecDefinitionByLabel` acha specs **pelo label** (ex.: `'Potência'`) e usaria o primeiro encontrado em caso de duplicidade.
- A ordem das categorias no arquivo define a ordem dos grupos na tabela de comparação.

### 5.15 `data/vehicles.json` (1132 linhas)

"Banco" mockado de 10 veículos, todos FORD, ano 2026:

```jsonc
{
  "schemaVersion": 1,
  "description": "Banco mockado normalizado. Use baseVehicleId para reaproveitar especificações de outro veículo e sobrescreva apenas o que muda.",
  "vehicles": [
    {
      "id": "ford_nova_ranger_4x4_xlt_2026",
      "brand": "FORD", "model": "Nova Ranger 4x4", "version": "XLT",
      "year": "2026", "vehicleCategory": "Picape", "engine": "3.0 V6 - 24V",
      "specs": { "peso_em_ordem_de_marchas": "2283", "potencia": "250", "torque": "600",
                 "transmissao_automatica": true, ... }   // 283 chaves
    },
    { "id": "ford-ranger-raptor-3-0-v6-ecoboost-2026",
      "baseVehicleId": "ford_nova_ranger_4x4_ltd_2026",   // herda 283 specs do base...
      "brand": "FORD", "model": "Ranger Raptor", "version": "3.0 V6 EcoBoost",
      "year": "2026", "vehicleCategory": "Picape", "engine": "3.0 V6 EcoBoost",
      "specs": { "peso_em_ordem_de_marchas": 2475, "potencia": 397, "torque": 583, ... }  // ...e sobrescreve 19
    }, ...
  ]
}
```

**Mecânica de herança:** um veículo com `baseVehicleId` herda todo o `specs{}` do veículo-base e sobrescreve apenas as chaves que ele declara. Ex.: o Ranger Raptor declara só 19 chaves (potência 397, torque 583, peso 2475, biturbo, AWD, Trail Control, suspensão Fox, Terrain Management, 7 airbags, multimídia 12", câmera 360, ACC, BLIS, classificação INMETRO "E", pneus ATR 60/40, rodas 17) e herda as outras 264 do base.

Os 10 veículos:

| id no JSON | Marca / Modelo / Versão | Tipo | base |
|---|---|---|---|
| ford_nova_ranger_4x4_xlt_2026 | FORD / Nova Ranger 4x4 / XLT | Picape | — (283 specs próprias) |
| **ford_nova_ranger_4x4_ltd_2026** (linha 300) | FORD / Nova Ranger 4x4 / LTD | Picape | — |
| **ford_nova_ranger_4x4_ltd_2026** (linha 594) ⚠️ | FORD / Nova Ranger 4x4 / LTD+ | Picape | — |
| ford-ranger-raptor-3-0-v6-ecoboost-2026 (id na linha 888) | FORD / Ranger Raptor / 3.0 V6 EcoBoost | Picape | `...ltd_2026` (19 specs) |
| ford-territory-sel-2026 | FORD / Territory / SEL | SUV | `...xlt_2026` (23 specs) |
| ford-territory-titanium-2026 | FORD / Territory / Titanium | SUV | `...ltd_2026` (23 specs) |
| ford-focus-se-2026 | FORD / Focus / SE | Hatch | `...xlt_2026` (25 specs) |
| ford-focus-titanium-2026 | FORD / Focus / Titanium | Hatch | `...ltd_2026` (26 specs) |
| ford-fusion-sel-2026 | FORD / Fusion / SEL | Sedan | `...xlt_2026` (21 specs) |
| ford-fusion-titanium-awd-2026 | FORD / Fusion / Titanium AWD | Sedan | `...ltd_2026` (23 specs) |

⚠️ **IDs duplicados:** o LTD (linha 300) e o LTD+ (linha 594) compartilham o id `ford_nova_ranger_4x4_ltd_2026`. Consequências: `getVehicleById` é ambíguo, e os 4 veículos que apontam esse id como base (Raptor, Territory Titanium, Focus Titanium, Fusion Titanium AWD) resolvem sempre para o **primeiro** achado no array (o LTD, linha 300). Ver Update.md, item 2.

Observações de dados:
- Nos veículos-base (XLT/LTD/LTD+), **numéricos vêm como string** (`"potencia": "250"`); nas sobrescritas do Raptor, vêm como number (`"potencia": 397`). O código lida com os dois (ver `specNumber`).
- `null` em `specs` significa "não disponível" → exibido como `N/A`. No Raptor, 8 specs ficam `null` (consumos etanol/gasolina/elétrico, CO₂ etanol, autonomia elétrica).
- O campo `cilindrada` do Raptor é `"3"` (provavelmente "3.0 L") — ambíguo contra um slide real.

### 5.16 `data/vehicles.ts` (380 linhas) — o "cérebro" de dados

Arquivo de **lógica pura** (sem React): tipos, normalização, resolução de herança, filtros, opções de atributo, métricas do radar e montagem das linhas da tabela.

**Imports (L1-2)**
- `schemaDb` = `specSchema.json`; `vehiclesDb` = `vehicles.json` (JSON importado vira objeto em tempo de build).

**Tipos (L4-82)**
- `SpecValue` (L4): `string | number | boolean | null` — o universo de valores de uma spec.
- `SpecDefinition` (L6-10): `{ key, label, type }` — uma linha do schema.
- `SpecCategory` (L12-16): `{ id, name, specs[] }` — um grupo do schema.
- `VehicleRecord` (L18-28): forma bruta do JSON — `id`, `baseVehicleId?`, `brand`, `model`, `version`, `year?`, `vehicleCategory?`, `engine?`, `specs: Record<string, SpecValue>`.
- `Vehicle` (L30): alias de `VehicleRecord` (após a resolução, `specs` já é o mapa completo).
- `VehicleSearchParams` (L32-36): `{ brand, model, version }` — a tripla de busca.
- `VehicleFilters` (L38-42): filtros opcionais por `category`/`brand`/`model`.
- `VehicleInput` (L44-46): `VehicleRecord` sem `id` obrigatório (usado só pelo CRUD morto do service).
- `ComparisonSlot` (L48-54): estado de um slot da UI — `id`, `label` ("Veículo A/B"), e marca/modelo/versão (cada um `string | null`).
- `RadarMetric` (L56-60): `{ key, label, value }` — um eixo do radar (value 0-100).
- `ComparisonRow` (L62-66): uma linha da tabela — `category?`, `label`, `values[]` (um valor por veículo, já formatados).
- `AttributeOption` (L68-72): `{ key, category, label }` — item do seletor de atributos.
- `SchemaDb` (L74-77) / `VehiclesDb` (L79-82): tipos internos para casar os JSONs.

**Setup (L84-92)**
- L84-85: `schema`/`database` = cast dos JSONs importados para os tipos.
- L87: `specCategories` exportado (usado por `getAttributeOptions`, `getComparisonRows`, `findSpecDefinitionByLabel`, radar).
- L88: `vehicleSeed` exportado = o array bruto de veículos (usado como seed do service).
- L90-92: `normalize(value)` — `trim().toLowerCase()`; comparador "ignorante de caixa e espaços" usado em toda a busca/filtro.

**L94-101 — `makeVehicleId({brand, model, version})`**
Gera slug: junta os três campos, remove diacríticos (NFD + regex `\u0300-\u036f`), lowercase, troca qualquer sequência não-alfanumérica por `-`, corta `-` nas pontas. Ex.: `FORD / Nova Ranger 4x4 / XLT` → `ford-nova-ranger-4x4-xlt`.
⚠️ Não inclui ano nem sufixo — **LTD e LTD+ colidem** (o JSON de fato tem o duplo). Só é usado no CRUD morto (`createVehicle`).

**L103-105 — `getSpecKey(category, label)`**
Gera `${normalize(category)}::${normalize(label)}`. **Nunca chamado** por nenhum outro arquivo (morte de código).

**L107-115 — `findSpecDefinitionByLabel(label)`**
Varre `specCategories` e retorna a primeira `SpecDefinition` cujo `label` casa (case-insensitive). Retorna `null` se não achar. Usado pelo radar (busca `'Potência'`, `'Torque'` etc.).

**L117-159 — `resolveVehicle(record, source, resolvingIds)` (privado, recursivo)**
Implementa a herança de `baseVehicleId`:
- L120-126: sem `baseVehicleId` → clona o record com um novo objeto `specs` (imutável, não muta o JSON original).
- L128-130: se o `id` já está em `resolvingIds` → **detecta ciclo** e lança `Referência circular encontrada...`.
- L132: busca o base por `id` em `source`.
- L134-140: se não existir base → devolve o record sozinho (degradação graciosa, sem herança).
- L142-148: marca `record.id` como "resolvendo", resolve o base recursivamente, desmarca.
- L150-157: merge `{ ...base.specs, ...record.specs }` — as chaves do próprio veículo vencem.

**L161-163 — `resolveVehicles(source = vehicleSeed)`**
Aplica `resolveVehicle` em cada veículo, cada um com um `Set` de ciclo próprio. Retorna o "banco resolvido" (toda spec herdada materializada).

**L165 — `export const vehicles = resolveVehicles()`**
Banco resolvido em nível de módulo (calculado uma vez, no import). Usado como fonte padrão das funções de filtro.

**L167-183 — `filterVehicles(source, filters)` (privado)**
Filtro por `vehicleCategory`/`brand`/`model`, todos via `normalize` (case-insensitive).

**L185-193 — `getVehicleCategories(source = vehicles)`**
Coleta `vehicleCategory` distintos e não-nulos, ordenados (A-Z): no dataset atual → `["Hatch", "Picape", "Sedan", "SUV"]`.

**L195-199 / L201-211 / L213-224 — `getBrands` / `getModels` / `getVersions`**
Mesmo padrão: filtra o banco (`getBrands` por categoria opcional; `getModels` por marca+categoria; `getVersions` por marca+modelo+categoria), extrai o campo, deduplica com `Set`, ordena. São as fontes dos 3 SearchSelects de cada slot.

**L226-238 — `findVariant({brand, model, version}, source = vehicles)`**
Busca exata (normalizada) dos três campos → retorna o `Vehicle` ou `null`. É a "consulta" que o slot faz quando marca+modelo+versão estão completos.

**L240-245 — `displaySpecValue(value)`**
Formatador obrigatório para a tabela (requisito "informação inexistente explícita"):
- `null` / `undefined` / `''` → `'N/A'`;
- `boolean` → `'Sim'` / `'Não'`;
- demais → `String(value)`.

**L247-255 — `getAttributeOptions()`**
Achatamento do schema: para cada categoria, para cada spec → `{ key, category: categoria.name, label }`. Resultado: 283 opções, na ordem do schema. Alimenta o `AttributeSelector`.

**Radar (L257-344)**
- `hasAvailableValue` (L257-261): spec "presente" se `true`, ou não-`null`/`undefined`/`''`. (`false` conta como ausente.)
- `getSpecValue(vehicle, specLabel)` (L263-269): acha a definição por label e lê `vehicle.specs[spec.key]`.
- `specNumber(vehicle, specLabel)` (L271-283): converte o valor em número — number passa direto; string tenta `Number(value.replace(',', '.'))` (aceita vírgula decimal) e cai em `0` se não for finito; demais tipos → `0`.
- `maxSpec(specLabel)` (L285-287): `Math.max(...todos os veículos, 1)` — o teto de normalização (evita divisão por zero). ⚠️ Percorre **todos** os veículos do seed a cada chamada (ver Update.md, item 6).
- `normalizeNumber(value, max)` (L289-291): `(value/max)*100` limitado a [0,100], arredondado.
- `categoryScore(vehicle, categoryNames)` (L293-302): **índice de disponibilidade** — % de specs da(s) categoria(s) que o veículo possui (`true`/valor). Ex.: "Segurança" = 86% se 12 de 14 specs de Safety existem.
- `getRadarMetrics(vehicle)` (L305-344): produz os 6 eixos:
  - `performance` "Perf." = média(normalizado Potência, normalizado Torque);
  - `efficiency` "Eficiência" = média(normalizado `Economia de Combustível`, normalizado `Consumo Rodoviário — Diesel`);
  - `safety` "Segurança" = `categoryScore(['Safety'])`;
  - `technology` "Tech" = `categoryScore(['Connectivity','High Tech','Ice Line Up'])`;
  - `comfort` "Conforto" = `categoryScore(['Air Conditioning','Seats','Trim','Sunroof'])`;
  - `utility` "Uso" = `categoryScore(['4X4','Wheels','Others'])`.

**L346-380 — `getComparisonRows(selectedVehicles, selectedAttributeKeys = [])`**
Monta as linhas da tabela:
- L348-349: **se `selectedVehicles.length < 2` retorna `[]`** ← a regra que esconde a lista com 1 veículo (bloqueio da validação; ver Update.md, item 1).
- L353: `selectedKeySet` = Set das chaves de atributos marcadas pelo usuário.
- L355-369: 3 linhas fixas no topo — `Ano`, `Categoria`, `Motor` (com `?? 'N/A'`).
- L371-379: as linhas de specs: para cada categoria do schema, specs filtradas (`selectedKeySet.size === 0` → **todas**; senão só as marcadas), cada uma virando `{ category, label, values: veículos.map(displaySpecValue) }`.
- L381: retorna `[...fixedRows, ...specRows]`.

### 5.17 `services/authService.ts` (69 linhas)

Camada fina sobre o Firebase Auth. Todos os erros chegam à UI como `Error.message` (em PT, já traduzidos pelo Firebase, ex.: "Invalid login credentials.").

- **L1-11:** imports (funções do `firebase/auth` + `User`) e do singleton `auth`.
- **L13-27 — `registerUser(email, password, name?)`:** `createUserWithEmailAndPassword` → cria a conta; se `name` veio, `updateProfile({ displayName })`. Retorna o credential.
- **L29-35 — `loginUser(email, password)`:** `signInWithEmailAndPassword`.
- **L39-41 — `resetUserPassword(email)`:** `sendPasswordResetEmail`.
- **L43-45 — `logoutUser()`:** `signOut(auth)`.
- **L47-49 — `getCurrentUser()`:** lê `auth.currentUser` (não é usado pela UI).
- **L51-53 — `isAuthenticated()`:** `currentUser !== null` (usada só pela tela órfã `details.tsx`).
- **L55-69 — `waitForAuthState()`:** retorna `Promise<User | null>` que resolve no **primeiro** evento de `onAuthStateChanged` (desinscreve antes de resolver). É a barra de proteção da Home: resolve `null` se não houver sessão → redirect para login.

### 5.18 `services/vehicleService.ts` (154 linhas)

"Fake API" + CRUD local. Padrão de todas as funções: tenta a API; se não houver API, usa o banco local resolvido.

- **L1-16:** imports de `data/vehicles` (funções puras + seed + tipos).
- **L17 — `const API_BASE_URL = '';`** ← chave: vazia.
- **L19 — `let localVehicles = JSON.parse(JSON.stringify(vehicleSeed))`** — deep-clone do seed em memória (o CRUD morto mutaria este clone, nunca o JSON original).
- **L21-37 — `request<T>(path, options?)`:** se `API_BASE_URL` vazio → `return null` (L22); senão `fetch` com `Content-Type: application/json`, lança `Erro na API: {status}` se `!response.ok`, senão `response.json()`. Como a URL é vazia, **sempre retorna null hoje** — todo o caminho de API é inerte.
- **L39-41 — `getLocalVehicles()`:** `resolveVehicles(localVehicles)` (aplica herança).
- **L43-55 — `listVehicles(filters?)`:** tenta `GET /vehicles` (sempre null) → usa local; filtra por `category`/`brand`/`model` com **comparação estrita `!==`** (inconsistente com o `normalize` de `data/vehicles.ts` — caminho nunca chamado com filtros pela UI).
- **L57-61 — `listVehicleCategories()`:** `getVehicleCategories` sobre `listVehicles()`.
- **L63-67 — `listBrands(category?)`**, **L69-73 — `listModels(brand, category?)`**, **L75-79 — `listVersions(brand, model, category?)`:** idem, delegando para as funções puras.
- **L81-90 — `findVehicle(params)`:** tenta `POST /vehicles/search`; senão `findVariant(params, local)`. **Esta é a função real usada pela Home** quando um slot completa marca+modelo+versão.
- **L92-98 — `getVehicleById(id)`:** API → local (`.find` por id). ⚠️ ambígua com os ids duplicados. **Não usada pela UI.**
- **L100-117 — `createVehicle(input)`**, **L119-142 — `updateVehicle(id, input)`** (com merge de `specs`), **L144-154 — `deleteVehicle(id)`**: CRUD completo sobre `localVehicles` (push / map+merge / filter). **Nenhum desses três é chamado pela UI** — sobra do recurso "adicionar carros" removido (commit `ff63a26 "removi o adicionar carros"`).

### 5.19 `app/_layout.tsx` (15 linhas)

```tsx
1  import '../styles/global.css';              // entra o CSS no bundle (obrigatório p/ NativeWind)
3  import { Stack } from 'expo-router';
5  export default function RootLayout() {
6    return (
7      <Stack
8        initialRouteName="index"              // abre em / (Login)
9        screenOptions={{
10         headerShown: false,                 // todas as telas desenham cabeçalho próprio
11         contentStyle: { backgroundColor: '#F5F8FC' },
12       }}
13     />
14   );
15 }
```
Layout raiz da navegação. `Stack` sem `<Stack.Screen>` declarados → rotas inferidas dos arquivos de `app/`. Não há proteção de rota por `.Protected` aqui — a proteção é feita manualmente dentro de `home.tsx` (§5.23) e `details.tsx`.

### 5.20 `app/index.tsx` — Login (87 linhas)

- **L1:** `useState` do React.
- **L2-14:** imports RN (`Alert, Button, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, useWindowDimensions, View`) + `useRouter` do expo-router.
- **L16:** importa `loginUser` do service.
- **L18-23:** `router` (navegação), `width` da tela e `isTablet = width >= 768` (quebra de layout).
- **L25-26:** estado `email`, `password` (strings vazias).
- **L28-42 — `handleLogin()`:** valida campos não vazios (Alert "Preencha email e senha."); `await loginUser(...)`; sucesso → `router.replace('/home')` (substitui a pilha, então voltar do Home não volta ao Login); erro → `Alert` com a mensagem do Firebase (ou fallback genérico).
- **L44-87 (JSX):**
  - `KeyboardAvoidingView` (L45-48): sobe o conteúdo quando o teclado abre (comportamento `padding` só no iOS).
  - Card centralizado (L50): largura `w-full` no celular, `w-3/5` no tablet.
  - Título "Login" (L51).
  - `TextInput` e-mail (L53-60): `autoCapitalize="none"`, `keyboardType="email-address"`.
  - `TextInput` senha (L62-69): `secureTextEntry` (mascara).
  - `Button "Entrar"` (L71): botão nativo, cor `#00095B` (azul Ford).
  - Links `TouchableOpacity` (L73-81): "Criar conta?" → `/register`; "Esqueci minha senha" → `/forgot-password`.

### 5.21 `app/register.tsx` — Cadastro (89 linhas)

Espelho do Login:
- **L18-24:** estado `name`, `email`, `password`.
- **L26-41 — `handleRegister()`:** valida os 3 campos; `registerUser(email, password, name)` (que também grava o `displayName`); sucesso → Alert "Usuário cadastrado com sucesso." + `router.back()` (volta ao Login); erro → Alert.
- **L43-88 (JSX):** card com título "Cadastro", 3 TextInputs (Nome, E-mail, Senha) e botão "Cadastrar". Mesmas classes/cores do Login.

### 5.22 `app/forgot-password.tsx` — Recuperação de senha (70 linhas)

- **L18:** estado `email`.
- **L20-36 — `handleResetPassword()`:** valida e-mail; `resetUserPassword(email)` → `sendPasswordResetEmail`; sucesso → Alert "Email enviado..." + `router.back()`; erro → Alert (ex.: e-mail não cadastrado).
- **L38-69 (JSX):** card "Recuperar Senha" com 1 TextInput e botão "Enviar".

### 5.23 `app/home.tsx` — Tela principal (325 linhas)

A tela de trabalho. Contém **dois layouts completos** (tablet e celular) desenhados à mão.

**Consts e helpers (L1-63)**
- **L1:** hooks `useEffect`, `useMemo`, `useState`.
- **L2-12:** imports RN (`ActivityIndicator, ScrollView, Text, TouchableOpacity, useWindowDimensions, View`) + `useRouter`.
- **L14-20:** imports dos 6 componentes da tela.
- **L21-27:** imports da lógica de dados: `ComparisonSlot`, `getAttributeOptions`, `getComparisonRows`, `getRadarMetrics`, `Vehicle`.
- **L28:** `logoutUser`, `waitForAuthState` do authService.
- **L29:** `findVehicle`, `listVehicleCategories` do vehicleService.
- **L29-30:** cores/estilos das 2 séries do radar: `RADAR_COLORS = ['#00095B' (Ford azul), '#1700F4' (grabber)]`; `RADAR_DOT_CLASSES` = classes de fundo dos pontinhos da legenda.
- **L32-40 — `createSlot(index)`:** fábrica de slots — `id: "vehicle-1"/"vehicle-2"`, `label: "Veículo A"/"Veículo B"` (65+index → 'A','B'), campos nulos.
- **L42-44 — `vehicleTitle(v)`:** `"Modelo - Versão"` (nome exibido no radar/legenda).
- **L46-50 — `getUserName(displayName, email)`:** nome do usuário → `displayName` limpa, ou o e-mail sem o `@`, ou `'Usuário'`.

**Componente (L54-325)**
- **L54-57:** `router`, `{width, height}`, `isTablet = width >= 768`.
- **L59-67 — estado:**
  - `drawerVisible` (drawer de tipo, celular);
  - `typePanelOpen` (painel de tipo expandido, tablet);
  - `categories` (tipos de veículo, vindos do banco);
  - `selectedCategory` (tipo filtrado ou `null` = "Todos");
  - `selectedAttributes` (chaves de specs marcadas; vazio = todas);
  - `slots` (2 slots iniciais, A e B);
  - `vehicles` (resultados resolvidos dos slots, em ordem A, B);
  - `userName`;
  - `loading` (spinner inicial).
- **L69-71 — `sideWidth`:** largura do painel de tipos no tablet — expandido: 22% da largura (mín. 260, máx. 340); recolhido: 76px (faixa estreita).
- **L73 — `selectorWidth`:** largura da coluna de seletores no tablet — 380 se a tela ≥ 1200, senão 340.
- **L75-77 — `radarSize`:** diâmetro do radar — tablet: clamp(300, 28% largura / 38% altura, 430); celular: `min(300, width-48)`.

**Efeitos**
- **L79-104 — `useEffect [router]` (auth + boot):** marca `loading`; `waitForAuthState()`; se desmontou, aborta (`mounted`); sem usuário → `router.replace('/')` (logout passivo); com usuário → guarda nome, carrega `categories` via `listVehicleCategories()`, sai do loading. O cleanup (`mounted = false`) evita setState após desmonte.
- **L106-124 — `useEffect [slots]` (resolver veículos):** a cada mudança de slot, dispara `findVehicle` **em paralelo** (`Promise.all`) para os slots completos; slots incompletos viram `null` e são descartados → `vehicles` sempre tem 0, 1 ou 2 veículos, na ordem dos slots.

**Derivados (L126-142)**
- **L126 — `attributeOptions`:** `useMemo` de `getAttributeOptions()` (estático — 283 opções).
- **L128-137 — `radarSeries`:** para cada veículo → `{ name, color, dotClassName, values: getRadarMetrics(vehicle) }` (cor alternada A/B).
- **L139-142 — `comparisonRows`:** `getComparisonRows(vehicles, selectedAttributes)` — reage a mudança de veículos OU de atributos marcados.

**Handlers (L144-159)**
- **`updateSlot(slotId, nextSlot)` (L144-148):** substitui o slot no estado (imutável).
- **`handleCategorySelect(category)` (L150-154):** troca o tipo, **reinicia os 2 slots** (limpa marca/modelo/versão) e fecha o drawer.
- **`handleLogout()` (L156-159):** `logoutUser()` → `router.replace('/')`.

**Render (L160-324)**
- **L160-166:** se `loading` → spinner centralizado.
- **L168-233 — LAYOUT TABLET (`isTablet`):** `flex-row` com 3 colunas:
  1. `VehicleTypePanel` (esquerda, largura `sideWidth`, fundo `#00142E`);
  2. Coluna de seletores (largura `selectorWidth`, branca): cabeçalho com `userName` (truncado) + botão "Sair"; `ScrollView` com os 2 `VehicleSelector` (`compact`) e o `AttributeSelector`;
  3. Área de resultados (flex-1): card "Radar" (título + "0 - 100") com `RadarChart` + `VehicleLegend` lado a lado; abaixo, `ComparisonTable`.
- **L236-324 — LAYOUT CELULAR:** coluna única:
  - Header branco: `userName` + botão "Sair" + botão "Tipo" (mostra a categoria ativa, abre o `VehicleTypeDrawer`);
  - `ScrollView` com: 2 `VehicleSelector` (versão cheia), `AttributeSelector`, card "Radar" (`RadarChart` + legenda embaixo), `ComparisonTable`;
  - `VehicleTypeDrawer` (modal) no fim da árvore.

**O que a tela NÃO faz** (importante para o Update.md): não impede escolher o mesmo veículo nos dois slots; não mostra nada de specs com 1 veículo (a tabela e o radar exibem placeholder "Selecione dois veículos").

### 5.24 `app/details.tsx` — tela ÓRFÃ (24 linhas)

- **L10-19:** no mount, se `isAuthenticated()` → `router.replace('/home')`; senão → `router.replace('/')`. Ou seja, **redireciona sempre para outro lugar**.
- **L21-23:** mostra só um spinner.
- **Nenhum outro arquivo faz `router.push('/details')`** — rota morta (provavelmente rastro de um design antigo com tela de detalhes de veículo).

### 5.25 `components/VehicleSelector.tsx` (98 linhas)

Um slot de seleção (Veículo A ou B).

- **L1-6:** imports (`useEffect`, `useState`, primitivos RN) + tipos `ComparisonSlot`.
- **L7:** importa `listBrands/listModels/listVersions` (do service).
- **L8-16, L18-24:** props `{ slot, category, compact?, onChange }`.
- **L26-28:** estado local `brands`, `models`, `versions` (arrays de strings).
- **L30-36:** efeito `[category]` → recarrega as marcas quando o tipo muda.
- **L38-49:** efeito `[slot.brand, category]` → sem marca, zera modelos; com marca, carrega modelos daquela marca (respeitando o tipo).
- **L51-63:** efeito `[slot.brand, slot.model, category]` → sem marca/modelo, zera versões; senão carrega versões daquele modelo.
- **L65-97 (JSX):** card com o rótulo do slot e 3 `SearchSelect` em cascata:
  - **Marca:** ao escolher → `onChange({ ...slot, brand, model: null, version: null })` (limpa os dependentes);
  - **Modelo:** `disabled={!slot.brand}`; ao escolher → limpa só a versão;
  - **Versão:** `disabled={!slot.model}`; ao escolher → fecha a cascata.

### 5.26 `components/SearchSelect.tsx` (141 linhas)

Dropdown com busca, em modal (usado 6× pela Home: 3 por slot).

- **L1-11:** imports + props `{ label, value, options, disabled?, compact?, onSelect }`.
- **L13-30:** `isTablet` (modal mais largo no tablet), estado `visible`/`term`; `filteredOptions` via `useMemo` — substring case-insensitive no texto.
- **L32-42:** `open()` (só se habilitado e com opções) e `close()` (fecha e limpa a busca).
- **L44-140 (JSX):**
  - Rótulo em caixa alta (L46-48);
  - "Botão" (TouchableOpacity, L50-68): mostra o valor selecionado (negrito escuro) ou "Selecionar" (cinza), com um "＋" à direita; estilos desabilitados em cinza;
  - Modal (L70-139): overlay `bg-black/25`; painel branco (520px no tablet, 100% no celular) com título, "Fechar", `TextInput` de busca (`placeholder="Buscar"`), `FlatList` das opções filtradas (item selecionado em azul Ford), "Nenhum item" vazio. Tocar num item → `onSelect(item)` + `close()`.

### 5.27 `components/Dropdown.tsx` (102 linhas) — **NÃO USADO**

Outro dropdown, com **tema escuro** (`#0f172a`, `#93c5fd`), modal estilo "sheet inferior" (`justify-end`, `rounded-t-3xl`), sem busca. **Nenhum arquivo importa** — resíduo de iteração anterior (os textos "Selecione a etapa anterior" indicam um fluxo em etapas antigo). Mantém o mesmo contrato de props que SearchSelect menos busca/compact.

### 5.28 `components/AttributeSelector.tsx` (182 linhas)

O coração do requisito "lista livre de atributos".

- **L1-17:** imports + props `{ options: AttributeOption[], selectedKeys: string[], onChange }`.
- **L19-40:** `isTablet`; estado `visible` (modal) e `term` (busca); `selectedSet` (Set para O(1) em render); `filteredOptions` — filtra por `label` ou `category` (case-insensitive).
- **L42-57:** `toggleAttribute(key)` (remove ou adiciona a chave), `clearSelection()`, `close()`.
- **L59-181 (JSX):**
  - Card "Atributos" (L60-79): contador ("N selecionados" ou "Todos") + botão azul "Selecionar" (abre o modal); se há seleção, link "Mostrar todos" limpa (volta a exibir as 283 specs);
  - Modal (L81-180): painel (620px no tablet, 100% no celular, máx. 82% da altura): cabeçalho com contador e "Fechar"; `TextInput` "Buscar equipamento ou atributo"; botões **"Selecionar todos"** (marca as 283) e **"Limpar"**; `FlatList` com checkboxes desenhados (quadrado: preenchido azul = marcado), label em negrito + categoria em caixa alta. `keyboardShouldPersistTaps="handled"` deixa a lista rolar com o teclado aberto.

### 5.29 `components/ComparisonTable.tsx` (97 linhas)

A saída obrigatória do desafio, em forma de tabela.

- **L1-12:** imports + props `{ vehicles, rows }` + helper `vehicleName` (`"Modelo - Versão"`).
- **L14-21:** `isTablet`; larguras: coluna "Item" 260 (tablet) / 210 (celular); coluna por veículo 250 / 190; `tableMinWidth` = soma (garante rolagem horizontal correta).
- **L23-33:** **se `vehicles.length < 2`** → card "Dados" com o placeholder **"Selecione dois veículos"** (L28) — aqui mora o bloqueio da validação com 1 veículo.
- **L35-96 (JSX, caso ≥ 2 veículos):**
  - Cabeçalho do card: "Dados" + contador "{rows.length} itens";
  - `ScrollView horizontal` envolvendo a grade (L53):
    - Linha de cabeçalho (L55-72): "ITEM" + um cabeçalho por veículo (chave de React = `brand-model-version`, `numberOfLines={2}`);
    - Linhas de dados (L74-93): cada `ComparisonRow` → coluna esquerda com a **categoria em caixa alta** (quando presente) + label; uma célula por veículo com o valor já formatado (`N/A`, `Sim`/`Não`, número/texto). Separações `border-b` sutis.

### 5.30 `components/RadarChart.tsx` (109 linhas)

Gráfico radar desenhado à mão em `react-native-svg` (sem lib de charts).

- **L1-18:** imports + tipo `RadarSeries` (`name, color, dotClassName, values`).
- **L20-26 — `point(center, radius, index, total)`:** converte (raio, índice do eixo) em coordenadas cartesianas; o `- Math.PI/2` gira para o 1º eixo apontar para cima.
- **L28-36 — `polygonPoints(values, center, maxRadius)`:** mapa cada métrica (0-100) para um ponto a `value/100 * maxRadius` do centro → string "x,y x,y ..." para o `<Polygon>`.
- **L38-108 — componente:**
  - L40-43: `metrics` dos valores da primeira série (todos os veículos usam os mesmos 6 eixos), `center = size/2`, `maxRadius = size*0.31`, níveis de grade `[0.25, 0.5, 0.75, 1]`;
  - L45-50: **se < 2 séries ou sem métricas → placeholder "Selecione dois veículos"**;
  - L52-107: `<Svg width height>` com: 4 **círculos concêntricos** de grade (`stroke #D8E3F2`); por eixo: linha do centro até a borda + `SvgText` do label a `maxRadius+30` (ex.: "Perf.", "Segurança"); por série: `<Polygon>` preenchido com `fillOpacity 0.12` e borda 2px na cor da série.

### 5.31 `components/VehicleLegend.tsx` (37 linhas)

- **L1-13:** imports + props `{ series: {name, dotClassName}[], className? }`.
- **L15:** se < 2 séries → `null` (legenda só existe em comparação).
- **L17-36:** título "VEÍCULOS" + um item por série: pontinho colorido (a `dotClassName` corresponde à cor do polígono) + "N. Modelo - Versão" (máx. 2 linhas).

### 5.32 `components/VehicleTypeDrawer.tsx` (75 linhas)

Seletor de tipo no **celular** (modal lateral).

- **L1-16:** imports + props `{ visible, categories, selectedCategory, onClose, onSelect }`.
- **L18-23:** `isTablet`; `drawerWidth` = 35% (tablet) / 86% (celular) da largura; `options = [null, ...categories]` (`null` = "Todos").
- **L25-74 (JSX):** modal transparente; painel branco ancorado à esquerda com título "Tipo", "Fechar", e `ScrollView` de botões — o ativo fica azul Ford preenchido com texto branco, os demais claros; tocar na área escura à direita (`Pressable flex-1`) fecha. `onSelect(category)` recebe `null` para "Todos".

### 5.33 `components/VehicleTypePanel.tsx` (91 linhas)

Seletor de tipo no **tablet** (painel fixo, recolhível).

- **L1-13:** imports + props `{ width, expanded, categories, selectedCategory, onToggle, onSelect }`.
- **L15-16:** `options = [null, ...categories]`.
- **L18-44 — estado recolhido:** faixa estreita (76px) azul-marinho com botão "Tipos" (expande) e o nome da categoria ativa (máx. 2 linhas, cor `#8FB3FF`).
- **L46-90 — estado expandido:** painel `#00142E` com título "Tipos" + "Ocultar" (recolhe), e `ScrollView` de botões (ativo: branco com texto azul; inativos: `bg-white/5` com borda branca 10%).

### 5.34 `assets/`

- `icon.png` (ícone do app), `adaptive-icon.png` (foreground Android), `splash-icon.png` (splash), `favicon.png` (web). Referenciados por `app.json`. (`assets/react-icon.png`, citado no `App.tsx.bkp`, **não existe**.)

### 5.35 `.expo/devices.json`

Metadado local do Expo (`{"devices": []}`) — lista de dispositivos pareados; não é código.

---

## 6. Rastreio do caso de validação: "Ford Ranger Raptor"

Passo a passo do que acontece hoje se o avaliador seguir o `Pedido_Desafio.txt`:

1. Login (Firebase) → Home.
2. Slot A: Marca `FORD` → Modelo `Ranger Raptor` → Versão `3.0 V6 EcoBoost`. (Slot B: vazio.)
3. `useEffect [slots]` → `findVehicle({brand:'FORD', model:'Ranger Raptor', version:'3.0 V6 EcoBoost'})` → `findVariant` normaliza e acha o id `ford-ranger-raptor-3-0-v6-ecoboost-2026` (vehicles.json:888) → `resolveVehicle` herda as 264 specs do base `ford_nova_ranger_4x4_ltd_2026` (o **LTD**, primeiro id duplicado) e aplica as 19 sobrescritas → `vehicles` tem **1** veículo.
4. `comparisonRows = getComparisonRows([raptor])` → **`[]`** (regra `< 2`).
5. `ComparisonTable` → placeholder "Selecione dois veículos"; `RadarChart` → placeholder; `VehicleLegend` → `null`.
6. **Resultado: nenhuma especificação é exibida.** A validação do desafio falha na UI, ainda que os dados estejam corretos no JSON.

Valores que o Raptor resolveria (confirmado simulando `resolveVehicle`): potência 397, torque 583, peso 2475 kg, cilindrada "3", economia 8.3, biturbo Sim, diesel Não, AWD Sim, Trail Control Sim, suspensão Fox Live Valve Sim, Terrain Management Sim, 7 airbags, multimídia 12", câmera 360 Sim, ACC Sim, BLIS Sim, INMETRO "E", pneus ATR 60/40 Sim, rodas 17. Dos 283 campos: 123 com valor, 152 `false` ("Não"), 8 `null` ("N/A"). **É preciso conferir esses números contra o slide oficial da Ranger Raptor** (o slide não está no repositório).

---

## 7. Resumo do que existe e do que não funciona (ponte para o Update.md)

| Categoria | Itens |
|---|---|
| **Bloqueia a validação do desafio** | Tabela/radar exigem 2 veículos; caso de validação é 1 veículo |
| **Integridade de dados** | IDs duplicados (LTD/LTD+); 9 specs numéricas como string; `cilindrada: "3"` ambíguo; Raptor herdando de um Ranger mockado |
| **Código morto** | `app/details.tsx`, `components/Dropdown.tsx`, `App.tsx.bkp`, CRUD do `vehicleService` (`create/update/delete/getById`), `getSpecKey`, `getCurrentUser`, `isAuthenticated` (só pela tela órfã), `colors/fontFamily` do tema, `expo-status-bar`, `nativewind-env.d.ts` duplicado |
| **Inconsistências menores** | `tailwind.config.js` aponta `./App.tsx` inexistente; filtro do service usa `!==` onde o resto usa `normalize`; key de React duplicada se o mesmo veículo for escolhido 2×; `handleCategorySelect` zera os slots até ao re-selecionar o mesmo tipo |

Detalhe, prioridade e como corrigir cada item: **Update.md**.
