import {Pressable, StyleSheet, TextProps, TextStyle} from 'react-native';
import Text from './Text';
import {Component, ReactNode} from 'react';
import Variables from '../../Style/Variables';

const Style = StyleSheet.create({
    Button:{
        borderWidth:1,
        borderRadius:Variables.boxBorderRadius,
        minHeight:40,
        minWidth:40,
        margin:4,
        padding:10,
        alignContent:"center",
        justifyContent:"center",
        textAlign:"center",
        elevation:4
    },
    Light:{
        backgroundColor:Variables.colourLightAccent,
        borderColor:Variables.colourAccent,
    },
    Normal:{
        backgroundColor:Variables.colourLightAccent,
        borderColor:Variables.colourMain,
    },
    Heavy:{
        backgroundColor:Variables.colourAccent,
        borderColor:Variables.colourMain,
    }
});

export interface ButtonProps extends TextProps {
    textStyle?:TextStyle,
    weight?:"light"|"normal"|"heavy"|undefined;
    image?:boolean
}

export class Button extends Component<ButtonProps>  {
    render():ReactNode{
        let style = new Array();
        style.push(Style.Button);
        switch(this.props.weight) {
            case "light":
                style.push(Style.Light);
                break;
            case "heavy":
                style.push(Style.Heavy);
                break;
            case 'normal':
            default:
                style.push(Style.Normal);
                break;
        }
        if (this.props.image)
        return <Pressable style={[style, this.props.style]} onPress={this.props.onPress}>{this.props.children}</Pressable>
        return (
            <Pressable style={[style, this.props.style]} onPress={this.props.onPress}><Text style={[{textAlign:"center"}, this.props.textStyle]}>{this.props.children}</Text></Pressable>
        );
    }
}

export default Button;