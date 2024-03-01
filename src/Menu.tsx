import React from "react";
import {View, BackHandler, Platform, Image} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import JSZip from "jszip";
import * as DocumentPicker from 'expo-document-picker';
import * as NavigationBar from 'expo-navigation-bar';
import * as Font from 'expo-font';
import * as expoFS from 'expo-file-system';
import fastXMLParser from 'fast-xml-parser';

import Text from './Components/Text';

import RosterMenuEntry from './RosterMenuEntry';
import Roster from './Roster';
import Button from "./Components/Button";
import Variables from "../Style/Variables";
import Options from './Options';
import { ColoursContext } from "../Style/ColoursContext";
import { Colour } from "./Options";

enum DisplayStateType {
    MENU, DISPLAY_ROSTER, OPTIONS
}

const STORAGE_KEY = "stored_rosters_40k_app";
const COLOURS_KEY = "stored_colours_40k_app";
const UNIT_CATEGORIES_KEY = "stored_unit_categories_40k_app";
const NAME_DISPLAY_KEY = "stored_name_display_40k_app";

const getData = async (key:string) => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        return value;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

class Menu extends React.Component{
    state = {
        Rosters: new Array<RosterMenuEntry>(),
        DisplayState: DisplayStateType.MENU,
        Errors: {
            rosterFile: null
        },
        CurrentRoster: 0,
        fontsLoaded:false,
        storageLoaded:false,
        coloursLoaded:false,
        colourMain:"rgb(255,0,0)",
        colourDark:"rgb(0,0,0)",
        colourLightAccent:"rgb(252, 233, 236)",
        colourAccent:"rgb(255,180,180)",
        colourBg:"rgba(255,255,255,0.9)",
        colourGrey:"rgb(245,245,245)"
    };

    async fetchFonts (that) {
        await Font.loadAsync({
            'Space-Marine': require('../assets/fonts/SpaceMarine-Nominal.ttf'),
            'Warhammer-Normal': require('../assets/fonts/VipnagorgiallaRg-Regular.ttf'),
            'Warhammer-Italic': require('../assets/fonts/VipnagorgiallaRg-Italic.ttf'),
            'Warhammer-Bold': require('../assets/fonts/VipnagorgiallaRg-Bold.ttf'),
            'Warhammer-ItalicBold': require('../assets/fonts/VipnagorgiallaRg-BoldItalic.ttf'),
        }).then(()=>{that.setState({fontsLoaded:true})});
    }
    
    constructor(props) {
        super(props);
        this.loadData(this);
        this.fetchFonts(this);
        let that = this;

        try{
            BackHandler.addEventListener('hardwareBackPress', function () {
                switch(that.state.DisplayState) {
                    case DisplayStateType.MENU : 
                        return false;
                    case DisplayStateType.DISPLAY_ROSTER : 
                        that.setState({DisplayState:DisplayStateType.MENU});
                        return true;
                    case DisplayStateType.OPTIONS : 
                        that.setState({DisplayState:DisplayStateType.MENU});
                        return true;
                }
                return false;
              });
        } catch(e) {}
    };

