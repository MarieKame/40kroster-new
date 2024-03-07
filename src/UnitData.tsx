import Variables from '../Style/Variables';

class DescriptorData {
    Name: string;
    Description: string;

    constructor(name:string, description:string){
        this.Name = name;
        this.Description = description.replaceAll("\n\n", "\n").replaceAll(/^(?:[a-z :])+\n(?![-■])/gi, " ");
    }
}

class StatsData {
    Data:string;
    protected _M: number;
    protected _T: number;
    protected _SV: number;
    protected _IV: number|null;
    protected _W: number;
    protected _LD: number;
    protected _OC: number;
    
    public M():string {
        return this._M + '"';
    }
    public T():string {
        return this._T.toString();
    }
    public SV():string {
        return this._SV+'+';
    }
    public IV():string|null {
        return (this._IV)?this._IV+'+':null;
    }
    public W():string {
        return this._W.toString();
    }
    public LD():string {
        return this._LD.toString();
    }
    public OC():string {
        return this._OC.toString();
    }

    public isRealModel(){
        return !isNaN(this._OC);
    }

    public same(stats:StatsData):boolean{
        return this._M == stats._M &&
        this._T == stats._T &&
        this._SV == stats._SV &&
        this._IV == stats._IV &&
        this._W == stats._W &&
        this._LD == stats._LD &&
        this._OC == stats._OC;
    }

    constructor(data:string, invulnerableDescription:string|undefined) {
        this.Data = data;
        let split = data.split(',');
        this._M = parseInt(split[0]);
        this._T = parseInt(split[1]);
        this._SV = parseInt(split[2]);
        this._W = parseInt(split[3]);
        this._LD = parseInt(split[4]);
        this._OC = parseInt(split[5]);

        if (invulnerableDescription) {
            this._IV = parseInt(invulnerableDescription.charAt(invulnerableDescription.search(/.\+/g)));
        } else {
            this._IV = null;
        }
    }
}

class ModelData {
    Name: string;
    Stats: StatsData;

    constructor(name:string, stats:StatsData){
        this.Name = name;
        this.Stats = stats;
    }
}

class CostData {
    public Val: number;
    public Unit: string;

    public toString():string {
        return this.Val.toFixed(0) + ' ' + this.Unit;
    }

    constructor(val:number, unit:string) {
        this.Val = val;
        this.Unit = unit;
    }
}

class WeaponData {
    protected _Range: number | null;
    protected _A: string;
    protected _BS: number|null;
    protected _S: string;
    protected _AP: string;
    protected _D: string;
    _Traits: Array<string>;

    public Data:string;
    public Count: number;
    public Name: string;

    public Range():string{
        return (this._Range && this._Range !== 0) ? (this._Range+'"') :'Melee';
    }
    public A():string {
        return this._A;
    }
    public BS():string {
        return (this._BS)?this._BS+'+':'N/A';
    }
    public S():string {
        return this._S;
    }
    public AP():string {
        return this._AP;
    }
    public D():string {
        return this._D;
    }
    public Traits():Array<string> {
        return this._Traits;
    }

    public IsMelee():boolean {
        return this._Range === null || this._Range === 0;
    }

    public IsWeapon():boolean {
        return this._D !== undefined;
    }

    constructor(data:string, count:number, name:string, avoidTrait:string|null = null) {
        this.Data = data;
        let split = data.split(',');
        this._Range = Number.isInteger(parseInt(split[0]))?parseInt(split[0]):null;
        this._A = split[1];
        this._BS = Number.isInteger(parseInt(split[2]))?parseInt(split[2]):null;
        this._S = split[3];
        this._AP = split[4];
        this._D = split[5];
        this._Traits = new Array<string>();
        for(let i= 6; i < split.length; i++) {
            if (split[i] !== '-' && (!avoidTrait || split[i] !== avoidTrait) && split[i] !== "") {
                this._Traits.push(split[i]); 
            }
        }
        this.Count = count;
        this.Name = name;
    }
}

class ProfileWeaponData extends WeaponData {
    
    public Profiles: Array<WeaponData>;

    public IsMelee():boolean {
        return this.Profiles[0].IsMelee();
    }

    constructor(profiles: Array<WeaponData>, count:number, name:string){
        super("0,0,0,0,0,1", count, name);
        this.Profiles = profiles;
    }
}

class LeaderData{
    private static UniqueBase = 0;

