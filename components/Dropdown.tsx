import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';

type DropdownProps = {
  label: string;
  value: string | null;
  options: string[];
  onSelect: (value: string) => void;
  disabled?: boolean;
};

export function Dropdown({ label, value, options, onSelect, disabled = false }: DropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <View className="w-full mb-5">
      <Text className="text-[#a0a0b0] text-xs font-semibold tracking-wider mb-1.5">
        {label}
      </Text>
      <TouchableOpacity
        className={`bg-[#16213e] rounded-lg border border-[#0f3460] px-4 py-3.5 flex-row justify-between items-center ${disabled ? 'opacity-40' : ''}`}
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text className={`text-sm ${value ? 'text-[#e0e0e0]' : 'text-[#606070]'}`}>
          {value ?? 'Select...'}
        </Text>
        <Text className="text-[#e94560] text-base">▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/60 justify-center p-8"
          onPress={() => setOpen(false)}
        >
          <View className="bg-[#16213e] rounded-2xl max-h-96 overflow-hidden border border-[#0f3460]">
            <Text className="text-[#e94560] text-sm font-bold tracking-wider px-4 py-4 border-b border-[#0f3460]">
              {label}
            </Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="px-5 py-3.5 border-b border-[#133a7c]"
                  onPress={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  <Text className="text-[#e0e0e0] text-sm">{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}