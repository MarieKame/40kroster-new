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

export class WeaponProfileRaw {
    Name:string;
    Profile:Array<DescriptorRaw>;
}

export class WeaponRaw {
    Count:number;
    Name:string;
    Profiles:Array<WeaponProfileRaw>;
}

export class LeaderDataRaw {
    Leading:Array<string>; // The names of the units it can lead
    Effects:Array<DescriptorRaw>;
    CurrentlyLeading:string|null; // the UniqueID of the unit it is leading, default is null
    BaseName:string;
    CustomName:string;
    Weapons:Array<WeaponRaw>;
    UniqueId:number;
}

export class ModelRaw {
    Name:string;
    Characteristics:Array<DescriptorRaw>;
}

export class UnitRaw {
    BaseName:string;
    CustomName:string;
    UniqueID:string;
    Cost:number;
    Models:Array<ModelRaw>;
    Weapons:Array<WeaponRaw>;
    Categories:Array<string>;
    Abilities:Array<DescriptorRaw>;
    Rules:Array<string>;
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
        console.log(" - " + unit.BaseName);
        console.log(" -- Weapons");
        console.log(unit.Weapons.map(w=>"    - " + w.Name + " - " + w.Count + " - " + w.Profiles.map(p=>" > " + p.Name + " " + p.Profile.map(c=>c.Name + ":" + c.Value).join(", ")).join("\n")));
        console.log(" -- Models");
        console.log(unit.Models.map(w=>"    - " + w.Name + " - " + w.Characteristics.map(c=>c.Name + ":" + c.Value)));
        console.log(" -- Abilities");
        console.log(unit.Abilities.map(c=>"    - " + c.Name + " : " + c.Value).join("\n"));
        console.log(" -- Categories" + unit.Categories.join(", "))
    });
    console.log("LeaderData");
    console.log(roster.LeaderData.map(ld=>ld.BaseName + ld.Leading.join(", ")));
}