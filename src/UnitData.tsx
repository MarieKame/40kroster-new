import $ from 'jquery';

class DescriptorData {
    Name: string;
    Description: string;

    constructor(name:string, description:string){
        this.Name = name;
        this.Description = description;
    }
}

class StatsData {
    protected _M: Number;
    protected _T: Number;
    protected _SV: Number;
    protected _IV: Number|null;
    protected _W: Number;
    protected _LD: Number;
    protected _OC: Number;
    
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
    protected _Traits: Array<string>;

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
        this._BS = Number.isInteger(parseInt(split[2]))?parseInt(split[1]):null;
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

    Costs: CostData;
    Models: Array<ModelData>|ModelData;

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
        UnitData.categories.forEach(function(category){
            let index = that.Keywords.indexOf(category);
            if (index != -1 && categoryIndex == -1) {
                categoryIndex = index;
            }
        });
        return this.Keywords[categoryIndex];
    }

    private getWeight():number{
        let weight = this.Costs.Val;
        let index = 10000000000000;
        const cat = this.GetUnitCategory();
        UnitData.categories.forEach((category)=>{
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

    static compareUnits(unit1:UnitData, unit2:UnitData) {
        return unit2.getWeight() - unit1.getWeight();
    }

    public static categories = ['Epic Hero', 'Character', 'Battleline', 'Infantry', 'Vehicle', 'Monster'];

    constructor() {
    }
}

export {UnitData,
CostData,
WeaponData,
ProfileWeaponData,
ModelData,
StatsData,
DescriptorData};