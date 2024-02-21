import {Text as RNText, TextProps, View} from 'react-native';
import {Component, ReactNode} from 'react';
import Variables from '../../Style/Variables';

export class Text extends Component<TextProps>  {
    render(): ReactNode {
        return (
            <RNText style={[{fontFamily:Variables.fonts.WHN, fontSize:Variables.fontSize * Variables.zoom}, this.props.style]}>{this.props.children}</RNText>
        );
    }
}
export class Descriptor extends Component<TextProps>  {
    render(): ReactNode {
        return (
            <View style={{flexDirection:"row", flexGrow:1}}><Text style={[{flex:1, width:1}, this.props.style]}>{this.props.children}</Text></View>
        );
    }
}
export default Text;