    Leading:Array<string>;
    Effects:Array<DescriptorData>;
    CurrentlyLeading:number;
    UniqueId:number;
    BaseName:string;
    CustomName:string;
    MeleeWeapons:Array<WeaponData>;
    RangedWeapons:Array<WeaponData>;

    constructor(unit:UnitData, leading:Array<string>){
        this.BaseName = unit.Name;
        this.CustomName = unit.CustomName;
        this.MeleeWeapons = unit.MeleeWeapons;
        this.RangedWeapons = unit.RangedWeapons;
        this.Leading = leading;
        this.Effects = new Array<DescriptorData>();
        this.CurrentlyLeading=-1;
        this.UniqueId = LeaderData.UniqueBase++;
    }
}

class UnitData {
    Name : string;
    CustomName : string;
    Keywords: Array<string>;
    Factions: Array<string>;
    Rules: Array<DescriptorData>;
    Profiles: Array<DescriptorData>;
    MeleeWeapons:Array<WeaponData>;
    RangedWeapons:Array<WeaponData>;
    OtherEquipment:Array<WeaponData>;
    Key:number;
    Count:number = 1;

    Costs: CostData;
    Models: Array<ModelData>|ModelData;

    private Leader?:LeaderData|false = null;

    private differentStats(modelList:Array<ModelData>):Array<StatsData>|StatsData{
        let stats = new Array<StatsData>();
        modelList.forEach(function(model){
            let index = stats.findIndex((stat) => model.Stats.same(stat));
            if (index === -1) {
                stats.push(model.Stats);
            }
        });
        if (stats.length > 1)
            return stats;
        else 
            return modelList.slice(-1)[0].Stats;
    }

    GetStats():StatsData|Array<StatsData>{
        if (this.Models instanceof ModelData) {
            return this.Models.Stats;
        } else {
            if (this.Models) {
                return this.differentStats(this.Models);
            } else {
                console.log("ERROR : " + this.Name)
                return new StatsData("0,0,0", "");
            }
        }
    }

    getModelName(index:number) {
        return this.Models[index].Name;
    }
 
    GetUnitCategory():string{
        let that = this;
        let categoryIndex = -1;
        Variables.unitCategories.forEach(function(category){
            let index = that.Keywords.indexOf(category);
            if (index != -1 && categoryIndex == -1) {
                categoryIndex = index;
            }
        });
        return this.Keywords[categoryIndex];
    }

    GetLeaderData():LeaderData|null{
        if (this.Leader)
            return this.Leader;
        if (this.Leader === false)
            return null;
        const that = this;
        this.Profiles.forEach(function(profile){
            if (profile.Name == "Leader") {
                that.Leader = new LeaderData(that, profile.Description.match(/(?<=[-■]).*/ig).map(item=>item.trim()));
            }
        });
        if (this.Leader === null) {
            this.Leader=false;
            return null;
        }
        this.Profiles.forEach(function(profile){
            if (profile.Description.match(/(leading)|(bearer[’'`]s unit)/ig)) {
                if (that.Leader) {
                    that.Leader.Effects.push(profile)
                }
            }
        });
        this.OtherEquipment.forEach(function(profile){
            if (profile.Data.match(/(leading)|(bearer[’'`]s unit)/ig)) {
                if (that.Leader) {
                    that.Leader.Effects.push(new DescriptorData(profile.Name, profile.Data))
                }
            }
        });
        return this.Leader;
    }

    private getWeight():number{
        let weight = this.Costs.Val;
        let index = 10000000000000;
        const cat = this.GetUnitCategory();
        Variables.unitCategories.forEach((category)=>{
            if (category == cat) {
                weight+= index;
            }
            index /= 100;
        });
        return weight;
    }

    HasNoModel() {
        return this.Models == null || (this.Models instanceof Array && this.Models.length == 0);
    }

    private flat():string{
        return this.Name+this.CustomName+this.Profiles.toString()+this.Rules.toString()+this.MeleeWeapons.toString()+this.RangedWeapons.toString()+this.OtherEquipment.toString();
    }

    Equals(other:UnitData):boolean{
        return this.flat() == other.flat();
    }

    static compareUnits(unit1:UnitData, unit2:UnitData) {
        const weight1 = unit1.getWeight();
        const weight2 = unit2.getWeight();
        return (weight2 !== weight1)?weight2-weight1:unit1.Name.localeCompare(unit2.Name);
    }
}

export {UnitData,
CostData,
WeaponData,
ProfileWeaponData,
ModelData,
StatsData,
DescriptorData,
LeaderData};