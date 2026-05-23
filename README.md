# SPECVORA — Sprint Mobile Development and IoT
## Integrantes do grupo

- **Denise Senise** — RM 556006
- **Larissa Rodrigues Lapa** — RM 554517
- **Mateus Leme** — RM 557803
- **David Gabriel Gomes Fernandes** — RM 556020
- **Vinicius Augusto Neves Prestes** — RM 559097

## Desafio escolhido
**Desafio 1 — Inteligência competitiva automotiva**

## Descrição da solução
O **Specvora** é uma aplicação mobile desenvolvida em **React Native com Expo** para apoiar a análise competitiva de veículos.
A solução permite que o usuário selecione veículos por **marca**, **modelo** e **versão**, defina livremente quais **atributos técnicos** deseja consultar e receba uma lista padronizada de especificações técnicas comparáveis.

## Objetivo
Transformar uma base de dados técnica em uma ferramenta clara para consulta, comparação e validação de especificações automotivas, facilitando o trabalho de analistas internos da Ford.

## Entradas do usuário
- Marca
- Modelo
- Versão
- Tipo de veículo
- Lista livre de atributos técnicos/equipamentos desejados
  
## Saída da aplicação
- Lista padronizada de especificações técnicas
- Campos claros, organizados e comparáveis
- Exibição explícita de informações indisponíveis como `N/A`
- Comparação entre dois veículos
- Gráfico radar como visualização complementar

## Tecnologias utilizadas
- React Native
- Expo
- Expo Router
- TypeScript
- NativeWind
- Firebase Authentication
- React Native SVG
- Dataset simulado em JSON

## Funcionalidades principais
- Login com Firebase Authentication
- Cadastro de usuário
- Recuperação de senha
- Proteção da tela principal por autenticação
- Filtro por tipo de veículo
- Seleção livre de atributos técnicos
- Comparação de especificações técnicas em tabela padronizada
- Interface responsiva para celular e tablet

### Pré-requisitos
- Node.js LTS instalado
- Expo CLI (opcional) ou npx
- iOS Simulator/Xcode ou Android Studio/Emulador, ou o aplicativo Expo Go no celular

### Como iniciar
1. Instale as dependências:
```bash
npm install
```
2. Inicie o projeto:
```bash
npm run start
```
3. Escolha a plataforma:
```bash
# no terminal do Expo
i  # iOS
a  # Android
w  # Web (quando aplicável)
```

### Scripts úteis
- `npm run start`: inicia o Metro/Expo
- `npm run android`: abre no emulador Android
- `npm run ios`: abre no simulador iOS
- `npm run web`: abre no navegador (quando aplicável)
