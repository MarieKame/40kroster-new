import { NewLifecycle } from "react";
import Variables from "../Variables";
import { STRATAGEMS, Stratagem } from "./Stratagems";
import { CostData, DescriptorData, LeaderData, ModelData, MultiRangeWeaponData, ProfileWeaponData, StatsData, UnitData, WeaponData } from "./UnitData";

const Phases={
    null:-1,
    "Any":0,
    "Command":1,
    "Moving":2,
    "Shooting":3,
    "Charge":4,
    "Fight":5
}

class StatAndName {
    Stat: string;
    Name: string;
}

class WpnStats{
    Stats:Array<StatAndName>;
    isProfileWeapon:boolean;
}

export class Reminder{
    Data:DescriptorData;
    UnitName:string;
    Phase:string|null;
}

function isIterable(obj) {
    if (obj == null) {
      return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
}

export default class RosterExtraction {
    private tempProfiles: Array<DescriptorData>;
    data = {
        Name: "",
        Costs:"",
        Faction:"",
        Detachment:"",
        Units: new Array<UnitData>(),
        UnitsToSkip: new Array<number>(),
        Leaders: new Array<LeaderData>(),
        Rules: new Array<DescriptorData>(),
        Reminders:new Array<Reminder>(),
        DetachmentStratagems: new Array<Stratagem>
    }

    private TestNameIsSame(currentName, unitName) :boolean{
        const found = /(.*)( .*)$/gi.exec(unitName);
        const regex = found?new RegExp("^"+found[1], "gi"):null;
        return currentName === unitName || currentName === unitName.substring(0, unitName.length-1) || regex&&regex.test(currentName) ;
    }

    FormatCost(cost) : CostData {
        return new CostData(Number(cost._value), cost._name);
    }

    AddNewRule(data:DescriptorData) {
        const name = /[a-z! ]*(?! )/gi.exec(data.Name).toString();
        if (!this.data.Rules.find(rule=>rule.Name == name)){
            this.data.Rules.push(new DescriptorData(name, data.Description));
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

    CheckAddReminder(data:DescriptorData, unitName:string){
        if (/(per battle)|(at the end of)|(each time)/gi.test(data.Description) && !/leading/gi.test(data.Description)){
            let reminder = new Reminder();
            reminder.UnitName=unitName;
            const results = /(((Command)|(Movement)|(Shooting)|(Charge)|(Fighting)|(Any)) (phase))/gi.exec(data.Description)
            if (results)
                reminder.Phase = results[2][0].toLocaleUpperCase() + results[2].slice(1);
            else
                reminder.Phase=null;
            reminder.Data = data;
            this.data.Reminders.push(reminder);
        }
    }

    ExtractProfiles(profiles, unitName): Array<DescriptorData> {
        let profilesData = new Array<DescriptorData>();
        if (!isIterable(profiles.profile)){
            const data=new DescriptorData(profiles.profile._name, this.getCharacteristic(profiles.profile.characteristics.characteristic));
            profilesData.push(data);
            this.CheckAddReminder(data, unitName);
            return profilesData;
        } 
        
       
        for(let element of profiles.profile){
            if (element._name !== unitName && element.characteristics && !this.TestNameIsSame(element._name, unitName)) {
                const data=new DescriptorData(element._name, this.getCharacteristic(element.characteristics.characteristic));
                profilesData.push(data);
                this.CheckAddReminder(data, unitName);
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
            let lastOneMelee=null;
            let profile=true;
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
                const wpn = new WeaponData(element.Stat, count, profileName, name);
                if(lastOneMelee == null){
                    lastOneMelee=wpn.IsMelee();
                } else {
                    if (lastOneMelee !== wpn.IsMelee()) {
                        profile=false;
                    }
                }
                profilesWeapons.push(wpn);
            }
            profilesWeapons = profilesWeapons.sort((wpnDta1, wpnDta2)=> wpnDta1.Traits.length != wpnDta2.Traits.length ?wpnDta1.Traits.length - wpnDta2.Traits.length:wpnDta1.Name.length - wpnDta2.Name.length)
            if (profile)
                return new ProfileWeaponData(profilesWeapons, count, name);
            else
            return new MultiRangeWeaponData(profilesWeapons, count, name);
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

    ExtractSingleModelUnitSelections(selections):Array<WeaponData> {
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
            if(selection.selections) {
                for(let element of selection.selections.selection){
                    that.TreatSelection({treatedSelections : model.treatedSelections}, Number(element._number), element._name, element.profiles);
                }
            } else {
                that.TreatSelection({treatedSelections : model.treatedSelections}, Number(selection._number), selection._name, selection.profiles);
            }
        }
    }

    ExtractMultiModelUnitSelections(selections) {
        let treatedSelections = new Array<WeaponData>();
        let that = this;
        function doElement(element){
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
        if (selections.selection.selections && isIterable(selections.selection.selections.selection)){
            for(let element of selections.selection.selections.selection){
                doElement(element)
            }
        } else if (!isIterable(selections.selection)){
            that.ExtractModelSelections({treatedSelections:treatedSelections},selections.selection.selections.selection, that);
        } else {
            for(let element of selections.selection){
                doElement(element)
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
            if (this.TestNameIsSame(element._name, name)) {
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

    ExtractModels(selections, invuls:Array<DescriptorData>, profiles?, name?) : Array<ModelData>|ModelData{
        let that = this;
        let models = new Array<ModelData>();

        function doElement(element, pass:{models}, that:RosterExtraction){
            let modelData:ModelData;
            const regex = new RegExp(element._name, 'gi');
            let invul = invuls.find(invul=>invul.Name.match(regex)||invul.Name=="Invulnerable Save");
            if (element.profile){
                modelData = new ModelData(element._name, new StatsData(that.ExtractStats(element, element._name), invul?invul.Description:null));
            } else if (element.profiles) {
                let forceInvul;
                if (isIterable(element.profiles.profile)) {
                    for(let elementIn of element.profiles.profile){
                        if(elementIn._name.match(/Invul/gi)){
                            forceInvul = elementIn.characteristics.characteristic.textValue;
                            that.tempProfiles.push(new DescriptorData(elementIn._name, elementIn.characteristics.characteristic.textValue));
                        }
                    }
                }
                modelData = new ModelData(element._name, new StatsData(that.ExtractStats(element.profiles, element._name), forceInvul?forceInvul:(invul?invul.Description:null)));
                
            }
            if(modelData) {
                if (!modelData.Stats.isRealModel()){
                    that.tempProfiles.push(new DescriptorData(modelData.Name, modelData.Stats.Data));
                } else if (pass.models.findIndex(model=>model.Name==modelData.Name) ==-1) {
                    pass.models.push(modelData);
                }
            }
        }
        if (!isIterable(selections.selection)){
            if (selections.selection.selections && isIterable(selections.selection.selections.selection)) {
                for(let element of selections.selection.selections.selection){
                    doElement(element, {models}, this);
                }
            } else {
                let profile;
                if (selections.selection.profiles) {
                    profile = selections.selection.profiles.profile;
                } else if (selections.selection.selections) {
                    profile = selections.selection.selections.selection.profiles.profile;
                }
                if (profile && ((profile._type && profile._type == "model") || (profile._typeName && profile._typeName == "Unit"))) {
                    return new ModelData(profile._name, new StatsData(that.ExtractStats(profile, profile._name), invuls.length>0?invuls[0].Description:null))
                }
            }
            
        } else {
            for(let element of selections.selection){
                doElement(element, {models}, this);
            }
            if (profiles && models.length == 0) {
                let uniqueModel;
                for(let element of profiles.profile){
                    if (element._name === name) {
                        uniqueModel = new ModelData(element._name, new StatsData(that.ExtractStats(element, element.name), invuls.length>0?invuls[0].Description:null))
                    }
                }
                return uniqueModel;
            }
        }

        return models;
    }

    FindInvulnerableDescriptors(profiles:Array<DescriptorData>):Array<DescriptorData>{
        return profiles.filter((descriptor) => descriptor.Name.match(/Invulnerable Save/gi));
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

    constructor(roster, forceLeaders:LeaderData[]|null, onUpdateLeaders:CallableFunction){
        this.data.Name = roster._name;
        this.data.Costs = this.FormatCost(roster.costs.cost).toString();
        let key = 0;
        const doLeaders = forceLeaders==null;
        this.data.Faction = roster.forces.force._catalogueName.indexOf("-")!==-1?roster.forces.force._catalogueName.match(/(?<=- ).*/gi)[0]:roster.forces.force._catalogueName;

        if (!doLeaders) {
            this.data.Leaders=forceLeaders;
        }
        
        for(let element of roster.forces.force.selections.selection) {
            if (element._type === "model" || element._type === "unit") {
                this.tempProfiles = new Array<DescriptorData>();
                let newUnit = new UnitData();
                newUnit.Key = key++;
                newUnit.CustomName = element._customName??null;
                newUnit.Name = element._name;
                newUnit.Rules = this.ExtractRules(element.rules);
                newUnit.Costs = this.FormatCost(element.costs.cost);
                let categories = this.ExtractCategories(element.categories);
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
                newUnit.Profiles = this.ExtractProfiles(element.profiles, newUnit.Name);
                let weapons:Array<WeaponData>;
                if (element._type == "model") {
                    const invuls = this.FindInvulnerableDescriptors(newUnit.Profiles);
                    newUnit.Models = new ModelData(element._name, new StatsData( this.ExtractStats(element.profiles, element._name), invuls.length>0?invuls[0].Description:null));
                    weapons = this.ExtractSingleModelUnitSelections(element.selections);
                } else if (element._type == "unit") {
                    weapons = this.ExtractMultiModelUnitSelections(element.selections);
                    if (weapons.length == 0) {
                        weapons = this.ExtractSingleModelUnitSelections(element.selections);
                    }
                    let invuls = this.FindInvulnerableDescriptors(newUnit.Profiles);
                    newUnit.Models = this.ExtractModels(element.selections, invuls, element.profiles, newUnit.Name);
                    let otherModel;
                    try{
                        otherModel = new ModelData(element._name, new StatsData( this.ExtractStats(element.profiles, element._name), invuls.length>0?invuls[0].Description:null))
                    } catch(e){}
                    if (newUnit.HasNoModel()) {
                        newUnit.Models = otherModel;
                    } else if (otherModel && otherModel.Stats.isRealModel()){
                        if(isIterable(newUnit.Models)) {
                            // @ts-ignore
                            newUnit.Models.push(otherModel);
                        } else {
                            newUnit.Models = [newUnit.Models, otherModel];
                        }
                    }
                }
                this.tempProfiles.forEach(extraProfile => {
                    newUnit.Profiles.push(extraProfile);
                });
                newUnit.MeleeWeapons = new Array<WeaponData>();
                newUnit.RangedWeapons = new Array<WeaponData>();
                newUnit.OtherEquipment = new Array<WeaponData>();
                if (isIterable(weapons)) {
                    for(let weapon of weapons){
                        if (weapon.IsMultiRange()){
                            function __formatName(wpnName, profileName){
                                return "➤ " + wpnName + (profileName!==""?" - " + profileName:"");
                            }
                            if((weapon as MultiRangeWeaponData).MeleeProfiles.length > 1){
                                newUnit.MeleeWeapons.push(new ProfileWeaponData((weapon as MultiRangeWeaponData).MeleeProfiles, weapon.Count, weapon.Name));
                            } else if ((weapon as MultiRangeWeaponData).MeleeProfiles.length == 1 ){
                                newUnit.MeleeWeapons.push(new WeaponData((weapon as MultiRangeWeaponData).MeleeProfiles[0].Data, weapon.Count, __formatName(weapon.Name, (weapon as MultiRangeWeaponData).MeleeProfiles[0].Name)));
                            }

                            if((weapon as MultiRangeWeaponData).RangedProfiles.length > 1){
                                newUnit.RangedWeapons.push(new ProfileWeaponData((weapon as MultiRangeWeaponData).RangedProfiles, weapon.Count, weapon.Name));
                            } else if ((weapon as MultiRangeWeaponData).RangedProfiles.length == 1 ){
                                newUnit.RangedWeapons.push(new WeaponData((weapon as MultiRangeWeaponData).RangedProfiles[0].Data, weapon.Count, __formatName(weapon.Name, (weapon as MultiRangeWeaponData).RangedProfiles[0].Name)));
                            }
                        } else if (weapon.IsMelee()) {
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
                    newUnit.Rules = this.getDefaultRules(newUnit.Factions);
                }
                newUnit.Rules.forEach(rule=>{
                    if (rule.Name !== "Leader") {
                        const regex = new RegExp(rule.Name, "gi");
                        const index = newUnit.Profiles.findIndex(profile=>regex.test(profile.Name));
                        if(index !== -1) {
                            rule.Name += " " + /D?[0-9]\+?/i.exec(newUnit.Profiles[index].Description).toString().trim();
                            newUnit.Profiles.splice(index, 1);
                        }
                    }
                })
                this.data.Units.push(newUnit);
                if (doLeaders && newUnit.GetLeaderData()){
                    this.data.Leaders.push(newUnit.GetLeaderData());
                }
            } else if (element._name == "Detachment Choice"){
                this.data.Detachment = /(.*)( Detachment)?/gi.exec(element.selections.selection._name)[1];
                this.data.DetachmentStratagems = STRATAGEMS;
                this.data.DetachmentStratagems.filter(stratagem=>stratagem.Faction == this.data.Faction && stratagem.Detachment == this.data.Detachment);

                if (element.selections.selection.rules) {
                    let reminder = new Reminder();
                    reminder.UnitName = " - Detachment";
                    reminder.Phase = null;
                    reminder.Data = new DescriptorData(element.selections.selection.rules.rule._name, element.selections.selection.rules.rule.description);
                    this.data.Reminders.push(reminder);
                }
            }
        };
        this.data.Reminders = this.data.Reminders.filter((reminder1, index, reminders) => 
            reminders.findIndex((reminder2) => 
                reminder1.UnitName==reminder2.UnitName && reminder1.Data.Name == reminder2.Data.Name
            ) == index);
        this.data.Reminders.sort((reminder1, reminder2)=>{
            return Phases[reminder1.Phase] !== Phases[reminder2.Phase]
                        ?Phases[reminder1.Phase] - Phases[reminder2.Phase]
                        :(reminder1.UnitName !== reminder2.UnitName)
                            ? reminder1.UnitName.localeCompare(reminder2.UnitName)
                            : reminder1.Data.Name.localeCompare(reminder2.Data.Name);
        });
        function Name(leader:LeaderData){
            return leader.CustomName?leader.CustomName+" ("+leader.BaseName+") ":leader.BaseName;
        }
        if (doLeaders) {
            this.data.Leaders.sort((leader1, leader2)=>this.data.Units.findIndex(unit=>Name(leader1).indexOf(unit.Name)!==-1)-this.data.Units.findIndex(unit=>Name(leader2).indexOf(unit.Name)!==-1))
            onUpdateLeaders(this.data.Leaders);
        }
        this.data.Units.sort(UnitData.CompareUnits);
        this.data.Units.forEach((unit1, index)=>{
            this.data.Units.slice(index+1).forEach((unit2, index2)=>{
                if (unit1.Equals(unit2, this.data.Leaders)) {
                    this.data.UnitsToSkip.push(index2 + index + 1);
                    unit1.Count++;
                }
            });
        });
        this.data.Rules.sort((rule1, rule2)=> rule1.Name.localeCompare(rule2.Name));
        
    }
}