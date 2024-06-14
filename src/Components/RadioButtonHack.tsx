import React from "react";
import { RadioButton } from "react-native-paper";
import { KameContext } from "../../Style/KameContext";

interface Props {
    value:string;
    onValueChange:(value:string)=>void;
    checked:boolean;
}

export default class RadioButtonHack extends React.Component<Props> {
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;

    render(): React.ReactNode {
        return <RadioButton value={null} onPress={()=>this.props.onValueChange(this.props.value)} status={this.props.checked?"checked":"unchecked"} color={this.context.Main}/>;
    }
}