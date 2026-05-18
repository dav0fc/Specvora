import "./styles/global.css"
import { Text, View, TextInput, TouchableOpacity, Image } from "react-native";
 
export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-teal-900 px-4">
      <Image
        source={require("./assets/react-icon.png")}
        className="w-40 h-40 rounded-full border-4 border-white opacity-70 mb-10"
      />

      <Text className="text-2xl font-bold text-white mb-6 text-center">
        Bem-vindo ao seu projeto React Native + NativeWind
      </Text>

      <TextInput
        className="w-full border border-green-200 rounded-lg px-4 py-8 mb-4 bg-white text-red-800"
        placeholder="Digite algo..."
      />

      <TouchableOpacity className="bg-white rounded-lg px-6 py-3">
        <Text className="text-teal-600 text-base font-semibold">Enviar</Text>
      </TouchableOpacity>
    </View>
  );
}