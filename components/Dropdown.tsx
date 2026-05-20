import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type DropdownProps = {
  label: string;
  value: string | null;
  options: string[];
  onSelect: (value: string) => void;
  disabled?: boolean;
};

export function Dropdown({
  label,
  value,
  options,
  onSelect,
  disabled = false,
}: DropdownProps) {
  const [open, setOpen] = useState(false);

  function handleOpen() {
    if (!disabled && options.length > 0) {
      setOpen(true);
    }
  }

  return (
    <View className="mb-4">
      <Text className="mb-2 text-xs font-bold uppercase tracking-[2px] text-[#93c5fd]">
        {label}
      </Text>

      <TouchableOpacity
        activeOpacity={disabled ? 1 : 0.8}
        onPress={handleOpen}
        className={`flex-row items-center justify-between rounded-2xl border px-4 py-4 ${
          disabled
            ? 'border-[#334155] bg-[#1e293b]'
            : 'border-[#1d4ed8] bg-[#0f172a]'
        }`}
      >
        <Text
          className={`text-base ${
            value ? 'font-semibold text-white' : 'text-[#64748b]'
          }`}
        >
          {value ?? (disabled ? 'Selecione a etapa anterior' : 'Selecionar')}
        </Text>

        <Text className="text-lg text-[#93c5fd]">⌄</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => setOpen(false)}
        >
          <Pressable className="max-h-[70%] rounded-t-3xl bg-[#0f172a] p-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-white">
                Selecione {label.toLowerCase()}
              </Text>

              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text className="text-base font-bold text-[#93c5fd]">
                  Fechar
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item}
              ItemSeparatorComponent={() => (
                <View className="h-px bg-[#1e293b]" />
              )}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="py-4"
                  activeOpacity={0.75}
                  onPress={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  <Text className="text-base text-[#e2e8f0]">{item}</Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
