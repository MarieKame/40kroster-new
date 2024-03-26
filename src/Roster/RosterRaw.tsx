import Each from "../Components/Each";
import { SelectionTreeEntry } from "../RosterBuilder/UnitSelection";
import Weapon from "../RosterView/Weapon";

export class DescriptorRaw {
    Name:string;
    Value:string;
}

export class NoteRaw {
    AssociatedID:string;
    Descriptor:DescriptorRaw;
}

export class WeaponRaw {
    Count:number;
    Name:string;
    Profiles:Array<Array<DescriptorRaw>>;
}

export class LeaderDataRaw {
    Leading:Array<string>; // The names of the units it can lead
    Effects:Array<DescriptorRaw>;
    CurrentlyLeading:string; // the UniqueID of the unit it is leading, default is null
    BaseName:string;
    CustomName:string;
    MultiRangeWeapons:Array<WeaponRaw>;
    MeleeWeapons:Array<WeaponRaw>;
    RangedWeapons:Array<WeaponRaw>;
}

export function NewLeaderData():LeaderDataRaw {
    let ldr = new LeaderDataRaw();
    return ldr;
}

export class ModelRaw {
    Name:string;
    Characteristics:Array<DescriptorRaw>;
}

export class UnitRaw {
    Name:string;
    Models:Array<ModelRaw>;
    Weapons:Array<WeaponRaw>;
    Categories:Array<string>;
    Tree:SelectionTreeEntry;
}

export default class RosterRaw{
    CatalogueID:string;
    Notes:Array<NoteRaw>;
    LeaderData:Array<LeaderDataRaw>;
    Units:Array<UnitRaw>;
    Name:string;
    Cost:number;
}

export function DebugRosterRaw(roster:RosterRaw) {
    console.log(roster.Name);
    console.log(roster.Cost + " pts");
    console.log(roster.Units);
    Each<UnitRaw>(roster.Units, unit=>{
        console.log(" - " + unit.Name);
        console.log(unit.Weapons.map(w=>w.Name + " - " + w.Count))
        console.log(unit.Models.map(w=>w.Name + " - " + w.Characteristics.map(c=>c.Name + ":" + c.Value)))
        console.log(unit.Categories.join(", "))
    });
}