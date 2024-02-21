import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import Menu from './src/Menu';

export default function App() {
  return (
    <View>
      <Menu />
      <StatusBar hidden={true} />
    </View>
  );
}