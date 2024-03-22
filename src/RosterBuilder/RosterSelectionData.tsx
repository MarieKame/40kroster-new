import Each from "../Components/Each";
import Variables from "../Variables";
import Selection from './UnitSelection';

class SelectionDataBase {
    Name:string;
    ID:string;
    Type:string;
}

export class SelectionData extends SelectionDataBase {
    Constraints:Array<Constraint>;
    Categories:Array<string>;
    constructor(){
        super();
        this.Constraints = new Array<Constraint>();
        this.Categories = new Array<string>();
    }
}

export class DetachmentSelectionData extends SelectionData {
}

export class TargetSelectionData extends SelectionData {
    Target:string;
    public CheckMerge:Array<Array<string>>;
    public Modifiers:Array<Modifier>;

    constructor(){
        super();
        this.CheckMerge = new Array<Array<string>>();
        this.Modifiers = new Array<Modifier>();
    }
}

export enum ModifierType{
    COST, MAX, CHARACTERISTIC
}

export class Modifier {
    Type:ModifierType;
    Comparator:string;
    Comparison:number;
    Value:number;
    Field:string;
}

export class Characteristic {
    Name:string;
    ID:string;
    Value:string;
}

export class ProfileData extends SelectionData {
    Characteristics:Array<Characteristic>;

    constructor(){
        super();
        this.Characteristics = new Array<Characteristic>();
    }
}

export class InfoLink{
    Target:string;
    Modifiers:Array<Modifier>;
}

export class SelectionEntry extends SelectionData {
    Cost:number;
    ChildrenIDs:Array<string>;
    DefaultSelectionID?:string;
    SubEntries:Array<TargetSelectionData>;
    Modifiers:Array<Modifier>;
    Profiles:Array<ProfileData>;
    ProfileInfoLinks:Array<InfoLink>;

    constructor(){
        super();
        this.Constraints = new Array<Constraint>();
        this.ChildrenIDs = new Array<string>();
        this.SubEntries = new Array<TargetSelectionData>();
        this.Modifiers = new Array<Modifier>();
        this.Profiles = new Array<ProfileData>();
        this.ProfileInfoLinks = new Array<InfoLink>();
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

export class Constraint extends SelectionDataBase {
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
    Profiles:Array<ProfileData>;

    GetProfile(info:InfoLink, ancestor:Selection):ProfileData{
        let profileData = new ProfileData();
        const found = this.Profiles.find(p=>p.ID === info.Target);
        profileData.Characteristics = [...found.Characteristics];
        profileData.Constraints = [...found.Constraints];
        profileData.ID = found.ID;
        profileData.Name = found.Name;
        Each(info.Modifiers.filter(m=>m.Type===ModifierType.CHARACTERISTIC), modifier=>{
            let characteristic = profileData.Characteristics.find(c=>c.ID===modifier.Field);
            switch(modifier.Comparator){
                case "instanceOf":
                    if(ancestor.ID === modifier.Comparison) characteristic.Value = modifier.Value;
                    break;
                default:
                    if (modifier.Comparator !== null) console.log("Untreated modifier comparator : " + modifier.Comparator)
                    characteristic.Value = modifier.Value
                    break;
            }
        });
        return profileData;
    }

    private duplicateSelectionEntry(selectionEntry:SelectionEntry, extraConstraints:Array<Constraint>):SelectionEntry {
        if(!selectionEntry) return null;
        let val = new SelectionEntry();
        val.Name = selectionEntry.Name;
        val.ID = selectionEntry.ID;
        val.Type = selectionEntry.Type;
        val.Constraints = [...selectionEntry.Constraints, ...extraConstraints];
        val.Categories = selectionEntry.Categories;
        val.Cost = selectionEntry.Cost;
        val.ChildrenIDs = [...selectionEntry.ChildrenIDs];
        val.DefaultSelectionID = selectionEntry.DefaultSelectionID;
        val.SubEntries = [...selectionEntry.SubEntries];
        val.Modifiers = [...selectionEntry.Modifiers];
        val.Profiles = [...selectionEntry.Profiles];
        val.ProfileInfoLinks = [...selectionEntry.ProfileInfoLinks];
        return val;
    }

    GetTarget(target:TargetSelectionData):SelectionEntry{
        return this.duplicateSelectionEntry(this.Selections.find(sel=>sel.ID == target.Target), target.Constraints);
    }

    GetChildren(entry:SelectionEntry):Array<SelectionEntry>{
        return this.Selections.filter(selection=>entry.ChildrenIDs.find(id=>id===selection.ID));
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
        this.Profiles = new Array<ProfileData>();
    }
}