# APP.md — Specvora: mapa completo do código

> Documento de referência para quem precisa entender o app inteiro **sem explorar o repositório**.
> Cada arquivo do projeto é explicado linha a linha (ou bloco a bloco, para arquivos JSON grandes).
> Os números de linha referem-se ao estado do repositório em `main` (commit `b90e41c`), **antes** da atualização.
> **Checkpoint: em 2026-09-27 o plano do Update.md foi integralmente aplicado** (ver §0). As descrições de §5 já refletem o estado novo do código.
> Problemas encontrados e o que deve ser mudado estão em **Update.md** — este arquivo apenas DESCREVE.

---

## 0. Log de alterações — aplicação do Update.md (2026-09-27)

**Tudo que era executável no Update.md foi aplicado.** Estado verificado com `npm run validate` (ok), `npx tsc --noEmit` (ok) e um teste de integração simulando o caso de validação (Raptor sozinho → 286 linhas na tabela, Cilindrada exibida como `3.0 L`, comparação de 2 veículos inalterada).

### P0 — bloqueios da validação
- **P0-1 (feito):** `getComparisonRows` agora aceita 1 veículo (guarda `=== 0`); `ComparisonTable` só mostra placeholder com 0 veículos ("Selecione um veículo"); radar/legenda continuam exigindo 2 (decisão do Update: a saída obrigatória é a lista). Com o Raptor sozinho a tabela exibe as 3 linhas fixas + 283 specs.
- **P0-2 (parcial — pendente do slide):** os 19 valores do Raptor no JSON são os do mock (potência 397, torque 583, peso 2475, economia 8.3, INMETRO "E", 7 airbags, multimídia 12", câmera 360, ACC, BLIS, Fox Live Valve, Terrain Management, Trail Control, AWD, biturbo, ATR 60/40, rodas 17). **O slide oficial não está no repositório** — a conferência final (passo 1 do P0-2) ainda falta. Para travar a resposta na demo, o `scripts/validate.mjs` compara o Raptor resolvido contra essa tabela de valores esperados (se o slide mudar, atualizar o `expected` no script). Formato: `cilindrada` agora é number + unidade `L` no schema → exibe **"3.0 L"**.

### P1 — integridade de dados
- **P1-1 (feito):** id do LTD+ renomeado para `ford_nova_ranger_4x4_ltd_plus_2026` (colisão resolvida; os 4 `baseVehicleId` continuam apontando para o LTD, idêntico ao comportamento de antes — ver pendência abaixo). `makeVehicleId` agora inclui o ano e adiciona sufixo `-2`, `-3`… em caso de colisão. `validateVehicleIds()` roda no load e faz `console.warn` se houver id duplicado.
- **P1-2 (feito):** os 61 valores numéricos que eram string em `vehicles.json` viraram `number` (script one-shot; verificado pelo `validate.mjs`, que falha se uma spec `type: "number"` vier como string). Convenção de `cilindrada` = litros com 1 decimal, registrada no `description` do schema; o schema ganhou o campo opcional `unit` (apenas `cilindrada` usa, `"L"`) e `displaySpecValue(value, unit?)` formata inteiros com 1 decimal + unidade (3 → `3.0 L`, 1.5 → `1.5 L`).
- **P1-3 (decisão tomada):** o Raptor **mantém** o `baseVehicleId` para o LTD — os 264 campos que o slide não mostra continuam herdados (P0-2 passo 3: "deixar como estão, viram Não/N/A"). Com o id do LTD+ renomeado, a herança agora é determinística (sempre o LTD, linha 300).

### P2 — robustez/UX
- **P2-1 (feito, opção 1 + 2):** `updateSlot` em `home.tsx` bloqueia completar um slot com o mesmo veículo do outro (Alert "Veículo duplicado"); chaves de React trocadas para posição (`col-${index}` no cabeçalho da tabela, `serie-${index}` nos polígonos do radar, `legenda-${index}` na legenda).
- **P2-2 (feito):** `handleCategorySelect` só zera os slots quando o tipo efetivamente muda.
- **P2-3 (feito):** `maxSpec` usa cache em módulo (`maxSpecCache`).
- **P2-4 (feito):** `filterVehicles` exportado de `data/vehicles.ts`; `listVehicles` delega a filtragem para ele (o filtro inline case-sensitive foi apagado).
- **P2-5 (feito, incluindo o opcional):** as 3 telas de auth ganham estado `submitting` (botão desabilitado + texto "Entrando…"/"Cadastrando…"/"Enviando…"), validação de e-mail por regex antes da chamada, e o `Button` nativo virou `TouchableOpacity` azul Ford. `authService.ts` exporta `translateAuthError()` (traduz `auth/invalid-credential`, `auth/wrong-password`, `auth/user-not-found`, `auth/invalid-email`, `auth/weak-password`, `auth/email-already-in-use`, `auth/too-many-requests` para PT).
- **P2-6 (feito):** telas de auth usam `SafeAreaView` (top) do `react-native-safe-area-context` dentro do `KeyboardAvoidingView`; a Home usa `useSafeAreaInsets()` no padding-top dos headers (celular e tablet). O `SafeAreaProvider` já vem do `expo-router` (`ExpoRoot.js`), não foi necessário adicionar.

### P3 — limpeza
- **P3-1 (feito):** apagados `app/details.tsx`, `components/Dropdown.tsx`, `App.tsx.bkp`, `nativewind-env.d.ts` (raiz — ficou só o de `types/`), `styles/colors.ts`, `styles/fontFamily.ts`; removidas do `vehicleService.ts` as 4 funções de CRUD (`getVehicleById`, `createVehicle`, `updateVehicle`, `deleteVehicle`) e de `data/vehicles.ts`/`authService.ts` as exports mortas (`getSpecKey`, `getCurrentUser`, `isAuthenticated`). `tailwind.config.js`: `content` corrigido para `["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./index.ts"]` e o `extend` de tokens removido (opção (i) do Update — os componentes seguem com hex arbitrário; a opção (ii) "reformular componentes com tokens" fica para o futuro). A dependência `expo-status-bar` foi **mantida** porque o P3-2 a passou a usar.
- **P3-2 (feito):** `<StatusBar style="dark" />` dentro do `<Stack>` em `app/_layout.tsx`.
- **P3-3 (feito o que era para o projeto):** código do Firebase intencionalmente mantido (chave de cliente); README.md documenta (a) que as credenciais são do app web `specvoraauth` e que o ideal é criar app RN dedicado, e (b) que a recuperação de senha depende de email de contato configurado no console Firebase.
- **P3-4 (feito):** contador da tabela agora "N atributos" (desconta as 3 linhas fixas, com plural correto); agrupamento visual: cada categoria da tabela ganha **uma** linha de cabeçalho de grupo (fundo claro) e as linhas não repetem a categoria; placeholder do radar com 1 veículo: "Selecione um segundo veículo para comparar" (com 0: "Selecione um veículo"); `description` do `vehicles.json` documenta que Ano/Categoria/Motor vêm dos campos do veículo e ficam fora do schema; **acessibilidade**: `accessibilityRole`/`accessibilityLabel`/`accessibilityState` nos touchables de todas as telas (login, cadastro, recuperação, home, SearchSelect, AttributeSelector, drawer e painel de tipos — checkboxes com role `checkbox`); **testes**: `scripts/validate.mjs` (ids únicos; chaves de specs ↔ schema nos dois sentidos + coerência de tipos; `baseVehicleId` existente; valores do Raptor) e o script `npm run validate` no package.json.

### Pendências (exigem entrada externa — não bloqueiam a validação)
1. **P0-2 passo 1:** conferir os 19 valores do Raptor contra o slide oficial (slide não está no repositório). Até lá, o `npm run validate` trava os valores do mock como a "fonte da verdade" da demo.
2. **P1-1 passo 2:** decidir a que veículo cada um dos 4 `baseVehicleId` (`...ltd_2026`) deve apontar — hoje (e depois da atualização) todos resolvem para o **LTD** (comportamento idêntico ao de antes). O Update sugere que Territory/Focus/Fusion Titanium talvez devessem herdar do **LTD+** — **confirmar com o time**; se sim, basta trocar o `baseVehicleId` nos 3 registros (o id do LTD+ agora é único e seguro para apontar).

### Arquivos novos / removidos nesta atualização
- **Novos:** `scripts/validate.mjs`; `validate` em `package.json` scripts.
- **Removidos:** `app/details.tsx`, `components/Dropdown.tsx`, `App.tsx.bkp`, `nativewind-env.d.ts` (raiz), `styles/colors.ts`, `styles/fontFamily.ts`.

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
| Saída: lista de especificações técnicas | ✅ | `data/vehicles.ts:getComparisonRows` + `components/ComparisonTable.tsx` — **funciona com 1 ou 2 veículos** (guarda `=== 0`); placeholder só com 0 veículos (atualizado no Update.md, P0-1) |
| Formato sempre o mesmo, independentemente do veículo | ✅ | `data/specSchema.json` (283 chaves fixas) — toda linha da tabela vem do schema |
| Campos claros, organizados, comparáveis | ✅ | Tabela com coluna "Item" + coluna por veículo, agrupada por categoria |
| Informação inexistente explícita (vazio/N/A) | ✅ | `data/vehicles.ts:displaySpecValue` (linhas 240-245) → `N/A` para `null`/`undefined`/`''`; `false` → `Não` |
| Validação com a Ford Ranger Raptor | ⚠️ **PARCIAL (só a conferência do slide falta)** | O dado existe (`Ranger Raptor` / `3.0 V6 EcoBoost`) e resolve para 283 campos; a UI **mostra a lista com 1 veículo** (P0-1 feito). Os 19 valores declarados são o mock do slide e **ainda precisam ser conferidos contra o slide oficial** (não está no repositório) — o `scripts/validate.mjs` trava esses valores (P0-2, pendência 1 do §0). |

**Conclusão (atualizada 2026-09-27):** o bloqueio da UI foi resolvido (P0-1) — logar → escolher só o Ranger Raptor já exibe a lista padronizada completa. O que falta para a validação ser 100% é conferir os valores contra o slide oficial (pendência externa, §0).

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
6. `ComparisonTable` renderiza a lista com **1 ou 2** veículos (placeholder só com 0); `RadarChart`/`VehicleLegend` só com 2 (ver §2).

---

## 4. Mapa de arquivos

```
Specvora/
├── index.ts                      # Entry point (1 linha)
├── app.json                      # Config Expo (nome, ícones, splash, plugins)
├── package.json                  # Dependências e scripts (+ "validate": node scripts/validate.mjs)
├── tsconfig.json                 # Extende expo/tsconfig.base + mapping do Firebase RN
├── babel.config.js               # Presets Babel (Expo + NativeWind)
├── metro.config.js               # Metro + NativeWind (input styles/global.css)
├── tailwind.config.js            # Tailwind/NativeWind (content corrigido, sem tokens — §5.7)
├── types/nativewind-env.d.ts     # Reference de tipos do NativeWind (único — o da raiz foi apagado)
├── Pedido_Desafio.txt            # Enunciado do desafio (ford)
├── README.md                     # Leia-me do grupo (+ observações Firebase, §P3-3)
├── app/                          # ROTAS (Expo Router)
│   ├── _layout.tsx               # Stack global, sem header, + StatusBar dark
│   ├── index.tsx                 # Login (SafeAreaView, submitting, validação de email)
│   ├── register.tsx              # Cadastro (idem)
│   ├── forgot-password.tsx       # Recuperação de senha (idem)
│   └── home.tsx                  # Tela principal (celular+tablet, safe area, bloq. duplicado)
├── components/
│   ├── VehicleSelector.tsx       # Slot Marca/Modelo/Versão (cascata)
│   ├── SearchSelect.tsx          # Dropdown com busca (modal, acessível)
│   ├── AttributeSelector.tsx     # Multi-seleção de atributos (modal + busca, acessível)
│   ├── ComparisonTable.tsx       # Tabela padronizada (1-2 veículos, grupos por categoria)
│   ├── RadarChart.tsx            # Gráfico radar SVG (2+ veículos)
│   ├── VehicleLegend.tsx         # Legenda do radar (2+ veículos)
│   ├── VehicleTypeDrawer.tsx     # Drawer modal de tipo (celular)
│   └── VehicleTypePanel.tsx      # Painel lateral de tipo (tablet)
├── services/
│   ├── authService.ts            # Firebase Auth (login/cadastro/senha/logout, erros PT)
│   └── vehicleService.ts         # "API" mockada (CRUD local removido — sobra morta)
├── scripts/
│   └── validate.mjs              # Validação do banco + Raptor (npm run validate)
├── data/
│   ├── specSchema.json           # Catálogo: 15 categorias, 283 atributos (+ unit em cilindrada)
│   ├── vehicles.json             # 10 veículos (Ford) com specs + herança (números tipados)
│   └── vehicles.ts               # Tipos + lógica pura (resolve, filtros, rows, 1-2 veículos)
├── firebase/
│   └── config.ts                 # Config Firebase + auth com persistence RN
├── styles/
│   └── global.css                # 3 diretivas @tailwind (input do NativeWind)
├── assets/                       # Ícones (icon, adaptive, splash, favicon)
└── .expo/                        # Metadados locais do Expo (devices.json)

Removidos na atualização de 2026-09-27 (P3-1): `app/details.tsx`, `components/Dropdown.tsx`, `App.tsx.bkp`, `nativewind-env.d.ts` (raiz), `styles/colors.ts`, `styles/fontFamily.ts`.
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

### 5.7 `tailwind.config.js` (atualizado na 2026-09-27)

```js
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./index.ts"],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },   // tokens removidos (P3-1h, opção i)
  plugins: [],
}
```
- `content` corrigido (antes apontava para `./App.tsx` inexistente + glob genérico).
- Os tokens `colors`/`fontFamily` foram **apagados** (arquivos `styles/colors.ts` e `styles/fontFamily.ts` removidos) — a opção (ii) do Update (reformular os componentes para usar `bg-aero`, `text-twilight` etc.) fica pendente como melhoria futura; os componentes continuam com hex arbitrário.

### 5.8 `types/nativewind-env.d.ts`

Contém: `/// <reference types="nativewind/types" />`
- Serve para o TypeScript aceitar `className` em componentes RN (`View`, `Text`, ...).
- O duplicado da raiz foi **removido** (P3-1f); ficou só o de `types/`.

