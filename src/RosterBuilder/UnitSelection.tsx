import Each from "../Components/Each";
import { DescriptorRaw, ModelRaw, UnitRaw, WeaponProfileRaw, WeaponRaw } from "../Roster/RosterRaw";
import BuilderMenu from "./BuilderMenu";
import { ProfilesDisplayData } from "./ProfilesDisplay";
import RosterSelectionData, { Constraint, SelectionEntry, TargetSelectionData, Modifier, ModifierType, ProfileData, InfoLink, Condition, LogicalModifier, Characteristic } from "./RosterSelectionData";

function Compare(modifier:Modifier, value:number):boolean{
    if(modifier.Comparator=="atLeast") return value >= Number(modifier.Comparison);
    if(modifier.Comparator=="atMost") return value < Number(modifier.Comparison);
    return true;
}

abstract class PrivateSelection {
    protected _modifiers:Array<Modifier>;
    private cost:number;
    private min:number;
    private max:number;

    Profiles:Array<ProfileData>;
    SelectionValue:Array<Selection>;
    Count:number;
    Parent?:Selection;
    Constraints:Array<Constraint>;
    Type:string;
    ID:string;
    Name:string;
    Stats:Array<string>;
    Categories:Array<string>;
    Rules:Array<string>;

    constructor(count:number, data:SelectionEntry, parent:Selection){
        if(!data) return;
        this.Constraints = data.Constraints;
        this._modifiers = data.Modifiers;
        this.ID = data.ID;
        Each(this.Constraints, constraint=>{
            if(constraint.Type === "min") this.min = constraint.Value;
            if(constraint.Type === "max") this.max = constraint.Value;
        })
        if(!this.min) this.min=0;
        this.cost = data.Cost;
        this.Type=data.Type;
        this.Count = count;
        this.Parent = parent;
        this.SelectionValue = new Array<Selection>();
        this.Profiles = [...data.Profiles];
        this.Name = data.Name;
        this.Categories = data.Categories;
        this.Rules = data.Rules;
    }

    GetCost():number{
        let modifiedValue;
        let modelCount = this.GetModelCount();
        Each(this._modifiers, modifier=>{
            switch(modifier.Comparator) {
                case "atLeast":
                    if(modelCount >= modifier.Comparison) modifiedValue= modifier.Value;
                    break;
                case "atMost":
                    if(modelCount < modifier.Comparison) modifiedValue= modifier.Value;
                    break;
            }
        });
        let cost = modifiedValue?modifiedValue:this.cost;
        const en = this._getEnhancements();
        return Number(cost) + Number(en.length>0?en[0].cost:0);
    }

    GetLocalOrParentCount(){
        return !this.Parent?this.Count:this.Parent.getSelectionCountFor(this.ID);
    }

    GetValidTypeCount():number{
        let count = (this.Type==="group")?this.GetSelectionCount():this.GetLocalOrParentCount();
        return count;
    }
    private getValidTypeCount():number{
        return (this.Type==="group")?this.GetSelectionCount():this.Count;
    }

    GetSelectionCount():number{
        return this.SelectionValue.map(sel=>sel.getValidTypeCount()).reduce((sum, current)=> sum+current, 0);
    }
    private getSelectionCountFor(specificId:string):number{
        return this.SelectionValue.filter(sel=>sel.ID===specificId).map(sel=>sel.getValidTypeCount()).reduce((sum, current)=> sum+current, 0)
    }

    NoOptions():boolean{
        let noOption = true;
        Each(this.SelectionValue, sel=>{
            noOption= noOption && sel.NoOptions();
            noOption= noOption && sel.GetValidTypeCount() !== 0;
        })
        return noOption;
    }

    protected _getSpecificSelections(type:string):Array<Selection>{
        let selections = new Array<Selection>();
        if(this.Type===type){
            if (this instanceof Selection) selections.push(this);
        }
        Each<Selection>(this.SelectionValue, sv=>{
            selections = [...selections, ...sv._getSpecificSelections(type)];
        })
        return selections;
    }

