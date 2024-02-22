import { Component } from "react";
import { ColorPicker } from "react-native-color-picker";
import { ScrollView, View } from "react-native";
import Text from "./Components/Text";
import Slider from "@react-native-community/slider";
import Button from "./Components/Button";
import Variables from "../Style/Variables";
import AutoExpandingTextInput from "./Components/AutoExpandingTextInput";
import { HsvColor } from "react-native-color-picker/dist/typeHelpers";


function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

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
        }
    }

    applyColourChange(colour:HsvColor) {
        const rgb = HSVtoRGB(colour.h, colour.s, colour.v);
        const value = this.state.currentlyEditing==Colour.BG?"rgba("+ rgb.r + "," + rgb.g + "," + rgb.b + ", 0.9)":"rgb("+ rgb.r + "," + rgb.g + "," + rgb.b + ")";
        switch(this.state.currentlyEditing){
            case Colour.BG:
                Variables.colourBg = value;
                this.setState({bg:value})
        }
    }

    render(){
        return <View style={{padding:10, width:"100%"}}>
            <View>
                <Button onPress={(e)=>this.props.onBack()} style={{width:100, position:"absolute", right:0}}>Back</Button>
            </View>
            <ScrollView style={{marginTop:40}} onLayout={(event)=> {this.setState({svLayout:event.target}); console.log(event)}}>
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