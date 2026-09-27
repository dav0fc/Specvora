# Update.md — o que eu mudaria no Specvora (plano, sem nenhuma alteração aplicada)

> Este documento descreve **exatamente o que deve ser mudado, onde e por quê**.
> **Nenhuma mudança foi feita no app.** Os números de linha referem-se ao estado atual de `main` (`b90e41c`).
> O contexto completo do código está em **APP.md** — leia-o antes de executar este plano.

Prioridades:
- **P0** — bloqueia a validação do `Pedido_Desafio.txt` (o app "não funciona" na avaliação);
- **P1** — integridade dos dados (risco de resposta errada na validação);
- **P2** — robustez/UX;
- **P3** — limpeza técnica (não muda comportamento).

---

## P0-1 · Mostrar a lista de especificações com **1 veículo** (o bloqueio da validação)

**Onde:** `data/vehicles.ts:346-348` (`getComparisonRows`), `components/ComparisonTable.tsx:23-33`, `components/RadarChart.tsx:45-50`, `app/home.tsx` (uso das duas).

**Situação atual:**
```ts
// data/vehicles.ts:348
if (selectedVehicles.length < 2) return [];
```
e `ComparisonTable`/`RadarChart` exibem "Selecione dois veículos" quando `vehicles.length < 2`.
O desafio pede "Uma lista de especificações técnicas" como saída obrigatória, e o caso de validação é **um** veículo (Ranger Raptor). Hoje, selecionando só o Raptor, o usuário **não vê nenhuma spec** → validação falha.

**Mudança exata:**
1. `getComparisonRows`: aceitar 1 veículo — trocar a guarda por `if (selectedVehicles.length === 0) return [];`.
2. `ComparisonTable`: remover a branch de placeholder para `< 2` (manter só o caso 0, ex.: "Selecione um veículo"). A grade já funciona com 1 coluna por veículo — `tableMinWidth` e os `map`s já tratam `vehicles.length` de forma genérica; só a chave de cabeçalho precisa mudar (ver P2-1).
3. `RadarChart` + `VehicleLegend`: decisão de produto — ou (a) deixar o radar só em comparação de 2+ (mantendo o placeholder, que aí fica correto) ou (b) suportar 1 série. Recomendo (a): a saída obrigatória do desafio é a **lista**, não o gráfico.
4. `app/home.tsx`: nada a mudar (só consome).

**Resultado:** com o Raptor sozinho, a tabela "Dados" lista Ano/Categoria/Motor + as 283 specs (ou as marcadas), com `N/A` nos vazios — exatamente o formato padronizado pedido. A comparação 2 veículos continua funcionando igual.

---

## P0-2 · Conferir e corrigir os dados do Ranger Raptor contra o slide oficial

**Onde:** `data/vehicles.json:888-921` (registro do Raptor) e o veículo-base que ele herda (P1-1).

**Situação atual:** os 19 valores do Raptor são mockados (potência 397, torque 583, peso 2475, economia 8.3, INMETRO "E", 7 airbags, multimídia 12", etc.) e o restante **herda do "Nova Ranger 4x4 LTD" — um veículo fictício** (ex.: rodas 17", pneus ATR 50/50, rádio sem USB, sem GPS, sem HUD, sem câmera 180…). Um Raptor real não tem rodas 17 nem "rádio mechless". Como o critério de aceite é *"entregar corretamente todas as especificações apresentadas no slide"*, qualquer herança incorreta vira resposta errada na avaliação.

**Mudança exata:**
1. Localizar o slide da Ranger Raptor (não está no repositório) e montar uma planilha: cada spec do slide → `key` do schema → valor correto.
2. Escrever **no registro do Raptor** (em `specs{}`) **todos** os campos que o slide mostra — sobrescrevendo a herança. Regra: nada que o slide mostra pode depender do base.
3. Campos que o slide NÃO mostra: deixar como estão (virarão `Não`/`N/A` na lista — comportamento correto).
4. Cuidar com o formato de cada valor conforme o slide (ex.: se o slide diz "2995 cc", o campo `cilindrada` deve ser `2995` (ou `3.0`, se o slide for assim) — ver P1-2).
5. Adicionar um pequeno teste/script de validação (ex.: `scripts/validate-raptor.mjs`) que resolve o Raptor e compara contra os valores do slide, para rodar antes de qualquer demo.