    protected _getModelSelections():Array<Selection>{
        return this._getSpecificSelections("model");
    }

    protected _getEnhancements():Array<PrivateSelection>{
        return this._getSpecificSelections("upgrade").filter(s=>/Enhancement/gi.test(s.Parent.Name) && s.Count===1);
    }

    GetAbilitiesContainers():Array<PrivateSelection>{
        let abilityContainers = new Array<PrivateSelection>();
        if(this.Profiles.filter(p=>p.Type==="Abilities").length>0) {
            abilityContainers.push(this);
        }
        Each<Selection>(this.SelectionValue, sv=>{
            abilityContainers = [...abilityContainers, ...sv.GetAbilitiesContainers()];
        });
        return abilityContainers;
    }

    GetAbilities(recursive:boolean=false):Array<ProfileData> {
        let abilities = new Array<ProfileData>();
        if(this.Count>0) {
            abilities = [...this.Profiles.filter(p=>p.Type==="Abilities")];
        }
        if(recursive) {
            Each<Selection>(this.SelectionValue, sv=>{
                abilities = [...abilities, ...sv.GetAbilities()];
            });
        }
        return abilities;
    }

    GetModelCount():number{
        return this._getModelSelections().map(model=>model.getValidTypeCount()).reduce((sum, current)=> sum+current, 0);
    }

    FindUnitProfile():ProfileData{
        return this.Profiles.find(p=>p.Type==="Unit");
    }

    GetModelsWithDifferentProfiles():Array<Selection>{
        function differentProfiles(model:Selection, index:number, models:Array<Selection>) {
            if(model.Profiles.length===0) return false;
            return models.findIndex(m=>
                m.Profiles.length===1 && 
                m.FindUnitProfile().Characteristics.map(c=>c.Value).toString() === model.FindUnitProfile().Characteristics.map(c=>c.Value).toString()) === index;
          }
          const filtered = this._getModelSelections().filter(differentProfiles);
        return filtered.length>0?filtered:this._getModelSelections();
    }

    Valid(adding:number=0):boolean{
        let valid=true;
        const count = Number(this.GetValidTypeCount()) + Number(adding);
        Each(this.Constraints, constraint=>{
            if(constraint.Type === "min") valid= valid && constraint.Value <= count;
            if(constraint.Type === "max") valid= valid && count <= this._getMax();
        })
        return valid;
    }
    

    protected _mergeConstraints(data:ProfileData, extraConstraints:Array<Constraint>):ProfileData {
        let pd = new ProfileData();
        pd.Categories = data.Categories;
        pd.Characteristics = data.Characteristics;
        pd.Constraints = [...data.Constraints, ...extraConstraints];
        pd.Name = data.Name;
        pd.ID = data.ID;
        pd.Type = data.Type;
        return pd;
    }
    DisplayStats():ProfilesDisplayData|Array<ProfilesDisplayData>{
        console.log(this.Name)
        console.log(this.Profiles)
        return new ProfilesDisplayData(this.Profiles.map(s=>this._mergeConstraints(s, this.Constraints)));
    }

    IsWarlord():boolean {
        const found = this.SelectionValue.find(sv=>sv.Name==="Warlord");
        return found&&found.Count==1;
    }

    CanRemove():boolean{
        return this.GetValidTypeCount() > this._getMin();
    }

    CanAdd():boolean{
        return this._getMaxPossible()==undefined?this.Parent.Valid(1)||this.Parent.Valid(5): this.GetValidTypeCount() < this._getMaxPossible();
    }
    
    Changeable():boolean{
        return this._getMin() !== this._getMax() || this._getMax()===undefined;
    }

