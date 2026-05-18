import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { BRANDS, getModels, getVersions, findVariant } from '../data/vehicles';
import { Dropdown } from '../components/Dropdown';

export default function SearchScreen() {
  const router = useRouter();

  const [brand, setBrand] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const models = brand ? getModels(brand) : [];
  const versions = brand && model ? getVersions(brand, model) : [];

  const handleBrandSelect = (value: string) => {
    setBrand(value);
    setModel(null);
    setVersion(null);
    setError(null);
  };

  const handleModelSelect = (value: string) => {
    setModel(value);
    setVersion(null);
    setError(null);
  };

  const handleSearch = () => {
    if (!brand || !model || !version) {
      setError('Please select brand, model and version.');
      return;
    }
    const variant = findVariant(brand, model, version);
    if (variant) {
      router.push({
        pathname: '/details',
        params: { brand, model, version },
      });
    } else {
      setError('Vehicle not found in database.');
    }
  };

  return (
    <ScrollView className="flex-1 bg-[#133a7c]">
      <View className="items-center p-6 pt-12">
        <Text className="text-[#e0e0e0] text-2xl font-bold mb-9 tracking-wider">
          Vehicle Search
        </Text>

        <Dropdown
          label="BRAND"
          value={brand}
          options={BRANDS}
          onSelect={handleBrandSelect}
        />
        <Dropdown
          label="MODEL"
          value={model}
          options={models}
          onSelect={handleModelSelect}
          disabled={!brand}
        />
        <Dropdown
          label="VERSION"
          value={version}
          options={versions}
          onSelect={setVersion}
          disabled={!model}
        />

        {error && <Text className="text-[#e94560] mb-3 text-sm">{error}</Text>}

        <TouchableOpacity
          className="mt-3 bg-[#e94560] rounded-lg py-4 px-12"
          onPress={handleSearch}
        >
          <Text className="text-white font-bold text-base tracking-widest">
            SEARCH
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}