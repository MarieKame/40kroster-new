import {Text as RNText, TextProps, View} from 'react-native';
import {Component, ReactNode} from 'react';
import Variables from '../../Style/Variables';
import {KameContext} from '../../Style/KameContext';

export class Text extends Component<TextProps>  {
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;
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
    boldFirstWord?:string;
}
const WORDS = [
    "[a-z]* time", 
    "[a-z]* per battle",
    "stratagem", 
    "invulnerable save", 
    "damage", 
    "attack", 
    "roll", 
    "wound roll", 
    "advance roll",
    "charge roll",
    "battle-shock",
    "hit roll",
    "saving throw",
    "[0-9]?D[0-9]",
    "[0-9]+CP",
    "[0-9]+\\+",
    "[0-9]+\"",
    "[a-z]* phase",
    "act of faith"
];
export class ComplexText extends Component<ComplexProps>{
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;
    state={
        text:null
    }
    constructor(props:TextProps, context:(typeof KameContext)){
        super(props, context);
        const allWords = [].concat.apply([], [
            WORDS,
            Variables.unitCategories.map(cat=>cat+" "), 
            Variables.factions.map(faction=>faction[0]), 
            Variables.factions.map(faction=>faction[1]),
            Variables.WeaponMods.map(mod=>mod.Name)
        ]);
        const regex = new RegExp(allWords.map(word=>"(r?e?-?"+word+"s?i?n?g?e?d?)").join("|"), "i");
        let index=1;
        let text = <Text style={{fontSize:this.props.fontSize, textAlign:"justify"}}>
            {this.props.boldFirstWord&&<Text key="bold" style={{fontFamily:Variables.fonts.WHB}}>{this.props.boldFirstWord}</Text>}
            {this.props.children.toString().split(regex).map(element => 
                regex.test(element)?<Text key={index++}style={{color:this.context.Main, textDecorationLine:"underline", fontSize:this.props.fontSize}}>{element}</Text>:element
            )}
        </Text>;
        this.state.text = text;
    }
    render(): ReactNode {
        return (
            <View style={this.props.style}>{this.state.text}</View>
        );
    }
}
export default Text;