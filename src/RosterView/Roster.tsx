import React from "react";
import Unit from "./Unit";
import {UnitData} from "./UnitData";
import {View, ScrollView, Platform, FlatList, Pressable} from 'react-native';
import Variables from "../Variables";
import Button from "../Components/Button";
import {Text} from "../Components/Text";
import {KameContext} from "../../Style/KameContext";
import { Stratagem } from "./Stratagems";
import AutoExpandingTextInput from "../Components/AutoExpandingTextInput";
import Checkbox from "expo-checkbox";
import { GestureHandlerRootView, PanGestureHandler } from "react-native-gesture-handler";
import RosterRaw, { DescriptorRaw, LeaderDataRaw, NoteRaw, RuleDataRaw, UnitRaw } from "../Roster/RosterRaw";
import Each from "../Components/Each";
import axios from "axios";
import * as FileSystem from 'expo-file-system';

class Reminder{
    Data:DescriptorRaw;
    UnitName:string;
    Phase:string|null;
}

interface Props {
    navigation:{navigate},
    OnUpdateLeaders:(leaderData:Array<LeaderDataRaw>)=>void,
    OnUpdateNotes:(notesData:Array<NoteRaw>)=>void,
    Data:RosterRaw
}

enum NoteState{
    CLOSED, CUSTOM, WPN, SCAR, TRAIT
}

function StratagemsFromJson(parsedJson):Array<Stratagem> {
    function getPhases(when:string): Array<"Any" | "Command" | "Movement" | "Shooting" | "Charge" | "Fight" | number> {
        let phases = new Array<"Any" | "Command" | "Movement" | "Shooting" | "Charge" | "Fight" | number>();
        Each<string>(when.split(" "), (word)=>{
            const capitalized = word.substring(0, 1).toLocaleUpperCase() + word.substring(1).toLocaleLowerCase();
            if (capitalized === "Any") phases.push(capitalized);
            if (capitalized === "Command") phases.push(capitalized);
            if (capitalized === "Movement") phases.push(capitalized);
            if (capitalized === "Shooting") phases.push(capitalized);
            if (capitalized === "Charge") phases.push(capitalized);
            if (capitalized === "Fight") phases.push(capitalized);
        });
        return phases;
    }
    function fromParsed(name, item):Stratagem{
        return {
            Name: name,
            CP: item["cost"],
            Flavor: item["flavour"]??"",
            When: item["when"],
            Target: item["target"]??"",
            Effect: item["effect"],
            Restrictions: item["restrictions"]??"",
            Phases: getPhases(item["when"])
        }
    }
    let strats = new Array<Stratagem>();
    for(const key in parsedJson) {
        strats.push(fromParsed(key, parsedJson[key]));
    }
    return strats;
}

class Roster extends React.Component<Props> {
    static Instance:Roster;
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;
    state = {
        Faction:"",
        Detachment:"",
        CurrentUnit:0,
        Units: new Array<UnitData>(),
        UnitsToSkip: new Array<number>(),
        Rules: new Array<RuleDataRaw>(),
        Reminders:new Array<Reminder>(),
        DetachmentStratagems: new Array<Stratagem>(),

        NoteState:NoteState.CLOSED,
        NoteTitle:"",
        NoteDescription:"",
        RadioWeapon:"",
        wpnMod1:false, 
        wpnMod2:false,
        wpnMod3:false,
        wpnMod4:false,
        wpnMod5:false,
        wpnMod6:false
    }

    private async downloadFileThen(name:string, url:string, that:Roster, then:(contents)=>void) {
        if(Platform.OS==="web") {
            axios.get(url).then(async(res)=>{
                then(res.data);
            }).catch((error)=>{console.error(error);})
        } else {
            //TODO: add date to file, see if it already exists, and update only if too old (more than 1 day maybe even?)
            const DR = FileSystem.createDownloadResumable(
                url,
                FileSystem.documentDirectory + name + ".json",
                {},
                (data)=>{
                    that.setState({progress:(Math.min(Math.max(data.totalBytesWritten, 0) / (data.totalBytesExpectedToWrite + data.totalBytesWritten), 1) * 100) + "%"})
                }
            );
            DR.downloadAsync().then((file)=>{
                FileSystem.readAsStringAsync(file.uri).catch(()=>{
                }).then((contents)=>{
                    if (contents) {
                        then(contents);
                    } else {
                    }
                });
            });
        }
    }

