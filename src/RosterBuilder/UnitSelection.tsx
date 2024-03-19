import RosterSelectionData, { SelectionEntry } from "./RosterSelectionData";

export class Selection {
    Name:string;
    private cost;
    constructor(data:SelectionEntry){
        this.Name = data.Name;
        this.cost = data.Cost;
    }

    GetCost():number{
        return this.cost;
    }
}

export default class UnitSelection {
    Framework:SelectionEntry;
    Data:Selection;

    constructor(data:SelectionEntry, rse:RosterSelectionData){
        if (!data) return;
        this.Framework=data;
        this.Data=new Selection(data);
        if (data.DefaultSelectionID) {
            this.Data = new Selection(rse.GetSelectionFromId(data.DefaultSelectionID));
        } else {
            this.Data=new Selection(data);
        }
    }
}