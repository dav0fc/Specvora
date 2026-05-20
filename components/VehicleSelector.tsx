import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { ComparisonSlot } from '../data/vehicles';
import { listBrands, listModels, listVersions } from '../services/vehicleService';
import { SearchSelect } from './SearchSelect';

type VehicleSelectorProps = {
  slot: ComparisonSlot;
  category: string | null;
  canRemove: boolean;
  onChange: (slot: ComparisonSlot) => void;
  onRemove: () => void;
};

export function VehicleSelector({
  slot,
  category,
  canRemove,
  onChange,
  onRemove,
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
    <View className="rounded-3xl border border-[#D8E3F2] bg-white p-4">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-[#00142E]">{slot.label}</Text>

        {canRemove && (
          <TouchableOpacity onPress={onRemove}>
            <Text className="text-sm font-bold text-[#7C93AF]">Remover</Text>
          </TouchableOpacity>
        )}
      </View>

      <SearchSelect
        label="Marca"
        value={slot.brand}
        options={brands}
        onSelect={(brand) => onChange({ ...slot, brand, model: null, version: null })}
      />

      <SearchSelect
        label="Modelo"
        value={slot.model}
        options={models}
        disabled={!slot.brand}
        onSelect={(model) => onChange({ ...slot, model, version: null })}
      />

      <SearchSelect
        label="Versão"
        value={slot.version}
        options={versions}
        disabled={!slot.model}
        onSelect={(version) => onChange({ ...slot, version })}
      />
    </View>
  );
}