    constructor(props:Props) {
        super(props);
        Roster.Instance = this;

        this.state.Units = this.props.Data.Units.map(u=> new UnitData(u));
        this.state.Units.sort(UnitData.CompareUnits);

        this.state.UnitsToSkip = new Array<number>();
        this.state.Rules = [...this.props.Data.Rules];
        this.state.Reminders = new Array<Reminder>();
        Each<UnitData>(this.state.Units, (unit, index)=>{
            this.state.Units.slice(index+1).forEach((unit2, index2)=>{
                if (unit.Equals(unit2, this.props.Data.LeaderData)) {
                    this.state.UnitsToSkip.push(index2 + index + 1);
                    unit.Count++;
                }
            });
            Each<DescriptorRaw>(unit.Abilities, ability=>{
                const r = this.checkAddReminder(ability, unit.Name());
                if(r !== null && this.state.Reminders.findIndex(re=>re.UnitName===r.UnitName && re.Data.Name===r.Data.Name)===-1) {
                    this.state.Reminders.push(r);
                }
            });
        });
        this.downloadFileThen("strats", "https://raw.githubusercontent.com/MarieKame/warhammer40k10th-stratagems/main/stratagems.json", this, (json)=>{
            try {
                this.state.DetachmentStratagems = StratagemsFromJson(json[this.props.Data.Faction][this.props.Data.Detachment]);
            } catch(e){
                this.state.DetachmentStratagems = [];
            }
        });
    }

    private checkAddReminder(data:DescriptorRaw, unitName:string){
        if (/(per battle)|(at the end of)|(each time)/gi.test(data.Value) && !/leading/gi.test(data.Value)){
            let reminder = new Reminder();
            reminder.UnitName=unitName;
            const results = /(((Command)|(Movement)|(Shooting)|(Charge)|(Fighting)|(Any)) (phase))/gi.exec(data.Value)
            if (results)
                reminder.Phase = results[2][0].toLocaleUpperCase() + results[2].slice(1);
            else
                reminder.Phase=null;
            reminder.Data = data;
            return reminder;
        }
        return null;
    }

    Previous(){
        let newIndex = (this.state.CurrentUnit-1);
        newIndex= newIndex<0?this.props.Data.Units.length-1:newIndex;
        while (this.state.UnitsToSkip.indexOf(newIndex)!==-1) {
            newIndex--;
            newIndex= newIndex<0?this.props.Data.Units.length-1:newIndex;
        }
        this.setState({CurrentUnit:newIndex});
    }

    Next(){
        let newIndex = (this.state.CurrentUnit+1)%this.props.Data.Units.length;
        while (this.state.UnitsToSkip.indexOf(newIndex)!==-1) {
            newIndex = (newIndex+1)%this.props.Data.Units.length
        }
        this.setState({CurrentUnit:newIndex});
    }

    GetUnit():UnitData{
        return this.state.Units[this.state.CurrentUnit];
    }

    DisplayUnit(index:number){
        this.setState({CurrentUnit:index});
    }

    UpdateLeader(leader:LeaderDataRaw, that:Roster) {
        let leaders = that.props.Data.LeaderData;
        const index = leaders.findIndex(leader2=>leader2.UniqueId==leader.UniqueId);
        leaders[index] = leader;
        that.props.OnUpdateLeaders(leaders);
        let skip = new Array<number>();
        let units = this.state.Units;
        units.forEach((unit1, index)=>{
            unit1.Count=1;
            units.slice(index+1).forEach((unit2, index2)=>{
                if (unit1.Equals(unit2, that.props.Data.LeaderData)) {
                    skip.push(index2 + index + 1);
                    unit1.Count++;
                }
            });
        });
        that.setState({Leaders:leaders, UnitsToSkip:skip, Units:units});
    }

