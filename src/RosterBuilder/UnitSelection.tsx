import Each from "../Components/Each";
import { DescriptorRaw, ModelRaw, UnitRaw, WeaponRaw } from "../Roster/RosterRaw";
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

    private getSpecificSelections(type:string):Array<Selection>{
        let selections = new Array<Selection>();
        if(this.Type===type){
            if (this instanceof Selection) selections.push(this);
        }
        Each<Selection>(this.SelectionValue, sv=>{
            selections = [...selections, ...sv.getSpecificSelections(type)];
        })
        return selections;
    }

    protected _getModelSelections():Array<Selection>{
        return this.getSpecificSelections("model");
    }

    protected _getEnhancements():Array<PrivateSelection>{
        return this.getSpecificSelections("upgrade").filter(s=>/Enhancement/gi.test(s.Parent.Name) && s.Count===1);
    }

    GetAbilities(recursive:boolean=false):Array<ProfileData> {
        let abilities = new Array<ProfileData>();
        abilities = [...abilities, ...this.Profiles.filter(p=>p.Type==="Abilities")];
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

    GetModelsWithDifferentProfiles():Array<Selection>{
        function differentProfiles(model:Selection, index:number, models:Array<Selection>) {
            if(model.Profiles.length===0) return false;
            return models.findIndex(m=>
                m.Profiles.length===1 && 
                m.Profiles[0].Characteristics.map(c=>c.Value).toString() === model.Profiles[0].Characteristics.map(c=>c.Value).toString()) === index;
          }
          const filtered = this._getModelSelections().filter(differentProfiles);
        return filtered.length>0?filtered:this._getModelSelections();
    }

    protected _getWeapons():Array<Selection> {
        return this.getSpecificSelections("upgrade").filter(s=>s.Parent.Type!=="upgrade" && s.Profiles.length>0 && /weapon/gi.test(s.Profiles[0].Type));
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
        const found = this.SelectionValue.find(sv=>sv.Name==="Warlord");
        return found&&found.Count==1;
    }

    CanRemove():boolean{
        return this.GetValidTypeCount() > this._getMin();
    }

    CanAdd():boolean{
        return this._getMaxPossible()==undefined?this.Parent.Valid(1): this.GetValidTypeCount() < this._getMaxPossible();
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
    Count:number;
    Children:Array<SelectionTreeEntry>;
}

class SelectionID {
    ID:string; 
    Selection:Selection;
}

export default class Selection extends PrivateSelection {
    Ancestor:Selection;
    private hidden:boolean;
    private secretSelection:Array<Selection>;
    private selectionMap:Array<SelectionID>;

    private data:SelectionEntry;
    private rse:RosterSelectionData;
    ExtraID:string;

    private static merging:Array<SelectionID> = new Array<SelectionID>();
    static Duplicate(selection:Selection):Selection{
        return new Selection(1, selection.data, selection.rse, selection.Parent, selection.Ancestor);
    }
    static DeepDuplicate(selection:Selection):Selection{
        let sel = new Selection(1, selection.data, selection.rse, selection.Parent, selection.Ancestor);
        sel.applySelectionIdTree(selection.getSelectionIdTree());
        return sel;
    }
    static Init(data:SelectionEntry, rse:RosterSelectionData, extraId?:string) : Selection{
        if (!data) return;
        let sel = new Selection(1, data, rse, null, null, extraId);
        sel.Debug();
        return sel;
    }

    protected GetAncestor(): Selection {
        return this.Ancestor;
    }

    constructor(count:number, data:SelectionEntry, rse:RosterSelectionData, parent:Selection, ancestor:Selection, extraId?:string){
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

    private getSelectionIdTree(duplicate:boolean=true):SelectionTreeEntry {
        let entry = {SelectionID:this.ID, Count:(this.Parent!==null && duplicate && /Enhancement/gi.test(this.Parent.Name))?0:this.Count, Children:new Array<SelectionTreeEntry>()};
        Each(this.SelectionValue, sv=>{
            entry.Children.push(sv.getSelectionIdTree());
        });
        return entry;
    }

    private applySelectionIdTree(entry:SelectionTreeEntry) {
        try{
            if(this.NoOptions() || this.Type==="group" || this.Type==="unit") {
                this.Count = entry.Count;
            } else {
                while(this.GetValidTypeCount() > entry.Count){
                    const found = this.Parent.SelectionValue.findIndex(sv=>sv.ID===entry.SelectionID);
                    this.Parent.SelectionValue.splice(found, 1);
                }
                while(this.GetValidTypeCount() < entry.Count){
                    const found = this.Parent.SelectionValue.find(sv=>sv.ID===entry.SelectionID);
                    if(found.Count===0) {
                        found.Count=1;
                    } else {
                        this.Parent.SelectionValue.push(Selection.Duplicate(found));
                    }
                }
            }
            Each(entry.Children, c=>{
                this.SelectionValue.find(sv=>sv.ID===c.SelectionID).applySelectionIdTree(c);
            })
        } catch(e){
            console.error("Selection Tree Error");
            console.error(entry.SelectionID);
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
        function newSelection(data:SelectionEntry|TargetSelectionData, defaultId?:string):Selection{
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
            if(that.Type==="group"||that.Type==="unit"){
                const cFound = data.Constraints.find(c=>c.Type==="min");
                count=cFound?Number(cFound.Value):1;
                if(!that.Valid()) {
                    while(!that.Valid(count)){
                        count++
                    }
                }
            } else {
                count = Math.min(Number(that._getMin()?that._getMax():that.GetMinimumCount(data)), that.GetMaximumCount(data));
            }
            count = (defaultId?(isDefault?count:0):count);
            let sel = new Selection((defaultId?(isDefault?count:0):count), data, rse, that, that.Ancestor);
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
                        current.SelectionValue.push(Selection.Duplicate(sel)); // TODO: make sure this is a copy, not the same object
                    }
                }
            }
        }
        Each(options, option=>{
            newSelection(option, data.DefaultSelectionID);
        });
        current.SelectionValue = current.SelectionValue.sort((sv1:Selection, sv2:Selection)=> {
            function sortMelee(sv1:Selection, sv2:Selection) :number {
                if (sv1.Profiles[0].Characteristics.length===1) return 1;
                if (sv2.Profiles[0].Characteristics.length===1) return -1;
                return sv1.Profiles[0].Characteristics[0].Value==="Melee" && sv2.Profiles[0].Characteristics[0].Value!=="Melee" ?-1:0;
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
                    if(sv2.Profiles[0].Characteristics.length===1) return 1;
                    if(sv1.SelectionValue[0].Type==="upgrade") return sortMelee(sv1.SelectionValue[0], sv2);
                } else if (sv2.Type==="group") {
                    if(sv1.SelectionValue[0].Type==="upgrade" && sv2.SelectionValue[0].Type==="upgrade") return sortMelee(sv1.SelectionValue[0], sv2.SelectionValue[0]);
                }
            }
            if(sv2.Type==="group"){
                if(sv1.Type==="upgrade") {
                    if(sv2.Parent.ID!==sv2.Ancestor.ID) return 1;
                    if(sv1.Profiles[0].Characteristics.length===1) return -1;
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

    GetUnitRaw():UnitRaw{
        let ur = new UnitRaw();
        function toCharacteristicRaw(characteristics:Array<Characteristic>):Array<DescriptorRaw> {
            return characteristics.map(c=>{return{Name:c.Name, Value:c.Value}});
        }
        function toModelRaw(model:Selection, name?:string):ModelRaw {
            let mr = new ModelRaw();
            mr.Name=name?name:model.Name;
            mr.Characteristics = toCharacteristicRaw(model.Profiles[0].Characteristics)
            return mr;
        }
        function toProfileRaw(data:ProfileData):Array<DescriptorRaw> {
            let adr = new Array<DescriptorRaw>();

            return adr;
        }
        function toWeaponRaw(model:Selection):WeaponRaw|Array<WeaponRaw> {
            if(model.secretSelection.length!==0) {
                let subSelection = new Array<WeaponRaw>();
                Each<Selection>(this.secretSelection, selection=>{
                    const wr = toWeaponRaw(selection);
                    if(wr instanceof WeaponRaw) subSelection.push(wr);
                });
                return subSelection;
            }
            let wr = new WeaponRaw();
            wr.Count = model.Count;
            wr.Name = model.Name;
            wr.Profiles = model.Profiles.map(toProfileRaw);
            return wr;
        }

        function exploreRawWeapons(wrd:WeaponRaw|Array<WeaponRaw>):Array<WeaponRaw>{
            if (wrd instanceof WeaponRaw)
                return [wrd]
            return wrd;
        }
        const models = this._getModelSelections();
        let weapons = new Array<WeaponRaw>;
        Each<Selection>(this._getWeapons(), weapon=>{
            weapons = [...weapons, ...exploreRawWeapons(toWeaponRaw(weapon))];
        });
        ur.Models = models.length===1?[toModelRaw(models[0], this.Name)]:models.map(m=>toModelRaw(m));
        ur.Categories = this.Categories;
        ur.Name = this.Name;
        ur.Weapons = weapons;
        ur.Tree = this.getSelectionIdTree(false);
        return ur;
    }

    Debug(){
        console.debug("----------------DEBUG--------------------")
        this.debugRec("");
    }
    private debugRec(space:string) {
        console.debug(space + this.Name + " - " + this.Type + " - " + this.Count + " - " + this.Profiles.length + " - " + this.ID);
        Each(this.SelectionValue, val=>{
            val.debugRec(space+"  ");
        });
    }
}