    protected _getMin():number{
        return this.min;
    }
    protected _getMax():number{
        const found = this._modifiers.find(m=>m.Type===ModifierType.MAX);
        return found?(Compare(found, this.GetAncestor().GetSelectionCount())?Number(found.Value):this.max):this.max;
    }
    protected _getMaxPossible():number{
        const found = this._modifiers.find(m=>m.Type===ModifierType.MAX);
        return found?Number(found.Value):this.max;
    }
    protected abstract GetAncestor():Selection;
}

export class SelectionTreeEntry{
    SelectionID:string;
    ExtraID:string;
    Count:number;
    Children:Array<SelectionTreeEntry>;
    Index:number;
}

class SelectionID {
    ID:string; 
    Selection:Selection;
}

export default class Selection extends PrivateSelection {
    Ancestor:Selection;
    CustomName:string=null;
    private hidden:boolean;
    private secretSelection:Array<Selection>;
    private selectionMap:Array<SelectionID>;

    private data:SelectionEntry;
    private rse:RosterSelectionData;
    ExtraID:string;

    private static merging:Array<SelectionID> = new Array<SelectionID>();
    static Duplicate(selection:Selection):Selection{
        return new Selection(1, selection.data, selection.rse, selection.Parent, selection.Ancestor, selection.ExtraID, 0);
    }
    static DeepDuplicate(selection:Selection):Selection{
        let sel = new Selection(1, selection.data, selection.rse, selection.Parent, selection.Ancestor, selection.ExtraID, 0);
        sel.applySelectionIdTree(selection.getSelectionIdTree());
        return sel;
    }
    static Init(data:SelectionEntry, rse:RosterSelectionData, extraId?:string) : Selection{
        if (!data) return;
        let sel = new Selection(1, data, rse, null, null, extraId, 0);
        //sel.Debug();
        return sel;
    }

    static FromTree(entry:SelectionTreeEntry, rse:RosterSelectionData):Selection {
        let sel = new Selection(1, rse.GetSelectionFromId(entry.SelectionID), rse, null, null, entry.ExtraID, 0);
        //sel.Debug();
        sel.applySelectionIdTree(entry);
        sel.Debug();
        return sel;
    }

    protected GetAncestor(): Selection {
        return this.Ancestor;
    }

    private constructor(count:number, data:SelectionEntry, rse:RosterSelectionData, parent:Selection, ancestor:Selection, extraId:string, index:number){
        super(count, data, parent);
        if(ancestor===null) {
            this.Ancestor=this;
            this.ExtraID = extraId;
            this.selectionMap = new Array<SelectionID>()
        } else {
            this.Ancestor=ancestor;
        }
        if(!data) return;
        this.rse = rse;
        this.data = data;
        if(/(w\/)|(with)/gi.test(this.Name)){
            this.Name = /(?<=(w\/)|(with) ).*/gi.exec(this.Name)[0].trim();
        }
        this.secretSelection = new Array<Selection>();
        if(this.Type !== "upgrade") {
            this.getDefaultSelection(data, rse, {SelectionValue:this.SelectionValue});
        } else {
            this.getDefaultSelection(data, rse, {SelectionValue:this.secretSelection});
        }
        Each<InfoLink>(this.data.ProfileInfoLinks, infoLink=>{
            this.Profiles.push(rse.GetProfile(infoLink, this.Ancestor));
        });
    }

    private getSelectionIdTree(duplicate:boolean=true, index:number=0):SelectionTreeEntry {
        let entry = {
            SelectionID:this.ID,
            Count:(this.Parent!==null && duplicate && /Enhancement/gi.test(this.Parent.Name))?0:this.Count, 
            Children:new Array<SelectionTreeEntry>(), 
            ExtraID:this.ExtraID,
            Index:index
        };
        Each(this.SelectionValue, (sv, index)=>{
            entry.Children.push(sv.getSelectionIdTree(duplicate, index));
        });
        return entry;
    }

