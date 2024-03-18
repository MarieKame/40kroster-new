import React from "react";
import Unit from "./Unit";
import {UnitData,  DescriptorData, LeaderData} from "./UnitData";
import {View, ScrollView, Platform, FlatList, Pressable} from 'react-native';
import fastXMLParser from 'fast-xml-parser';
import Variables from "../../Style/Variables";
import Button from "../Components/Button";
import {Text} from "../Components/Text";
import {KameContext} from "../../Style/KameContext";
import RosterExtraction, { Reminder } from "./RosterExtraction";
import { Stratagem } from "./Stratagems";
import AutoExpandingTextInput from "../Components/AutoExpandingTextInput";
import Checkbox from "expo-checkbox";
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView, PanGestureHandler } from "react-native-gesture-handler";


interface Props {
    XML:string,
    navigation:{navigate},
    onLoad:CallableFunction,
    onUpdateLeaders:CallableFunction,
    onUpdateNotes:CallableFunction,
    forceLeaders?:Array<LeaderData>,
    Notes:Array<Array<DescriptorData>>
}

enum NoteState{
    CLOSED, CUSTOM, WPN, SCAR, TRAIT
}

class Roster extends React.Component<Props> {
    static Instance:Roster;
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;
    state = {
        Index:0,
        Name: "",
        Costs:"",
        Faction:"",
        Detachment:"",
        Units: new Array<UnitData>(),
        UnitsToSkip: new Array<number>(),
        Leaders: new Array<LeaderData>(),
        Rules: new Array<DescriptorData>(),
        Reminders:new Array<Reminder>(),
        DetachmentStratagems: new Array<Stratagem>,
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

    constructor(props:Props) {
        super(props);
        Roster.Instance = this;
        const parser = new fastXMLParser.XMLParser({ignoreAttributes:false, attributeNamePrefix :"_", textNodeName:"textValue"});
        const exploration = new RosterExtraction(parser.parse(props.XML).roster, this.props.forceLeaders, this.props.onUpdateLeaders);
        this.state.Name = exploration.data.Name;
        this.state.Costs = exploration.data.Costs;
        this.state.Faction = exploration.data.Faction;
        this.state.Detachment = exploration.data.Detachment;
        this.state.Units = exploration.data.Units;
        this.state.UnitsToSkip = exploration.data.UnitsToSkip;
        this.state.Leaders = exploration.data.Leaders;
        this.state.Rules = exploration.data.Rules;
        this.state.Reminders = exploration.data.Reminders;
        this.state.DetachmentStratagems = exploration.data.DetachmentStratagems;
        this.props.onLoad(this.state.Costs);
    }

    Previous(){
        let newIndex = (this.state.Index-1);
        newIndex= newIndex<0?this.state.Units.length-1:newIndex;
        while (this.state.UnitsToSkip.indexOf(newIndex)!==-1) {
            newIndex--;
            newIndex= newIndex<0?this.state.Units.length-1:newIndex;
        }
        this.setState({Index:newIndex});
    }

    Next(){
        let newIndex = (this.state.Index+1)%this.state.Units.length;
        while (this.state.UnitsToSkip.indexOf(newIndex)!==-1) {
            newIndex = (newIndex+1)%this.state.Units.length
        }
        this.setState({Index:newIndex});
    }

    GetUnit():UnitData{
        return this.state.Units[this.state.Index];
    }

    DisplayUnit(index:number){
        this.setState({Index:index});
    }

    UpdateLeader(leader:LeaderData, that:Roster) {
        let leaders = that.state.Leaders;
        const index = leaders.findIndex(leader2=>leader2.UniqueId==leader.UniqueId);
        leaders[index] = leader;
        that.props.onUpdateLeaders(leaders);
        let skip = new Array<number>();
        let units = this.state.Units;

        units.forEach((unit1, index)=>{
            unit1.Count=1;
            units.slice(index+1).forEach((unit2, index2)=>{
                if (unit1.Equals(unit2, this.state.Leaders)) {
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
        let notes = [...this.props.Notes]
        let currentNotes = [...notes[this.state.Index]];
        currentNotes.splice(noteIndex, 1);
        notes[this.state.Index] = currentNotes;
        this.props.onUpdateNotes(notes);
    }

    SaveNote(note:DescriptorData){
        let notes = [...this.props.Notes];
        if (!notes[this.state.Index]) {
            notes[this.state.Index] = new Array<DescriptorData>();
        }
        notes[this.state.Index].push(note);
        this.props.onUpdateNotes(notes);
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
            return mod.Name + ": " + mod.Description + "\n";
        }
        descriptions += (this.state.wpnMod1?getDescription(0):"");
        descriptions += (this.state.wpnMod2?getDescription(1):"");
        descriptions += (this.state.wpnMod3?getDescription(2):"");
        descriptions += (this.state.wpnMod4?getDescription(3):"");
        descriptions += (this.state.wpnMod5?getDescription(4):"");
        descriptions += (this.state.wpnMod6?getDescription(5):"");
        return descriptions;
    }

    getCurrentTraitCategory():Array<DescriptorData>|null{
        const unit = this.state.Units[this.state.Index];
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
                    <Button onPress={e=>this.SaveNote(new DescriptorData(this.state.NoteTitle, this.state.NoteDescription))}>Add Note</Button>
                </View>;
            case NoteState.WPN:
                return <View style={{flexDirection:"row", flexWrap:"wrap", paddingLeft:4}}>
                    <View key="wpns" style={{width:"65%"}}>
                        <Text key="title" style={{paddingBottom:6}}>Select a weapon : </Text>
                        
                        <FlatList 
                            numColumns={2}
                            data={[...this.state.Units[this.state.Index].MeleeWeapons, ...this.state.Units[this.state.Index].RangedWeapons]}
                            renderItem={(item)=>
                                <View style={{width:"50%", flexDirection:"row", alignItems:"center", paddingBottom:2, height:24}}>
                                    <Checkbox value={this.state.RadioWeapon==item.item.Name} 
                                        onValueChange={(e)=>{if (e) this.setState({RadioWeapon:item.item.Name})}}
                                        style={{marginRight:4}} />
                                        <Pressable onPress={e=>this.setState({RadioWeapon:item.item.Name})}><Text style={{fontSize:Variables.fontSize.small}}>{item.item.Name}</Text></Pressable>
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
                    <Button disabled={this.state.RadioWeapon=="" || this.getNbSelected() < 2} style={{width:"98%", marginTop:4}} onPress={e=>this.SaveNote(new DescriptorData("Mod : " + this.state.RadioWeapon, this.getModsDescriptions()))}>
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
        let index = this.state.Index;
        this.state.UnitsToSkip.reverse().forEach(toSkip=>{
            if (toSkip < index) index--;
        });
        return index + 1;
    }

    private GetCurrentNotes(that:Roster):Array<DescriptorData> {
        return that.props.Notes[that.state.Index]??new Array<DescriptorData>();
    }

    render(){
        Roster.Instance = this;
        let key= 0;
        if (Platform.OS=="web"){
            return <View style={{width:Variables.width, alignSelf:"center", padding:10}}>{this.state.Units.map(unitData => (
                <Unit data={unitData} 
                    key={key++} 
                    Leaders={this.state.Leaders}
                    onUpdateLeader={(leader)=>this.UpdateLeader(leader,this)} 
                    onNoteRemoved={index=>this.DeleteNote(index)}
                    onAddNotePressed={e=>this.AddNote(this)} 
                    Notes={this.GetCurrentNotes(this)}
                    />
            ))}</View>;
        } else {
            return <GestureHandlerRootView><PanGestureHandler minPointers={2} onEnded={e=>
                // @ts-ignore
            {if(e.nativeEvent.translationX > 100){this.Previous()} else if (e.nativeEvent.translationX<-100){this.Next()}else if (e.nativeEvent.translationY>100){this.props.navigation.navigate('RosterMenu')}}}>
                <View>
                <ScrollView>
                    <View style={{width:Variables.width, alignSelf:"center", padding:10, height:"100%"}}>
                        <Unit data={this.state.Units[this.state.Index]} 
                            Leaders={this.state.Leaders} 
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
                    <Text style={{textAlign:"center"}}>{(this.GetDisplayIndex()) + " / " + (this.state.Units.length  - this.state.UnitsToSkip.length) + (this.state.UnitsToSkip.length>0?" ( "+this.state.Units.length+" )":"")}</Text>
                </View>
                {this.state.NoteState!==NoteState.CLOSED&&
                <View style={{height:Variables.height, width:Variables.width, position:"absolute", backgroundColor:"rgba(0,0,0,0.6)", justifyContent: 'center', alignItems: 'center', zIndex:1000}}>
                    <View style={{backgroundColor:this.context.Bg, position:"absolute", padding:10, borderColor:this.context.Accent, borderWidth:1, borderRadius:Variables.boxBorderRadius, width:"90%", height:"90%"}}>
                        <View key="tabs" style={{flexDirection:"row"}}>
                            <Button tab key="custom" weight={this.state.NoteState==NoteState.CUSTOM?"heavy":"normal"} onPress={e=>this.setState({NoteState:NoteState.CUSTOM})}>Custom</Button>
                            {this.getCurrentTraitCategory()!==null&&<Button tab key="battleTrait" weight={this.state.NoteState==NoteState.TRAIT?"heavy":"normal"} onPress={e=>this.setState({NoteState:NoteState.TRAIT})}>Battle Trait</Button>}
                            {!this.state.Units[this.state.Index].Keywords.find(keyword=> /(epic hero)/gi.test(keyword))&&<Button tab key="wpnMod" weight={this.state.NoteState==NoteState.WPN?"heavy":"normal"} onPress={e=>this.setState({NoteState:NoteState.WPN})}>Weapons Mod</Button>}
                            {!this.state.Units[this.state.Index].Keywords.find(keyword=> /(epic hero)/gi.test(keyword))&&<Button tab key="battleScar" weight={this.state.NoteState==NoteState.SCAR?"heavy":"normal"} onPress={e=>this.setState({NoteState:NoteState.SCAR})}>Battle Scar</Button>}
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
    
}

export default Roster;