import { DescriptorRaw, RuleDataRaw } from "../../Roster/RosterRaw";
import { ProfilesDisplayData } from "../ProfilesDisplay";
import { Constraint, ProfileData } from "../RosterSelectionData";
import Selection from "../UnitSelection";

export default class DetachmentSelection extends Selection {
    constructor(){
        super(0, null, null, null, null, "", 0);
        this.options = new Array<DetachmentSelection>();
        this.Ancestor = this;
        this.Name="Detachment Selection";
    }

    DetachmentProfiles:Array<DescriptorRaw>;
    private value:DetachmentSelection;

    SetValue(value:string) {
        this.value = this.options.find(o=>o.Name===value);
    }

    Value():string{
        return this.value.Name;
    }

    DetachmentRules():RuleDataRaw {
        return {
            Name:this.value.DetachmentProfiles[0].Name,
            ID:this.value.DetachmentProfiles[0].Name,
            Description:this.value.DetachmentProfiles[0].Value
        };
    }

    AddDetachment(name:string, profiles:Array<DescriptorRaw>) {
        let o = new DetachmentSelection();
        o.max = 1;
        o.Count=0;
        o.Name = name;
        o.DetachmentProfiles = profiles;
        o.Type="upgrade";
        o.Ancestor = this;
        o.Parent = this;
        this.options.push(o);
        if(this.options.length===1) {
            this.value = o;
        }
    }

    private options:Array<DetachmentSelection>;

    GetFrameworkCost():number{
        return 0;
    }
    SelectionValue(): Array<Selection> {
        return this.options;
    }
    Valid():boolean{
        return true;
    }
    IsHidden():boolean{
        return false;
    }
    Changeable(): boolean {
        return true;
    }
    DisplayStats():ProfilesDisplayData|Array<ProfilesDisplayData>{
        let profileData = new ProfileData();
        profileData.Name="";
        profileData.Constraints = new Array<Constraint>();
        profileData.Characteristics = [{Name:"", Value:this.UniqueID, ID:""}];
        return new ProfilesDisplayData([profileData]);
    }
}