    private applySelectionIdTree(entry:SelectionTreeEntry) {
        let same = true;
        try{
            this.Count = entry.Count;
            if(entry.Children.length!==this.SelectionValue.length) {
                same=false;
            } else {
                Each<SelectionTreeEntry>(entry.Children, c=>{
                    if(c.SelectionID !== this.SelectionValue[c.Index].ID) same=false;
                });
            }
            if(!same) {
                let newSelectionValue = new Array<Selection>();
                Each<SelectionTreeEntry>(entry.Children, c=>{
                    newSelectionValue.push(Selection.Duplicate(this.SelectionValue.find(sv=>sv.ID === c.SelectionID)))
                });
                this.SelectionValue = newSelectionValue;
            }
            Each<SelectionTreeEntry>(entry.Children, c=>{
                this.SelectionValue[c.Index].applySelectionIdTree(c);
            })
        } catch(e){
            console.error("Selection Tree Error");
            console.error(entry.Children.map(c=>c.SelectionID));
            console.error(this.SelectionValue.map(sv=>sv.ID));
        }
    }

    GetVariablesCategoryIndex():number{
        return this.data.GetVariablesCategoryIndex();
    }

    GetFrameworkCategories():SelectionEntry{
        return this.data;
    }
    GetFrameworkCost():number{
        return this.data.Cost;
    }

    HasEnhancement():boolean{
        return this._getEnhancements().length>0;
    }

    ReplaceWith(id:string){
        this.Count=0;
        this.Parent.SelectionValue.find(sv=>sv.ID===id).Count=1;
    }

    DisplayCount():string{
        let min = this._getMin();
        if (min === this._getMax()) min=null;
        return ((this.Type==="group" || this.Changeable())? " - " + this.GetValidTypeCount() + (this._getMax()!==undefined?(" [ " + (min!==null?(min+" ~ "):"") + this._getMax() +  " ]"):""):"");
    }

    IsHidden():boolean{
        let that = this;
        function TreatCondition(condition:Condition):boolean{
            let hidden = false;
            switch(condition.Comparator){
                case "equalTo":
                    hidden = hidden || 
                        (that.Ancestor.selectionMap.find(s=>s.ID === condition.Field).Selection.GetValidTypeCount() === Number(condition.Comparison) 
                        && condition.Value==="true");
                    break;
                case "notInstanceOf":
                    hidden = hidden || (that.Ancestor.ID !== condition.Field && that.Ancestor.ExtraID !== condition.Field);
                    break;
                default:
                    console.error("IsHidden condition comparator not taken into account : " + condition.Comparator);
                    console.error(condition);
                    break;
            }
            return hidden;
        }

        let hidden = this.hidden;
        Each<Modifier>(this._modifiers.filter(m=>m.Type===ModifierType.HIDE), modifier=>{
            if(modifier instanceof LogicalModifier) {
                if(modifier.Logic==="or") {
                    Each(modifier.Conditions, condition=>{
                        hidden = hidden || TreatCondition(condition);
                    })
                } else if (modifier.Logic==="and") {
                    let and = true;
                    Each(modifier.Conditions, condition=>{
                        and = and && TreatCondition(condition);
                    })
                    hidden = hidden || and;
                }
            } else {
                hidden = hidden || TreatCondition(modifier);
            }
            
        });
        return hidden;
    }
    DisplayStats():ProfilesDisplayData|Array<ProfilesDisplayData>{
        if(this.secretSelection.length>0){
            return this.secretSelection.map<ProfilesDisplayData>(s=> new ProfilesDisplayData(s.Profiles.map(s2=>this._mergeConstraints(s2, s.Constraints))));
        } else {
            return super.DisplayStats();
        }
    }

    Add(bm:BuilderMenu):void{
        if(this.Parent.checkAdd(this)) this.Count++;
        bm.setState({update:bm.state.update+1});
    }
    private checkAdd(selection:Selection):boolean{
        if(selection.NoOptions() || selection.Count == 0){
            return true;
        } else {
            this.SelectionValue.push(Selection.Duplicate(selection));
            return false;
        }
    }

