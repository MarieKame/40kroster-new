import { Component } from "react";
import { ColorPicker, fromHsv } from "react-native-color-picker";
import { ScrollView, View } from "react-native";
import Text from "./Components/Text";
import Slider from "@react-native-community/slider";
import Button from "./Components/Button";
import Variables from "../Style/Variables";
import AutoExpandingTextInput from "./Components/AutoExpandingTextInput";
import { HsvColor } from "react-native-color-picker/dist/typeHelpers";
import {ColoursContext} from "../Style/ColoursContext";

interface Props {
    onBack:CallableFunction,
    onColourChange:CallableFunction,
    onCategoriesChange:CallableFunction,
    onReset:CallableFunction
}

export enum Colour{
    BG, MAIN, ACCENT, LIGHT, DARK
}

class Options extends Component<Props> {
    static contextType = ColoursContext; 
    declare context: React.ContextType<typeof ColoursContext>;
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
    constructor(props, context:(typeof ColoursContext)){
        super(props, context);
        this.state.unitCategoriesText = Variables.unitCategories.join(", ");
        this.state.bg = this.context.Bg;
        this.state.main = this.context.Main;
        this.state.accent = this.context.Accent;
        this.state.light = this.context.LightAccent;
        this.state.dark = this.context.Dark;
    }

    tryUpdateUnitCategories(text:string){
        try {
            let newCategories = text.split(',').map(category=>category.trim().split(" ").map(word=>word[0].toUpperCase()+word.substring(1)).join(" "));
            Variables.unitCategories = newCategories;
            this.props.onCategoriesChange(text);
            this.setState({unitCategoriesText : newCategories.join(", ")});
        } catch(e) {
            this.setState({unitCategoriesText : Variables.unitCategories.join(", ")});
        }
    }

    restoreToDefaults(){
        this.setState({
            unitCategoriesText:"Epic Hero, Character, Battleline, Infantry, Vehicle, Monster",
            bg:"rgba(255,255,255,0.9)",
            main:"rgb(255,0,0)",
            accent:"rgb(255,180,180)",
            light:"rgb(252, 233, 236)",
            dark:"rgb(0,0,0)",
        }, ()=>{
            Variables.unitCategories = this.state.unitCategoriesText.split(",").map((cat)=>cat.trim());
            this.props.onCategoriesChange(this.state.unitCategoriesText);
        });
        this.props.onReset();
    }

    editColour(colour:Colour) {
        if (this.state.svLayout) {
            this.state.svLayout.scrollTo({x:0, y:100})
        }
        this.setState({currentlyEditing:colour});
        switch(colour){
            case Colour.BG:
                this.setState({editingColour:this.context.Bg});
                break;
            case Colour.MAIN:
                this.setState({editingColour:this.context.Main});
                break;
            case Colour.ACCENT:
                this.setState({editingColour:this.context.Accent});
                break;
            case Colour.LIGHT:
                this.setState({editingColour:this.context.LightAccent});
                break;
            case Colour.DARK:
                this.setState({editingColour:this.context.Dark});
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
                this.setState({bg:value})
                break;
            case Colour.MAIN:
                this.setState({main:value})
                break;
            case Colour.ACCENT:
                this.setState({accent:value})
                break;
            case Colour.LIGHT:
                this.setState({light:value})
                break;
            case Colour.DARK:
                this.setState({dark:value})
                break;
        }
        this.props.onColourChange(this.state.currentlyEditing, value);
    }

    render(){
        return <View style={{padding:10, width:"100%"}}>
            <View>
                <Button onPress={(e)=>this.props.onBack()} style={{width:100, position:"absolute", right:0}}>Back</Button>
                <Button onPress={(e)=>this.restoreToDefaults()} style={{width:100, position:"absolute", right:120}}>Restore defaults</Button>
            </View>
            <ScrollView style={{marginTop:40}} onLayout={(event)=> this.setState({svLayout:event.target})}>
                <Text style={{fontSize:Variables.fontSize.big, marginBottom:10}}>Change Unit Categories, separated by a comma (,) :</Text>
                <AutoExpandingTextInput multiline editable value={this.state.unitCategoriesText} onSubmit={text=>this.tryUpdateUnitCategories(text)} />
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