import { Component } from "react";
import { TextInput, TextInputProps } from "react-native";
import Variables from "../../Style/Variables";



class AutoExpandingTextInput extends Component<TextInputProps> {

    constructor(props) {
      super(props);
      this.state = {height: 0};
    }
    render() {
      return (
        <TextInput
          {...this.props}
          multiline={true}
          onChangeText={(text) => this.props.onChangeText(text)}
          onContentSizeChange={(event) => {
              this.setState({ height: event.nativeEvent.contentSize.height })
          }}
          style={[{borderColor:Variables.colourMain, borderWidth:Variables.boxBorderWidth, borderRadius:Variables.boxBorderRadius, padding:4, backgroundColor:Variables.colourGrey}, this.props.style]}
          value={this.props.value}
        />
      );
    }
  }

  export default AutoExpandingTextInput;