### 5.9 `styles/global.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
- Três diretivas do Tailwind; este arquivo é **input do pipeline NativeWind/Metro** (§5.6), não um CSS renderizado.

### 5.10 `styles/colors.ts` — **REMOVIDO** (2026-09-27, P3-1h)

Paleta nomeada que só era consumida pelo `tailwind.config.js` (tokens ociosos). Valores de referência para quem quiser reformular os componentes com tokens (opção (ii) do Update.md): `twilight #00142E`, `fordBlue #00095B`, `fordGrabber #1700F4`, `sky #2A6BAC`, `aero #F5F8FC`, `line #D8E3F2`, `muted #517198`, `white #FFFFFF`.

### 5.11 `styles/fontFamily.ts` — **REMOVIDO** (2026-09-27, P3-1h/j)

Era configuração morta (fontes Roboto nunca carregadas, sem `expo-font`). Se um dia a tipografia custom for implementada, recarregar via `expo-font` + `useFonts`.

### 5.12 `App.tsx.bkp` — **REMOVIDO** (2026-09-27, P3-1c)

Era backup morto do boilerplate do NativeWind (referenciava `assets/react-icon.png`, inexistente; nunca compilado — entry é `index.ts`).

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
  "description": "Catálogo único de atributos técnicos. ... Convenção: 'cilindrada' é em litros com 1 decimal (ex.: 3.0 = 3.0 L). O campo opcional 'unit' acrescenta a unidade à exibição de specs number (ex.: 3 vira 3.0 L).",
  "categories": [
    { "id": "engine_transmission", "name": "Engine & Transmission",
      "specs": [
        { "key": "cilindrada", "label": "Cilindrada", "type": "number", "unit": "L" },  // único spec com unit (atualização 2026-09-27)
        { "key": "potencia", "label": "Potência", "type": "number" },   // key = slug estável (id na tabela/specs)
        { "key": "transmissao_automatica", "label": "Transmissão Automática", "type": "boolean" },
        ...
      ] },
    ...
  ]
}
```
- Cada **spec** tem `key` (identificador snake_case usado nos `specs{}` dos veículos e como `key` de React nas listas), `label` (texto exibido, em PT), `type` (`text` | `number` | `boolean`) e o opcional `unit` (acrescenta a unidade à exibição de numbers — só `cilindrada` usa, `"L"`; P1-2 de 2026-09-27).
- `type` é **informativo**, mas agora **enforçado em dois pontos**: os JSONs têm os numbers tipados de verdade (conversão de 2026-09-27, P1-2) e o `scripts/validate.mjs` falha se uma spec `type: "number"` vier como string.
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
  "description": "Banco mockado normalizado. ... Convenções: specs com type number no specSchema são gravadas como number; 'cilindrada' é em litros com 1 decimal (ex.: 3.0). As linhas fixas Ano, Categoria e Motor vêm dos campos do veículo (year, vehicleCategory, engine) e ficam fora do specSchema.",
  "vehicles": [
    {
      "id": "ford_nova_ranger_4x4_xlt_2026",
      "brand": "FORD", "model": "Nova Ranger 4x4", "version": "XLT",
      "year": "2026", "vehicleCategory": "Picape", "engine": "3.0 V6 - 24V",
      "specs": { "peso_em_ordem_de_marchas": 2283, "potencia": 250, "torque": 600,
                 "transmissao_automatica": true, ... }   // 283 chaves, numbers tipados desde 2026-09-27
    },
    { "id": "ford-ranger-raptor-3-0-v6-ecoboost-2026",
      "baseVehicleId": "ford_nova_ranger_4x4_ltd_2026",   // herda 283 specs do base...
      "brand": "FORD", "model": "Ranger Raptor", "version": "3.0 V6 EcoBoost",
      "year": "2026", "vehicleCategory": "Picape", "engine": "3.0 V6 EcoBoost",
      "specs": { "peso_em_ordem_de_marchas": 2475, "cilindrada": 3, "potencia": 397, "torque": 583, ... }  // ...e declara 20 chaves
    }, ...
  ]
}
```

