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
    Faction:string;
}

export function DebugRosterRaw(roster:RosterRaw) {
    console.debug(roster.Name);
    console.debug(roster.Cost + " pts");
    console.debug(roster.Units);
    Each<UnitRaw>(roster.Units, unit=>{
        console.debug(" - " + unit.BaseName);
        console.debug(" -- Weapons");
        console.debug(unit.Weapons.map(w=>"    - " + w.Name + " - " + w.Count + " - " + w.Profiles.map(p=>" > " + p.Name + " " + p.Profile.map(c=>c.Name + ":" + c.Value).join(", ")).join("\n")));
        console.debug(" -- Models");
        console.debug(unit.Models.map(w=>"    - " + w.Name + " - " + w.Characteristics.map(c=>c.Name + ":" + c.Value)));
        console.debug(" -- Abilities");
        console.debug(unit.Abilities.map(c=>"    - " + c.Name + " : " + c.Value).join("\n"));
        console.debug(" -- Categories" + unit.Categories.join(", "))
    });
    console.debug("LeaderData");
    console.debug(roster.LeaderData.map(ld=>ld.BaseName + ld.Leading.join(", ")));
}