    AddNote(that:Roster) {
        that.setState({NoteState:NoteState.CUSTOM, NoteTitle:"", NoteDescription:"", RadioWeapon:"", wpnMod1:false, wpnMod2:false, wpnMod3:false, wpnMod4:false, wpnMod5:false, wpnMod6:false});
    }

    updateNoteTitle(text:string){
        this.setState({NoteTitle:text});
    }

    updateNoteDescription(text:string){
        this.setState({NoteDescription:text});
    }

    DeleteNote(noteIndex:number){
        let notes = [...this.props.Data.Notes];
        notes.splice(noteIndex, 1);
        this.props.OnUpdateNotes(notes);
    }

    SaveNote(note:DescriptorRaw){
        let notes = [...this.props.Data.Notes];
        notes.push({AssociatedID:this.GetUnit().Key(), Descriptor:note});
        this.props.OnUpdateNotes(notes);
        this.setState({NoteState:NoteState.CLOSED});
    }

    updateRadioWeapon(wpn:string){
        this.setState({RadioWeapon:wpn});
    }

    getNbSelected(){
        return (this.state.wpnMod1?1:0) + 
        (this.state.wpnMod2?1:0) + 
        (this.state.wpnMod3?1:0) + 
        (this.state.wpnMod4?1:0) + 
        (this.state.wpnMod5?1:0) + 
        (this.state.wpnMod6?1:0);
    }

    getModsDescriptions():string{
        let descriptions = "";
        function getDescription(index:number):string{
            const mod = Variables.WeaponMods[index];
            return mod.Name + ": " + mod.Value + "\n";
        }
        descriptions += (this.state.wpnMod1?getDescription(0):"");
        descriptions += (this.state.wpnMod2?getDescription(1):"");
        descriptions += (this.state.wpnMod3?getDescription(2):"");
        descriptions += (this.state.wpnMod4?getDescription(3):"");
        descriptions += (this.state.wpnMod5?getDescription(4):"");
        descriptions += (this.state.wpnMod6?getDescription(5):"");
        return descriptions;
    }

    getCurrentTraitCategory():Array<DescriptorRaw>|null{
        const unit = this.GetUnit();
        if (unit.Keywords.find(keyword=> /(epic hero)/gi.test(keyword)))
            return null;
        if (unit.Keywords.find(keyword=> /(vehicle)|(monster)/gi.test(keyword)))
            return Variables.PariahNexusTraits.Vehicule;
        if (unit.Keywords.find(keyword=> /(character)/gi.test(keyword)))
            return Variables.PariahNexusTraits.Character;
        if (unit.Keywords.find(keyword=> /(infantry)/gi.test(keyword)))
            return Variables.PariahNexusTraits.Infantry;
        if (unit.Keywords.find(keyword=> /(mounted)/gi.test(keyword)))
            return Variables.PariahNexusTraits.Mounted;
        return null
    }

