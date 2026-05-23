import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { ComparisonSlot } from '../data/vehicles';
import { listBrands, listModels, listVersions } from '../services/vehicleService';
import { SearchSelect } from './SearchSelect';

type VehicleSelectorProps = {
  slot: ComparisonSlot;
  category: string | null;
  compact?: boolean;
  onChange: (slot: ComparisonSlot) => void;
};

export function VehicleSelector({
  slot,
  category,
  compact = false,
  onChange,
}: VehicleSelectorProps) {
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [versions, setVersions] = useState<string[]>([]);

  useEffect(() => {
    async function loadBrands() {
      setBrands(await listBrands(category));
    }

    loadBrands();
  }, [category]);

  useEffect(() => {
    async function loadModels() {
      if (!slot.brand) {
        setModels([]);
        return;
      }

      setModels(await listModels(slot.brand, category));
    }

    loadModels();
  }, [slot.brand, category]);

  useEffect(() => {
    async function loadVersions() {
      if (!slot.brand || !slot.model) {
        setVersions([]);
        return;
      }

      setVersions(await listVersions(slot.brand, slot.model, category));
    }

    loadVersions();
  }, [slot.brand, slot.model, category]);

  return (
    <View
      className={`rounded-3xl border border-[#D8E3F2] bg-[#F8FAFD] ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <View className={`${compact ? 'mb-2' : 'mb-4'} flex-row items-center justify-between`}>
        <Text className={`${compact ? 'text-base' : 'text-lg'} font-bold text-[#00142E]`}>
          {slot.label}
        </Text>
      </View>

      <SearchSelect
        compact={compact}
        label="Marca"
        value={slot.brand}
        options={brands}
        onSelect={(brand) => onChange({ ...slot, brand, model: null, version: null })}
      />

      <SearchSelect
        compact={compact}
        label="Modelo"
        value={slot.model}
        options={models}
        disabled={!slot.brand}
        onSelect={(model) => onChange({ ...slot, model, version: null })}
      />

      <SearchSelect
        compact={compact}
        label="Versão"
        value={slot.version}
        options={versions}
        disabled={!slot.model}
        onSelect={(version) => onChange({ ...slot, version })}
      />
    </View>
  );
}
