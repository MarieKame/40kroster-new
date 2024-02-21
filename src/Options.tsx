import { Component } from "react";
import { ColorPicker } from "react-native-color-picker";
import { View } from "react-native";
import Text from "./Components/Text";
import Slider from "@react-native-community/slider";


class Options extends Component {
    render(){
        return <View style={{padding:10, width:"100%"}}>
            <ColorPicker onColorSelected={color=> console.log(color)} style={{height:300}} sliderComponent={Slider}/>

        </View>;
    }
}

export default Options;