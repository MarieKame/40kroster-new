import Variables from "../Variables";
import {Selection} from './UnitSelection';

export class SelectionData{
    Name:string;
    ID:string;
    Type:string;
    Constraints:Array<Constraint>;
    constructor(){
        this.Constraints = new Array<Constraint>();
    }
}

export class DetachmentSelectionData extends SelectionData {
}

export class TargetSelectionData extends SelectionData {
    Target:string;
    public CheckMerge:Array<Array<string>>;

    constructor(){
        super();
        this.CheckMerge = new Array<Array<string>>();
    }
}

export class Modifier {
    Comparator:string;
    Comparison:number;
    Value:number;
}

export class SelectionEntry extends SelectionData {
    Categories:Array<string>;
    Cost:number;
    ChildrenIDs:Array<string>;
    DefaultSelectionID?:string;
    SubEntries:Array<TargetSelectionData>;
    CostModifiers:Array<Modifier>;

    constructor(){
        super();
        this.Constraints = new Array<Constraint>();
        this.Categories = new Array<string>();
        this.ChildrenIDs = new Array<string>();
        this.SubEntries = new Array<TargetSelectionData>();
        this.CostModifiers = new Array<Modifier>();
    }

    GetVariablesCategory():string{
        for(let cat of Variables.unitCategories){
            if (this.Categories.findIndex(c=>c==cat)!==-1) return cat;
        }
        return "";
    }

    GetVariablesCategoryIndex():number{
        for(let cat of Variables.unitCategories){
            const index = this.Categories.findIndex(c=>c==cat);
            if (index!==-1) {
                return Variables.unitCategories.findIndex(c=>c==cat);
            }
        }
        return -1;
    }
}

export class Constraint extends SelectionData {
    Scope:string;
    Value:string;
    Shared:boolean;

    constructor(name:string, id:string, type:string, scope:string, value:string, shared:string){
        super();
        this.Name = name;
        this.ID = id;
        this.Type = type;
        this.Scope = scope;
        this.Value = value;
        this.Shared= shared==="true";
    }
}

export default class RosterSelectionData {
    Units:Array<TargetSelectionData>;
    DetachmentChoice:SelectionEntry;
    Selections:Array<SelectionEntry>;

    GetTarget(unit:TargetSelectionData):SelectionEntry{
        let found = this.Selections.find(sel=>sel.ID == unit.Target);
        found.Constraints = [...found.Constraints, ...unit.Constraints]
        return found;
    }

    GetChildren(entry:SelectionEntry):Array<SelectionEntry>{
        return this.Selections.filter(selection=>entry.ChildrenIDs.find(id=>id===selection.ID));
    }

    GetSubEntry(target:TargetSelectionData):SelectionEntry{
        return this.Selections.find(selection=>target.Target===selection.ID);
    }

    GetCombinedChildrenAndSubEntries(entry:SelectionEntry):Array<SelectionEntry|TargetSelectionData> {
        return [
            ...this.GetChildren(entry), 
            ...entry.SubEntries
        ];
    }

    GetSelectionFromId(id:String):SelectionEntry {
        return this.Selections.find(sel=>sel.ID == id);
    }

    constructor(){
        this.Units = new Array<TargetSelectionData>();
        this.Selections = new Array<SelectionEntry>();
    }
}