    updateRosterList(newRosterList) {
        this.setState({Rosters : newRosterList, Errors:{
            rosterFile: null
        }});
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newRosterList));
    }

    viewRoster(index) {
        this.setState({
            CurrentRoster:index, 
            DisplayState: DisplayStateType.DISPLAY_ROSTER
        });
    }
    deleteRoster(index) {
        let newRosterList = this.state.Rosters;
        newRosterList.splice(index, 1);
        this.updateRosterList(newRosterList);
    }

    jszipLoadAsync(that, file) {
        JSZip.loadAsync(file, {base64:true}).then(function (zip) {
            zip.forEach((path, file)=> {
                file.async('text').then((text) => {
                    that.tryAddRoster(text);
                });
            });
        }).catch((error)=>{
           console.log(error);
        });
    }

    async handleUri(that:Menu, uri:string, rosz:boolean){
        expoFS.readAsStringAsync(uri, {encoding:"base64"}).then((file) => {
            that.jszipLoadAsync(that, file);
        }).catch((e)=>{
            console.log(e);
        });
    }

    async docPicker(that) {
        DocumentPicker.getDocumentAsync().then((response) => {
        if (!response.canceled && response.assets.length > 0) {
            let asset = response.assets[0];
            if (asset) {
                if (Platform.OS === "android") {
                    that.handleUri(that, asset.uri, asset.name.includes(".rosz"));
                } else {
                    if (asset.name.includes(".rosz")){
                        that.jszipLoadAsync(that, asset.file);
                    } else {
                        const reader = new FileReader();
                        reader.onload = ((data)=>{
    
                            that.tryAddRoster(data);
                        });
                        reader.readAsText(asset.file);
                    }
                }
                
                }
            }
        });
    }

    getColoursAsString():string{
        return this.state.colourDark+';'+this.state.colourBg+';'+this.state.colourAccent+';'+this.state.colourLightAccent+';'+this.state.colourMain+';'+this.state.colourGrey;
    }

    LoadColoursFromString(colours:string) {
        const split = colours.split(';');
        this.state.colourDark = split[0];
        this.state.colourBg = split[1];
        this.state.colourAccent = split[2];
        this.state.colourLightAccent = split[3];
        this.state.colourMain = split[4];
        this.state.colourGrey = split[5];
    }

    applyColourChangeGlobally(colour:Colour, value:string, that:Menu) {
        switch(colour){
            case Colour.BG:
                that.setState({colourBg:value}, ()=>AsyncStorage.setItem(COLOURS_KEY, that.getColoursAsString()))
                break;
            case Colour.MAIN:
                that.setState({colourMain:value}, ()=>AsyncStorage.setItem(COLOURS_KEY, that.getColoursAsString()))
                break;
            case Colour.ACCENT:
                that.setState({colourAccent:value}, ()=>AsyncStorage.setItem(COLOURS_KEY, that.getColoursAsString()))
                break;
            case Colour.LIGHT:
                that.setState({colourLightAccent:value}, ()=>AsyncStorage.setItem(COLOURS_KEY, that.getColoursAsString()))
                break;
            case Colour.DARK:
                that.setState({colourDark:value}, ()=>AsyncStorage.setItem(COLOURS_KEY, that.getColoursAsString()))
                break;
        }
    }

    saveUnitCategoriesChange(categories:string){
        AsyncStorage.setItem(UNIT_CATEGORIES_KEY, categories);
    }

    saveNameDisplayChange(nameDisplay:string) {
        AsyncStorage.setItem(NAME_DISPLAY_KEY, nameDisplay);
    }

    resetColours(colours:Array<string>, that:Menu){
        that.setState({
            colourMain:colours[0],
            colourDark:colours[1],
            colourLightAccent:colours[2],
            colourAccent:colours[3],
            colourBg:colours[4],
            colourGrey:colours[5]
        }, ()=>{
            AsyncStorage.setItem(COLOURS_KEY, that.getColoursAsString());
        });
    }

    async loadData(that){
        getData(STORAGE_KEY).then((rostersJson) => {
            if (rostersJson) {
                that.setState({
                    Rosters:JSON.parse(rostersJson),
                    storageLoaded:true
                });
            }
        });
        getData(COLOURS_KEY).then((coloursString) => {
            if (coloursString) {
                this.LoadColoursFromString(coloursString);
            }
            that.setState({coloursLoaded:true});
        });
        getData(UNIT_CATEGORIES_KEY).then((types) => {
            if (types){
                Variables.unitCategories = types.split(",").map(category=>category.trim().split(" ").map(word=>word[0].toUpperCase()+word.substring(1)).join(" "))
            }
        });
        getData(NAME_DISPLAY_KEY).then((nameDisplay)=>{
            if (nameDisplay) {
                let split = nameDisplay.split(";;;");
                Variables.username = split[0];
                Variables.displayFirst = split[1];
            }
        })
    }

    Validate(xml):string|null {
        let valid = null;
        try{
            const parser = new fastXMLParser.XMLParser({ignoreAttributes:false, attributeNamePrefix :"_"});
            valid = parser.parse(xml).roster._name;
        } catch(e) {
            console.log(e);
            this.setState({Errors:{rosterFile:"Please select a valid .ros or .rosz file"}});
        }
        return valid;
    }

    tryAddRoster(rosterXml) {
        let rosterName = this.Validate(rosterXml);
        if (rosterName && rosterXml){
            let newRosterList = this.state.Rosters;
            newRosterList.push(new RosterMenuEntry(rosterName, rosterXml));
            this.updateRosterList(newRosterList);
        }
    }

    RosterLoaded(cost:string) {
        let rosters = this.state.Rosters;
        rosters[this.state.CurrentRoster].Cost = cost;
        this.updateRosterList(rosters);
    }

    render() {
        if (!(this.state.fontsLoaded && this.state.coloursLoaded && this.state.storageLoaded)){
            return (<View />);
        }
        NavigationBar.setVisibilityAsync("hidden");
        let that = this;

        function displayMenuItem(rosters?: Array<RosterMenuEntry>) {
            if (!rosters) return "";
            return (
                <View style={{flexDirection: 'row', flexWrap: 'wrap', width:"100%"}}>
                     {rosters.map((roster, index) => 
                        <View style={{flexBasis:"50%", flexDirection:"row"}} key={index}>
                            <Button onPress={(e) => that.viewRoster(index)} style={{flex:1, height:60}}>{roster.Name}{roster.Cost&&("\n( "+roster.Cost+" )")}</Button>
                            <Button onPress={(e) => that.deleteRoster(index)} textStyle={{fontSize:20}} style={{width:44}} weight="light">🗑</Button>
                        </View>
                     )}
                </View>
                );
        }
        let mainScreen;
        switch(this.state.DisplayState) {
            case DisplayStateType.MENU :
                mainScreen= 
                    <View style={{padding:10, width:Variables.width}}>
                        <View style={{flexDirection:"row", width:"100%", backgroundColor:this.state.colourBg, borderRadius:4}}>
                            <Text style={{fontFamily:Variables.fonts.spaceMarine, verticalAlign:"middle", flex:1, textAlign:"center", textDecorationLine:"underline"}}>{Variables.username}'s Roster List</Text>
                            <Button onPress={(e)=>this.docPicker(this)} textStyle={{fontSize:20}}>+</Button>
                            <Button onPress={(e)=>this.setState({DisplayState:DisplayStateType.OPTIONS})} image={true}><Image style={{width:20, height:20, tintColor:this.state.colourDark, marginLeft:3}} source={require("../assets/images/gear.png")}/></Button>
                        </View>
                        <View>{displayMenuItem(this.state.Rosters)}</View>
                    </View>
                ;
                break;
            case DisplayStateType.DISPLAY_ROSTER :
                mainScreen= <Roster XML={that.state.Rosters[this.state.CurrentRoster].XML} onBack={(e)=>this.setState({DisplayState: DisplayStateType.MENU})} onLoad={(e)=>this.RosterLoaded(e)} />
                ;
                break;
            case DisplayStateType.OPTIONS:
                mainScreen=<Options onBack={(e)=>this.setState({DisplayState: DisplayStateType.MENU})} onColourChange={(colour:Colour, value:string)=>this.applyColourChangeGlobally(colour, value, this)} onCategoriesChange={this.saveUnitCategoriesChange} onReset={(colours)=>this.resetColours(colours, this)} onNameDisplayChange={(nd)=>this.saveNameDisplayChange(nd)}/>;
        }
        return  <ColoursContext.Provider value={{Main:this.state.colourMain, Dark: this.state.colourDark, Bg:this.state.colourBg, Accent:this.state.colourAccent, LightAccent:this.state.colourLightAccent, Grey:this.state.colourGrey}}> 
                    <View style={{width:Variables.width, borderWidth:1, borderColor:this.state.colourDark, borderRadius:Variables.boxBorderRadius, height:"100%"}}>
                        {mainScreen}
                    </View>
                </ColoursContext.Provider>;
    };
};

export default Menu;