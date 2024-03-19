import React from "react";
import { View } from "react-native";
import Variables from "../Variables";
import { KameContext } from "../../Style/KameContext";
import Text from "./Text";
import Button from "./Button";

export interface PopupOption{
    option:string,
    callback:CallableFunction
}

interface Props{
    question?:string,
    options?:Array<PopupOption>,
    default?:string,
    onClose:CallableFunction
}

export default class Popup extends React.Component<Props> {
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;

    constructor(props:Props, context){
        super(props, context);
        this.state.display = props.question !== null && props.question!=="";
    }

    state = {
        display:false
    }

    ChooseOption(callback?:CallableFunction) {
        if (callback)
            callback();
        this.setState({display:false, question:"", options:[]});
        this.props.onClose();
    }
    
    render(){
        if (!this.state.display) {
            return <View></View>;
        }
        return <View style={{height:Variables.height, width:Variables.width, position:"absolute", backgroundColor:"rgba(0,0,0,0.6)", justifyContent: 'center', alignItems: 'center'}}>
            <View style={{backgroundColor:this.context.Bg, position:"absolute", padding:10, borderColor:this.context.Accent, borderWidth:1, borderRadius:Variables.boxBorderRadius}}>
                <Text key="question" style={{fontSize:Variables.fontSize.big, margin:10}}>{this.props.question}</Text>
                {this.props.options.map((option, index)=>
                    <Button key={index} onPress={e=>this.ChooseOption(option.callback)} style={{height:40}}>{option.option}</Button>
                )}
                {this.props.default&&<Button key="default" onPress={e=>this.ChooseOption()} style={{height:40}}>{this.props.default}</Button>}
            </View>
        </View>;
    }
}