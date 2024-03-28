import { Component } from "react";
import { TextInput, TextInputProps, View } from "react-native";
import Variables from "../Variables";
import { KameContext } from "../../Style/KameContext";
import Text from "./Text";

interface AEProps extends TextInputProps {
  onSubmit:CallableFunction
  hint?:string
}

class AutoExpandingTextInput extends Component<AEProps> {
  static contextType = KameContext; 
  declare context: React.ContextType<typeof KameContext>;
  state={
    height:0,
    value:""
  }
    constructor(props) {
      super(props);
      this.state = {height: 0, value:this.props.value};
    }

    render() {
      let view = [
        <TextInput
            {...this.props}
            multiline={true}
            blurOnSubmit={true}
            onSubmitEditing ={(e)=> this.props.onSubmit(this.state.value)}
            onContentSizeChange={(event) => {
                this.setState({ height: event.nativeEvent.contentSize.height })
            }}
            style={[{borderColor:this.context.Main, borderWidth:Variables.boxBorderWidth, borderRadius:Variables.boxBorderRadius, padding:4, backgroundColor:this.context.Grey}, this.props.style]}
            value={this.state.value}
            onChangeText={text=>this.setState({value:text})}
          />
        ];
        if(this.props.hint && (this.state.value===""||this.state.value===undefined||this.state.value===null)) {
          view.push(
            <View style={{position:"absolute", left:8, alignSelf:"center"}}>
              <Text style={{color:"#888888"}}>
                {this.props.hint}
              </Text>
            </View>);
        }
      return view;
    }
  }

  export default AutoExpandingTextInput;