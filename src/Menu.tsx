import React, { Component, useMemo } from "react";
import {View, BackHandler, Platform, Image} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import JSZip from "jszip";
import * as DocumentPicker from 'expo-document-picker';
import * as NavigationBar from 'expo-navigation-bar';
import * as Font from 'expo-font';
import * as expoFS from 'expo-file-system';
import fastXMLParser from 'fast-xml-parser';
import { DefaultTheme, NavigationContainer, NavigationProp } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();

import Text from './Components/Text';

import RosterMenuEntry from './RosterMenuEntry';
import Roster from './Roster';
import Button from "./Components/Button";
import Variables from "../Style/Variables";
import Options from './Options';
import { KameContext } from "../Style/KameContext";
import { Colour } from "./Options";
import { DescriptorData, LeaderData } from "./UnitData";
import Popup, { PopupOption } from "./Components/Popup";
import RosterMenu from "./RosterMenu";

const STORAGE_KEY = "stored_rosters_40k_app";
const COLOURS_KEY = "stored_colours_40k_app";
const UNIT_CATEGORIES_KEY = "stored_unit_categories_40k_app";
const NAME_DISPLAY_KEY = "stored_name_display_40k_app";
const LEADERS_KEY = "stored_leaders_40k_app";
const NOTES_KEY = "stored_notes_40k_app";

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

class LeaderDataEntry {
    Data:Array<LeaderData>;
    RosterName:string;

    constructor(data:Array<LeaderData>, rosterName:string) {
        this.Data = data;
        this.RosterName = rosterName;
    }
}

class NoteEntry{
    Data:Array<Array<DescriptorData>>;
    RosterName:string;

    constructor(data:Array<Array<DescriptorData>>, rosterName:string) {
        this.Data = data;
        this.RosterName = rosterName;
    }
}

class Menu extends React.Component{
    public static Instance:Menu;
    
    state = {
        Rosters: new Array<RosterMenuEntry>(),
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
        colourGrey:"rgb(245,245,245)",
        LeadersData:new Array<LeaderDataEntry>(),
        NotesData:new Array<NoteEntry>(),
        popupQuestion:null,
        popupOptions:null,
        popupDefault:null,
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
        Menu.Instance = this;

        /*if(localSearchParams?.shareIntent && localSearchParams?.shareIntent) {
            console.log(localSearchParams?.shareIntent);
        }*/
    };