**Por quê:** é o único requisito de "validação da solução" do enunciado; hoje a resposta do app para o Raptor é plausível mas não verificada.

---

## P1-1 · IDs duplicados: `ford_nova_ranger_4x4_ltd_2026` (LTD e LTD+)

**Onde:** `data/vehicles.json:300` (LTD) e `data/vehicles.json:594` (LTD+) — **mesmo id**; `data/vehicles.ts:94-101` (`makeVehicleId`); `data/vehicles.ts:132` (`source.find` por id na herança); `services/vehicleService.ts:92-98` (`getVehicleById`).

**Situação atual:** LTD e LTD+ colidem no id. Consequências concretas:
- Os 4 veículos que usam esse id como `baseVehicleId` (Raptor 889, Territory Titanium 955, Focus Titanium 1027, Fusion Titanium AWD 1098) herdam sempre do **primeiro** achado no array (o LTD). Se alguém reordenar o array ou trocar o conteúdo do LTD+, a herança muda silenciosamente.
- `getVehicleById('ford_nova_ranger_4x4_ltd_2026')` não consegue distinguir LTD de LTD+.
- A UI ainda funciona porque a busca de versão é por (marca, modelo, versão), não por id — o bug está latente nos dados.

**Mudança exata:**
1. Renomear o id do LTD+ (linha 594) para `ford_nova_ranger_4x4_ltd_plus_2026` (ou `..._ltd+_2026` → normalizar para `ltd-plus`).
2. Decidir a que veículo cada `baseVehicleId` deve apontar (hoje, todos os 4 herdam do LTD — confirmar se é intenção; ex.: Territory/Focus/Fusion Titanium provavelmente deveriam herdar do LTD+, que é a versão superior — **confirmar com o time**).
3. Tornar `makeVehicleId` à prova de colisão: incluir o ano (`${brand}-${model}-${version}-${year}`) e/ou um sufixo automático quando já existir id igual no banco (ex.: `-2`). Como a função é só usada no CRUD, o impacto é zero.
4. Adicionar validação no load (dev): `console.warn` (ou erro em `__DEV__`) se dois veículos compartilharem `id`.

---

## P1-2 · Valores numéricos guardados como string (e `cilindrada: "3"`)

**Onde:** `data/vehicles.json` (veículos-base, ex.: `"potencia": "250"`, `"cilindrada": "3"`, `"quantidade_de_marchas": "10"`); `data/specSchema.json` (declara `type: "number"`); `data/vehicles.ts:271-283` (`specNumber` mascara o problema).

**Situação atual:** o schema diz `number`, mas os JSONs misturam string e number. O código sobrevive porque `specNumber` faz `Number(value.replace(',', '.'))` e `displaySpecValue` faz `String(value)`. Consequências:
- `cilindrada: "3"` exibe como **"3"** na tabela — se o slide diz "3.0 L" ou "2995 cc", está errado/ambíguo.
- Comparação ordenada (se um dia sortearmos por potência) quebra.
- Quem preencher o banco no futuro não sabe se digitar `250` ou `"250"`.

**Mudança exata:**
1. Padronizar **number para `type: "number"`** em todos os veículos (passar os JSONs por um script: `JSON.stringify` + conversão das chaves com type number).
2. Corrigir semântica de `cilindrada`: escolher UMA convenção (recomendo litros com 1 decimal, ex.: `3.0`) e registrar isso no `description` do schema; ajustar o valor do Raptor conforme o slide (P0-2).
3. Opcional (defesa): em `displaySpecValue`, para specs com `type: "number"`, formatá-lo com unidade/sufixo se o schema ganhar um campo `unit` (ex.: `"unidade": "L"` → exibe `3.0 L`). Isso melhora a clareza exigida pelo enunciado ("campos claros").

---

## P1-3 · O Ranger Raptor herda de um Ranger **fictício**

**Onde:** `data/vehicles.json:889` (`"baseVehicleId": "ford_nova_ranger_4x4_ltd_2026"`).

