import { Component } from "react";
import { ColorPicker, fromHsv } from "react-native-color-picker";
import { ScrollView, View } from "react-native";
import Text from "./Components/Text";
import Slider from "@react-native-community/slider";
import Button from "./Components/Button";
import Variables from "../Style/Variables";
import AutoExpandingTextInput from "./Components/AutoExpandingTextInput";
import { HsvColor } from "react-native-color-picker/dist/typeHelpers";
import {KameContext} from "../Style/KameContext";
import RadioButtonGroup, { RadioButtonItem } from "expo-radio-button";
import Checkbox from "expo-checkbox";

interface Props {
    onColourChange:CallableFunction,
    onCategoriesChange:CallableFunction,
    onReset:CallableFunction,
    onNameDisplayChange:CallableFunction,
    navigation:{goBack}
}

export enum Colour{
    BG, MAIN, ACCENT, LIGHT, DARK
}
enum Themes{
    DEFAULT, THORNS, EATERS, PLAGUE, THOUSAND, WOLVES, ANGELS, SORORITAS, NIDS
}

class Options extends Component<Props> {
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;
    state={
        unitCategoriesText:"",
        editingColour:null,
        currentlyEditing:null,
        bg:"",
        main:"",
        accent:"",
        light:"",
        dark:"",
        svLayout:null,
        displayFirst:Variables.displayFirst,
        username:Variables.username,
        displayLeaderInfo:Variables.displayLeaderInfo,
        mergeLeaderWeapons:Variables.mergeLeaderWeapons,
        displayTransportRule:Variables.displayTransportRule,
    };
    constructor(props, context:(typeof KameContext)){
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
        this.props.onReset([
            /*colourMain:*/"rgb(255,0,0)",
            /*colourDark:*/"rgb(0,0,0)",
            /*colourLightAccent:*/"rgb(252, 233, 236)",
            /*colourAccent:*/"rgb(255,180,180)",
            /*colourBg:*/"rgba(255,255,255,0.9)",
            /*colourGrey:*/"rgb(245,245,245)"
        ]);
    }

    setColours(theme:Themes){
        let colours = {
            colourMain:"rgb(255,0,0)",
            colourDark:"rgb(0,0,0)",
            colourLightAccent:"rgb(252, 233, 236)",
            colourAccent:"rgb(255,180,180)",
            colourBg:"rgba(255,255,255,0.9)"
        }
        switch(theme){
            case Themes.THORNS:
                colours = {
                    colourMain:"rgb(14,233,182)",
                    colourDark:"rgb(255,255,255)",
                    colourLightAccent:"rgb(0, 78, 76)",
                    colourAccent:"rgb(7,103,106)",
                    colourBg:"rgba(0,41,46,0.9)"
                };
                break;
            case Themes.EATERS:
                colours = {
                    colourMain:"rgb(255,0,26)",
                    colourDark:"rgb(255,188,187)",
                    colourLightAccent:"rgb(80, 0, 28)",
                    colourAccent:"rgb(128,0,8)",
                    colourBg:"rgba(46,0,0,0.9)"
                };
                break;
            case Themes.PLAGUE:
                colours = {
                    colourBg:"rgba(82,128,82,0.9)",
                    colourMain:"rgb(255,255,255)",
                    colourAccent:"rgb(79,149,84)",
                    colourLightAccent:"rgb(96, 161, 100)",
                    colourDark:"rgb(177,255,182)",
                };
                break;
            case Themes.THOUSAND:
                colours = {
                    colourBg:"rgba(31,83,187,0.9)",
                    colourMain:"rgb(255,228,90)",
                    colourAccent:"rgb(163,131,47)",
                    colourLightAccent:"rgb(69, 109, 209)",
                    colourDark:"rgb(215,241,255)",
                };
                break;
            case Themes.WOLVES:
                colours = {
                    colourBg:"rgba(185,235,255,0.9)",
                    colourAccent:"rgb(145,220,255)",
                    colourLightAccent:"rgb(171, 223, 255)",
                    colourMain:"rgb(145,139,0)",
                    colourDark:"rgb(0,0,0)",
                };
                break;
            case Themes.ANGELS:
                colours = {
                    colourBg:"rgba(0,46,12,0.9)",
                    colourAccent:"rgb(16,30,8)",
                    colourLightAccent:"rgb(15, 68, 32)",
                    colourMain:"rgb(215,0,5)",
                    colourDark:"rgb(255,246,193)",
                };
                break;
            case Themes.SORORITAS:
                colours = {
                    colourBg:"rgba(165,136,136,0.9)",
                    colourAccent:"rgb(181,13,0)",
                    colourLightAccent:"rgb(199, 154, 156)",
                    colourMain:"rgb(0,0,0)",
                    colourDark:"rgb(255,255,255)",
                };
                break;
            case Themes.NIDS:
                colours = {
                    colourBg:"rgba(59,0,78,0.9)",
                    colourAccent:"rgb(128,0,177)",
                    colourLightAccent:"rgb(91,0,135)",
                    colourMain:"rgb(247,169,0)",
                    colourDark:"rgb(255,255,255)",
                };
                break;
                
            case Themes.DEFAULT:
            default:
                break;
        }
        this.setState({
            bg:colours.colourBg,
            main:colours.colourMain,
            accent:colours.colourAccent,
            light:colours.colourLightAccent,
            dark:colours.colourDark
        });
        this.props.onReset([colours.colourMain, colours.colourDark, colours.colourLightAccent, colours.colourAccent, colours.colourBg, "rgb(245,245,245)"])
    }

