import Each from "../Components/Each";
import { ProfilesDisplayData } from "./ProfilesDisplay";
import { Constraint, ProfileData, TargetSelectionData } from "./RosterSelectionData";
import Selection from "./UnitSelection";

export default class OptionSelection extends Selection {
    constructor(){
        super(0, null, null, null, null, "", 0);
        this.options = new Array<Selection>();
        this.Ancestor = this;
        this.Name="Show/Hide Options";
    }

    private options:Array<Selection>;

    Set(options:Array<TargetSelectionData>){
        Each<TargetSelectionData>(options, option=>{
            let o = new OptionSelection();
            o.max = 1;
            o.Count=0;
            o.Name = option.Target;
            o.ExtraID = option.Target;
            o.UniqueID = option.Name;
            o.Type="upgrade";
            o.Ancestor = this;
            o.Parent = this;
            this.options.push(o);
        });
        this.options = this.options.filter((o, index)=>this.options.findIndex(ot=>ot.UniqueID === o.UniqueID) === index);
    }
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