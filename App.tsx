import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ImageBackground, View } from 'react-native';
import Menu from './src/Menu';

export default function App() {
  return (
    <View>
      <ImageBackground source={require('./assets/images/background.jpg')} resizeMode="cover" style={{justifyContent:"center"}}>
        <Menu />
        <StatusBar hidden={true} />
      </ImageBackground>
    </View>
  );
}