**Mecânica de herança:** um veículo com `baseVehicleId` herda todo o `specs{}` do veículo-base e sobrescreve apenas as chaves que ele declara. Ex.: o Ranger Raptor declara só 20 chaves (peso 2475, cilindrada 3, potência 397, torque 583, economia 8.3, diesel Não, biturbo, rodas 17, ATR 60/40, AWD, Trail Control, suspensão Fox, Terrain Management, 7 airbags, multimídia 12", câmera 360, ACC, BLIS, classificação INMETRO "E") e herda as outras 263 do base — incluindo as 8 `null` (consumos etanol/gasolina/elétrico, CO₂ etanol, autonomia elétrica). **Os 20 valores declarados são a fonte da validação do desafio e ficam travados no `scripts/validate.mjs` (P0-2); a conferência final contra o slide oficial ainda está pendente (slide fora do repositório, §0).**

Os 10 veículos:

| id no JSON | Marca / Modelo / Versão | Tipo | base |
|---|---|---|---|
| ford_nova_ranger_4x4_xlt_2026 | FORD / Nova Ranger 4x4 / XLT | Picape | — (283 specs próprias) |
| **ford_nova_ranger_4x4_ltd_2026** (linha 300) | FORD / Nova Ranger 4x4 / LTD | Picape | — |
| **ford_nova_ranger_4x4_ltd_plus_2026** (linha 594; id único desde 2026-09-27 — era duplicado do LTD) | FORD / Nova Ranger 4x4 / LTD+ | Picape | — |
| ford-ranger-raptor-3-0-v6-ecoboost-2026 (id na linha 888) | FORD / Ranger Raptor / 3.0 V6 EcoBoost | Picape | `...ltd_2026` (20 specs declaradas) |
| ford-territory-sel-2026 | FORD / Territory / SEL | SUV | `...xlt_2026` (23 specs) |
| ford-territory-titanium-2026 | FORD / Territory / Titanium | SUV | `...ltd_2026` (23 specs) |
| ford-focus-se-2026 | FORD / Focus / SE | Hatch | `...xlt_2026` (25 specs) |
| ford-focus-titanium-2026 | FORD / Focus / Titanium | Hatch | `...ltd_2026` (26 specs) |
| ford-fusion-sel-2026 | FORD / Fusion / SEL | Sedan | `...xlt_2026` (21 specs) |
| ford-fusion-titanium-awd-2026 | FORD / Fusion / Titanium AWD | Sedan | `...ltd_2026` (23 specs) |

✔️ **IDs únicos (atualização 2026-09-27, P1-1):** o id do LTD+ foi renomeado para `ford_nova_ranger_4x4_ltd_plus_2026`. Os 4 veículos que apontam `...ltd_2026` como base (Raptor, Territory Titanium, Focus Titanium, Fusion Titanium AWD) resolvem de forma **determinística** para o LTD (linha 300) — comportamento idêntico ao de antes. **Pendência (P1-1 passo 2, §0):** confirmar com o time se os 3 Titanium deveriam apontar para o LTD+; se sim, trocar o `baseVehicleId` nos 3 registros. `validateVehicleIds()` em `data/vehicles.ts` faz `console.warn` no load se houver colisão, e o `validate.mjs` falha com ids duplicados.

Observações de dados (atualizadas 2026-09-27):
- **Todos os numéricos agora são `number`** (P1-2): os 61 strings numéricas foram convertidas (`"250"` → `250`); o `validate.mjs` impede regressão.
- `null` em `specs` significa "não disponível" → exibido como `N/A`. No Raptor, 8 specs ficam `null` (herdadas do LTD: consumos etanol/gasolina/elétrico, CO₂ etanol, autonomia elétrica). Raptor resolvido: 283 chaves — 124 com valor, 151 `false` ("Não"), 8 `null` ("N/A").
- `cilindrada` segue a convenção **litros com 1 decimal** (3 = 3.0 L) e exibe com unidade graças ao `"unit": "L"` do schema → `displaySpecValue` mostra **"3.0 L"**.

### 5.16 `data/vehicles.ts` (380 linhas) — o "cérebro" de dados

Arquivo de **lógica pura** (sem React): tipos, normalização, resolução de herança, filtros, opções de atributo, métricas do radar e montagem das linhas da tabela.

**Imports (L1-2)**
- `schemaDb` = `specSchema.json`; `vehiclesDb` = `vehicles.json` (JSON importado vira objeto em tempo de build).

**Tipos (L4-82)**
- `SpecValue` (L4): `string | number | boolean | null` — o universo de valores de uma spec.
- `SpecDefinition` (L6-10): `{ key, label, type, unit? }` — uma linha do schema (o `unit?` é novo na atualização 2026-09-27, P1-2).
- `SpecCategory` (L12-16): `{ id, name, specs[] }` — um grupo do schema.
- `VehicleRecord` (L18-28): forma bruta do JSON — `id`, `baseVehicleId?`, `brand`, `model`, `version`, `year?`, `vehicleCategory?`, `engine?`, `specs: Record<string, SpecValue>`.
- `Vehicle` (L30): alias de `VehicleRecord` (após a resolução, `specs` já é o mapa completo).
- `VehicleSearchParams` (L32-36): `{ brand, model, version }` — a tripla de busca.
- `VehicleFilters` (L38-42): filtros opcionais por `category`/`brand`/`model`.
- `VehicleInput` (L44-46): `VehicleRecord` sem `id` obrigatório (antes usado pelo CRUD do service, removido em 2026-09-27 — agora só existe para quem recriar o CRUD).
- `ComparisonSlot` (L48-54): estado de um slot da UI — `id`, `label` ("Veículo A/B"), e marca/modelo/versão (cada um `string | null`).
- `RadarMetric` (L56-60): `{ key, label, value }` — um eixo do radar (value 0-100).
- `ComparisonRow` (L62-66): uma linha da tabela — `category?`, `label`, `values[]` (um valor por veículo, já formatados).
- `AttributeOption` (L68-72): `{ key, category, label }` — item do seletor de atributos.
- `SchemaDb` (L74-77) / `VehiclesDb` (L79-82): tipos internos para casar os JSONs.

**Setup (L84-92)**
- L84-85: `schema`/`database` = cast dos JSONs importados para os tipos.
- L87: `specCategories` exportado (usado por `getAttributeOptions`, `getComparisonRows`, `findSpecDefinitionByLabel`, radar).
- L88: `vehicleSeed` exportado = o array bruto de veículos (usado como seed do service).
- **Novo (2026-09-27, P1-1):** `validateVehicleIds()` roda no load do módulo e faz `console.warn` se dois veículos compartilharem `id` (proteção contra regressão da colisão LTD/LTD+).
- `normalize(value)` — `trim().toLowerCase()`; comparador "ignorante de caixa e espaços" usado em toda a busca/filtro.

**`makeVehicleId({brand, model, version, year?}, existingIds?)` (reescrito na 2026-09-27, P1-1)**
Gera slug: junta os três campos **+ ano** (se vier), remove diacríticos (NFD + regex `\u0300-\u036f`), lowercase, troca qualquer sequência não-alfanumérica por `-`, corta `-` nas pontas. Se o id já existir em `existingIds` (padrão: ids do `vehicleSeed`), adiciona sufixo `-2`, `-3`… Ex.: `FORD / Nova Ranger 4x4 / XLT / 2026` → `ford-nova-ranger-4x4-xlt-2026` (e `-2` se colidir).

**Removido na 2026-09-27 (P3-1e):** `getSpecKey(category, label)` (morte de código, nunca chamado).

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

**`filterVehicles(source, filters)` (privado → EXPORTADO na 2026-09-27, P2-4)**
Filtro por `vehicleCategory`/`brand`/`model`, todos via `normalize` (case-insensitive). Agora é a fonte única de filtragem: `vehicleService.listVehicles` delega para ele.

**L185-193 — `getVehicleCategories(source = vehicles)`**
Coleta `vehicleCategory` distintos e não-nulos, ordenados (A-Z): no dataset atual → `["Hatch", "Picape", "Sedan", "SUV"]`.

**L195-199 / L201-211 / L213-224 — `getBrands` / `getModels` / `getVersions`**
Mesmo padrão: filtra o banco (`getBrands` por categoria opcional; `getModels` por marca+categoria; `getVersions` por marca+modelo+categoria), extrai o campo, deduplica com `Set`, ordena. São as fontes dos 3 SearchSelects de cada slot.

**L226-238 — `findVariant({brand, model, version}, source = vehicles)`**
Busca exata (normalizada) dos três campos → retorna o `Vehicle` ou `null`. É a "consulta" que o slot faz quando marca+modelo+versão estão completos.

**`displaySpecValue(value, unit?)` (ganhou o 2º parâmetro na 2026-09-27, P1-2)**
Formatador obrigatório para a tabela (requisito "informação inexistente explícita"):
- `null` / `undefined` / `''` → `'N/A'`;
- `boolean` → `'Sim'` / `'Não'`;
- `number` + `unit` → inteiro vira 1 decimal + unidade (3 + `L` → `"3.0 L"`; 1.5 + `L` → `"1.5 L"`);
- demais → `String(value)`.

**L247-255 — `getAttributeOptions()`**
Achatamento do schema: para cada categoria, para cada spec → `{ key, category: categoria.name, label }`. Resultado: 283 opções, na ordem do schema. Alimenta o `AttributeSelector`.

**Radar (L257-344)**
- `hasAvailableValue` (L257-261): spec "presente" se `true`, ou não-`null`/`undefined`/`''`. (`false` conta como ausente.)
- `getSpecValue(vehicle, specLabel)` (L263-269): acha a definição por label e lê `vehicle.specs[spec.key]`.
- `specNumber(vehicle, specLabel)` (L271-283): converte o valor em número — number passa direto; string tenta `Number(value.replace(',', '.'))` (aceita vírgula decimal) e cai em `0` se não for finito; demais tipos → `0`.
- `maxSpec(specLabel)` (atualizado 2026-09-27, P2-3): `Math.max(...todos os veículos, 1)` — o teto de normalização (evita divisão por zero), **agora com cache em módulo** (`maxSpecCache`): calcula uma vez por label, reusa nas chamadas seguintes.
- `normalizeNumber(value, max)` (L289-291): `(value/max)*100` limitado a [0,100], arredondado.
- `categoryScore(vehicle, categoryNames)` (L293-302): **índice de disponibilidade** — % de specs da(s) categoria(s) que o veículo possui (`true`/valor). Ex.: "Segurança" = 86% se 12 de 14 specs de Safety existem.
- `getRadarMetrics(vehicle)` (L305-344): produz os 6 eixos:
  - `performance` "Perf." = média(normalizado Potência, normalizado Torque);
  - `efficiency` "Eficiência" = média(normalizado `Economia de Combustível`, normalizado `Consumo Rodoviário — Diesel`);
  - `safety` "Segurança" = `categoryScore(['Safety'])`;
  - `technology` "Tech" = `categoryScore(['Connectivity','High Tech','Ice Line Up'])`;
  - `comfort` "Conforto" = `categoryScore(['Air Conditioning','Seats','Trim','Sunroof'])`;
  - `utility` "Uso" = `categoryScore(['4X4','Wheels','Others'])`.

**`getComparisonRows(selectedVehicles, selectedAttributeKeys = [])` (atualizado 2026-09-27, P0-1)**
Monta as linhas da tabela:
- **se `selectedVehicles.length === 0` retorna `[]`** ← antes era `< 2` (o bloqueio da validação); agora **1 ou 2 veículos** geram a lista (P0-1).
- `selectedKeySet` = Set das chaves de atributos marcadas pelo usuário.
- 3 linhas fixas no topo — `Ano`, `Categoria`, `Motor` (com `?? 'N/A'`; fora do schema — documentado no `description` do vehicles.json).
- As linhas de specs: para cada categoria do schema, specs filtradas (`selectedKeySet.size === 0` → **todas**; senão só as marcadas), cada uma virando `{ category, label, values: veículos.map((v) => displaySpecValue(v.specs[spec.key], spec.unit)) }` (a unidade é nova — P1-2).
- Retorna `[...fixedRows, ...specRows]` → com 1 veículo: 286 linhas (3 fixas + 283 specs).

### 5.17 `services/authService.ts` (atualizado 2026-09-27)

Camada fina sobre o Firebase Auth. Erros: as telas de auth **não** mostram mais a mensagem crua do Firebase — passam por `translateAuthError()` (P2-5).

- **Imports:** funções do `firebase/auth` + `User` e o singleton `auth`.
- **`registerUser(email, password, name?)`:** `createUserWithEmailAndPassword` → cria a conta; se `name` veio, `updateProfile({ displayName })`. Retorna o credential.
- **`loginUser(email, password)`:** `signInWithEmailAndPassword`.
- **`resetUserPassword(email)`:** `sendPasswordResetEmail`.
- **`logoutUser()`:** `signOut(auth)`.
- **`translateAuthError(error)` (NOVO, 2026-09-27, P2-5):** traduz o `code` do erro do Firebase para PT — `auth/invalid-credential` / `auth/wrong-password` / `auth/user-not-found` → "Email ou senha incorretos."; `auth/invalid-email` → "Informe um email válido."; `auth/weak-password` → "A senha precisa ter pelo menos 6 caracteres."; `auth/email-already-in-use` → "Este email já está cadastrado."; `auth/too-many-requests` → "Muitas tentativas..."; demais → `error.message` (ou fallback genérico).
- **`waitForAuthState()`:** retorna `Promise<User | null>` que resolve no **primeiro** evento de `onAuthStateChanged` (desinscreve antes de resolver). É a barra de proteção da Home: resolve `null` se não houver sessão → redirect para login.
- **Removidos na 2026-09-27 (P3-1e):** `getCurrentUser()` (não era usado) e `isAuthenticated()` (usava só a tela órfã `details.tsx`, também removida).

### 5.18 `services/vehicleService.ts` (atualizado 2026-09-27 — 77 linhas, antes 154)

"Fake API" de leitura. Padrão de todas as funções: tenta a API; se não houver API, usa o banco local resolvido. **O CRUD local inteiro foi removido (P3-1d).**

- **Imports:** de `data/vehicles` (`filterVehicles` agora incluído — P2-4).
- **`const API_BASE_URL = '';`** ← chave: vazia.
- **`let localVehicles = JSON.parse(JSON.stringify(vehicleSeed))`** — deep-clone do seed em memória (hoje é somente leitura; nenhum código o muta mais).
- **`request<T>(path, options?)`:** se `API_BASE_URL` vazio → `return null`; senão `fetch` com `Content-Type: application/json`, lança `Erro na API: {status}` se `!response.ok`, senão `response.json()`. Como a URL é vazia, **sempre retorna null hoje** — todo o caminho de API é inerte.
- **`getLocalVehicles()`:** `resolveVehicles(localVehicles)` (aplica herança).
- **`listVehicles(filters?)`:** tenta `GET /vehicles` (sempre null) → usa local; a filtragem agora **delega para `filterVehicles`** de `data/vehicles.ts` (P2-4 — o filtro inline case-sensitive `!==` foi apagado; comportamento único de filtro no app).
- **`listVehicleCategories()`:** `getVehicleCategories` sobre `listVehicles()`.
- **`listBrands(category?)`**, **`listModels(brand, category?)`**, **`listVersions(brand, model, category?)`:** idem, delegando para as funções puras.
- **`findVehicle(params)`:** tenta `POST /vehicles/search`; senão `findVariant(params, local)`. **Esta é a função real usada pela Home** quando um slot completa marca+modelo+versão.
- **Removidos na 2026-09-27 (P3-1d):** `getVehicleById(id)`, `createVehicle(input)`, `updateVehicle(id, input)`, `deleteVehicle(id)` — CRUD sobre `localVehicles` nunca chamado pela UI (sobra do recurso "adicionar carros" removido em `ff63a26`).

### 5.19 `app/_layout.tsx` (15 linhas)

```tsx
import '../styles/global.css';              // entra o CSS no bundle (obrigatório p/ NativeWind)
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar'; // NOVO na 2026-09-27 (P3-2)

export default function RootLayout() {
  return (
    <Stack
      initialRouteName="index"                // abre em / (Login)
      screenOptions={{
        headerShown: false,                   // todas as telas desenham cabeçalho próprio
        contentStyle: { backgroundColor: '#F5F8FC' },
      }}
    >
      <StatusBar style="dark" />              // app é claro → ícones do status escuros
    </Stack>
  );
}
```
Layout raiz da navegação. `Stack` sem `<Stack.Screen>` declarados → rotas inferidas dos arquivos de `app/`. Não há proteção de rota por `.Protected` aqui — a proteção é feita manualmente dentro de `home.tsx` (§5.23). (A tela `details.tsx` foi removida em 2026-09-27, P3-1a.)

### 5.20 `app/index.tsx` — Login (atualizado 2026-09-27: P2-5, P2-6, P3-4#5)

- **Imports:** RN (`Alert, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, useWindowDimensions, View`) + `useRouter` + `SafeAreaView` do `react-native-safe-area-context` (o `Button` nativo saiu).
- **`EMAIL_PATTERN = /^\S+@\S+\.\S+$/`** — validação mínima de e-mail.
- **Estado:** `email`, `password` + **`submitting`** (novo).
- **`handleLogin()`:** guarda `if (submitting) return`; valida campos não vazios (Alert "Preencha email e senha."); **valida o formato do e-mail** (Alert "Informe um email válido."); `setSubmitting(true)` → `await loginUser(...)`; sucesso → `router.replace('/home')`; erro → `Alert` com `translateAuthError(error)`; `finally setSubmitting(false)`.
- **JSX:** `KeyboardAvoidingView` → **`SafeAreaView edges={['top']}`** (novo, P2-6 — o `SafeAreaProvider` já vem do expo-router) → card centralizado (`w-full` celular / `w-3/5` tablet) → título "Login" → 2 `TextInput` (com `accessibilityLabel`) → **botão "Entrar" como `TouchableOpacity` azul Ford `#00095B`** (`disabled={submitting}`, texto "Entrando…" enquanto envia, `accessibilityRole="button"`) → links "Criar conta?" e "Esqueci minha senha" (com `accessibilityRole`/`accessibilityLabel`).

### 5.21 `app/register.tsx` — Cadastro (atualizado 2026-09-27, mesmos padrões do Login)

- Estado `name`, `email`, `password` + `submitting`.
- **`handleRegister()`:** guarda contra duplo clique; valida os 3 campos; valida o formato do e-mail; `registerUser(email, password, name)` (que também grava o `displayName`); sucesso → Alert "Usuário cadastrado com sucesso." + `router.back()`; erro → `Alert` com `translateAuthError(error)`. `finally setSubmitting(false)`.
- JSX: `SafeAreaView` (top) no lugar do `View` externo, 3 TextInputs com `accessibilityLabel`, botão "Cadastrar" como `TouchableOpacity` azul (desabilitado + "Cadastrando…" enquanto envia).

### 5.22 `app/forgot-password.tsx` — Recuperação de senha (atualizado 2026-09-27, mesmos padrões)

- Estado `email` + `submitting`.
- **`handleResetPassword()`:** guarda contra duplo clique; valida e-mail não vazio **e** formato; `resetUserPassword(email)` → `sendPasswordResetEmail`; sucesso → Alert "Email enviado..." + `router.back()`; erro → `Alert` com `translateAuthError(error)`.
- JSX: `SafeAreaView` (top), TextInput com `accessibilityLabel`, botão "Enviar" como `TouchableOpacity` azul (desabilitado + "Enviando…" enquanto envia).

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

**Handlers (atualizados 2026-09-27: P2-1, P2-2)**
- **`updateSlot(slotId, nextSlot)`:** **bloqueia veículo duplicado (P2-1):** se o `nextSlot` estiver completo (marca+modelo+versão) e igual (normalizado) ao slot já completo do outro lado → `Alert.alert('Veículo duplicado', ...)` e **ignora o onChange** (o slot fica com marca+modelo, sem versão). Senão, substitui o slot no estado (imutável).
- **`handleCategorySelect(category)`:** troca o tipo; **reinicia os 2 slots SÓ quando o tipo efetivamente muda** (`changed = category !== selectedCategory`, P2-2 — re-clicar no mesmo tipo ou em "Todos" não perde mais a seleção) e fecha o drawer.
- **`handleLogout()`:** `logoutUser()` → `router.replace('/')`.

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

**Atualizações de 2026-09-27 (home):** agora **impede** escolher o mesmo veículo nos dois slots (P2-1, via `updateSlot`); a tabela **mostra a lista com 1 veículo** (P0-1) — o placeholder só aparece com 0 veículos; headers com `useSafeAreaInsets()` no padding-top (P2-6); botões "Sair"/"Tipo" com `accessibilityRole`/`accessibilityLabel` (P3-4#5).

**O que a tela NÃO faz:** não mostra radar/legenda com 1 veículo (decisão de produto do P0-1: a saída obrigatória é a lista; o radar pede o 2º veículo com a mensagem "Selecione um segundo veículo para comparar").

### 5.24 `app/details.tsx` — tela ÓRFÃ — **REMOVIDA** (2026-09-27, P3-1a)

Era só um redirecionamento (`isAuthenticated()` → `/home`; senão → `/`) + spinner, sem nenhum link apontando para ela. Apagada; junto saiu a `isAuthenticated()` do authService (P3-1e).

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

### 5.26 `components/SearchSelect.tsx` (atualizado 2026-09-27: P3-4#5)

Dropdown com busca, em modal (usado 6× pela Home: 3 por slot).

- **Props:** `{ label, value, options, disabled?, compact?, onSelect }`.
- **Estado:** `visible`/`term`; `filteredOptions` via `useMemo` — substring case-insensitive no texto.
- **`open()`** (só se habilitado e com opções) e **`close()`** (fecha e limpa a busca).
- **JSX:**
  - Rótulo em caixa alta;
  - "Botão" (TouchableOpacity): mostra o valor selecionado (negrito escuro) ou "Selecionar" (cinza), com um "＋" à direita; estilos desabilitados em cinza; **`accessibilityRole="button"` + `accessibilityLabel="${label}: ${value ?? 'Selecionar'}"` + `accessibilityState={{ disabled }}` (novo)**;
  - Modal: overlay `bg-black/25`; painel branco (520px no tablet, 100% no celular) com título, "Fechar" (com `accessibilityRole`/`Label`), `TextInput` de busca (`placeholder="Buscar"`, com `accessibilityLabel`), `FlatList` das opções filtradas (item selecionado em azul Ford; cada item é `Pressable` com `accessibilityRole="button"` + `accessibilityState={{ selected }}`), "Nenhum item" vazio. Tocar num item → `onSelect(item)` + `close()`.

### 5.27 `components/Dropdown.tsx` — **REMOVIDO** (2026-09-27, P3-1b)

Era outro dropdown de tema escuro, nunca importado (resíduo de iteração anterior com fluxo em etapas). Apagado.

### 5.28 `components/AttributeSelector.tsx` (182 linhas)

O coração do requisito "lista livre de atributos".

- **L1-17:** imports + props `{ options: AttributeOption[], selectedKeys: string[], onChange }`.
- **L19-40:** `isTablet`; estado `visible` (modal) e `term` (busca); `selectedSet` (Set para O(1) em render); `filteredOptions` — filtra por `label` ou `category` (case-insensitive).
- **L42-57:** `toggleAttribute(key)` (remove ou adiciona a chave), `clearSelection()`, `close()`.
- **L59-181 (JSX):**
  - Card "Atributos": contador ("N selecionados" ou "Todos") + botão azul "Selecionar" (abre o modal; com `accessibilityRole`/`Label`); se há seleção, link "Mostrar todos" limpa (volta a exibir as 283 specs);
  - Modal: painel (620px no tablet, 100% no celular, máx. 82% da altura): cabeçalho com contador e "Fechar"; `TextInput` "Buscar equipamento ou atributo" (com `accessibilityLabel`); botões **"Selecionar todos"** (marca as 283) e **"Limpar"** (ambos com `accessibilityRole`/`Label`); `FlatList` com checkboxes desenhados (quadrado: preenchido azul = marcado; cada item é `Pressable` com **`accessibilityRole="checkbox"`** + `accessibilityLabel` (label + categoria) + `accessibilityState={{ selected }}` — novo na 2026-09-27), label em negrito + categoria em caixa alta. `keyboardShouldPersistTaps="handled"` deixa a lista rolar com o teclado aberto.

### 5.29 `components/ComparisonTable.tsx` (reescrito em 2026-09-27: P0-1, P2-1, P3-4#1/#2)

A saída obrigatória do desafio, em forma de tabela. **Funciona com 1 OU 2 veículos.**

- **Props:** `{ vehicles, rows }` + helper `vehicleName` (`"Modelo - Versão"`).
- **`isTablet`;** larguras: coluna "Item" 260 (tablet) / 210 (celular); coluna por veículo 250 / 190; `tableMinWidth` = soma (rolagem horizontal correta mesmo com 1 coluna).
- **Placeholder:** **só com `vehicles.length === 0`** (antes era `< 2`) — mensagem **"Selecione um veículo"** (P0-1). Com 1 veículo, a tabela renderiza normalmente com 1 coluna de valores.
- **Cabeçalho do card:** "Dados" + contador **"N atributos"** (P3-4#1: `rows.length - 3`, desconta as linhas fixas Ano/Categoria/Motor, com singular/plural).
- **`buildTableItems(rows)` (novo, P3-4#2):** pré-processa as linhas em itens de render — quando a categoria muda, insere **uma linha de cabeçalho de grupo** (fundo `#F5F8FC`, caixa alta) e as linhas de spec **não repetem mais a categoria** na coluna esquerda (só o label).
- **JSX:** `ScrollView horizontal` envolvendo a grade:
  - Linha de cabeçalho: "ITEM" + um cabeçalho por veículo (**chave de React = `col-${index}`** — posição, não identidade; P2-1) + `numberOfLines={2}`;
  - Itens: grupos → linha de categoria única; linhas → label à esquerda + célula por veículo com o valor já formatado (`N/A`, `Sim`/`Não`, número, `3.0 L`). Separações `border-b` sutis.

### 5.30 `components/RadarChart.tsx` (109 linhas)

Gráfico radar desenhado à mão em `react-native-svg` (sem lib de charts).

- **L1-18:** imports + tipo `RadarSeries` (`name, color, dotClassName, values`).
- **L20-26 — `point(center, radius, index, total)`:** converte (raio, índice do eixo) em coordenadas cartesianas; o `- Math.PI/2` gira para o 1º eixo apontar para cima.
- **L28-36 — `polygonPoints(values, center, maxRadius)`:** mapa cada métrica (0-100) para um ponto a `value/100 * maxRadius` do centro → string "x,y x,y ..." para o `<Polygon>`.
- **Componente:**
  - `metrics` dos valores da primeira série (todos os veículos usam os mesmos 6 eixos), `center = size/2`, `maxRadius = size*0.31`, níveis de grade `[0.25, 0.5, 0.75, 1]`;
  - **se < 2 séries ou sem métricas → placeholder (atualizado 2026-09-27, P3-4#3):** com 0 séries → **"Selecione um veículo"**; com 1 → **"Selecione um segundo veículo para comparar"** (o radar continua só em comparação de 2+ — decisão do P0-1);
  - `<Svg width height>` com: 4 **círculos concêntricos** de grade (`stroke #D8E3F2`); por eixo: linha do centro até a borda + `SvgText` do label a `maxRadius+30` (ex.: "Perf.", "Segurança"); por série: `<Polygon>` preenchido com `fillOpacity 0.12` e borda 2px na cor da série (**chave = `serie-${index}`** — posição, P2-1).

### 5.31 `components/VehicleLegend.tsx` (37 linhas)

- **Props:** `{ series: {name, dotClassName}[], className? }`.
- Se < 2 séries → `null` (legenda só existe em comparação).
- Título "VEÍCULOS" + um item por série: pontinho colorido (a `dotClassName` corresponde à cor do polígono) + "N. Modelo - Versão" (máx. 2 linhas). Chave de React = `legenda-${index}` (posição, P2-1 de 2026-09-27).

### 5.32 `components/VehicleTypeDrawer.tsx` (75 linhas)

Seletor de tipo no **celular** (modal lateral).

- **L1-16:** imports + props `{ visible, categories, selectedCategory, onClose, onSelect }`.
- **L18-23:** `isTablet`; `drawerWidth` = 35% (tablet) / 86% (celular) da largura; `options = [null, ...categories]` (`null` = "Todos").
- **JSX:** modal transparente; painel branco ancorado à esquerda com título "Tipo", "Fechar" (com `accessibilityRole`/`Label` — 2026-09-27), e `ScrollView` de botões — o ativo fica azul Ford preenchido com texto branco, os demais claros (cada botão com `accessibilityRole="button"` + `accessibilityLabel="Tipo de veículo: ${label}"` + `accessibilityState={{ selected }}`); tocar na área escura à direita (`Pressable flex-1`, com `accessibilityLabel="Fechar"`) fecha. `onSelect(category)` recebe `null` para "Todos".

### 5.33 `components/VehicleTypePanel.tsx` (91 linhas)

Seletor de tipo no **tablet** (painel fixo, recolhível).

- **Props:** `{ width, expanded, categories, selectedCategory, onToggle, onSelect }`; `options = [null, ...categories]`.
- **Estado recolhido:** faixa estreita (76px) azul-marinho com botão "Tipos" (expande; com `accessibilityRole`/`Label` — 2026-09-27) e o nome da categoria ativa (máx. 2 linhas, cor `#8FB3FF`).
- **Estado expandido:** painel `#00142E` com título "Tipos" + "Ocultar" (recolhe; com `accessibilityRole`/`Label`), e `ScrollView` de botões (ativo: branco com texto azul; inativos: `bg-white/5` com borda branca 10%; cada botão com `accessibilityRole="button"` + `accessibilityLabel` + `accessibilityState`).

### 5.34 `assets/`

- `icon.png` (ícone do app), `adaptive-icon.png` (foreground Android), `splash-icon.png` (splash), `favicon.png` (web). Referenciados por `app.json`. (`assets/react-icon.png`, citado no antigo `App.tsx.bkp` removido, nunca existiu no repositório.)

### 5.35 `.expo/devices.json`

Metadado local do Expo (`{"devices": []}`) — lista de dispositivos pareados; não é código.

---

## 6. Rastreio do caso de validação: "Ford Ranger Raptor" (atualizado 2026-09-27 — fluxo CORRIGIDO)

Passo a passo do que acontece se o avaliador seguir o `Pedido_Desafio.txt`:

1. Login (Firebase) → Home.
2. Slot A: Marca `FORD` → Modelo `Ranger Raptor` → Versão `3.0 V6 EcoBoost`. (Slot B: vazio.)
3. `useEffect [slots]` → `findVehicle({brand:'FORD', model:'Ranger Raptor', version:'3.0 V6 EcoBoost'})` → `findVariant` normaliza e acha o id `ford-ranger-raptor-3-0-v6-ecoboost-2026` → `resolveVehicle` herda as 263 specs do base `ford_nova_ranger_4x4_ltd_2026` (o **LTD** — id agora único e determinístico, P1-1) e aplica as 20 chaves declaradas → `vehicles` tem **1** veículo.
4. `comparisonRows = getComparisonRows([raptor])` → **286 linhas** (3 fixas + 283 specs; regra `=== 0` desde o P0-1).
5. `ComparisonTable` → **exibe a lista padronizada completa** com 1 coluna (Raptor): grupos por categoria com cabeçalho único, `N/A` nos vazios, `Não` nos booleans falsos, `3.0 L` na cilindrada. `RadarChart` → placeholder "Selecione um segundo veículo para comparar"; `VehicleLegend` → `null` (decisão de produto: radar só em 2+).
6. **Resultado: a lista obrigatória é exibida.** ✔️ (antes: `[]` + placeholder → validação falhava na UI).

Caso alternativo: marcar um subconjunto nos "Atributos" (ex.: Potência, Torque, Airbag, Câmera 360) → a tabela mostra 3 fixas + só as 4 marcadas, no mesmo formato. Comparação de 2 veículos continua igual (2 colunas).

Valores que o Raptor resolve (confirmado simulando `resolveVehicle` e travados no `scripts/validate.mjs`): potência 397, torque 583, peso 2475, cilindrada 3 → exibida **"3.0 L"**, economia 8.3, biturbo Sim, diesel Não, AWD Sim, Trail Control Sim, suspensão Fox Live Valve Sim, Terrain Management Sim, 7 airbags, multimídia 12", câmera 360 Sim, ACC Sim, BLIS Sim, INMETRO "E", pneus ATR 60/40 Sim, rodas 17. Dos 283 campos: 124 com valor, 151 `false` ("Não"), 8 `null` ("N/A"). **Única pendência: conferir esses números contra o slide oficial** (o slide não está no repositório — pendência 1 do §0; o `npm run validate` garante que a demo não mude sem aviso).

---

## 7. Resumo do estado do projeto (atualizado 2026-09-27)

| Categoria | Estado |
|---|---|
| **Bloqueio da validação** | ✅ Resolvido (P0-1): a lista sai com 1 veículo; radar continua 2+ (decisão de produto) |
| **Dados do Raptor** | ⚠️ 20 valores declarados travados no `validate.mjs`; **conferência final contra o slide oficial pendente** (slide fora do repositório) |
| **Integridade de dados** | ✅ IDs únicos (LTD+ renomeado); ✅ números tipados (61 conversões); ✅ `cilindrada` 3.0 L com unidade; herança do Raptor agora determinística (LTD). Pendência: confirmar com o time a base dos 3 Titanium (P1-1 passo 2) |
| **Código morto** | ✅ Tudo removido (P3-1): `details.tsx`, `Dropdown.tsx`, `App.tsx.bkp`, CRUD do service, `getSpecKey`, `getCurrentUser`, `isAuthenticated`, `colors`/`fontFamily`, `nativewind-env.d.ts` duplicado; `expo-status-bar` agora é usada (P3-2) |
| **Inconsistências menores** | ✅ `tailwind.config.js` corrigido; ✅ filtro único via `filterVehicles`; ✅ keys de React por posição + bloqueio de veículo duplicado; ✅ slots só zeram quando o tipo muda |
| **Testes** | ✅ `npm run validate` (ids, specs × schema, heranças, Raptor); `tsc --noEmit` limpo |

O plano original com prioridade e racional de cada item: **Update.md**. O que foi feito e o que ficou pendente: **§0 (Log de alterações)**.
