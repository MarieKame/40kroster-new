import React from "react";
import {View, BackHandler, Platform, Image} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import JSZip from "jszip";
import * as DocumentPicker from 'expo-document-picker';
import * as Font from 'expo-font';
import * as expoFS from 'expo-file-system';
import fastXMLParser from 'fast-xml-parser';

import Text from './Components/Text';

import RosterMenuEntry from './RosterMenuEntry';
import Roster from './Roster';
import Button from "./Components/Button";
import Variables from "../Style/Variables";
import Options from './Options';


enum DisplayStateType {
    MENU, DISPLAY_ROSTER, OPTIONS
}

const STORAGE_KEY = "stored_rosters_40k_app";

const getData = async () => {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEY);
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
        loaded:false
    };

    async fetchFonts (that) {
        await Font.loadAsync({
            'Space-Marine': require('../assets/fonts/SpaceMarine-Nominal.ttf'),
            'Warhammer-Normal': require('../assets/fonts/VipnagorgiallaRg-Regular.ttf'),
            'Warhammer-Italic': require('../assets/fonts/VipnagorgiallaRg-Italic.ttf'),
            'Warhammer-Bold': require('../assets/fonts/VipnagorgiallaRg-Bold.ttf'),
            'Warhammer-ItalicBold': require('../assets/fonts/VipnagorgiallaRg-BoldItalic.ttf'),
        }).then(()=>{that.setState({loaded:true})});
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
        this.setState({Rosters : newRosterList});
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

    async loadData(that){
        getData().then((rostersJson) => {
            if (rostersJson) {
                that.setState({
                    Rosters:JSON.parse(rostersJson)
                });
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
        let rosterName = this.Validate(rosterXml);
        console.log(rosterName);
        if (rosterName && rosterXml){
            let newRosterList = this.state.Rosters;
            newRosterList.push(new RosterMenuEntry(rosterName, rosterXml));
            this.updateRosterList(newRosterList);
            this.setState({
                Errors:{
                    rosterFile: null
                },
                DisplayState:DisplayStateType.MENU
            });
        }
    }

    RosterLoaded(cost:string) {
        let rosters = this.state.Rosters;
        rosters[this.state.CurrentRoster].Cost = cost;
        this.updateRosterList(rosters);
    }

    render() {

        if (!this.state.loaded){
            return (<View />);
        }
        let that = this;

        function displayMenuItem(rosters?: Array<RosterMenuEntry>) {
            if (!rosters) return "";
            return rosters.map((roster, index) => 
                <View style={{flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', width:"100%"}} key={index}>
                    <View style={{width:"50%", flexDirection:"row"}}>
                        <Button onPress={(e) => that.viewRoster(index)} style={{flex:1, height:60}}>{roster.Name}{roster.Cost&&("\n( "+roster.Cost+" )")}</Button>
                        <Button onPress={(e) => that.deleteRoster(index)} textStyle={{fontSize:20}} style={{width:44}} weight="light">🗑</Button>
                    </View>
                </View>)
        }
        let mainScreen;
        switch(this.state.DisplayState) {
            case DisplayStateType.MENU :
                mainScreen= 
                    <View style={{padding:10, width:Variables.width}}>
                        <View style={{flexDirection:"row", width:"100%", backgroundColor:Variables.colourBg, borderRadius:4}}>
                            <Text style={{fontFamily:Variables.fonts.spaceMarine, verticalAlign:"middle", flex:1, textAlign:"center", textDecorationLine:"underline"}}>Sammie's Roster List</Text>
                            <Button onPress={(e)=>this.docPicker(this)} textStyle={{fontSize:20}}>+</Button>
                            <Button onPress={(e)=>this.setState({DisplayState:DisplayStateType.OPTIONS})} image={true}><Image style={{width:20, height:20}} source={require("../assets/images/gear.png")}/></Button>
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
                mainScreen=<Options onBack={(e)=>this.setState({DisplayState: DisplayStateType.MENU})} />;
        }
        return <View style={{width:Variables.width, borderWidth:1, borderColor:Variables.colourDark, borderRadius:Variables.boxBorderRadius, height:"100%"}}>
            {mainScreen}
            </View>;
    };
};

export default Menu;