    RenderAddNoteContent(noteState:NoteState){
        switch(noteState) {
            case NoteState.CUSTOM:
                return <View style={{paddingBottom:10, margin:6}}>
                    <View style={{flexDirection:"row"}}>
                        <Text style={{alignSelf:"center", paddingRight:6}}>Note Name : </Text>
                        <AutoExpandingTextInput multiline editable value={this.state.NoteTitle} onSubmit={text=>this.updateNoteTitle(text)} style={{flexGrow:1}} />
                    </View>
                    <Text>Description : </Text>
                    <AutoExpandingTextInput multiline editable value={this.state.NoteDescription} onSubmit={text=>this.updateNoteDescription(text)} style={{height:"55%"}} />
                    <Button onPress={e=>this.SaveNote({Name:this.state.NoteTitle, Value:this.state.NoteDescription})}>Add Note</Button>
                </View>;
            case NoteState.WPN:
                return <View style={{flexDirection:"row", flexWrap:"wrap", paddingLeft:4}}>
                    <View key="wpns" style={{width:"65%"}}>
                        <Text key="title" style={{paddingBottom:6}}>Select a weapon : </Text>
                        <FlatList 
                            numColumns={2}
                            data={[...this.GetUnit().MeleeWeapons, ...this.GetUnit().RangedWeapons]}
                            renderItem={(item)=>
                                <View style={{width:"50%", flexDirection:"row", alignItems:"center", paddingBottom:2, height:24}}>
                                    <Checkbox value={this.state.RadioWeapon==item.item.Name()} 
                                        onValueChange={(e)=>{if (e) this.setState({RadioWeapon:item.item.Name()})}}
                                        style={{marginRight:4}} />
                                        <Pressable onPress={e=>this.setState({RadioWeapon:item.item.Name()})}><Text style={{fontSize:Variables.fontSize.small}}>{item.item.Name()}</Text></Pressable>
                                </View>
                            }
                        />
                    </View>
                    <View key="boosts" style={{width:"34%", borderLeftWidth:1, borderColor:this.context.Main, paddingLeft:20}}>
                        <Text key="title">And modifications: </Text>
                        <Text key="subtitle" style={{fontSize:Variables.fontSize.small, paddingLeft:4, paddingBottom:4}}>(2 per upgrade)</Text>
                        <View style={{flexDirection:"row", alignItems:"center", paddingBottom:4, height:24}}>
                            <Checkbox value={this.state.wpnMod1} onValueChange={value=>this.setState({wpnMod1:value})} style={{marginRight:4}}/>
                            <Pressable onPress={e=>this.setState({wpnMod1:!this.state.wpnMod1})}><Text>Finely Balanced</Text></Pressable>
                        </View>
                        <View style={{flexDirection:"row", alignItems:"center", paddingBottom:4, height:24}}>
                            <Checkbox value={this.state.wpnMod2} onValueChange={value=>this.setState({wpnMod2:value})} style={{marginRight:4}}/>
                            <Pressable onPress={e=>this.setState({wpnMod2:!this.state.wpnMod2})}><Text>Brutal</Text></Pressable>
                        </View>
                        <View style={{flexDirection:"row", alignItems:"center", paddingBottom:4, height:24}}>
                            <Checkbox value={this.state.wpnMod3} onValueChange={value=>this.setState({wpnMod3:value})} style={{marginRight:4}}/>
                            <Pressable onPress={e=>this.setState({wpnMod3:!this.state.wpnMod3})}><Text>Armour Piercing</Text></Pressable>
                        </View>
                        <View style={{flexDirection:"row", alignItems:"center", paddingBottom:4, height:24}}>
                            <Checkbox value={this.state.wpnMod4} onValueChange={value=>this.setState({wpnMod4:value})} style={{marginRight:4}}/>
                            <Pressable onPress={e=>this.setState({wpnMod4:!this.state.wpnMod4})}><Text>Master-Worked</Text></Pressable>
                        </View>
                        <View style={{flexDirection:"row", alignItems:"center", paddingBottom:4, height:24}}>
                            <Checkbox value={this.state.wpnMod5} onValueChange={value=>this.setState({wpnMod5:value})} style={{marginRight:4}}/>
                            <Pressable onPress={e=>this.setState({wpnMod5:!this.state.wpnMod5})}><Text>Heirloom</Text></Pressable>
                        </View>
                        <View style={{flexDirection:"row", alignItems:"center", paddingBottom:4, height:24}}>
                            <Checkbox value={this.state.wpnMod6} onValueChange={value=>this.setState({wpnMod6:value})} style={{marginRight:4}}/>
                            <Pressable onPress={e=>this.setState({wpnMod6:!this.state.wpnMod6})}><Text>Precise</Text></Pressable>
                        </View>
                    </View>
                    <Button disabled={this.state.RadioWeapon=="" || this.getNbSelected() < 2} style={{width:"98%", marginTop:4}} onPress={e=>this.SaveNote({Name:"Mod : " + this.state.RadioWeapon, Value:this.getModsDescriptions()})}>
                        {this.state.RadioWeapon==""?"Select a weapon":(this.getNbSelected()<2?"Select at least 2 mods":"Add as Note")}
                    </Button>
                </View>;
            case NoteState.SCAR:
                return <View style={{width:"100%", justifyContent:"center", alignItems:"center"}}>
                    <Text key="title" style={{padding:10, fontSize:Variables.fontSize.big, fontFamily:Variables.fonts.WHI}}>Select your Battle Scar</Text>
                    <View style={{flexDirection:"row", flexWrap:"wrap", paddingTop:10}}>
                        <Button key="dmg" style={{width:"48%"}} onPress={e=>this.SaveNote(Variables.battleScars[0])}>( 1 ) Crippling Damage</Button>
                        <Button key="btw" style={{width:"48%"}} onPress={e=>this.SaveNote(Variables.battleScars[1])}>( 2 ) Battle-Weary</Button>
                        <Button key="ft" style={{width:"48%"}} onPress={e=>this.SaveNote(Variables.battleScars[2])}>( 3 ) Fatigued</Button>
                        <Button key="dis" style={{width:"48%"}} onPress={e=>this.SaveNote(Variables.battleScars[3])}>( 4 ) Disgraced</Button>
                        <Button key="mos" style={{width:"48%"}} onPress={e=>this.SaveNote(Variables.battleScars[4])}>( 5 ) Mark of Shame</Button>
                        <Button key="ds" style={{width:"48%"}} onPress={e=>this.SaveNote(Variables.battleScars[5])}>( 6 ) Deep Scars</Button>
                    </View>
                </View>;
            case NoteState.TRAIT:
                const cat= this.getCurrentTraitCategory();
                return <View style={{width:"100%", justifyContent:"center", alignItems:"center"}}>
                    <Text key="title" style={{padding:10, fontSize:Variables.fontSize.big, fontFamily:Variables.fonts.WHI}}>Select your Battle Trait</Text>
                    <View style={{flexDirection:"row", flexWrap:"wrap", paddingTop:10}}>
                        <Button key="dmg" style={{width:"48%"}} onPress={e=>this.SaveNote(cat[0])}>( 1 ) {cat[0].Name}</Button>
                        <Button key="btw" style={{width:"48%"}} onPress={e=>this.SaveNote(cat[1])}>( 2 ) {cat[1].Name}</Button>
                        <Button key="ft" style={{width:"48%"}} onPress={e=>this.SaveNote(cat[2])}>( 3 ) {cat[2].Name}</Button>
                        <Button key="dis" style={{width:"48%"}} onPress={e=>this.SaveNote(cat[3])}>( 4 ) {cat[3].Name}</Button>
                        <Button key="mos" style={{width:"48%"}} onPress={e=>this.SaveNote(cat[4])}>( 5 ) {cat[4].Name}</Button>
                        <Button key="ds" style={{width:"48%"}} onPress={e=>this.SaveNote(cat[5])}>( 6 ) {cat[5].Name}</Button>
                    </View>
                </View>;
        }
    }