**Situação atual:** "Nova Ranger 4x4" é um veículo inventado (não existe no mercado). O Raptor herda dele specs de rodas/pneus/rádio/etc. que provavelmente não correspondem ao Raptor real — mesmo que o slide não mostre esses campos, eles aparecem na lista completa (quando "Selecionar todos" está ativo) e podem contradizer o slide ("roda 17" para um Raptor é visivelmente errado).

**Mudança exata (duas opções):**
- **Opção A (recomendada, junto com P0-2):** o registro do Raptor passa a ser **autocontido** — preencher no próprio `specs{}` do Raptor todos os campos que o slide mostra e decidir os demais conscientemente; remover ou manter o `baseVehicleId` (se mantiver, o base só pode suprir campos que **não** aparecem no slide e que sejam verdadeiros).
- **Opção B:** criar um veículo-base "Ranger (base)" com dados reais e apontar o Raptor para ele.

**Por quê:** o enunciado diz que a solução "está operando corretamente" se os dados do Raptor forem "claros, organizados e consistentes" — consistência com a realidade do veículo é parte disso.

---

## P2-1 · Chave de React duplicada se o mesmo veículo for escolhido nos dois slots

**Onde:** `components/ComparisonTable.tsx:56` (`key={\`${vehicle.brand}-${vehicle.model}-${vehicle.version}\`}`) e `components/RadarChart.tsx` (`<Polygon key={item.name}>`, L98); `components/VehicleLegend.tsx` (`key={item.name}`, L25).

**Situação atual:** nada impede o usuário de escolher FORD / Ranger Raptor / 3.0 em **ambos** os slots. Aí `vehicles` tem 2 entradas idênticas → chaves de React iguais (aviso de console, risco de bug de render) e 2 polígonos idênticos sobrepostos no radar.

**Mudança exata (escolher 1 das 2):**
1. **Bloquear na seleção** (recomendado): em `app/home.tsx:145-148` (`updateSlot`), se o slot de destino completar (marca+modelo+versão) igual ao outro slot já completo, ignorar o `onChange` (ou mostrar um `Alert` "Veículo já selecionado no outro slot").
2. Ou: usar a **posição do slot** como chave (`key={index}` / `key={\`col-${index}\`}`) — resolve o sintoma, mas a comparação "Raptor vs Raptor" continua sem sentido.

Recomendo 1 + 2 juntas.

---

## P2-2 · Trocar o tipo de veículo zera os slots (mesmo ao re-selecionar o mesmo tipo)

**Onde:** `app/home.tsx:150-154` (`handleCategorySelect`).

**Situação atual:** `onSelect` sempre reinicia os 2 slots, inclusive quando o usuário abre o drawer e clica no tipo **já selecionado** (ou "Todos") — perde o trabalho sem motivo.

**Mudança exata:**
```ts
function handleCategorySelect(category: string | null) {
  const changed = category !== selectedCategory;
  setSelectedCategory(category);
  if (changed) setSlots([createSlot(0), createSlot(1)]);
  setDrawerVisible(false);
}
```

---

## P2-3 · `maxSpec()` recalcula o máximo de todo o dataset a cada métrica

**Onde:** `data/vehicles.ts:285-287` (chamada 6× por veículo em `getRadarMetrics`, L305-344).

**Situação atual:** `Math.max(...vehicles.map(...))` percorre os 10 veículos do seed para cada label de spec, para cada veículo selecionado. Com 10 veículos é irrelevante; com um dataset real (centenas de veículos) o radar fica O(N²×specs).

**Mudança exata:** precomputar os máximos **uma vez** em nível de módulo (memo por label) e reusar:
```ts
const maxCache = new Map<string, number>();
function maxSpec(label: string) {
  if (!maxCache.has(label)) maxCache.set(label, Math.max(...vehicles.map(v => specNumber(v, label)), 1));
  return maxCache.get(label)!;
}
```
(Se um dia o CRUD local mutar o banco, invalidar o cache junto.)

---

## P2-4 · Inconsistência de normalização no filtro do service

**Onde:** `services/vehicleService.ts:43-55` (`listVehicles` usa `vehicle.brand !== filters.brand` — case-sensitive) vs. `data/vehicles.ts:167-183` (`filterVehicles` usa `normalize`).

