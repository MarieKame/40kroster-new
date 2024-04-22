import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ImageBackground, View } from 'react-native';
import Menu from './src/Menu';
import { useShareIntent } from "expo-share-intent";
//const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

export default function App() {
  return (
    <View style={{flex:1}}>
      <ImageBackground source={require('./assets/images/background.jpg')} resizeMode="cover" style={{justifyContent:"center", flex:1, width:"100%", height:"100%"}} imageStyle={{resizeMode: 'repeat'}}>
        <Menu/>
        <StatusBar hidden={true} />
      </ImageBackground>
    </View>
  );
}