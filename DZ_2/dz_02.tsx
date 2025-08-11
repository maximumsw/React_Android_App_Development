// CalculatorScreen.tsx
import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, Text, Pressable, StyleSheet } from 'react-native';

type KeyType =
  | 'digit' | 'dot'
  | 'op'    // + − × ÷
  | 'unary' // ± % √ 1/x
  | 'ctrl'  // AC C ⌫ =
  | 'paren' // ( )
  | 'mem';  // MC MR M+ M- MS

type KeyDef = { label: string; type: KeyType; value?: string };

export default function CalculatorScreen() {
  const [display, setDisplay] = useState<string>('0');
  const [memory, setMemory] = useState<number | null>(null);

  // --- Рядок пам'яті ---
  const memoryRow: KeyDef[] = useMemo(() => ([
    { label: 'MC', type: 'mem' },
    { label: 'MR', type: 'mem' },
    { label: 'M+', type: 'mem' },
    { label: 'M-', type: 'mem' },
    { label: 'MS', type: 'mem' },
  ]), []);

  // --- Інші ряди клавіш (приклад) ---
  const rows: KeyDef[][] = [
    [ { label:'AC', type:'ctrl' }, { label:'±', type:'unary' }, { label:'%', type:'unary' }, { label:'÷', type:'op', value:'/' } ],
    [ { label:'7', type:'digit' }, { label:'8', type:'digit' }, { label:'9', type:'digit' }, { label:'×', type:'op', value:'*' } ],
    [ { label:'4', type:'digit' }, { label:'5', type:'digit' }, { label:'6', type:'digit' }, { label:'−', type:'op', value:'-' } ],
    [ { label:'1', type:'digit' }, { label:'2', type:'digit' }, { label:'3', type:'digit' }, { label:'+', type:'op', value:'+' } ],
    [ { label:'(', type:'paren' }, { label:'0', type:'digit' }, { label:'.', type:'dot' }, { label:'=', type:'ctrl' } ],
  ];

  const onKey = (key: KeyDef) => {
    if (key.type === 'mem') {
      handleMemory(key.label);
      return;
    }
    // Заглушки — тут допишеш власну логіку обчислень
    switch (key.type) {
      case 'digit':
        setDisplay(d => (d === '0' ? key.label : d + key.label));
        break;
      case 'dot':
        setDisplay(d => (d.includes('.') ? d : d + '.'));
        break;
      case 'op':
        // встав приклад: зберегти оператор, тощо
        setDisplay(d => d + ' ' + (key.value ?? key.label) + ' ');
        break;
      case 'unary':
        if (key.label === '±') setDisplay(d => (d.startsWith('-') ? d.slice(1) : d === '0' ? d : '-' + d));
        else if (key.label === '%') setDisplay(d => String(Number(d) / 100));
        else if (key.label === '√') setDisplay(d => String(Math.sqrt(Math.max(0, Number(d)))));
        else if (key.label === '1/x') setDisplay(d => (Number(d) === 0 ? '∞' : String(1 / Number(d))));
        break;
      case 'ctrl':
        if (key.label === 'AC') { setDisplay('0'); /* скинь ще свій стейт */ }
        else if (key.label === '=') { /* обчисли вираз */ }
        else if (key.label === '⌫') setDisplay(d => (d.length > 1 ? d.slice(0, -1) : '0'));
        break;
      case 'paren':
        setDisplay(d => d + key.label);
        break;
    }
  };

  const handleMemory = (label: string) => {
    const current = Number(display.replace(',', '.'));
    switch (label) {
      case 'MC': setMemory(null); break;
      case 'MR': if (memory !== null) setDisplay(String(memory)); break;
      case 'M+': setMemory(m => (m ?? 0) + current); break;
      case 'M-': setMemory(m => (m ?? 0) - current); break;
      case 'MS': setMemory(current); break;
    }
  };

  const Key = ({ item }: { item: KeyDef }) => (
    <Pressable
      onPress={() => onKey(item)}
      style={({ pressed }) => [styles.key, pressed && { opacity: 0.7 },
        item.type === 'op' || item.type === 'ctrl' ? styles.keyAccent : null]}
      android_ripple={{ borderless: false }}
      testID={`key-${item.label}`}
    >
      <Text style={styles.keyText}>{item.label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.display}>
        <Text style={styles.memoryMark}>{memory !== null ? 'M' : ' '}</Text>
        <Text style={styles.displayText} numberOfLines={1}>{display}</Text>
      </View>

      {/* Рядок пам'яті */}
      <View style={styles.row}>
        {memoryRow.map(k => <Key key={k.label} item={k} />)}
      </View>

      {/* Інші ряди */}
      {rows.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map(k => <Key key={k.label} item={k} />)}
        </View>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 12, gap: 8 },
  display: {
    minHeight: 96, backgroundColor: '#222', borderRadius: 16, padding: 16,
    alignItems: 'flex-end', justifyContent: 'center'
  },
  memoryMark: { position: 'absolute', left: 16, top: 12, color: '#9aa', fontSize: 16 },
  displayText: { color: '#fff', fontSize: 40, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  key: {
    flex: 1, height: 56, borderRadius: 14, backgroundColor: '#333',
    alignItems: 'center', justifyContent: 'center'
  },
  keyAccent: { backgroundColor: '#444' },
  keyText: { color: '#fff', fontSize: 20, fontWeight: '600' },
});
