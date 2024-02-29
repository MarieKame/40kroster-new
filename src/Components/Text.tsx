import {Text as RNText, TextProps, View} from 'react-native';
import {Component, ReactNode} from 'react';
import Variables from '../../Style/Variables';
import {ColoursContext} from '../../Style/ColoursContext';

export class Text extends Component<TextProps>  {
    static contextType = ColoursContext; 
    declare context: React.ContextType<typeof ColoursContext>;
    render():ReactNode{
        return <RNText style={[{fontFamily:Variables.fonts.WHN, fontSize:Variables.fontSize.normal, color:this.context.Dark}, this.props.style]}>{this.props.children}</RNText>
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
    static contextType = ColoursContext; 
    declare context: React.ContextType<typeof ColoursContext>;
    state={
        text:null
    }
    constructor(props:TextProps, context:(typeof ColoursContext)){
        super(props, context);
        const regex = /([a-z]* time)|(stratagem)|(invulnerable save)|(damage)|(attacks?)|(r?e?-?rolle?d?)|(wound roll)|([a-z]* phase)|(hit roll)|(advance roll)|(battle-shock)|(charge roll)|(saving throws?)|(D[0-9])|([0-9]+CP)|([0-9]+\+?"?)/i;
        const normalStyle = {};
        const redStyle ={};
        let text = <Text style={{fontSize:this.props.fontSize}}>{this.props.children.toString().split(regex).map(element => 
            regex.test(element)?<Text style={{color:this.context.Main, textDecorationLine:"underline", fontSize:this.props.fontSize}}>{element}</Text>:element
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