    Remove(bm:BuilderMenu):void{
        this.Count--;
        this.Parent.checkRemove(this);
        bm.setState({update:bm.state.update+1});
    }
    private checkRemove(selection:Selection):void {
        if(this.SelectionValue.filter(sel=>sel.ID == selection.ID).length > 1){
            this.SelectionValue.splice(this.SelectionValue.findIndex(sel=>sel.ID==selection.ID && sel.Count===0), 1);
        }
    }

    ValidRecursive():boolean{
        let valid = this.Valid();
        Each(this.SelectionValue, sel=>{
            valid = valid && sel.ValidRecursive();
        });
        return valid;
    }

    GetMaximumCount(selection:SelectionEntry):number{
        const max = selection.Constraints.find(constraint=>constraint.Type==="max")
        if (!max) return 1;
        return Number(max.Value);
    }

    GetMinimumCount(selection:SelectionEntry):number{
        const min = selection.Constraints.find(constraint=>constraint.Type==="min")
        if (!min) return 0;
        return Number(min.Value);
    }

    private getDefaultSelection(data:SelectionEntry, rse:RosterSelectionData, current:{SelectionValue:Array<Selection>}){
        let options = [...rse.GetChildren(data), ...data.SubEntries];
        const that = this;
        function newSelection(data:SelectionEntry|TargetSelectionData, index:number, defaultId?:string):Selection{
            if(!data) return;
            let found=-1;
            let setMergeId;
            let isDefault = defaultId && data.ID === defaultId;
            if (data instanceof TargetSelectionData) {
                const newData = rse.GetTarget(data);
                const targetId = data.Target;
                if(data.CheckMerge.length>0) {
                    const found2 = data.CheckMerge.findIndex(cm=>cm[0] === targetId);
                    if (found2 !== -1){
                        found = Selection.merging.findIndex(m=>m.ID === targetId);
                        if(found === -1) {
                            setMergeId=data.CheckMerge[found2][1];
                        }
                    }
                }
                data = newData;
            }
            let count = 1;
            if(that.Type==="group" || that.Type==="unit"){
                const cFound = data.Constraints.find(c=>c.Type==="min");
                count=cFound?Number(cFound.Value):1;
                if(!that.Valid()) {
                    while(!that.Valid(count)){
                        count++
                    }
                }
            } else {
                count = Math.min(Number(that.GetMinimumCount(data)), that.GetMaximumCount(data));
            }
            count = (defaultId?(isDefault?count:0):count);
            let sel = new Selection((defaultId?(isDefault?count:0):count), data, rse, that, that.Ancestor, null, index);
            const extraProfile = rse.GetProfileByName(sel.Name);
            if(sel.Profiles.length===0 && extraProfile) {
                sel.Profiles.push(extraProfile);
            }
            sel.Ancestor.selectionMap.push({ID:sel.ID, Selection:sel});
            if(sel.Name==="Warlord") {
                count=sel._getMin();
                sel.Count = sel._getMin();
            }

            if(setMergeId) {
                Selection.merging.push({ID:setMergeId, Selection:sel});
            }

            if (found !== -1) {
                let otherSel = Selection.merging[found].Selection;
                Each(sel.SelectionValue, val=>{
                    val.Count = 0;
                });
                otherSel.SelectionValue = [...otherSel.SelectionValue, ...sel.SelectionValue];
                Selection.merging.splice(found, 1);
                otherSel.Type= "group";
                otherSel.Name += " or " + data.Name;
            } else {
                if(sel.Type==="group" || sel.Type=="unit" || sel.NoOptions() || count === 0){
                    sel.Count=count;
                    if(sel.Parent.Type === "group" && !sel.Parent.Valid(count) || (/Enhancement/gi.test(sel.Parent.Name) && !isDefault)) {
                        sel.Count=0;
                    }
                    current.SelectionValue.push(sel);
                } else {
                    sel.Count=1;
                    if(sel.Parent.Type === "group" && !sel.Parent.Valid(count)) {
                        count=0;
                        sel.Count=0;
                        current.SelectionValue.push(sel);
                    }
                    for(let i= 0; i != count; i++){
                        current.SelectionValue.push(Selection.Duplicate(sel)); 
                    }
                }
            }
        }
        Each(options, (option, index)=>{
            newSelection(option, index, data.DefaultSelectionID);
        });
        current.SelectionValue = current.SelectionValue.sort((sv1:Selection, sv2:Selection)=> {
            function getUpgradeProfile(s:Selection):ProfileData {
                if(s.secretSelection.length>0) {
                    return s.secretSelection[0].Profiles[0];
                } return s.Profiles[0];
            }
            function sortMelee(sv1:Selection, sv2:Selection) :number {
                if (getUpgradeProfile(sv1).Characteristics.length===1) return 1;
                if (getUpgradeProfile(sv2).Characteristics.length===1) return -1;
                return getUpgradeProfile(sv1).Characteristics[0].Value==="Melee" && getUpgradeProfile(sv2).Characteristics[0].Value!=="Melee" ?-1:0;
            }
            if(/Warlord/gi.test(sv1.Name)) return -1;
            if(/Enhancement/gi.test(sv1.Name)) return 1;
            if(sv1.Parent.ID===sv1.Ancestor.ID){
                if (sv1.Type==="upgrade") return -1;
                return 0;
            }
            if(sv1.Type==="group") {
                if(sv2.Type==="upgrade") {
                    if(sv1.Parent.ID!==sv1.Ancestor.ID) return -1;
                    if(getUpgradeProfile(sv2).Characteristics.length===1) return 1;
                    if(sv1.SelectionValue[0].Type==="upgrade") return sortMelee(sv1.SelectionValue[0], sv2);
                } else if (sv2.Type==="group") {
                    if(sv1.SelectionValue[0].Type==="upgrade" && sv2.SelectionValue[0].Type==="upgrade") return sortMelee(sv1.SelectionValue[0], sv2.SelectionValue[0]);
                }
            }
            if(sv2.Type==="group"){
                if(sv1.Type==="upgrade") {
                    if(sv2.Parent.ID!==sv2.Ancestor.ID) return 1;
                    if(getUpgradeProfile(sv1).Characteristics.length===1) return -1;
                    if(sv2.SelectionValue[0].Type==="upgrade") return sortMelee(sv1, sv2.SelectionValue[0]);
                }
            }
            if(sv1.Type==="upgrade"){
                if(sv2.Type==="upgrade") return sortMelee(sv1, sv2);
                if(sv2.Type==="group" && sv2.SelectionValue[0].Type==="upgrade") return sortMelee(sv1, sv2.SelectionValue[0]);
            } 
            return 0;
        });
    }

