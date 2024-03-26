import { Component } from "react"
import { Pressable, StyleProp, TextStyle, View, ViewStyle } from "react-native"
import ExpoCheckbox from "expo-checkbox";
import Text from "./Text";

class Props {
    Style?:StyleProp<ViewStyle>;
    TextStyle?:StyleProp<TextStyle>;
    Text:string;
    OnCheckedChanged?:CallableFunction
    Checked:boolean;
    Disabled?:boolean
}

export default class Checkbox extends Component<Props>{
    constructor(props){
        super(props);
    }

    OnCheckedChanged(newValue:boolean, that:Checkbox) {
        if(this.props.Disabled) return;
        if(that.props.OnCheckedChanged) {
            that.props.OnCheckedChanged(newValue);
        }
        that.setState({checked:newValue});
    }

    render() {
        return <View style={[this.props.Style, {flexDirection:"row"}]}>
            <ExpoCheckbox value={this.props.Checked} 
                onValueChange={(e)=>{this.OnCheckedChanged(e, this)}}
                style={{alignSelf:"center", marginRight:4}} disabled={this.props.Disabled} />
            <Pressable onPress={e=>{ this.OnCheckedChanged(!this.props.Checked, this)}} style={{alignSelf:"center", flexShrink:1}}>
                <Text style={[this.props.TextStyle, {width:"100%"}]}>
                    {this.props.Text}
                </Text>
            </Pressable>
        </View>
    }
}