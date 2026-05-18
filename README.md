### Template React Native com Expo + NativeWind

Este repositório é um template para iniciar rapidamente um app React Native utilizando Expo, TypeScript e NativeWind (Tailwind CSS para React Native). Ele já vem configurado com as dependências e arquivos necessários para começar a estilizar com classes utilitárias.

### Tecnologias
- **Expo**: fluxo de desenvolvimento simplificado para React Native
- **React Native**: desenvolvimento mobile nativo com React
- **TypeScript**: tipagem estática para maior segurança
- **NativeWind**: estilização usando utilitários à la Tailwind

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

### Estrutura principal
```
assets/               # imagens e fontes
styles/               # estilos globais e presets do NativeWind
types/                # tipos e declarações auxiliares
App.tsx               # entrada principal do app
babel.config.js       # plugin do nativewind e presets do Expo
metro.config.js       # config do Metro (resolução e assets)
tailwind.config.js    # configuração do NativeWind/Tailwind
nativewind-env.d.ts   # tipos do NativeWind
tsconfig.json         # configuração TypeScript
```

### Configuração do NativeWind
O template já inclui as configurações essenciais para o NativeWind funcionar corretamente.

- `tailwind.config.js`: define o preset e paths a serem analisados
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './styles/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

- `babel.config.js`: adiciona o plugin do NativeWind
```js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['nativewind/babel'],
  };
};
```

- `nativewind-env.d.ts`: fornece dicas de tipo
```ts
/// <reference types="nativewind/types" />
```

Exemplo de uso no `App.tsx`:
```tsx
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-semibold text-blue-600">
        Template Expo + NativeWind
      </Text>
    </View>
  );
}
```

### Dicas e resolução de problemas
- Se classes não aplicarem estilo, confirme os caminhos em `content` do `tailwind.config.js`.
- Garanta que o plugin `nativewind/babel` esteja no `babel.config.js`.
- Após alterar `tailwind.config.js`, reinicie o bundler do Expo.
- Em iOS/Android, limpe cache quando necessário:
```bash
expo start -c
```

### Licença
Este projeto é disponibilizado como template educacional. Adapte conforme a sua necessidade.
