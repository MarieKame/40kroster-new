import Each from "../Components/Each";
import BuilderMenu from "./BuilderMenu";
import RosterSelectionData, { Constraint, SelectionEntry, TargetSelectionData, Modifier, ModifierType } from "./RosterSelectionData";

function Compare(modifier:Modifier, value:number):boolean{
    console.log(modifier);
    if(modifier.Comparator=="atLeast") return value >= modifier.Comparison;
    if(modifier.Comparator=="atMost") return value < modifier.Comparison;
    return true;
}

class PrivateSelection {
    private modifiers:Array<Modifier>;
    private cost:number;
    private min:number;
    private max:number;

    SelectionValue:Array<Selection>;
    Count:number;
    Parent?:Selection;
    Ancestor:PrivateSelection;
    Constraints:Array<Constraint>;
    Type:string;
    ID:string;

    constructor(count:number, data:SelectionEntry, parent:Selection, ancestor?:PrivateSelection){
        if(!ancestor) this.Ancestor=this;
        else this.Ancestor=ancestor;
        this.Constraints = data.Constraints;
        this.modifiers = data.Modifiers;
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
    }

    GetCost():number{
        let modifiedValue;
        let modelCount = this.GetSelectionCount();
        Each(this.modifiers, modifier=>{
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
        return Number(cost);
    }

    GetLocalOrParentCount(){
        return (this.NoOptions()||!this.Parent)?this.Count:this.Parent.getSelectionCountFor(this.ID);
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

    Valid(adding:number=0):boolean{
        let valid=true;
        const count = this.GetValidTypeCount() + adding;
        Each(this.Constraints, constraint=>{
            if(constraint.Type === "min") valid= valid && constraint.Value <= count;
            if(constraint.Type === "max") valid= valid && count <= this._getMax();
        })
        return valid;
    }

    protected _getMin():number{
        return this.min;
    }
    protected _getMax():number{
        const found = this.modifiers.find(m=>m.Type===ModifierType.MAX); // TODO: maybe there can be multiple?
        return found?(Compare(found, this.Ancestor.GetSelectionCount())?found.Value:this.max):this.max;
    }
    protected _getMaxPossible():number{
        const found = this.modifiers.find(m=>m.Type===ModifierType.MAX);
        return found?found.Value:this.max;
    }
}

export class Selection extends PrivateSelection {
    Name:string;
    Stats:Array<string>;
    private secretSelection:Array<Selection>;

    private data:SelectionEntry;
    private rse:RosterSelectionData;

    private static merging:Array<{ID:string, Selection:Selection}> = new Array<{ID:string, Selection:Selection}>();
    private static Duplicate(selection:Selection):Selection{
        return new Selection(1, selection.data, selection.rse, selection.Parent, selection.Ancestor);
    }

    constructor(count:number, data:SelectionEntry, rse:RosterSelectionData, parent:Selection, ancestor?:PrivateSelection){
        super(count, data, parent, ancestor);
        this.rse = rse;
        this.data = data;
        this.Name = data.Name;
        if(/(w\/)|(with)/gi.test(this.Name)){
            this.Name = /(?<=(w\/)|(with) ).*/gi.exec(this.Name)[0];
        }
        this.secretSelection = new Array<Selection>();
        if(this.Type !== "upgrade") {
            this.getDefaultSelection(data, rse, {SelectionValue:this.SelectionValue});
        } else {
            this.getDefaultSelection(data, rse, {SelectionValue:this.secretSelection});
        }
    }

    DisplayCount():string{
        if (!this._getMax()) return "";
        let min = this._getMin();
        if (min === this._getMax()) min=null;
        return ((this.Type==="group" || this.Changeable())? " - " + this.GetValidTypeCount() + " [ " + (min!==null?(min+" ~ "):"") + this._getMax() +  " ]":"");
    }

    DisplayStats():string{
        return "";
    }

    CanRemove():boolean{
        return this.Count > this._getMin();
    }

    CanAdd():boolean{
        return this.GetLocalOrParentCount() < this._getMaxPossible();
    }
    
    Changeable():boolean{
        return this._getMin() !== this._getMax();
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
            if(data.Name==="Paragon Warsuit") console.log("WARSUIT")
            if((that.Type==="group"||that.Type==="unit")){
                if(data.Name==="Paragon Warsuit") console.log("Group/unit")
                const cFound = data.Constraints.find(c=>c.Type==="min");
                count=cFound?Number(cFound.Value):1;
                if(!that.Valid()) {
                    while(!that.Valid(count)){
                        count++
                    }
                }
            } else {
                if(data.Name==="Paragon Warsuit") console.log("other")
                count = Math.min(Number(that._getMin()?that._getMax():that.GetMinimumCount(data)), that.GetMaximumCount(data));
            }
            count = (defaultId?(isDefault?count:0):count);
            let sel = new Selection((defaultId?(isDefault?count:0):count), data, rse, that, that.Ancestor);

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
                otherSel.Name += " or " + data.Name;
            } else {
                if(sel.Type==="group" || sel.Type=="unit" || sel.NoOptions() || count === 0){
                    sel.Count=count;
                    if(sel.Parent.Type === "group" && !sel.Parent.Valid(count)) {
                        sel.Count=0;
                    }
                    current.SelectionValue.push(sel);
                } else {
                    if(data.Name==="Paragon Warsuit") console.log("here???")
                    sel.Count=1;
                    for(let i= 0; i != count; i++){
                        current.SelectionValue.push(Selection.Duplicate(sel)); // TODO: make sure this is a copy, not the same object
                    }
                }
            }
        }
        Each(options, option=>{
            newSelection(option, data.DefaultSelectionID);
        });
        current.SelectionValue = current.SelectionValue.sort((sv1, sv2)=> sv1.Type==="group"&&sv2.Type==="upgrade"?-1:0);
    }

    Debug(){
        console.debug("----------------DEBUG--------------------")
        this.debugRec("");
    }
    private debugRec(space:string) {
        console.debug(space + this.Name + " - " + this.Count + " - " + this.ID);
        Each(this.SelectionValue, val=>{
            val.debugRec(space+"  ");
        });
    }
}

export default class UnitSelection {
    Framework:SelectionEntry;
    Data:Selection;

    constructor(data:SelectionEntry, rse:RosterSelectionData){
        if (!data) return;
        this.Framework=data;
        this.Data=new Selection(1, data, rse, null);
        this.Data.Debug();
    }
}