import { Component, Context } from "react";
import { TextInput, TextInputProps } from "react-native";
import Variables from "../../Style/Variables";
import { ColoursContext } from "../../Style/ColoursContext";

interface AEProps extends TextInputProps {
  onSubmit:CallableFunction
}

class AutoExpandingTextInput extends Component<AEProps> {
  static contextType = ColoursContext; 
  declare context: React.ContextType<typeof ColoursContext>;
  state={
    height:0,
    value:""
  }
    constructor(props) {
      super(props);
      this.state = {height: 0, value:this.props.value};
    }

    render() {
      return (
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
      );
    }
  }

  export default AutoExpandingTextInput;