**Situação atual:** caminho hoje não chamado com filtros pela UI, mas são dois comportamentos de filtro diferentes para o mesmo problema — bomba-relógio.

**Mudança exata:** em `listVehicles`, delegar a filtragem para `filterVehicles` de `data/vehicles.ts` (exportá-lo) e apagar o filtro inline. Uma linha a menos, um comportamento só.

---

## P2-5 · Login sem estado de "enviando" e sem normalização de e-mail

**Onde:** `app/index.tsx:28-42` (`handleLogin`); idem `register.tsx`, `forgot-password.tsx`.

**Situação atual:** o botão "Entrar" pode ser tocado várias vezes durante a chamada (múltiplos `signInWithEmailAndPassword`); e-mail não tem validação de formato (o Firebase vai errar com mensagem crua).

**Mudança exata (pequena, por tela):**
1. `const [submitting, setSubmitting] = useState(false)`; `disabled={submitting}` no botão (ou trocar o `Button` por um `TouchableOpacity` com o estilo do app — o `Button` nativo não aceita `disabled` com o visual atual de forma elegante).
2. Validação mínima de e-mail (regex ou `String.prototype.includes('@')`) antes de chamar o service.
3. (Opcional) Traduzir os códigos de erro do Firebase (`auth/invalid-credential`, `auth/user-not-found`, `auth/wrong-password`) para mensagens PT amigáveis num helper em `services/authService.ts`.

---

## P2-6 · `KeyboardAvoidingView` e safe area

**Onde:** `app/index.tsx`, `register.tsx`, `forgot-password.tsx` (e header da `home.tsx`).

**Situação atual:** `KeyboardAvoidingView` sem `enabled` por plataforma (no Android o comportamento é ignorado, ok), e nenhum uso de `SafeAreaView`/`safe-area-context` — em aparelhos com "orelha"/barra de navegação gestual, o header da Home e os cards de login podem sobrepor a área de segurança.

**Mudança exata:**
1. Trocar o `View` externo das telas de auth por `SafeAreaView` (o `react-native-safe-area-context` já está instalado).
2. Na Home, envolver o header em `SafeAreaView` (ou usar `useSafeAreaInsets` no padding-top) para iOS com notch e Android edge-to-edge (`edgeToEdgeEnabled: true` no `app.json`).

---

## P3-1 · Remover código morto

Nenhum item abaixo afeta o que o usuário vê.

| # | O quê | Onde | Ação |
|---|---|---|---|
| a | Tela órfã que só redireciona | `app/delete details.tsx` | Apagar o arquivo (não há link para `/details` em lugar nenhum) |
| b | Dropdown de tema escuro, nunca importado | `components/Dropdown.tsx` | Apagar |
| c | Backup do boilerplate (referencia `assets/react-icon.png` inexistente) | `App.tsx.bkp` | Apagar |
| d | CRUD local nunca chamado pela UI (sobra do "adicionar carros" removido em `ff63a26`) | `services/vehicleService.ts:92-154` (`getVehicleById`, `createVehicle`, `updateVehicle`, `deleteVehicle`) | Apagar as 4 funções; se a "fake API" continuar, ficar `request`, `localVehicles`, `listVehicles`, `listVehicleCategories`, `listBrands/Models/Versions`, `findVehicle` |
| e | Funções exportadas sem uso | `data/vehicles.ts:103-105` (`getSpecKey`), `services/authService.ts:47-49` (`getCurrentUser`), `services/authService.ts:51-53` (`isAuthenticated` — usada só pela tela órfã) | Apagar |
| f | Duplo `nativewind-env.d.ts` | raiz + `types/nativewind-env.d.ts` | Manter só um (recomendo `types/`) |
| g | Dependência instalada e nunca importada | `expo-status-bar` | Remover de `package.json` (ou usá-la no `_layout` — ver P3-2) |
| h | Tokens de tema declarados e nunca usados | `styles/colors.ts`, `styles/fontFamily.ts` (e o `extend` do `tailwind.config.js`) | Duas opções: (i) apagar os arquivos e o `extend`; (ii) **reformular os componentes para usar os tokens** (`bg-aero`, `border-line`, `text-twilight`, `text-muted`, `bg-fordblue`) — recomendo (ii) no longo prazo, pois centraliza a paleta Ford; (i) agora para despoluir |
| i | `content` do Tailwind aponta para `./App.tsx` que não existe | `tailwind.config.js:6` | Corrigir para `["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./index.ts"]` |
| j | `fontFamily` referencia Roboto sem `expo-font` | `styles/fontFamily.ts` | Apagar junto com (h), ou implementar o carregamento de fonte de verdade (`expo-font` + `useFonts`) se quiser tipografia custom |

