import React, { Component } from "react";
import {View, Platform, Image} from 'react-native';
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
import Roster from './RosterView/Roster';
import Button from "./Components/Button";
import Variables from "./Variables";
import Options from './Options';
import { KameContext } from "../Style/KameContext";
import { Colour } from "./Options";
import Popup, { PopupOption } from "./Components/Popup";
import RosterMenu from "./RosterView/RosterMenu";
import BuilderMenu from "./RosterBuilder/BuilderMenu";
import RosterRaw, { LeaderDataRaw, NoteRaw } from "./Roster/RosterRaw";
import { FlatList, GestureHandlerRootView, ScrollView } from "react-native-gesture-handler";

const STORAGE_KEY = "stored_rosters_40k_app";
const COLOURS_KEY = "stored_colours_40k_app";
const UNIT_CATEGORIES_KEY = "stored_unit_categories_40k_app";
const NAME_DISPLAY_KEY = "stored_name_display_40k_app";
const ROSTERS_KEY = "stored_new_rosters_40k_app";

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
    public static Instance:Menu;
    
    state = {
        Rosters: new Array<RosterRaw>(),
        EditingRoster:null,
        CurrentRoster: -1,
        fontsLoaded:false,
        storageLoaded:false,
        coloursLoaded:false,
        colourMain:"rgb(255,0,0)",
        colourDark:"rgb(0,0,0)",
        colourLightAccent:"rgb(252, 233, 236)",
        colourAccent:"rgb(255,180,180)",
        colourBg:"rgba(255,255,255,0.9)",
        colourGrey:"rgb(245,245,245)",
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
            console.debug(localSearchParams?.shareIntent);
        }*/
    };

    updateRosterList(newRosterList) {
        this.DoSave(newRosterList);
    }

    jszipLoadAsync(that, file) {
        JSZip.loadAsync(file, {base64:true}).then(function (zip) {
            zip.forEach((path, file)=> {
                file.async('text').then((text) => {
                    that.tryAddRoster(text);
                });
            });
        }).catch((error)=>{
           console.error(error);
        });
    }

    async handleUri(that:Menu, uri:string, rosz:boolean){
        expoFS.readAsStringAsync(uri, {encoding:"base64"}).then((file) => {
            that.jszipLoadAsync(that, file);
        }).catch((e)=>{
            console.error(e);
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
        //await expoFS.readDirectoryAsync("file://data/net.battlescribe.mobile.rostereditor/files/rosters").then(dir=>console.debug(dir));
        getData(ROSTERS_KEY).then((rostersJson) => {
            if (rostersJson) {
                that.setState({
                    Rosters:JSON.parse(rostersJson),
                    storageLoaded:true
                });
            } else {
                this.setState({
                    Rosters:new Array<RosterRaw>(),
                    storageLoaded:true});
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
    }

    Validate(xml):string|null {
        let valid = null;
        try{
            const parser = new fastXMLParser.XMLParser({ignoreAttributes:false, attributeNamePrefix :"_"});
            valid = parser.parse(xml).roster._name;
        } catch(e) {
            console.error(e);
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
                        /*let leadersData = that.state.LeadersData;
                        leadersData.splice(that.FindLeaderDataIndex(rosterName, that), 1)
                        that.setState({LeadersData:leadersData});
                        AsyncStorage.setItem(LEADERS_KEY, JSON.stringify(leadersData));
                        let rosterList = that.state.Rosters;
                        rosterList.splice(rosterList.findIndex(roster=>roster.Name==rosterName), 1);
                        add(rosterList, that);*/
                    }}],
                    "No"
                )
            } else {
                //add(that.state.Rosters, that);
            }
        }
    }

    SaveLeadersData(leaders:Array<LeaderDataRaw>){
        let rosters = Menu.Instance.state.Rosters;
        let roster = rosters[Menu.Instance.state.CurrentRoster];
        roster.LeaderData = leaders;
        rosters[Menu.Instance.state.CurrentRoster] = roster;
        Menu.Instance.DoSave(rosters);
    }

    SaveNotes(notes:Array<NoteRaw>){
        let rosters = Menu.Instance.state.Rosters;
        let roster = rosters[Menu.Instance.state.CurrentRoster];
        roster.Notes = notes;
        rosters[Menu.Instance.state.CurrentRoster] = roster;
        Menu.Instance.DoSave(rosters);
    }

    CallPopup(question:string, options:Array<PopupOption>,def:string){
        Menu.Instance.setState({
            popupQuestion:question,
            popupOptions:options,
            popupDefault:def
        });
    }

    onPopupClose(that:Menu){
        that.setState({
            popupQuestion:"",
            popupOptions:[],
            popupDefault:""
        })
    }

    OnSaveRoster(roster:RosterRaw){
        let rosters = Menu.Instance.state.Rosters;
        let foundIndex;
        if(Menu.Instance.state.EditingRoster){
            foundIndex = rosters.findIndex(r=>r.Name===Menu.Instance.state.EditingRoster.Name);
        }else {
            foundIndex = rosters.findIndex(r=>r.Name===roster.Name);
        }
        if(foundIndex!==-1) {
            rosters[foundIndex]=roster;
        } else {
            rosters.push(roster)
        }
        Menu.Instance.DoSave(rosters);
    }

    private DoSave(rosters:Array<RosterRaw>) {
        AsyncStorage.setItem(ROSTERS_KEY, JSON.stringify(rosters));
        Menu.Instance.setState({rosters:rosters});
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
                                {(props)=> <MenuDisplay {...props} that={this} Popup={this.CallPopup}/>}
                            </Stack.Screen>
                            <Stack.Screen name="Roster" options={{animation:"slide_from_right", animationTypeForReplace:"pop"}}>
                                {(props)=> <Roster {...props} 
                                    OnUpdateLeaders={(leaders)=>this.SaveLeadersData(leaders)}
                                    OnUpdateNotes={(notes)=>this.SaveNotes(notes)}
                                    Data={this.state.Rosters[this.state.CurrentRoster]} 
                                    />}
                            </Stack.Screen>
                            <Stack.Screen name="RosterMenu" options={{animation:"fade"}}>
                                {(props)=> <RosterMenu {...props}/>}
                            </Stack.Screen>
                            <Stack.Screen name="Options" options={{animation:"slide_from_right"}}>
                                {(props)=> <Options {...props} onColourChange={(colour:Colour, value:string)=>this.applyColourChangeGlobally(colour, value, this)} onCategoriesChange={this.saveUnitCategoriesChange} onReset={(colours)=>this.resetColours(colours, this)} onNameDisplayChange={(nd)=>this.saveNameDisplayChange(nd)}/>}
                            </Stack.Screen>
                            <Stack.Screen name="RosterBuilder" options={{animation:"fade"}}>
                                {(props)=> <BuilderMenu {...props} 
                                    Popup={this.CallPopup} 
                                    NamesTaken={this.state.Rosters.map(r=>r.Name)} 
                                    OnSaveRoster={this.OnSaveRoster} 
                                    EditingRoster={this.state.EditingRoster}
                                    OnExit={()=>{
                                        Menu.Instance.setState({EditingRoster:null});
                                    }}
                                    />}
                            </Stack.Screen>
                        </Stack.Navigator>
                    </NavigationContainer>
                    <Popup question={this.state.popupQuestion} options={this.state.popupOptions} default={this.state.popupDefault} onClose={e=>this.onPopupClose(this)} key={this.state.popupQuestion} />
                </KameContext.Provider>;
    };
};

