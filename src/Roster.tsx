import React, { ReactNode } from "react";
import Unit from "./Unit";
import {UnitData, CostData, WeaponData, ProfileWeaponData, ModelData, StatsData, DescriptorData, LeaderData} from "./UnitData";
import {View, ScrollView, Platform} from 'react-native';
import fastXMLParser from 'fast-xml-parser';
import Variables from "../Style/Variables";
import Button from "./Components/Button";
import {Text, ComplexText} from "./Components/Text";
import {KameContext} from "../Style/KameContext";

function isIterable(obj) {
    // checks for null and undefined
    if (obj == null) {
      return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
  }

interface Props {
    XML:string,
    onBack:CallableFunction,
    onLoad:CallableFunction,
    onUpdateLeaders:CallableFunction,
    forceLeaders?:Array<LeaderData>
}

class StatAndName {
    Stat: string;
    Name: string;
}

class WpnStats{
    Stats:Array<StatAndName>;
    isProfileWeapon:boolean;
}

enum RosterMenuCategories {
    UNIT_LIST, RULES, REMINDERS
}

class Reminder{
    Data:DescriptorData;
    UnitName:string;
    Phase:string|null;
}

const Phases={
    null:-1,
    "Any":0,
    "Command":1,
    "Moving":2,
    "Shooting":3,
    "Charge":4,
    "Fight":5
}

class Roster extends React.Component<Props> {
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;
    state = {
        Name: "",
        Costs:"",
        Units: new Array<UnitData>(),
        Leaders: new Array<LeaderData>(),
        Index:0,
        Menu:false,
        Rules: new Array<DescriptorData>(),
        MenuSection:RosterMenuCategories.UNIT_LIST,
        Reminders:new Array<Reminder>()
    }

    FormatCost(cost) : CostData {
        return new CostData(Number(cost._value), cost._name);
    }

    AddNewRule(data:DescriptorData) {
        if (!this.state.Rules.find(rule=>rule.Name == data.Name)){
            this.state.Rules.push(data);
        }
    }

    ExtractRules(rules): Array<DescriptorData> {
        let rulesData = new Array<DescriptorData>();
        if (rules) {
            if (rules.rule.length) {
                for(let element of rules.rule){
                    const data = new DescriptorData(element._name, element.description);
                    rulesData.push(data);
                    this.AddNewRule(data);
                }
            } else {
                const data = new DescriptorData(rules.rule._name, rules.rule.description);
                rulesData.push(data);
                this.AddNewRule(data);
            }
        }
        return rulesData;
    }

    ExtractCategories(categories): Array<string> {
        let categoriesData = new Array<string>();
        for(let element of categories.category){
            categoriesData.push(element._name);
        }
        return categoriesData;
    }

    ExtractProfiles(profiles, unitName): Array<DescriptorData> {
        let profilesData = new Array<DescriptorData>();
        if (!isIterable(profiles.profile)) return profilesData;
        for(let element of profiles.profile){
            if (element._name !== unitName && element.characteristics) {
                const data=new DescriptorData(element._name, this.getCharacteristic(element.characteristics.characteristic));
                profilesData.push(data);
                if (/(per battle)|(at the end of)|(each time)/gi.test(data.Description) && !/leading/gi.test(data.Description)){
                    let reminder = new Reminder();
                    reminder.UnitName=unitName;
                    const results = /(((Command)|(Movement)|(Shooting)|(Charge)|(Fighting)|(Any)) (phase))/gi.exec(data.Description)
                    if (results)
                        reminder.Phase = results[2][0].toLocaleUpperCase() + results[2].slice(1);
                    else
                        reminder.Phase=null;
                    reminder.Data = data;
                    this.state.Reminders.push(reminder);
                }
            }
        }
        return profilesData;
    }

    getCharacteristic(characteristic) {
        if (characteristic.join) {
            return characteristic.map((char)=>char.textValue).join(",");
        } else {
            return characteristic.textValue;
        }
    }

    GetStats(profiles) : WpnStats {
        let stats = new WpnStats();
        let rawStats = "";
        let name = "";
        stats.Stats = new Array<StatAndName>();
        if (profiles.characteristics) {
            stats.isProfileWeapon = false;
            rawStats = this.getCharacteristic(profiles.characteristics.characteristic);
            name = profiles._name;
        } else if (profiles.profile.characteristics) {
            stats.isProfileWeapon = false;
            rawStats = this.getCharacteristic(profiles.profile.characteristics.characteristic)
            name = profiles.profile._name;
        } else {
            stats.isProfileWeapon = true;
        }
        if (stats.isProfileWeapon){
            for(let element of profiles.profile){
                let snn = new StatAndName();
                snn.Stat = this.getCharacteristic(element.characteristics.characteristic);
                snn.Name = element._name;
                stats.Stats.push(snn);
            }
        } else {
            let snn = new StatAndName();
            snn.Stat = rawStats;
            snn.Name = name;
            stats.Stats.push(snn);
        }
    
        return stats;
    }

    CreateWeapon(stats:WpnStats, count:number, name:string) : WeaponData {
        if (stats.isProfileWeapon) {
            let profilesWeapons = new Array<WeaponData>();
            for(let element of stats.Stats){
                let profileName = "";
                let result = /(?<=\ - ).*/g.exec(element.Name); // everything after the dash
                let number = /(\d-\d)/g.exec(element.Name);
                if (result && result[0] ){
                    profileName = result[0];
                }
                if (number && number[0]) {
                    profileName = "(" + number[0] + ") " + profileName;
                }
                profilesWeapons.push(new WeaponData(element.Stat, count, profileName, name))
            }
            return new ProfileWeaponData(profilesWeapons, count, name);
        } else {
            return new WeaponData(stats.Stats[0].Stat, count, name);
        }
    }

    TreatSelection(model:{treatedSelections:Array<WeaponData>}, count:number, name:string, profiles){
        let newWeapon = this.CreateWeapon(this.GetStats(profiles), count, name);
        let existsIndex = model.treatedSelections.findIndex((wpn) => wpn.Name === name && wpn.IsMelee() == newWeapon.IsMelee());
        if (existsIndex !== -1) {
            model.treatedSelections[existsIndex].Count += count;
        } else {
            model.treatedSelections.push(newWeapon);
        }
    }

    ExtractSingleModelUnitSelections(selections) {
        let treatedSelections = new Array<WeaponData>();
        let that = this;
        if (!isIterable(selections.selection)) {
            let selection;
            if (selections.selection.profiles) {
                selection = selections.selection;
            } else if (selections.selection.selections) {
                selection = selections.selection.selections.selection;
            }
            if (selection) {
                that.TreatSelection({treatedSelections : treatedSelections}, Number(selection._number), selection._name, selection.profiles);
            }
        } else {
            for(let element of selections.selection){
                if (element.profiles) {
                    that.TreatSelection({treatedSelections : treatedSelections}, Number(element._number), element._name, element.profiles);
                }
            }
        }
        return treatedSelections;
    }

    ExtractModelSelections(model:{treatedSelections : Array<WeaponData>}, selection, that){
        if (isIterable(selection)) {
            for(let elementIn of selection){
                let count = Number(elementIn._number??1);
                let name = elementIn._name;
                if (elementIn.profile){
                    for(let elementInIn of elementIn.profile){
                        count = Number(elementInIn._number??1);
                        if (elementInIn.characteristics) {
                            that.TreatSelection({treatedSelections : model.treatedSelections}, count, elementInIn._name, elementInIn)
                        }
                    }
                } else if (elementIn.profiles) {
                    that.TreatSelection({treatedSelections : model.treatedSelections}, count, name, elementIn.profiles);
                } else if (elementIn.selections && elementIn.selections.selection) {
                    if (elementIn.selections.selection.profiles) {
                        that.TreatSelection({treatedSelections : model.treatedSelections}, count, name, elementIn.selections.selection.profiles);
                    } else {
                        for(let elementInIn of elementIn.selections.selection){
                            that.TreatSelection({treatedSelections : model.treatedSelections}, Number(elementInIn._number), elementInIn._name, elementInIn.profiles)
                        }
                    }
                }
            }
        } else {
            that.TreatSelection({treatedSelections : model.treatedSelections}, Number(selection._number), selection._name, selection.profiles);
        }
    }

    ExtractMultiModelUnitSelections(selections) {
        let treatedSelections = new Array<WeaponData>();
        let that = this;
        if (!isIterable(selections.selection)){
            that.ExtractModelSelections({treatedSelections:treatedSelections},selections.selection.selections.selection, that);
        } else {
            for(let element of selections.selection){
                if (element.selection && element.selection._type == "upgrade") {
                    let count = Number(element.selection._number??1);
                    let name = element.selection._name;
                    that.TreatSelection({treatedSelections : treatedSelections}, count, name, element.selection.profiles);
                } else {
                    let sel= element.selections;
                    if (!sel) {
                        sel = element;
                    }
                    if (sel && sel.selection) {
                        that.ExtractModelSelections({treatedSelections:treatedSelections},sel.selection, that);
                    }
                }
            }
        }
        return treatedSelections;
    }

    ExtractStats(profiles, name) : string {
        if (!profiles) return "";
        if (profiles.characteristics) {
            return this.getCharacteristic(profiles.characteristics.characteristic);
        }
        if (profiles.profile.characteristics) {
            return this.getCharacteristic(profiles.profile.characteristics.characteristic);
        }
        let stats = "";
        for(let element of profiles.profile){
            if (element._name === name) {
                stats= this.getCharacteristic(element.characteristics.characteristic);
            }
        }
        return stats;
    }

    ExtractLastProfile(selections){
        if (selections.selection.profiles) {
            return selections.selection.profiles;
        }
        let lastProfile;
        for(let element of selections.selection){
            if (element.profiles.profile.characteristics) {
                lastProfile = element.profiles;
            } else {
                for(let elementIn of element.profiles.profile){
                    lastProfile = elementIn;
                }
            }
        }
        return lastProfile;
    }

    ExtractModels(selections, invul, profiles?, name?) : Array<ModelData>|ModelData{
        let that = this;
        let models = new Array<ModelData>();
        if (!isIterable(selections.selection)){
            let profile;
            if (selections.selection.profiles) {
                profile = selections.selection.profiles.profile;
            } else if (selections.selection.selections) {
                profile = selections.selection.selections.selection.profiles.profile;
            }
            if (profile && profile._type && profile._type == "model") {
                return new ModelData(profile._name, new StatsData(that.ExtractStats(profile, profile._name), invul))
            }
            
        } else {
            for(let element of selections.selection){
                if (element.profile){
                    models.push(new ModelData(element._name, new StatsData(that.ExtractStats(element, element._name), invul)));
                } else if (element.profiles) {
                    models.push(new ModelData(element._name, new StatsData(that.ExtractStats(element.profiles, element._name), invul)));
                } 
            }
            if (profiles && models.length == 0) {
                let uniqueModel;
                for(let element of profiles.profile){
                    if (element._name === name) {
                        uniqueModel = new ModelData(element._name, new StatsData(that.ExtractStats(element, element.name), invul))
                    }
                }
                return uniqueModel;
            }
        }

        return models;
    }

    FindInvulnerableDescriptor(profiles:Array<DescriptorData>):string{
        let descriptor = "";
        let found = profiles.find((descriptor) => descriptor.Name.includes("Invulnerable Save"));
        if (found) {
            descriptor = found.Description;
        }
        return descriptor;
    }

    getDefaultRules(factions:Array<string>):Array<DescriptorData>{
        let rules = new Array<DescriptorData>();
        factions.forEach(faction => {
            const find = Variables.factions.find(f=>f[0]==faction);
            if (find) {
                rules.push(new DescriptorData(find[1], ""));
            }
        });
        return rules;
    }

    ExploreRoster(roster){
        this.state.Name = roster._name;
        this.state.Costs = this.FormatCost(roster.costs.cost).toString();
        let that = this;
        let key = 0;
        const doLeaders = this.props.forceLeaders==null;
        if (!doLeaders) {
            this.state.Leaders=this.props.forceLeaders;
        }
        if (roster.forces.force.rules) {
            for(let element of roster.forces.force.rules.rule) {
                this.state.Rules.push(new DescriptorData(element._name, element.description));
            } 
        }
        for(let element of roster.forces.force.selections.selection) {
            if (element._type === "model" || element._type === "unit") {
                let newUnit = new UnitData();
                newUnit.Key = key++;
                newUnit.CustomName = element._customName??null;
                newUnit.Name = element._name;
                newUnit.Rules = that.ExtractRules(element.rules);
                newUnit.Costs = that.FormatCost(element.costs.cost);
                let categories = that.ExtractCategories(element.categories);
                newUnit.Keywords = new Array<string>();
                newUnit.Factions = new Array<string>();
                for(let subElement of categories){
                    let result = /(?<=Faction: ).*/g.exec(subElement)
                    if (result){
                        newUnit.Factions.push(result[0]);
                    } else  {
                        newUnit.Keywords.push(subElement);
                    }
                }
                newUnit.Profiles = that.ExtractProfiles(element.profiles, newUnit.Name);
                let weapons;
                if (element._type == "model") {
                    newUnit.Models = new ModelData(element._name, new StatsData( that.ExtractStats(element.profiles, element._name), that.FindInvulnerableDescriptor(newUnit.Profiles)));
                    weapons = that.ExtractSingleModelUnitSelections(element.selections);
                } else if (element._type == "unit") {
                    weapons = that.ExtractMultiModelUnitSelections(element.selections);
                    if (weapons.length == 0) {
                        weapons = that.ExtractSingleModelUnitSelections(element.selections);
                    }
                    let invul = that.FindInvulnerableDescriptor(newUnit.Profiles);
                    newUnit.Models = that.ExtractModels(element.selections, invul, element.profiles, newUnit.Name);
                    if (newUnit.HasNoModel()) {
                        newUnit.Models = new ModelData(element._name, new StatsData( that.ExtractStats(element.profiles, element._name), invul));
                    }
                }
                newUnit.MeleeWeapons = new Array<WeaponData>();
                newUnit.RangedWeapons = new Array<WeaponData>();
                newUnit.OtherEquipment = new Array<WeaponData>();
                if (isIterable(weapons)) {
                    for(let weapon of weapons){
                        if (weapon.IsMelee()) {
                            if (weapon.IsWeapon()) {
                                newUnit.MeleeWeapons.push(weapon);
                            } else {
                                newUnit.OtherEquipment.push(weapon);
                            }
                        } else {
                            newUnit.RangedWeapons.push(weapon);
                        }
                    }
                }
                function sortWeapon(wpn1:WeaponData, wpn2:WeaponData):number{
                    if (wpn1.Count > wpn2.Count)
                        return -1;
                    if (wpn1.Count < wpn2.Count)
                        return 1;
                    if (wpn1 instanceof ProfileWeaponData && !(wpn2 instanceof ProfileWeaponData))
                        return 1;
                    if (!(wpn1 instanceof ProfileWeaponData) && wpn2 instanceof ProfileWeaponData)
                        return -1;
                    return 0;
                }
                newUnit.MeleeWeapons.sort(sortWeapon);
                newUnit.RangedWeapons.sort(sortWeapon);
                if (newUnit.Rules.length == 0){
                    newUnit.Rules = that.getDefaultRules(newUnit.Factions);
                }
                that.state.Units.push(newUnit);
                if (doLeaders && newUnit.GetLeaderData()){
                    this.state.Leaders.push(newUnit.GetLeaderData());
                }
            }
        };
        this.state.Reminders = this.state.Reminders.filter((reminder1, index, reminders) => 
            reminders.findIndex((reminder2) => 
                reminder1.UnitName==reminder2.UnitName && reminder1.Data.Name == reminder2.Data.Name
            ) == index);
        this.state.Reminders.sort((reminder1, reminder2)=>{
            return Phases[reminder1.Phase] !== Phases[reminder2.Phase]
                        ?Phases[reminder1.Phase] - Phases[reminder2.Phase]
                        :(reminder1.UnitName !== reminder2.UnitName)
                            ? reminder1.UnitName.localeCompare(reminder2.UnitName)
                            : reminder1.Data.Name.localeCompare(reminder2.Data.Name);
        });
        this.state.Units.sort(UnitData.compareUnits);
        if (doLeaders) {
            this.state.Leaders.sort((leader1, leader2)=>this.state.Units.findIndex(unit=>leader1.Name.indexOf(unit.Name)!==-1)-this.state.Units.findIndex(unit=>leader2.Name.indexOf(unit.Name)!==-1))
            this.props.onUpdateLeaders(this.state.Leaders);
        }
    }

    constructor(props) {
        super(props);
        this.state.Units = new Array<UnitData>();
        const parser = new fastXMLParser.XMLParser({ignoreAttributes:false, attributeNamePrefix :"_", textNodeName:"textValue"});
        this.ExploreRoster(parser.parse(props.XML).roster);
        this.props.onLoad(this.state.Costs);
    }

    Previous(){
        let newIndex = (this.state.Index-1);
        newIndex= newIndex<0?this.state.Units.length-1:newIndex;
        this.setState({Index:newIndex});
    }

    Next(){
        const newIndex = (this.state.Index+1)%this.state.Units.length;
        this.setState({Index:newIndex});
    }

    GetUnit():UnitData{
        return this.state.Units[this.state.Index];
    }

    DisplayUnit(index:number){
        this.setState({Index:index, Menu:false});
    }

    ShowCategory(category:string, index:number):ReactNode {
        let that = this;
        if (this.state.Units.filter((unit)=> unit.GetUnitCategory() == category).length == 0) return "";
        return <View style={{paddingBottom:14}} key={index}>
            <Text style={{width:"100%", textAlign:"center", fontFamily:Variables.fonts.spaceMarine, paddingBottom:4}}>— {category} —</Text>
            <View style={{flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', width:"100%"}}>
                {this.state.Units.map((unit, index) => 
                    unit.GetUnitCategory() == category&&<View style={{width:"50%"}}><Button onPress={(e)=>that.DisplayUnit(index)} weight={(index==that.state.Index)?"heavy":"normal"}>{unit.CustomName?unit.CustomName:unit.Name}</Button></View>
                )}
            </View>
        </View>;
    }

    ShowRemindersFor(phase:string, index:number):ReactNode{

        return <View key={index+"reminderPhase"} style={{marginBottom:10, padding:4}}>
                    {phase&&<Text style={{backgroundColor:this.context.Accent, fontFamily:Variables.fonts.spaceMarine, padding:5, marginBottom:4}}>{phase+" Phase"}</Text>}
                    {this.state.Reminders.map((reminder, reminderIndex)=>
                    reminder.Phase==phase&&
                        <View key={index+reminderIndex}><Text style={{backgroundColor:this.context.LightAccent, fontFamily:Variables.fonts.spaceMarine, padding:5}}>{reminder.UnitName + " - " + reminder.Data.Name}</Text>
                        <ComplexText fontSize={Variables.fontSize.normal} style={{marginLeft:10, marginRight:10}}>{reminder.Data.Description}</ComplexText></View>
                    )}
                    
                </View>;
    }

    ShowRule(rule:DescriptorData, index:number):ReactNode{
        return <View key={index} style={{marginBottom:10}}>
                    <Text style={{backgroundColor:this.context.Accent, fontFamily:Variables.fonts.spaceMarine, padding:5}}>{rule.Name}</Text>
                    <ComplexText fontSize={Variables.fontSize.normal} style={{marginLeft:10, marginRight:10}}>{rule.Description}</ComplexText>
                </View>;
    }

    UpdateLeader(leader:LeaderData, that:Roster) {
        let leaders = that.state.Leaders;
        const index = leaders.findIndex(leader2=>leader2.UniqueId==leader.UniqueId);
        leaders[index] = leader;
        that.props.onUpdateLeaders(leaders);
        that.setState({Leaders:leaders});
    }

    render(){
        let key= 0;
        if (Platform.OS=="web"){
            return <View style={{width:Variables.width, alignSelf:"center", padding:10}}>{this.state.Units.map(unitData => (
                <Unit data={unitData} key={key++} Leaders={this.state.Leaders} onUpdateLeader={(leader)=>this.UpdateLeader(leader,this)} />
            ))}</View>;
        } else {
            if (this.state.Menu) {
                let menuContents;
                switch(this.state.MenuSection) {
                    case RosterMenuCategories.UNIT_LIST:
                        menuContents=
                           <ScrollView>
                                {Variables.unitCategories.map((category, index) => this.ShowCategory(category, index))}
                            </ScrollView>;
                            break;
                    case RosterMenuCategories.RULES:
                        menuContents=
                           <ScrollView>
                                {this.state.Rules.map((category, index) => this.ShowRule(category, index))}
                            </ScrollView>;
                            break;
                    case RosterMenuCategories.REMINDERS:
                        menuContents=
                            <ScrollView>
                                 {[null, "Any", "Command", "Movement", "Shooting", "Charge", "Fight"].map((phase, index) => this.ShowRemindersFor(phase, index))}
                             </ScrollView>;
                            break;

                }
                return <View style={{width:Variables.width, alignSelf:"center", padding:10, height:"100%"}}>
                            <View style={{flexDirection: 'row', left:-4}}>
                                <Button key="main" style={{position:"absolute", right:44, top:-4}} onPress={(e)=>this.props.onBack()}>Main Menu</Button>
                                <Button key="x" style={{position:"absolute", right:-4, top:-4}} onPress={(e)=>this.setState({Menu:false})}>X</Button>
                                <Button key="list" tab={true} onPress={(e)=>this.setState({MenuSection:RosterMenuCategories.UNIT_LIST})} weight={this.state.MenuSection==RosterMenuCategories.UNIT_LIST?"heavy":"normal"}>Unit List</Button>
                                <Button key="rules" tab={true} onPress={(e)=>this.setState({MenuSection:RosterMenuCategories.RULES})} weight={this.state.MenuSection==RosterMenuCategories.RULES?"heavy":"normal"}>Rules</Button>
                                <Button key="remi" tab={true} onPress={(e)=>this.setState({MenuSection:RosterMenuCategories.REMINDERS})} weight={this.state.MenuSection==RosterMenuCategories.REMINDERS?"heavy":"normal"}>Reminders</Button>
                            </View>
                            <View style={{backgroundColor:this.context.Bg, top:-4, paddingTop:10, bottom:10, height:Variables.height - 52}}>
                                {menuContents}
                            </View>
                </View>;
            } else {
                return <View>
                    <ScrollView>
                        <View style={{width:Variables.width, alignSelf:"center", padding:10, height:"100%"}}>
                            <Unit data={this.state.Units[this.state.Index]} Leaders={this.state.Leaders} onUpdateLeader={(leader)=>this.UpdateLeader(leader,this)} />
                        </View>
                    </ScrollView>
                    <View style={{position:"absolute", right:20, top:20, zIndex:100, backgroundColor:this.context.Bg, borderRadius:10}}>
                        <View style={{flexDirection:"row"}}>
                            <Button key="back" onPress={(e)=> this.Previous()} textStyle={{transform:[{rotate:'180deg'}], top:2}}>➤</Button>
                            <View style={{flexDirection:"column"}}>
                                <Button onPress={(e)=> this.setState({Menu:true, MenuSection:RosterMenuCategories.UNIT_LIST})}style={{width:70}}>Menu</Button>
                            </View>
                            <Button key="for" onPress={(e)=> this.Next()}>➤</Button>
                        </View>
                        <Text style={{textAlign:"center"}}>{(this.state.Index+1) + " / " + this.state.Units.length}</Text>
                    </View>
                </View>;
            }
        }
    }
}

export default Roster;