---

## P3-2 · `expo-status-bar` não usada

**Onde:** `app/_layout.tsx`.

**Mudança exata (recomendada):**
```tsx
import { StatusBar } from 'expo-status-bar';
// dentro do <Stack>:  <StatusBar style="dark" />
```
Como o app é claro (`userInterfaceStyle: "light"`), o ícone/status deve ser escuro. Uma linha, e a dependência instalada passa a ser usada.

---

## P3-3 · Firebase: chave no código e app web reaproveitado

**Onde:** `firebase/config.ts:8-15`.

**Mudança exata (baixa prioridade, para o pós-projeto):**
1. Para o projeto de curso, deixar como está (chave de cliente, pública por natureza) — mas **não** versionar segredos reais no futuro.
2. No Firebase Console, criar um app **React Native** dedicado (appId `rn:` em vez de `web:`) e usar suas credenciais; o atual funciona, mas é o app web do projeto `specvoraauth`.
3. Documentar no README que a senha de recuperação depende de e-mail configurado no console Firebase.

---

## P3-4 · Pequenos polimentos de produto (opcionais, mas baratos)

1. **Contador na tabela**: "Dados — N itens" (`ComparisonTable.tsx:43`) é confuso; trocar por "N atributos" (as 3 linhas fixas não são atributos).
2. **Agrupamento visual**: na tabela, quando um grupo de categoria começa, a etiqueta de categoria aparece em cada linha (`ComparisonRow.category` repetido). Alternativa: uma linha de cabeçalho de grupo única + linhas sem categoria. Visual apenas.
3. **Radar com 1 veículo**: se a P0-1 for aprovada, deixar o placeholder do radar como "Selecione um segundo veículo para comparar" (mensagem mais útil que "Selecione dois veículos").
4. **`getComparisonRows` — linhas fixas**: `Ano`/`Categoria`/`Motor` usam `?? 'N/A'` — consistente, ok; só garantir que o `description` do JSON documente que esses 3 campos são fora do schema.
5. **Acessibilidade**: os "botões" que são `Text` dentro de `TouchableOpacity` ("Criar conta?", "Fechar", "＋") sem `accessibilityRole="button"` e `accessibilityLabel`; o `TextInput` sem `label`/`accessibilityLabel`. Adicionar papéis de acessibilidade nos touchables.
6. **Testes**: nenhum no projeto. Mínimo barato: um script Node (sem Jest) que (i) valida ids únicos no `vehicles.json`, (ii) valida que toda chave de `specs` existe no schema e vice-versa, e (iii) roda a validação do Raptor do P0-2. Rodar via `npm run validate`.

---

## Ordem de execução sugerida

| Passo | Itens | Esforço | Risco |
|---|---|---|---|
| 1 | **P0-1** (lista com 1 veículo) | ~15 min | Baixo — só afeta o `< 2` guard |
| 2 | **P0-2 + P1-3** (dados reais do Raptor, registro autocontido) | depende do slide | Médio — exige o slide oficial |
| 3 | **P1-1 + P1-2** (ids únicos + números tipados) | ~30 min + script | Baixo |
| 4 | **P2-1, P2-2, P2-5** (UX) | ~1 h | Baixo |
| 5 | **P3-1, P3-2** (limpeza) | ~30 min | Zero (remover o que não é usado) |
| 6 | P2-3, P2-4, P2-6, P3-3, P3-4 | variável | Baixo |

**Definição de "pronto para a validação":** passos 1-3 feitos, `npm run validate` passando, e alguém conseguindo: logar → escolher só o Ranger Raptor → ver a lista padronizada completa com os valores do slide → marcar/destacar qualquer subconjunto de atributos e ver a lista filtrada no mesmo formato.
