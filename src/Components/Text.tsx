import {Text as RNText, TextProps, View, StyleProp, TextStyle, ColorValue} from 'react-native';
import {Component, ReactNode} from 'react';
import Variables from '../../Style/Variables';

export class Text extends Component<TextProps>  {
    render():ReactNode{
        return <RNText style={[{fontFamily:Variables.fonts.WHN, fontSize:Variables.fontSize.normal}, this.props.style]}>{this.props.children}</RNText>
    }
}
export class Descriptor extends Component<TextProps>  {
    render(): ReactNode {
        return (
            <View style={{flexDirection:"row", flexGrow:1}}><Text style={[{flex:1}, this.props.style]}>{this.props.children}</Text></View>
        );
    }
}
interface ComplexProps extends TextProps {
    fontSize?;
}
export class ComplexText extends Component<ComplexProps>{
    state={
        text:null
    }
    constructor(props:TextProps){
        super(props);
        const regex = /([a-z]* time)|(stratagem)|(invulnerable save)|(damage)|(attacks?)|(re-roll)|(wound roll)|([a-z]* phase)|(hit roll)|(roll)|(D[0-9])|([0-9]+CP)|([0-9]+\+?)/i;
        const normalStyle = {};
        const redStyle ={};
        let text = <Text style={{fontSize:this.props.fontSize}}>{this.props.children.toString().split(regex).map(element => 
            regex.test(element)?<Text style={{color:Variables.colourMain, textDecorationLine:"underline", fontSize:this.props.fontSize}}>{element}</Text>:element
        )}</Text>;
        this.state.text = text;
    }
    render(): ReactNode {
        return (
            <View style={this.props.style}>{this.state.text}</View>
        );
    }
}
export default Text;