interface MenuDisplayProps{
    that:Menu;
    navigation:{navigate};
    Popup:(question:string, options:Array<PopupOption>,def:string)=>void;
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

    duplicateRoster(index) {
        let newRosterList = Menu.Instance.state.Rosters;
        const roster = newRosterList[index];

        let duplicate = JSON.parse(JSON.stringify(roster));

        let i=2;
        while(newRosterList.findIndex(r=>r.Name===(roster.Name+i))!==-1) {
            i++;
        }
        duplicate.Name = roster.Name+i;

        newRosterList.push(duplicate);
        Menu.Instance.updateRosterList(newRosterList);
    }

    deleteRoster(index) {
        let newRosterList = Menu.Instance.state.Rosters;
        newRosterList.splice(index, 1);
        Menu.Instance.updateRosterList(newRosterList);
    }

    displayMenuItem(rosters: Array<RosterRaw>) {
        if (!rosters) return "";
        const that = this;
        return <FlatList numColumns={2} data={rosters} renderItem={render=>
            <View style={{flexBasis:"50%", flexDirection:"row"}} key={render.index}>
                <Button key="name" onPress={(e) => that.viewRoster(render.index)} style={{flex:1, height:60}} mergeRight>
                    <Text style={{fontFamily:Variables.fonts.spaceMarine}}>{render.item.Name}</Text>
                    <Text style={{fontFamily:Variables.fonts.WHI}}>{"\n"+render.item.Faction}</Text>
                    <Text>{("\n( "+render.item.Cost+" pts )")}</Text>
                </Button>
                <Button key="modify" onPress={(e) => {
                    Menu.Instance.setState({EditingRoster:render.item}); 
                        this.props.navigation.navigate("RosterBuilder");
                    }} 
                    textStyle={{fontSize:20}} 
                    style={{width:44}} 
                    mergeLeft 
                    mergeRight>✎</Button>
                <Button key="options" onPress={(e) => {
                        that.props.Popup("How to modify this roster", 
                        [{
                            option:"Duplicate (x2)",
                            callback:()=>{
                                that.duplicateRoster(render.index);
                            }
                        },{
                            option:"Delete (🗑)",
                            callback:()=>{
                                that.deleteRoster(render.index);
                            }
                        }], 
                        "Cancel")
                    }} 
                    textStyle={{fontSize:20}} 
                    style={{width:44}} 
                    mergeLeft>☰</Button> 
            </View>
        } />;
    }
 
    render(){
        return [<GestureHandlerRootView key="rosters"><View style={{padding:10, width:Variables.width}}>
            <View style={{flexDirection:"row", width:"100%", backgroundColor:this.context.Bg, borderRadius:4}}>
                <Text style={{fontFamily:Variables.fonts.spaceMarine, verticalAlign:"middle", flex:1, textAlign:"center", textDecorationLine:"underline"}}>{Variables.username}'s Roster List</Text>
                <Button onPress={(e)=>
                {
                    Menu.Instance.CallPopup(
                        "How do you want to add a new roster?", [
                            {option:"Import from BattleScribe", callback:()=>{
                                this.props.that.docPicker(Menu.Instance)
                            }},
                            {option:"Generate", callback:()=>{
                                this.props.navigation.navigate("RosterBuilder");
                            }},
                        ],
                        "Cancel")
                }} textStyle={{fontSize:20}}>+</Button>
                <Button onPress={(e)=>this.props.navigation.navigate('Options')} image={true}><Image style={{width:20, height:20, tintColor:this.context.Dark, marginLeft:3}} source={require("../assets/images/gear.png")}/></Button>
            </View>
            <View style={{height:Variables.height*0.8}}>{this.displayMenuItem(this.props.that.state.Rosters)}</View>
        </View></GestureHandlerRootView>,
        <View key="app version" style={{position:"absolute", right:20, bottom:0}}><Text>App Version : {require('../app.json').expo.version}</Text></View>]
    }
}

export default Menu;