    protected _getWeapons():Array<Selection> {
        return this._getSpecificSelections("upgrade").filter(s=>
            (s.Profiles.length>0 && s.Profiles.findIndex(p=>/weapon/gi.test(p.Type))!==-1) ||
            (s.secretSelection.length>0));
    }

    private getFirstModelParent():Selection {
        if(this.Parent.Type==="model") return this.Parent;
        return this.Parent.getFirstModelParent();
    }

    GetUnitRaw(index:number):UnitRaw{
        let ur = new UnitRaw();
        function toCharacteristicRaw(characteristics:Array<Characteristic>):Array<DescriptorRaw> {
            return characteristics.map(c=>{return{Name:c.Name, Value:c.Value}});
        }
        function toModelRaw(model:Selection, name?:string):ModelRaw {
            let mr = new ModelRaw();
            mr.Name=name?name:model.Name;
            mr.Characteristics = toCharacteristicRaw(model.FindUnitProfile().Characteristics)
            return mr;
        }
        function toProfileRaw(data:ProfileData, nameToIgnore?:string):WeaponProfileRaw {
            let adr = new WeaponProfileRaw();
            const reg = new RegExp("(" + nameToIgnore + " - )(.*)", "gi").exec(data.Name);
            if (reg && reg.length>0) {
                adr.Name = reg[2];
            } else {
                adr.Name = data.Name;
            }
            adr.Profile = new Array<DescriptorRaw>();
            Each<Characteristic>(data.Characteristics, characteristic=>{
                adr.Profile.push({Name:characteristic.Name, Value:characteristic.Value});
            });
            return adr;
        }
        function toWeaponRaw(model:Selection, nameToIgnore?:string):WeaponRaw|Array<WeaponRaw> {
            if(model.secretSelection.length!==0) {
                let subSelection = new Array<WeaponRaw>();
                Each<Selection>(model.secretSelection, selection=>{
                    let wr = toWeaponRaw(selection, model.Name);
                    if(wr instanceof WeaponRaw) {
                        wr.Count= selection.Count * model.Count * model.getFirstModelParent().Count;
                        subSelection.push(wr);
                    } else {
                        console.error("not supposed to");
                    }
                });
                return subSelection;
            }
            let wr = new WeaponRaw();
            wr.Count = model.Count * model.getFirstModelParent().Count;
            wr.Name = model.Name;
            wr.Profiles = model.Profiles.map(p=>toProfileRaw(p, nameToIgnore?nameToIgnore:model.Name));
            return wr;
        }

        function exploreRawWeapons(wrd:WeaponRaw|Array<WeaponRaw>):Array<WeaponRaw>{
            if (wrd instanceof WeaponRaw)
                return [wrd]
            return wrd;
        }
        let weapons = new Array<WeaponRaw>();
        Each<Selection>(this._getWeapons(), weapon=>{
            weapons = [...weapons, ...exploreRawWeapons(toWeaponRaw(weapon))];
        });
        let mergedWeapons = new Array<WeaponRaw>();
        Each<WeaponRaw>(weapons, weapon=>{
            const found = mergedWeapons.find(wpn=>wpn.Name===weapon.Name);
            if(found) {
                found.Count+= weapon.Count;
            } else {
                mergedWeapons.push(weapon);
            }
        });
        ur.Weapons = mergedWeapons.filter(wpn=>wpn.Count!==0);
        const models = this.GetModelsWithDifferentProfiles();
        ur.Models = models.length===1?[toModelRaw(models[0], this.Name)]:models.map(m=>toModelRaw(m));
        ur.Categories = this.Categories;
        ur.Cost = this.GetCost();
        ur.BaseName = this.Name;
        ur.CustomName = this.CustomName;
        ur.UniqueID = this.Name + index;
        const abilities = this.GetAbilities(true);
        ur.Abilities = [
                ...abilities, 
                ...this.GetAbilitiesContainers().filter(
                    s=>s.Count===1 && 
                    s.ID!==this.ID &&
                    s instanceof Selection && !s.IsHidden() &&
                    abilities.findIndex(a=>a.Name===s.Name)===-1 &&
                    (!s.Parent || !s.Parent.IsHidden())
                ).flatMap(s=>s.Profiles)
            ].map(p=>{return{Name:p.Name, Value:p.Characteristics[0].Value}});
        ur.Rules = [...this.Rules];
        ur.Tree = this.getSelectionIdTree(false);
        return ur;
    }

    Debug(){
        console.debug("----------------DEBUG--------------------")
        this.debugRec("");
    }
    private debugRec(space:string) {
        console.debug(space + this.Name + " - " + this.Type + " - " + this.Count + " - " + this.Profiles.length + " - " + this.ID);
        Each([...this.SelectionValue, ...this.secretSelection], val=>{
            val.debugRec(space+"  ");
        });
    }
}