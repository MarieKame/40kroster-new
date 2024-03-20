import Each from "../Components/Each";
import BuilderMenu from "./BuilderMenu";
import RosterSelectionData, { Constraint, SelectionEntry, TargetSelectionData, Modifier } from "./RosterSelectionData";

export class Selection {
    ID:string;
    Name:string;
    Type:string;
    Count:number;
    SelectionValue:Array<Selection>;
    Constraints:Array<Constraint>;
    Parent?:Selection;
    Stats:Array<string>;
    private cost:number;
    private min:number;
    private max:number;
    private costModifiers:Array<Modifier>;
    private static merging:Array<{ID:string, Selection:Selection}> = new Array<{ID:string, Selection:Selection}>();

    constructor(count:number, data:SelectionEntry, rse:RosterSelectionData, parent:Selection){
        this.ID = data.ID;
        this.Name = data.Name;
        if(/w\//gi.test(this.Name)){
            this.Name = /(?<=w\/ ).*/gi.exec(this.Name)[0];
        }
        this.cost = data.Cost;
        this.Type=data.Type;
        this.Count = count;
        this.Constraints = data.Constraints;
        this.Parent = parent;
        this.costModifiers = data.CostModifiers;
        Each(this.Constraints, constraint=>{
            if(constraint.Type === "min") this.min = constraint.Value;
            if(constraint.Type === "max") this.max = constraint.Value;
        })
        this.getDefaultSelection(data, rse);
        if(!this.min) this.min=0;
    }

    GetCost():number{
        let modifiedValue;
        let modelCount = this.Parent?this.GetValidTypeCount():this.GetSelectionCount();
        Each(this.costModifiers, modifier=>{
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
        return Number(cost) + Number(this.SelectionValue.map(sel=>sel.GetCost()).reduce((sum, current)=> sum+current, 0));
    }

    DisplayCount():string{
        let min = this.min;
        if (!this.max) return "";
        if (min === this.max) min=null;
        return " - " + this.GetValidTypeCount() + ((this.Type==="group" || this.Changeable())?" [ " + (min?(min+" ~ "):"") + this.max +  " ]":"");
    }

    DisplayStats():string{
        return "";
    }

    CanRemove():boolean{
        return this.Count > this.min;
    }

    CanAdd():boolean{
        return this.Count < this.max;
    }
    
    Changeable():boolean{
        return this.min !== this.max;
    }

    Add(bm:BuilderMenu):void{
        console.log(this.Parent);
        console.log(this.Parent.checkAdd(this));
        if(this.Parent.checkAdd(this)) this.Count++;
        bm.setState({update:bm.state.update+1});
    }
    private checkAdd(selection:Selection):boolean{
        if(selection.NoOptions() || selection.Count == 0){
            return true;
        } else {
            this.SelectionValue.push(selection); // TOOD: same as below
            return false;
        }
    }
    Remove(bm:BuilderMenu):void{
        console.log(this.Count);
        this.Count--;
        if(this.Count==0 && this.Parent){
            this.Parent.checkRemove(this);
        }
        bm.setState({update:bm.state.update+1});
    }
    private checkRemove(selection:Selection):void {
        if(this.SelectionValue.filter(sel=>sel.ID == selection.ID).length > 1){
            this.SelectionValue.splice(this.SelectionValue.findIndex(sel=>sel.ID==selection.ID && sel.Count===0), 1);
        }
    }

    Valid(adding:number=0):boolean{
        let valid=true;
        const count = this.GetValidTypeCount() + adding;
        Each(this.Constraints, constraint=>{
            if(constraint.Type === "min") valid= valid && constraint.Value <= count;
            if(constraint.Type === "max") valid= valid && count <= constraint.Value;
        })
        return valid;
    }

    ValidRecursive():boolean{
        let valid = this.Valid();
        Each(this.SelectionValue, sel=>{
            valid = valid && sel.ValidRecursive();
        });
        return valid;
    }

    GetValidTypeCount():number{
        return (this.Type==="group")?this.GetSelectionCount():this.Count;
    }

    GetSelectionCount():number{
        return this.SelectionValue.map(sel=>sel.Count).reduce((sum, current)=> sum+current, 0);
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

    NoOptions():boolean{
        let noOption = true;
        Each(this.SelectionValue, sel=>{
            noOption= noOption && sel.NoOptions();
            noOption= noOption && sel.GetValidTypeCount() !== 0;
        })
        return noOption;
    }

    private getDefaultSelection(data:SelectionEntry, rse:RosterSelectionData):void{
        this.SelectionValue = new Array<Selection>();
        const that= this;
        let options = [...rse.GetChildren(data), ...data.SubEntries];
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
            let count = Math.min(Number(that.max?that.max:that.GetMinimumCount(data)), that.GetMaximumCount(data));
            count = (defaultId?(isDefault?count:0):count);
            let sel = new Selection((defaultId?(isDefault?count:0):count), data, rse, that);

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
                if(that.Type==="group" || that.Type=="unit" || sel.NoOptions()){
                    sel.Count=count;
                    if(sel.Parent.Type === "group" && !sel.Parent.Valid(count)) {
                        sel.Count=0;
                    }
                    that.SelectionValue.push(sel);
                } else {
                    for(let i= 0; i != count; i++){
                        that.SelectionValue.push(sel); // TODO: make sure this is a copy, not the same object
                    }
                }
            }
        }
        Each(options, option=>{
            newSelection(option, data.DefaultSelectionID);
        });
    }

    Debug(){
        console.log("----------------DEBUG--------------------")
        this.debugRec("");
    }
    private debugRec(space:string) {
        console.log(space + this.Name + " - " + this.Count + " - " + this.ID);
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
        //this.Data.Debug();
    }
}