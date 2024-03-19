import Variables from "../Variables";

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

export class UnitSelectionData extends SelectionData {
    Target:string;
}

export class SelectionEntry extends SelectionData {
    Categories:Array<string>;
    Cost:number;
    ChildrenIDs:Array<string>;
    SubEntries:Array<SelectionData>;
    DefaultSelectionID?:string;

    constructor(){
        super();
        this.Constraints = new Array<Constraint>();
        this.Categories = new Array<string>();
        this.ChildrenIDs = new Array<string>();
        this.SubEntries = new Array<SelectionData>();
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
    Units:Array<UnitSelectionData>;
    DetachmentChoice:SelectionEntry;
    Selections:Array<SelectionEntry>;
    SelectionGroups:Array<SelectionEntry>;

    GetTarget(unit:UnitSelectionData):SelectionEntry{
        return this.Selections.find(sel=>sel.ID == unit.Target);
    }

    GetChildren(entry:SelectionEntry):Array<SelectionEntry>{
        return [...this.Selections.filter(selection=>entry.ChildrenIDs.find(id=>id===selection.ID)), ...this.SelectionGroups.filter(selection=>entry.ChildrenIDs.find(id=>id===selection.ID))];
    }

    GetSelection(entry:SelectionData):Array<SelectionEntry>{
        console.log("GetSelection");
        console.log(entry);
        if (entry.Type==="selectionEntry")
            return this.Selections.filter(selection=>selection.ID===entry.ID);
        if (entry.Type==="selectionEntryGroup")
            return this.SelectionGroups.filter(selection=>selection.ID===entry.ID);
    }

    GetSelectionFromId(id:String) {
        return this.Selections.find(sel=>sel.ID == id);
    }

    constructor(){
        this.Units = new Array<UnitSelectionData>();
        this.Selections = new Array<SelectionEntry>();
        this.SelectionGroups = new Array<SelectionEntry>();
    }
}