    editColour(colour:Colour) {
        if (this.state.svLayout) {
            this.state.svLayout.scrollTo({x:0, y:270})
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

    updateDisplayTransportInfo(value:boolean, that:Options) {
        that.setState({displayLeaderInfo:value})
        Variables.displayLeaderInfo = value;
        that.props.onNameDisplayChange(that.state.username+";;;"+that.state.displayFirst+";;;"+(this.state.displayLeaderInfo?"true":"false")+";;;"+(this.state.mergeLeaderWeapons?"true":"false")+";;;"+(value?"true":"false"));
    }

    updateMergeLeaderWeapons(value:boolean, that:Options) {
        that.setState({mergeLeaderWeapons:value})
        Variables.mergeLeaderWeapons = value;
        that.props.onNameDisplayChange(that.state.username+";;;"+that.state.displayFirst+";;;"+(this.state.displayLeaderInfo?"true":"false")+";;;"+(value?"true":"false")+";;;"+(this.state.displayTransportRule?"true":"false"));
    }

    updateDisplayLeaderInfo(value:boolean, that:Options) {
        that.setState({displayLeaderInfo:value})
        Variables.displayLeaderInfo = value;
        that.props.onNameDisplayChange(that.state.username+";;;"+that.state.displayFirst+";;;"+(value?"true":"false")+";;;"+(this.state.mergeLeaderWeapons?"true":"false")+";;;"+(this.state.displayTransportRule?"true":"false"));
    }

    updateDisplayFirst(display:string){
        this.setState({displayFirst:display})
        Variables.displayFirst = display;
        this.props.onNameDisplayChange(this.state.username+";;;"+display+";;;"+(this.state.displayLeaderInfo?"true":"false")+";;;"+(this.state.mergeLeaderWeapons?"true":"false")+";;;"+(this.state.displayTransportRule?"true":"false"));
    }

    updateUsername(username:string) {
        this.setState({username:username});
        Variables.username = username;
        this.props.onNameDisplayChange(username+";;;"+this.state.displayFirst+";;;"+(this.state.displayLeaderInfo?"true":"false")+";;;"+(this.state.mergeLeaderWeapons?"true":"false")+";;;"+(this.state.displayTransportRule?"true":"false"));
    }

    render(){
        const textStyle = {fontSize:Variables.fontSize.big, marginBottom:10, backgroundColor:this.state.accent, padding:6, borderRadius:6};
        const sectionStyle= {backgroundColor:this.state.bg, marginBottom:10, padding:4, borderRadius:4};
        return <View style={{padding:10, width:"100%"}}>
            <View>
                <Button onPress={(e)=>this.props.navigation.goBack()} style={{width:100, position:"absolute", right:0}}>Back</Button>
                <Button onPress={(e)=>this.restoreToDefaults()} style={{width:100, position:"absolute", right:120}}>Restore defaults</Button>
            </View>
            <ScrollView style={{marginTop:50}} onLayout={(event)=> this.setState({svLayout:event.target})}>
                <View style={sectionStyle}>
                    
                    <View style={{flexDirection:"row", paddingBottom:10}}>
                        <View style={{width:"18%", marginRight:10}}>
                            <Text style={textStyle}>Username</Text>
                            <AutoExpandingTextInput multiline editable value={this.state.username} onSubmit={text=>this.updateUsername(text)} />
                        </View>
                        <View style={{width:"24%", marginRight:10}}>
                            <Text style={textStyle}>Display First</Text>
                            <RadioButtonGroup selected={this.state.displayFirst} onSelected={(e)=>this.updateDisplayFirst(e)} radioBackground={this.state.accent} containerStyle={{flexDirection:"row", justifyContent:"center"}} containerOptionStyle={{margin:5, marginLeft:5, marginRight:5}}>
                                <RadioButtonItem value="melee" label={<Text>Melee</Text>}/>
                                <RadioButtonItem value="ranged" label={<Text>Ranged</Text>}/>
                            </RadioButtonGroup>
                        </View>
                        <View style={{width:"55%", height:"100%"}}>
                            <Text style={textStyle}>Other Display Info</Text>
                            <View style={{flexDirection:"row"}}>
                                <View style={{flexDirection:"row", justifyContent:"center", alignItems:"center", paddingRight:10, paddingBottom:4, height:40}}>
                                    <Checkbox value={this.state.displayLeaderInfo} onValueChange={value=>this.updateDisplayLeaderInfo(value, this)} style={{marginRight:4}}/>
                                    <Text>Leader Rule</Text>
                                </View>
                                <View style={{flexDirection:"row", justifyContent:"center", alignItems:"center", paddingRight:10, paddingBottom:4, height:40}}>
                                    <Checkbox value={this.state.mergeLeaderWeapons} onValueChange={value=>this.updateMergeLeaderWeapons(value, this)} style={{marginRight:4}}/>
                                    <Text>Merge Weapons</Text>
                                </View>
                                <View style={{flexDirection:"row", justifyContent:"center", alignItems:"center", paddingRight:10, paddingBottom:4, height:40}}>
                                    <Checkbox value={this.state.displayTransportRule} onValueChange={value=>this.updateDisplayTransportInfo(value, this)} style={{marginRight:4}}/>
                                    <Text>Transport Rule</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                    <Text style={textStyle}>Unit Categories (separated by , ) :</Text>
                    <AutoExpandingTextInput multiline editable value={this.state.unitCategoriesText} onSubmit={text=>this.tryUpdateUnitCategories(text)} />
                </View>
                <View style={sectionStyle}>
                    <Text style={textStyle}>Premade Themes :</Text>
                    <View style={{flexDirection:"row", flexWrap:"wrap", width:"100%"}}>
                        <Button style={{width:"32%"}} forceColour="rgb(252, 233, 236)" onPress={(e)=>this.setColours(Themes.DEFAULT)}>Default</Button>
                        <Button style={{width:"32%"}} forceColour="rgb(0, 78, 76)" onPress={(e)=>this.setColours(Themes.THORNS)}>Order of the Blessed Thorn</Button>
                        <Button style={{width:"32%"}} forceColour="rgb(128, 0, 8)" onPress={(e)=>this.setColours(Themes.EATERS)}>World Eaters</Button>
                        <Button style={{width:"32%"}} forceColour="rgb(79,149,84)" onPress={(e)=>this.setColours(Themes.PLAGUE)}>Death Guard</Button>
                        <Button style={{width:"32%"}} forceColour="rgb(31,83,187)" onPress={(e)=>this.setColours(Themes.THOUSAND)}>Thousand Sons</Button>
                        <Button style={{width:"32%"}} forceColour="rgb(145,220,255)" onPress={(e)=>this.setColours(Themes.WOLVES)}>Space Wolves</Button>
                        <Button style={{width:"32%"}} forceColour="rgb(16,30,8)" onPress={(e)=>this.setColours(Themes.ANGELS)}>Dark Angels</Button>
                        <Button style={{width:"32%"}} forceColour="rgb(181,13,0)" onPress={(e)=>this.setColours(Themes.SORORITAS)}>Adepta Sororitas</Button>
                        <Button style={{width:"32%"}} forceColour="rgb(91,0,135)" onPress={(e)=>this.setColours(Themes.NIDS)}>Tyranids</Button>
                    </View>
                </View>
                <View style={sectionStyle}>
                    <View style={{flexDirection:"row", paddingTop:30, paddingBottom:30}}>
                        <View style={{width:"50%"}}>
                            <Text style={textStyle}>Change Theme Colours :</Text>
                            <Button onPress={(e)=>this.editColour(Colour.BG)} forceColour={this.state.bg}>{"Background - " + this.state.bg}</Button>
                            <Button onPress={(e)=>this.editColour(Colour.ACCENT)} forceColour={this.state.accent}>{"Title Background - " + this.state.accent}</Button>
                            <Button onPress={(e)=>this.editColour(Colour.LIGHT)} forceColour={this.state.light}>{"Subtitle Background - " + this.state.light}</Button>
                            <Button onPress={(e)=>this.editColour(Colour.MAIN)} forceColour={this.state.main}>{"Accent  - " + this.state.main}</Button>
                            <Button onPress={(e)=>this.editColour(Colour.DARK)} forceColour={this.state.dark}>{"Text - " + this.state.dark}</Button>
                        </View>
                        <View style={{width:"40%", paddingTop:40, paddingLeft:"5%"}}>
                            {this.state.editingColour&&<ColorPicker oldColor={this.state.editingColour} onColorChange={colour=> this.applyColourChange(colour)} onColorSelected={()=>this.setState({editingColour:null})} style={{height:200}} sliderComponent={Slider}/>}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>;
    }
}
//

export default Options;