    updateRosterList(newRosterList) {
        this.setState({Rosters : newRosterList, Errors:{
            rosterFile: null
        }});
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newRosterList));
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

    async docPicker(that:Menu) {
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
        //await expoFS.readDirectoryAsync("file://data/net.battlescribe.mobile.rostereditor/files/rosters").then(dir=>console.log(dir));
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
                Variables.displayLeaderInfo = split[2]=="true";
                Variables.mergeLeaderWeapons = split[3]=="true";
                Variables.displayTransportRule = split[4]=="true";
            }
        });
        getData(LEADERS_KEY).then((leadersJson)=>{
            if (leadersJson) {
                const parsed = JSON.parse(leadersJson);
                that.setState({LeadersData:parsed});
            }
        });
        getData(NOTES_KEY).then((notesJson)=>{
            if (notesJson) {
                const parsed = JSON.parse(notesJson);
                that.setState({NotesData:parsed});
            }
        });
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
        function add(initialRoster:Array<RosterMenuEntry>, that:Menu){
            let newRosterList = initialRoster;
            newRosterList.push(new RosterMenuEntry(rosterName, rosterXml));
            that.updateRosterList(newRosterList);
        }
        let rosterName = this.Validate(rosterXml);
        let that = this;
        if (rosterName && rosterXml){
            if (this.state.Rosters.find(roster=>rosterName==roster.Name)){
                this.CallPopup(
                    "There is already a roster with this name; overwrite?",
                    [{option:"Yes", callback:()=>{
                        let leadersData = that.state.LeadersData;
                        leadersData.splice(that.FindLeaderDataIndex(rosterName, that), 1)
                        that.setState({LeadersData:leadersData});
                        AsyncStorage.setItem(LEADERS_KEY, JSON.stringify(leadersData));
                        let rosterList = that.state.Rosters;
                        rosterList.splice(rosterList.findIndex(roster=>roster.Name==rosterName), 1);
                        add(rosterList, that);
                    }}],
                    "No"
                )
            } else {
                add(that.state.Rosters, that);
            }
        }
    }

    RosterLoaded(cost:string) {
        let rosters = this.state.Rosters;
        rosters[this.state.CurrentRoster].Cost = cost;
        this.updateRosterList(rosters);
    }

    FindCurrentLeaderData(that:Menu):Array<LeaderData>|null {
        const index = that.FindLeaderDataIndex(that.state.Rosters[that.state.CurrentRoster].Name, that);
        return index===-1?null:that.state.LeadersData[index].Data;
    }

    FindLeaderDataIndex(name:string, that:Menu):number {
        return that.state.LeadersData.findIndex(leaderData=>leaderData.RosterName==name);
    }

    SaveLeadersData(leaders:Array<LeaderData>, name:string, that:Menu){
        const index = this.FindLeaderDataIndex(name, that);
        let leadersData = this.state.LeadersData;
        if (index !== -1) {
            leadersData.splice(index, 1);
        }
        leadersData.push(new LeaderDataEntry(leaders, name));
        this.setState({LeadersData:leadersData});
        AsyncStorage.setItem(LEADERS_KEY, JSON.stringify(leadersData));
    }

    FindCurrentNotesData(that:Menu):Array<Array<DescriptorData>> {
        const index = that.FindNotesIndex(that.state.Rosters[that.state.CurrentRoster].Name, that);
        return index===-1?new Array<Array<DescriptorData>>():that.state.NotesData[index].Data;
    }

    FindNotesIndex(name:string, that:Menu):number {
        return that.state.NotesData.findIndex(noteData=>noteData.RosterName==name);
    }

    SaveNotes(notes:Array<Array<DescriptorData>>, name:string, that:Menu){
        const index = this.FindNotesIndex(name, that);
        let notesData = this.state.NotesData;
        if (index !== -1) {
            notesData.splice(index, 1);
        }
        notesData.push(new NoteEntry(notes, name));
        this.setState({NotesData:notesData});
        AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notesData));
    }

    CallPopup(question:string, options:Array<PopupOption>,def:string){
        this.setState({
            popupQuestion:question,
            popupOptions:options,
            popupDefault:def,
        });
    }

    render() {
        if (!(this.state.fontsLoaded && this.state.coloursLoaded && this.state.storageLoaded)){
            return (<View />);
        }
        NavigationBar.setVisibilityAsync("hidden");
        let that = this;

        const config = {
            animation: 'spring',
            config: {
              stiffness: 1000,
              damping: 500,
              mass: 3,
              overshootClamping: true,
              restDisplacementThreshold: 0.01,
              restSpeedThreshold: 0.01,
            },
          };

        return  <KameContext.Provider value={{Main:this.state.colourMain, Dark: this.state.colourDark, Bg:this.state.colourBg, Accent:this.state.colourAccent, LightAccent:this.state.colourLightAccent, Grey:this.state.colourGrey, Popup:this.CallPopup}}> 
                    <NavigationContainer theme={{...DefaultTheme, colors:{...DefaultTheme.colors, background:"transparent"}}} >
                        <Stack.Navigator initialRouteName="Home" screenOptions={{headerShown: false}}>
                            <Stack.Screen name="Home" options={{animation:"slide_from_left"}}>
                                {(props)=> <MenuDisplay {...props} that={this}/>}
                            </Stack.Screen>
                            <Stack.Screen name="Roster" options={{animation:"slide_from_right", animationTypeForReplace:"pop"}}>
                                {(props)=> <Roster {...props} 
                                    XML={that.state.Rosters[this.state.CurrentRoster].XML} 
                                    forceLeaders={that.FindCurrentLeaderData(that)} 
                                    onLoad={(e)=>this.RosterLoaded(e)} 
                                    onUpdateLeaders={(newLeaders)=>this.SaveLeadersData(newLeaders, this.state.Rosters[this.state.CurrentRoster].Name, that)}
                                    onUpdateNotes={notes=>this.SaveNotes(notes, this.state.Rosters[this.state.CurrentRoster].Name, that)}
                                    Notes={that.FindCurrentNotesData(that)} 
                                    />}
                            </Stack.Screen>
                            <Stack.Screen name="RosterMenu" options={{animation:"fade"}}>
                                {(props)=> <RosterMenu {...props}/>}
                            </Stack.Screen>
                            <Stack.Screen name="Options" options={{animation:"slide_from_right"}}>
                                {(props)=> <Options {...props} onColourChange={(colour:Colour, value:string)=>this.applyColourChangeGlobally(colour, value, this)} onCategoriesChange={this.saveUnitCategoriesChange} onReset={(colours)=>this.resetColours(colours, this)} onNameDisplayChange={(nd)=>this.saveNameDisplayChange(nd)}/>}
                            </Stack.Screen>
                        </Stack.Navigator>
                    </NavigationContainer>
                    <Popup question={this.state.popupQuestion} options={this.state.popupOptions} default={this.state.popupDefault} key={this.state.popupQuestion} />
                </KameContext.Provider>;
    };
};

interface MenuDisplayProps{
    that:Menu,
    navigation:{navigate}
}
class MenuDisplay extends Component<MenuDisplayProps> {
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;

    viewRoster(index) {
        Menu.Instance.setState({
            CurrentRoster:index
        });
        this.props.navigation.navigate("Roster");
    }

    deleteRoster(index) {
        let newRosterList = Menu.Instance.state.Rosters;
        const rosterName = Menu.Instance.state.Rosters[index].Name;

        newRosterList.splice(index, 1);
        Menu.Instance.updateRosterList(newRosterList);
        
        const leaderDataIndex = Menu.Instance.FindLeaderDataIndex(rosterName, Menu.Instance);
        if (leaderDataIndex !== -1) {
            Menu.Instance.SaveLeadersData(null, rosterName, Menu.Instance);
        }
    }

    displayMenuItem(rosters: Array<RosterMenuEntry>) {
        if (!rosters) return "";
        const that = this;
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
 
    render(){
        return <View style={{padding:10, width:Variables.width}}>
            <View style={{flexDirection:"row", width:"100%", backgroundColor:this.context.Bg, borderRadius:4}}>
                <Text style={{fontFamily:Variables.fonts.spaceMarine, verticalAlign:"middle", flex:1, textAlign:"center", textDecorationLine:"underline"}}>{Variables.username}'s Roster List</Text>
                <Button onPress={(e)=>this.props.that.docPicker(Menu.Instance)} textStyle={{fontSize:20}}>+</Button>
                <Button onPress={(e)=>this.props.navigation.navigate('Options')} image={true}><Image style={{width:20, height:20, tintColor:this.context.Dark, marginLeft:3}} source={require("../assets/images/gear.png")}/></Button>
            </View>
            <View>{this.displayMenuItem(this.props.that.state.Rosters)}</View>
        </View>
    }
}

export default Menu;