    private GetDisplayIndex():number{
        let index = this.state.CurrentUnit;
        this.state.UnitsToSkip.reverse().forEach(toSkip=>{
            if (toSkip < index) index--;
        });
        return index + 1;
    }

    private GetCurrentNotes(that:Roster):Array<NoteRaw> {
        const unit = that.GetUnit();
        return that.props.Data.Notes.filter(n=>n.AssociatedID===unit.Key());
    }

    render(){
        Roster.Instance = this;
        return <GestureHandlerRootView><PanGestureHandler minPointers={2} onEnded={e=>
            // @ts-ignore
        {if(e.nativeEvent.translationX > 100){this.Previous()} else if (e.nativeEvent.translationX<-100){this.Next()}else if (e.nativeEvent.translationY>100){this.props.navigation.navigate('RosterMenu')}}}>
            <View key={this.state.CurrentUnit}>
            <ScrollView>
                <View style={{width:Variables.width, alignSelf:"center", padding:10, height:"100%"}}>
                    <Unit data={this.GetUnit()} 
                        Leaders={this.props.Data.LeaderData} 
                        onUpdateLeader={(leader)=>this.UpdateLeader(leader,this)} 
                        onAddNotePressed={e=>this.AddNote(this)} 
                        onNoteRemoved={index=>this.DeleteNote(index)}
                        Notes={this.GetCurrentNotes(this)}
                        />
                </View>
            </ScrollView>
            <View style={{position:"absolute", right:20, top:20, zIndex:100, backgroundColor:this.context.Bg, borderRadius:10}}>
                <View style={{flexDirection:"row"}}>
                    <Button key="back" onPress={(e)=> this.Previous()} textStyle={{transform:[{rotate:'180deg'}], top:2}}>➤</Button>
                    <View style={{flexDirection:"column"}}>
                        <Button onPress={(e)=> this.props.navigation.navigate('RosterMenu')}style={{width:70}}>Menu</Button>
                    </View>
                    <Button key="for" onPress={(e)=> this.Next()}>➤</Button>
                </View>
                <Text style={{textAlign:"center"}}>{(this.GetDisplayIndex()) + " / " + (this.props.Data.Units.length  - this.state.UnitsToSkip.length) + (this.state.UnitsToSkip.length>0?" ( "+this.props.Data.Units.length+" )":"")}</Text>
            </View>
            {this.state.NoteState!==NoteState.CLOSED&&
            <View style={{height:Variables.height, width:Variables.width, position:"absolute", backgroundColor:"rgba(0,0,0,0.6)", justifyContent: 'center', alignItems: 'center', zIndex:1000}}>
                <View style={{backgroundColor:this.context.Bg, position:"absolute", padding:10, borderColor:this.context.Accent, borderWidth:1, borderRadius:Variables.boxBorderRadius, width:"90%", height:"90%"}}>
                    <View key="tabs" style={{flexDirection:"row"}}>
                        <Button tab key="custom" weight={this.state.NoteState==NoteState.CUSTOM?"heavy":"normal"} onPress={e=>this.setState({NoteState:NoteState.CUSTOM})}>Custom</Button>
                        {this.getCurrentTraitCategory()!==null&&<Button tab key="battleTrait" weight={this.state.NoteState==NoteState.TRAIT?"heavy":"normal"} onPress={e=>this.setState({NoteState:NoteState.TRAIT})}>Battle Trait</Button>}
                        {!this.GetUnit().Keywords.find(keyword=> /(epic hero)/gi.test(keyword))&&<Button tab key="wpnMod" weight={this.state.NoteState==NoteState.WPN?"heavy":"normal"} onPress={e=>this.setState({NoteState:NoteState.WPN})}>Weapons Mod</Button>}
                        {!this.GetUnit().Keywords.find(keyword=> /(epic hero)/gi.test(keyword))&&<Button tab key="battleScar" weight={this.state.NoteState==NoteState.SCAR?"heavy":"normal"} onPress={e=>this.setState({NoteState:NoteState.SCAR})}>Battle Scar</Button>}
                    </View>
                    <View key="content" style={{backgroundColor:this.context.Accent, top:-4, paddingTop:10, bottom:10, height:"74%", left:4, width:"99%"}}>
                        {this.RenderAddNoteContent(this.state.NoteState)}
                    </View>
                    <Button key="cancel" onPress={e=>this.setState({NoteState:NoteState.CLOSED})}>Cancel</Button>
                </View>
            </View>
            }
        </View></PanGestureHandler></GestureHandlerRootView>;
    }
}

export default Roster;