import { Component } from "react";
import { Animated, LayoutAnimation, Pressable, StyleProp, View, ViewStyle } from "react-native";
import { KameContext } from "../../Style/KameContext";
import Text from "./Text";
import Variables from "../Variables";

class Props {
    MessageOnPress:string
    Visible:boolean
    Style?:StyleProp<ViewStyle>
}
export default class Info extends Component<Props> {
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;

    state={
        opacity:new Animated.Value(0),
        animating:false
    }

    render() {
        if(!this.props.Visible) return null;
        return <View style={[this.props.Style, {width:25, height:25}]}><Pressable onPress={e => {
            if(this.state.animating) return;
            this.setState({animating:true})
            Animated.timing(this.state.opacity, {
                toValue:1,
                duration:300,
                useNativeDriver:true
            }).start(()=>{
                Animated.timing(this.state.opacity, {
                    toValue:1,
                    duration:3000,
                    useNativeDriver:true
                }).start(()=>{
                    Animated.timing(this.state.opacity, {
                        toValue:0,
                        duration:300,
                        useNativeDriver:true
                    }).start(()=>{
                        this.setState({animating:false})
                    });
                });
            });
        }} style={{borderRadius:1000, borderWidth:1, borderColor:this.context.Main, backgroundColor:this.context.Bg}}>
            <Text style={{color:this.context.Main, fontSize:Variables.fontSize.big, textAlign:"center"}}>i</Text>
        </Pressable>
        <Animated.View style={{
            opacity: this.state.opacity,
            position:"absolute",
            top:15,
            width:200, 
            backgroundColor:this.context.Bg, 
            zIndex:1000, 
            borderRadius:Variables.boxBorderRadius, 
            borderWidth:1, 
            borderColor:this.context.Main,
            alignSelf:"center",
            padding:8
            }}>
            <Text style={{paddingLeft:4, color:this.context.Main}}>
                {this.props.MessageOnPress}
            </Text>
        </Animated.View>
        </View>;
    }
}