import {Pressable, StyleSheet, TextProps, TextStyle} from 'react-native';
import Text from './Text';
import {Component, Context, ReactNode, useContext} from 'react';
import Variables from '../Variables';
import {KameContext} from '../../Style/KameContext';

export interface ButtonProps extends TextProps {
    textStyle?:TextStyle,
    weight?:"light"|"normal"|"heavy"|undefined;
    image?:boolean,
    forceColour?:string
    tab?:boolean
    small?:boolean
    disabled?:boolean
    mergeLeft?:boolean
    mergeRight?:boolean
}

export class Button extends Component<ButtonProps>  {   
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;
    
    onPress(e, that:Button){
        if(!that.props.disabled && that.props.onPress)that.props.onPress(e);
    }
    render():ReactNode{
        const Style = StyleSheet.create({
            All:{
                minHeight:20,
                minWidth:40,
                margin:4,
                padding:6,
                alignContent:"center",
                justifyContent:"center",
                textAlign:"center",
                elevation:4
            },
            Button:{
                borderWidth:1,
                borderRadius:Variables.boxBorderRadius
            },
            Tab:{
                borderTopWidth:1,
                borderLeftWidth:1,
                borderRightWidth:1,
                borderTopLeftRadius:Variables.boxBorderRadius,
                borderTopRightRadius:Variables.boxBorderRadius,
            },
            Light:{
                backgroundColor:this.context.LightAccent,
                borderColor:this.context.Accent,
            },
            Normal:{
                backgroundColor:this.context.LightAccent,
                borderColor:this.context.Main,
            },
            Heavy:{
                backgroundColor:this.context.Accent,
                borderColor:this.context.Main,
            }
        });

        let style = new Array();
        let forceTextColour;
        style.push(Style.All);
        if (this.props.tab){
            style.push(Style.Tab);
        } else {
            style.push(Style.Button);
        }
        if (this.props.forceColour){
            const colours = this.props.forceColour.match(/[0-9]+/g);
            let textColour = "black";
            if (colours){
                const brightness = Math.round(((parseInt(colours[0]) * 299) +
                      (parseInt(colours[1]) * 587) +
                      (parseInt(colours[2]) * 114)) / 1000);
                textColour = (brightness > 125) ? 'black' : 'white';
            }
            style.push({
                backgroundColor:this.props.forceColour,
                borderColor:"black"
            });
            forceTextColour = {color:textColour};
        } else {
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
        }
        if(this.props.small){
            style.push({
                minHeight:12,
                minWidth:20,
                margin:0,
                padding:0,
            })
        }
        if(this.props.disabled){
            style.push({
                backgroundColor:this.context.Accent,
                borderColor:this.context.LightAccent,
            });
            forceTextColour = {color:this.context.LightAccent}
        }
        if(this.props.mergeLeft) {
            style.push({
                borderTopLeftRadius:0,
                borderBottomLeftRadius:0,
                marginLeft:0,
                paddingLeft:0,
                borderLeftWidth:0
            });
        }
        if(this.props.mergeRight) {
            style.push({
                borderTopRightRadius:0,
                borderBottomRightRadius:0,
                marginRight:0,
                paddingRight:0,
                borderRightWidth:0
            });
        }
        if (this.props.image)
            return <Pressable style={[style, this.props.style]} onPress={e=>this.onPress(e, this)}>{this.props.children}</Pressable>
        return (
            <Pressable style={[style, {height:"auto"}, this.props.style]} onPress={e=>this.onPress(e, this)}>
                <Text style={[{textAlign:"center"}, forceTextColour, this.props.textStyle]}>
                    {this.props.children}
                </Text>
            </Pressable>
        );
    }
}

export default Button;