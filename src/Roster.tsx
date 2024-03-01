import React, { ReactNode } from "react";
import Unit from "./Unit";
import {UnitData, CostData, WeaponData, ProfileWeaponData, ModelData, StatsData, DescriptorData} from "./UnitData";
import {View, ScrollView, Platform} from 'react-native';
import fastXMLParser from 'fast-xml-parser';
import Variables from "../Style/Variables";
import Button from "./Components/Button";
import {Text, ComplexText} from "./Components/Text";
import {ColoursContext} from "../Style/ColoursContext";

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
    onLoad:CallableFunction
}

class StatAndName {
    Stat: string;
    Name: string;
}

class WpnStats{
    Stats:Array<StatAndName>;
    isProfileWeapon:boolean;
}

class Roster extends React.Component<Props> {
    static contextType = ColoursContext; 
    declare context: React.ContextType<typeof ColoursContext>;
    state = {
        Name: "",
        Costs:"",
        Units: new Array<UnitData>(),
        Index:0,
        Menu:false,
        Rules: new Array<DescriptorData>(),
        Rule:false
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

    ExtractProfiles(profiles, avoid): Array<DescriptorData> {
        let profilesData = new Array<DescriptorData>();
        if (!isIterable(profiles.profile)) return profilesData;
        for(let element of profiles.profile){
            if (element._name !== avoid && element.characteristics) {
                profilesData.push(new DescriptorData(element._name, this.getCharacteristic(element.characteristics.characteristic)));
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
            }
        };
        this.state.Units.sort(UnitData.compareUnits);
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

    ShowRule(rule:DescriptorData, index:number):ReactNode{
        return <View key={index} style={{marginBottom:10}}>
                    <Text style={{backgroundColor:this.context.Accent, fontFamily:Variables.fonts.spaceMarine, padding:5}}>{rule.Name}</Text>
                    <ComplexText fontSize={Variables.fontSize.normal} style={{marginLeft:10, marginRight:10}}>{rule.Description}</ComplexText>
                </View>;
    }

    render(){
        let key= 0;
        if (Platform.OS=="web"){
            return <View style={{width:Variables.width, alignSelf:"center", padding:10}}>{this.state.Units.map(unitData => (
                <Unit data={unitData} key={key++} />
            ))}</View>;
        } else {
            if (this.state.Menu) {
                return <View style={{width:Variables.width, alignSelf:"center", padding:10, height:"100%", backgroundColor:this.context.Bg}}>
                            <View style={{flexDirection: 'row'}}>
                                <Button style={{ width:200}} onPress={(e)=>this.props.onBack()}>Back to Main Menu</Button>
                                <Button style={{position:"absolute", right:0}} onPress={(e)=>this.setState({Menu:false})}>X</Button>
                            </View>
                           <ScrollView>
                                {Variables.unitCategories.map((category, index) => this.ShowCategory(category, index))}
                            </ScrollView>
                        </View>;
            } else if (this.state.Rule) {
                return <View style={{width:Variables.width, alignSelf:"center", padding:10, height:"100%", backgroundColor:this.context.Bg}}>
                            <View style={{flexDirection: 'row'}}>
                                <Button style={{ width:200}} onPress={(e)=>this.props.onBack()}>Back to Main Menu</Button>
                                <Button style={{position:"absolute", right:0}} onPress={(e)=>this.setState({Rule:false})}>X</Button>
                            </View>
                           <ScrollView>
                                {this.state.Rules.map((category, index) => this.ShowRule(category, index))}
                            </ScrollView>
                        </View>;
            } else {
                return <View>
                    <ScrollView>
                        <View style={{width:Variables.width, alignSelf:"center", padding:10, height:"100%"}}>
                            <Unit data={this.state.Units[this.state.Index]}/>
                        </View>
                    </ScrollView>
                    <View style={{position:"absolute", right:20, top:20, zIndex:100, backgroundColor:this.context.Bg, borderRadius:10}}>
                        <View style={{flexDirection:"row"}}>
                            <Button onPress={(e)=> this.Previous()} textStyle={{transform:[{rotate:'180deg'}], top:2}}>➤</Button>
                            <View style={{flexDirection:"column"}}>
                                <Button onPress={(e)=> this.setState({Menu:true})}style={{width:70}}>Unit List</Button>
                                <Button onPress={(e)=> this.setState({Rule:true})}style={{width:70}}>Rules</Button>
                            </View>
                            <Button onPress={(e)=> this.Next()}>➤</Button>
                        </View>
                        <Text style={{textAlign:"center"}}>{(this.state.Index+1) + " / " + this.state.Units.length}</Text>
                    </View>
                </View>;
            }
        }
    }
}

export default Roster;