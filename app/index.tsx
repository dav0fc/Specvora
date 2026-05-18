// app/index.tsx
import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { BRANDS, getModels, getVersions } from '../data/vehicles';
import { Dropdown } from '../components/Dropdown';

export default function SearchScreen() {
  const router = useRouter();

  // Veículo principal
  const [brand, setBrand] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const models = brand ? getModels(brand) : [];
  const versions = brand && model ? getVersions(brand, model) : [];

  // Veículo para comparação
  const [compareBrand, setCompareBrand] = useState<string | null>(null);
  const [compareModel, setCompareModel] = useState<string | null>(null);
  const [compareVersion, setCompareVersion] = useState<string | null>(null);
  const compareModelsList = compareBrand ? getModels(compareBrand) : [];
  const compareVersionsList = compareBrand && compareModel ? getVersions(compareBrand, compareModel) : [];

  const [error, setError] = useState<string | null>(null);

  const handleSearch = () => {
    if (!brand || !model || !version) {
      setError('Please select brand, model and version.');
      return;
    }

    // Navega para a tela de detalhes, passando os parâmetros
    router.push({
      pathname: '/details',
      params: {
        brand,
        model,
        version,
        compareBrand: compareBrand || '',
        compareModel: compareModel || '',
        compareVersion: compareVersion || '',
      },
    });
  };

  return (
    <ScrollView className="flex-1 bg-[#133a7c]">
      <View className="p-6 pt-12">
        <Text className="text-[#e0e0e0] text-2xl font-bold mb-8 tracking-wider text-center">
          Specvora
        </Text>

        {/* VEÍCULO PRINCIPAL */}
        <Text className="text-[#e94560] text-xs font-semibold mb-2">VEHICLE</Text>
        <Dropdown label="Brand" value={brand} options={BRANDS} onSelect={setBrand} />
        <Dropdown label="Model" value={model} options={models} onSelect={setModel} disabled={!brand} />
        <Dropdown label="Version" value={version} options={versions} onSelect={setVersion} disabled={!model} />

        {/* COMPARAÇÃO (OPCIONAL) */}
        <Text className="text-[#e94560] text-xs font-semibold mt-6 mb-2">COMPARE WITH (optional)</Text>
        <Dropdown label="Brand" value={compareBrand} options={BRANDS} onSelect={setCompareBrand} />
        <Dropdown label="Model" value={compareModel} options={compareModelsList} onSelect={setCompareModel} disabled={!compareBrand} />
        <Dropdown label="Version" value={compareVersion} options={compareVersionsList} onSelect={setCompareVersion} disabled={!compareModel} />

        {error && <Text className="text-[#e94560] text-sm mt-3">{error}</Text>}

        <TouchableOpacity
          className="mt-8 bg-[#e94560] rounded-lg py-4 px-12 items-center"
          onPress={handleSearch}
        >
          <Text className="text-white font-bold text-base tracking-widest">SEARCH</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}