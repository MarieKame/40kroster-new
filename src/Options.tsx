import { Component } from "react";
import { ColorPicker, fromHsv } from "react-native-color-picker";
import { ScrollView, View } from "react-native";
import Text from "./Components/Text";
import Slider from "@react-native-community/slider";
import Button from "./Components/Button";
import Variables from "../Style/Variables";
import AutoExpandingTextInput from "./Components/AutoExpandingTextInput";
import { HsvColor } from "react-native-color-picker/dist/typeHelpers";

interface Props {
    onBack:CallableFunction
}

enum Colour{
    BG, MAIN, ACCENT, LIGHT, DARK
}

class Options extends Component<Props> {
    state={
        unitCategoriesText:"",
        editingColour:null,
        currentlyEditing:null,
        bg:"",
        main:"",
        accent:"",
        light:"",
        dark:"",
        svLayout:null
    };
    constructor(props){
        super(props);
        this.state.unitCategoriesText = Variables.unitCategories.join(", ");
        this.state.bg = Variables.colourBg;
        this.state.main = Variables.colourMain;
        this.state.accent = Variables.colourAccent;
        this.state.light = Variables.colourLightAccent;
        this.state.dark = Variables.colourDark;
    }

    tryUpdateUnitCategories(text:string){
        this.setState({unitCategoriesText:text});
        try {
            let newCategories = new Array<string>();
            text.split(',').forEach(category=>{
                newCategories.push(category.trim());
            });
            Variables.unitCategories = newCategories;
            this.setState({unitCategoriesText : Variables.unitCategories.join(", ")});
        } catch(e) {
            this.setState({unitCategoriesText : Variables.unitCategories.join(", ")});
        }
    }

    editColour(colour:Colour) {
        if (this.state.svLayout) {
            this.state.svLayout.scrollTo({x:0, y:100})
        }
        this.setState({currentlyEditing:colour});
        switch(colour){
            case Colour.BG:
                this.setState({editingColour:Variables.colourBg});
                break;
            case Colour.MAIN:
                this.setState({editingColour:Variables.colourMain});
                break;
            case Colour.ACCENT:
                this.setState({editingColour:Variables.colourAccent});
                break;
            case Colour.LIGHT:
                this.setState({editingColour:Variables.colourLightAccent});
                break;
            case Colour.DARK:
                this.setState({editingColour:Variables.colourDark});
                break;
        }
    }

    applyColourChange(colour:HsvColor) {
        const rgbHex = fromHsv(colour).replace("#", "");
        const rgb = {r: parseInt(rgbHex.slice(0,2), 16),
                     g: parseInt(rgbHex.slice(2,4), 16),
                     b: parseInt(rgbHex.slice(4,6), 16)};
        const value = this.state.currentlyEditing==Colour.BG?"rgba("+ rgb.r + "," + rgb.g + "," + rgb.b + ", 0.9)":"rgb("+ rgb.r + "," + rgb.g + "," + rgb.b + ")";
        switch(this.state.currentlyEditing){
            case Colour.BG:
                Variables.colourBg = value;
                this.setState({bg:value})
                break;
            case Colour.MAIN:
                Variables.colourMain = value;
                this.setState({main:value})
                break;
            case Colour.ACCENT:
                Variables.colourAccent = value;
                this.setState({accent:value})
                break;
            case Colour.LIGHT:
                Variables.colourLightAccent = value;
                this.setState({light:value})
                break;
            case Colour.DARK:
                Variables.colourDark = value;
                this.setState({dark:value})
                break;
        }
    }

    render(){
        return <View style={{padding:10, width:"100%"}}>
            <View>
                <Button onPress={(e)=>this.props.onBack()} style={{width:100, position:"absolute", right:0}}>Back</Button>
            </View>
            <ScrollView style={{marginTop:40}} onLayout={(event)=> this.setState({svLayout:event.target})}>
                <Text style={{fontSize:Variables.fontSize.big, marginBottom:10}}>Change Unit Categories, separated by a comma (,) :</Text>
                <AutoExpandingTextInput multiline editable value={this.state.unitCategoriesText} onChangeText={text=>this.tryUpdateUnitCategories(text)} />
                <View style={{flexDirection:"row", paddingTop:30, paddingBottom:30}}>
                    <View style={{width:"50%"}}>
                        <Text style={{fontSize:Variables.fontSize.big, marginBottom:10}}>Change Theme Colours :</Text>
                        <Button onPress={(e)=>this.editColour(Colour.BG)} forceColour={this.state.bg}>Background</Button>
                        <Button onPress={(e)=>this.editColour(Colour.MAIN)} forceColour={this.state.main}>Main</Button>
                        <Button onPress={(e)=>this.editColour(Colour.ACCENT)} forceColour={this.state.accent}>Accent</Button>
                        <Button onPress={(e)=>this.editColour(Colour.LIGHT)} forceColour={this.state.light}>Lighter Accent</Button>
                        <Button onPress={(e)=>this.editColour(Colour.DARK)} forceColour={this.state.dark}>Text</Button>
                    </View>
                    <View style={{width:"50%", paddingTop:40}}>
                        {this.state.editingColour&&<ColorPicker oldColor={this.state.editingColour} onColorChange={colour=> this.applyColourChange(colour)} onColorSelected={()=>this.setState({editingColour:null})} style={{height:200}} sliderComponent={Slider}/>}
                    </View>
                </View>
            </ScrollView>
        </View>;
    }
}
//

export default Options;