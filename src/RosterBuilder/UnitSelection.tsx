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
    protected cost:number;
    protected min:number;
    protected max:number;

    Profiles:Array<ProfileData>;
    protected _selectionValue:Array<Selection>;
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
        this._selectionValue = new Array<Selection>();
        this.Profiles = [...data.Profiles];
        this.Name = data.Name;
        this.Categories = data.Categories;
        this.Rules = data.Rules;
    }

    SelectionValue():Array<Selection>{
        return this._selectionValue;
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
        return this._selectionValue.map(sel=>sel.getValidTypeCount()).reduce((sum, current)=> sum+current, 0);
    }
    private getSelectionCountFor(specificId:string):number{
        return this._selectionValue.filter(sel=>sel.ID===specificId).map(sel=>sel.getValidTypeCount()).reduce((sum, current)=> sum+current, 0)
    }

    NoOptions():boolean{
        let noOption = true;
        Each(this._selectionValue, sel=>{
            noOption= noOption && sel.NoOptions();
            noOption= noOption && sel.GetValidTypeCount() !== 0;
        })
        return noOption;
    }

    protected _getSpecificSelections(type:Array<string>):Array<Selection>{
        let selections = new Array<Selection>();
        Each<string>(type, t=>{
            if(this.Type===t){
                if (this instanceof Selection) selections.push(this);
            }
        });
        Each<Selection>(this._selectionValue, sv=>{
            selections = [...selections, ...sv._getSpecificSelections(type)];
        })
        return selections;
    }

    protected _getEnhancements():Array<PrivateSelection>{
        return this._getSpecificSelections(["upgrade"]).filter(s=>/Enhancement/gi.test(s.Parent.Name) && s.Count===1);
    }

    GetAbilitiesContainers():Array<PrivateSelection>{
        let abilityContainers = new Array<PrivateSelection>();
        if(this.Profiles.filter(p=>p.Type==="Abilities").length>0) {
            abilityContainers.push(this);
        }
        Each<Selection>(this._selectionValue, sv=>{
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
            Each<Selection>(this._selectionValue, sv=>{
                abilities = [...abilities, ...sv.GetAbilities()];
            });
        }
        return abilities;
    }

    GetModelCount():number{
        return this._getSpecificSelections(["model"]).map(model=>model.getValidTypeCount()).reduce((sum, current)=> sum+current, 0);
    }

    FindUnitProfile():ProfileData{
        return this.Profiles.find(p=>p.Type==="Unit");
    }

    GetModelsWithDifferentProfiles():Array<Selection>{
        function differentProfiles(model:Selection, index:number, models:Array<Selection>) {
            if(!model.FindUnitProfile()) return false;
            return models.findIndex(m=>
                m.FindUnitProfile() && 
                m.FindUnitProfile().Characteristics.map(c=>c.Value).toString() === model.FindUnitProfile().Characteristics.map(c=>c.Value).toString()) === index;
        }
        const filtered = this._getSpecificSelections(["model", "unit"]).filter(differentProfiles);
        return filtered.length>0?filtered:this._getSpecificSelections(["model"]);
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
        return new ProfilesDisplayData(this.Profiles.map(s=>this._mergeConstraints(s, this.Constraints)));
    }

    IsWarlord():boolean {
        const found = this._selectionValue.find(sv=>sv.Name==="Warlord");
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
    UniqueID:string;
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
    UniqueID:string;
    Temporary:number;
    private hidden:boolean;
    private secretSelection:Array<Selection>;
    private selectionMap:Array<SelectionID>;

    private data:SelectionEntry;
    private rse:RosterSelectionData;
    ExtraID:string;

    private static merging:Array<SelectionID> = new Array<SelectionID>();
    static DeepDuplicate(selection:Selection, nextIndex:number):Selection{
        let sel = selection.duplicate();
        sel.UniqueID = sel.ID + nextIndex;
        sel.applySelectionIdTree(selection.getSelectionIdTree());
        return sel;
    }
    static Init(data:SelectionEntry, rse:RosterSelectionData, nextIndex:number, extraId?:string) : Selection{
        if (!data) return;
        let sel = new Selection(1, data, rse, null, null, extraId, 0);
        sel.UniqueID = sel.ID + nextIndex;
        //sel.Debug();
        return sel;
    }

    static FromTree(entry:SelectionTreeEntry, rse:RosterSelectionData, nextIndex:number):Selection {
        let sel = new Selection(1, rse.GetSelectionFromId(entry.SelectionID), rse, null, null, entry.ExtraID, 0);
        //sel.Debug();
        sel.applySelectionIdTree(entry);
        sel.UniqueID = entry.UniqueID;
        if(sel.UniqueID===undefined) {
            sel.UniqueID = sel.ID + nextIndex;
        }
        //sel.Debug();
        return sel;
    }

    protected GetAncestor(): Selection {
        return this.Ancestor;
    }

    protected constructor(count:number, data:SelectionEntry, rse:RosterSelectionData, parent:Selection, ancestor:Selection, extraId:string, index:number){
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
            this.getDefaultSelection(data, rse, {_selectionValue:this._selectionValue});
        } else {
            this.getDefaultSelection(data, rse, {_selectionValue:this.secretSelection});
        }
        Each<InfoLink>(this.data.ProfileInfoLinks, infoLink=>{
            this.Profiles.push(rse.GetProfile(infoLink, this.Ancestor));
        });
        const extraProfile = rse.GetProfileByName(this.Name);
        if(this.Profiles.length===0  && extraProfile) {
            this.Profiles.push(extraProfile);
        }
    }
    
    private duplicate():Selection{
        return new Selection(1, this.data, this.rse, this.Parent, this.Ancestor, this.ExtraID, 0);
    }

    private getSelectionIdTree(duplicate:boolean=true, index:number=0):SelectionTreeEntry {
        let entry = {
            SelectionID:this.ID,
            Count:(this.Parent!==null && duplicate && /Enhancement/gi.test(this.Parent.Name))?0:this.Count, 
            Children:new Array<SelectionTreeEntry>(), 
            ExtraID:this.ExtraID,
            Index:index,
            UniqueID:this.UniqueID
        };
        Each(this._selectionValue, (sv, index)=>{
            entry.Children.push(sv.getSelectionIdTree(duplicate, index));
        });
        return entry;
    }

    private applySelectionIdTree(entry:SelectionTreeEntry) {
        let same = true;
        try{
            this.Count = entry.Count;
            if(entry.Children.length!==this._selectionValue.length) {
                same=false;
            } else {
                Each<SelectionTreeEntry>(entry.Children, c=>{
                    if(c.SelectionID !== this._selectionValue[c.Index].ID) same=false;
                });
            }
            if(!same) {
                let newSelectionValue = new Array<Selection>();
                Each<SelectionTreeEntry>(entry.Children, c=>{
                    newSelectionValue.push(this._selectionValue.find(sv=>sv.ID === c.SelectionID).duplicate())
                });
                this._selectionValue = newSelectionValue;
            }
            Each<SelectionTreeEntry>(entry.Children, c=>{
                this._selectionValue[c.Index].applySelectionIdTree(c);
            })
        } catch(e){
            console.error("Selection Tree Error");
            console.error(entry.Children.map(c=>c.SelectionID));
            console.error(this._selectionValue.map(sv=>sv.ID));
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
        this.Parent._selectionValue.find(sv=>sv.ID===id).Count=1;
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
            this._selectionValue.push(selection.duplicate());
            return false;
        }
    }

    Remove(bm:BuilderMenu):void{
        this.Count--;
        this.Parent.checkRemove(this);
        bm.setState({update:bm.state.update+1});
    }
    private checkRemove(selection:Selection):void {
        if(this._selectionValue.filter(sel=>sel.ID == selection.ID).length > 1){
            this._selectionValue.splice(this._selectionValue.findIndex(sel=>sel.ID==selection.ID && sel.Count===0), 1);
        }
    }

    ValidRecursive():boolean{
        let valid = this.Valid();
        Each(this._selectionValue, sel=>{
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

    private getDefaultSelection(data:SelectionEntry, rse:RosterSelectionData, current:{_selectionValue:Array<Selection>}){
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
                Each(sel._selectionValue, val=>{
                    val.Count = 0;
                });
                otherSel._selectionValue = [...otherSel._selectionValue, ...sel._selectionValue];
                Selection.merging.splice(found, 1);
                otherSel.Type= "group";
                otherSel.Name += " or " + data.Name;
            } else {
                if(sel.Type==="group" || sel.Type=="unit" || sel.NoOptions() || count === 0){
                    sel.Count=count;
                    if(sel.Parent.Type === "group" && !sel.Parent.Valid(count) || (/Enhancement/gi.test(sel.Parent.Name) && !isDefault)) {
                        sel.Count=0;
                    }
                    current._selectionValue.push(sel);
                } else {
                    sel.Count=1;
                    if(sel.Parent.Type === "group" && !sel.Parent.Valid(count)) {
                        count=0;
                        sel.Count=0;
                        current._selectionValue.push(sel);
                    }
                    for(let i= 0; i != count; i++){
                        current._selectionValue.push(sel.duplicate()); 
                    }
                }
            }
        }
        Each(options, (option, index)=>{
            newSelection(option, index, data.DefaultSelectionID);
        });
        current._selectionValue = current._selectionValue.sort((sv1:Selection, sv2:Selection)=> {
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
                    if(sv1._selectionValue[0].Type==="upgrade") return sortMelee(sv1._selectionValue[0], sv2);
                } else if (sv2.Type==="group") {
                    if(sv1._selectionValue[0].Type==="upgrade" && sv2._selectionValue[0].Type==="upgrade") return sortMelee(sv1._selectionValue[0], sv2._selectionValue[0]);
                }
            }
            if(sv2.Type==="group"){
                if(sv1.Type==="upgrade") {
                    if(sv2.Parent.ID!==sv2.Ancestor.ID) return 1;
                    if(getUpgradeProfile(sv1).Characteristics.length===1) return -1;
                    if(sv2._selectionValue[0].Type==="upgrade") return sortMelee(sv1, sv2._selectionValue[0]);
                }
            }
            if(sv1.Type==="upgrade"){
                if(sv2.Type==="upgrade") return sortMelee(sv1, sv2);
                if(sv2.Type==="group" && sv2._selectionValue[0].Type==="upgrade") return sortMelee(sv1, sv2._selectionValue[0]);
            } 
            return 0;
        });
    }

    protected _getWeapons():Array<Selection> {
        return this._getSpecificSelections(["upgrade"]).filter(s=>
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
        ur.UniqueID = this.UniqueID;
        return ur;
    }

    Print(current:{category:string}=null, count:number=0, space:string=""):string {
        function doSelections(next:Array<Selection>, s:string):string {
            let toAdd = new Array<{value:string, sel:Selection, count:number}>();
            Each<Selection>(next, n=>{
                const test = n.Print();
                const found = toAdd.find(a=>a.value===test);
                if(found) {
                    found.count+= n.Count;
                } else {
                    toAdd.push({value:test, sel:n, count:n.Count});
                }
            })
            return toAdd.map(a=>a.sel.Print(current, a.count, s)).join("");
        }
        const cost = this.GetCost();
        const first = this.ID === this.Ancestor.ID;
        let toString = "";
        if(first && current!==null) {
            const cat = this.data.GetVariablesCategory();
            if(current.category !== cat) {
                toString+= "--= " + cat+" =--\n";
                current.category = cat;
            }
        }
        if(this.Type==="group" && !first) {
            toString += doSelections(this._selectionValue, space);
        } else if(this.secretSelection.length>0) {
            if(this.Count>0) {
                toString += doSelections(this.secretSelection, space);
            }
        } else {
            if(this.Count!==0) {
                toString += space + 
                    ((first && count <= 1)?"":(count>1)?" "+count+"x ":(first)?"":" ") + 
                    this.Name + 
                    (cost>0?" - "+(count>1?count+"x ":"")+cost+"pts\n":"\n");
                toString += doSelections(this._selectionValue, space+" .");
            }
        }

        return toString;
    }

    Debug(){
        console.debug("----------------DEBUG--------------------")
        this.debugRec("");
    }
    private debugRec(space:string) {
        console.debug(space + this.Name + " - " + this.Type + " - " + this.Count + " - " + this.Profiles.length + " - " + this.ID);
        Each([...this._selectionValue, ...this.secretSelection], val=>{
            val.debugRec(space+"  ");
        });
    }
}