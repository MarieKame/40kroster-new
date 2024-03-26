import { SelectionTreeEntry } from "../RosterBuilder/UnitSelection";

export class DescriptorRaw {
    Name:string;
    Value:string;
}

export class NoteRaw {
    AssociatedID:string;
    Descriptor:DescriptorRaw;
}

export class WeaponRaw {
    
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
}

export default class RosterRaw{
    CatalogueID:string;
    Notes:Array<NoteRaw>;
    LeaderData:Array<LeaderDataRaw>;
    Units:Array<UnitRaw>;

    OriginalData:Array<SelectionTreeEntry>;
}