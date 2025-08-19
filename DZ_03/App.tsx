import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import Game2048 from './src/Game2048';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <Game2048 />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
