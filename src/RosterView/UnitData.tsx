import Variables from '../Variables';
import { DescriptorRaw, LeaderDataRaw, ModelRaw, UnitRaw, WeaponRaw } from '../Roster/RosterRaw';
import Each from '../Components/Each';

class StatsData {
    private data:Array<DescriptorRaw>;
    private _IV:string|null;
    
    public M():string {
        return this.data[0].Value;
    }
    public T():string {
        return this.data[1].Value;
    }
    public SV():string {
        return this.data[2].Value;
    }
    public IV():string|null {
        return this._IV;
    }
    public W():string {
        return this.data[3].Value;
    }
    public LD():string {
        return this.data[4].Value;
    }
    public OC():string {
        return this.data[5].Value;
    }

    public IsSame(stats:StatsData):boolean{
        let same = true;
        Each<DescriptorRaw>(this.data, (desctiptor, index)=>{
            same = same && (desctiptor.Value===stats.data[index].Value);
        });
        return same;
    }

    constructor(data:Array<DescriptorRaw>, invulnerableDescription:string|undefined) {
        this.data = data;
        if (invulnerableDescription) {
            this._IV = invulnerableDescription.charAt(invulnerableDescription.search(/.\+/g)) + "+";
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

class WeaponData {
    Data:Array<DescriptorRaw>;
    private count:number;
    private name:string;

    Name():string {return this.name;}

    Count():number {return this.count;}

    public Range():string{
        return this.Data[0].Value;
    }
    public A():string {
        return this.Data[1].Value;
    }
    public BS():string {
        return this.Data[2].Value;
    }
    public S():string {
        return this.Data[3].Value;
    }
    public AP():string {
        return this.Data[4].Value;
    }
    public D():string {
        return this.Data[5].Value;
    }
    public Traits():Array<string> {
        return this.Data.filter((trait, index)=>index>=6&&trait.Value!=="-").map(trait=>trait.Value);
    }

    public IsMelee():boolean {
        return this.Range()==="Melee";
    }

    public IsMultiRange():boolean{
        return false;
    }

    constructor(data:Array<DescriptorRaw>, count:number, name:string) {
        this.Data = data;
        this.count = count;
        this.name = name;
    }
}

class MultiRangeWeaponData extends WeaponData {
    public MeleeProfiles:Array<WeaponData>;
    public RangedProfiles:Array<WeaponData>;

    public IsMelee():boolean {
        return false;
    }
    public IsMultiRange(): boolean {
        return true;
    }

    constructor(profiles: Array<WeaponData>, count:number, name:string){
        super(null, count, name);
        this.MeleeProfiles = profiles.filter(profile=>profile.IsMelee());
        this.RangedProfiles = profiles.filter(profile=>!profile.IsMelee());
    }
}

class ProfileWeaponData extends WeaponData {
    public Profiles: Array<WeaponData>;

    public IsMelee():boolean {
        return this.Profiles[0].IsMelee();
    }

    constructor(profiles: Array<WeaponData>, count:number, name:string){
        super(null, count, name);
        this.Profiles = profiles;
    }
}

export function ExtractWeaponData(weapons:Array<WeaponRaw>):{melee:Array<WeaponData>, ranged:Array<WeaponData>} {
    let MeleeWeapons = new Array<WeaponData>();
    let RangedWeapons = new Array<WeaponData>();
    Each<WeaponRaw>(weapons, weapon=>{
        if(weapon.Profiles.length===1){
            if(weapon.Profiles[0].Profile[0].Value==="Melee"){
                MeleeWeapons.push(new WeaponData(weapon.Profiles[0].Profile, weapon.Count, weapon.Name));
            } else {
                RangedWeapons.push(new WeaponData(weapon.Profiles[0].Profile, weapon.Count, weapon.Name));
            }
        } else {
            const meleeProfiles = weapon.Profiles.filter(p=>p.Profile[0].Value ==="Melee");
            const rangedProfiles = weapon.Profiles.filter(p=>p.Profile[0].Value!=="Melee");
            if(meleeProfiles.length === weapon.Profiles.length) {
                MeleeWeapons.push(new ProfileWeaponData(weapon.Profiles.map(p=>new WeaponData(p.Profile, 0, p.Name)), weapon.Count, weapon.Name))
            } else if (rangedProfiles.length === weapon.Profiles.length) {
                RangedWeapons.push(new ProfileWeaponData(weapon.Profiles.map(p=>new WeaponData(p.Profile, 0, p.Name)), weapon.Count, weapon.Name))
            } else {
                const mrw = new MultiRangeWeaponData(weapon.Profiles.map(p=>new WeaponData(p.Profile, 0, p.Name)), weapon.Count, weapon.Name);
                function __formatName(wpnName, profileName){
                    return "➤ " + wpnName + (profileName!==""?" - " + profileName:"");
                }
                if(mrw.MeleeProfiles.length > 1){
                    MeleeWeapons.push(new ProfileWeaponData(mrw.MeleeProfiles, weapon.Count, weapon.Name));
                } else if (mrw.MeleeProfiles.length == 1 ){
                    MeleeWeapons.push(new WeaponData(mrw.MeleeProfiles[0].Data, weapon.Count, __formatName(weapon.Name, mrw.MeleeProfiles[0].Name)));
                }

                if(mrw.RangedProfiles.length > 1){
                    RangedWeapons.push(new ProfileWeaponData(mrw.RangedProfiles, weapon.Count, weapon.Name));
                } else if (mrw.RangedProfiles.length == 1 ){
                    RangedWeapons.push(new WeaponData(mrw.RangedProfiles[0].Data, weapon.Count, __formatName(weapon.Name, mrw.RangedProfiles[0].Name)));
                }
            }
        }
    });
    return {melee:MeleeWeapons, ranged:RangedWeapons};
}

class UnitData {

    static CompareUnits(unit1:UnitData, unit2:UnitData) {
        const weight1 = unit1.getWeight();
        const weight2 = unit2.getWeight();
        return (weight2 !== weight1)?weight2-weight1:unit1.Name().localeCompare(unit2.Name());
    }

    Name() : string {return this.data.BaseName}
    CustomName() : string {return this.data.CustomName!==undefined?this.data.CustomName:null}
    Key():string {return this.data.UniqueID};

    Keywords: Array<string>;
    Factions: Array<string>;
    Rules: Array<string>;
    Abilities: Array<DescriptorRaw>;
    MeleeWeapons:Array<WeaponData>;
    RangedWeapons:Array<WeaponData>;

    Count:number = 1;

    Models: Array<ModelData>;

    private data:UnitRaw;

    constructor(unit:UnitRaw) {
        this.data = unit;
        this.Factions = new Array<string>();
        this.Keywords = new Array<string>();
        Each<string>(unit.Categories, categories=>{
            let result = /(?<=Faction: ).*/g.exec(categories)
            if (result){
                this.Factions.push(result[0]);
            } else  {
                this.Keywords.push(categories);
            }
        });
        this.Rules = new Array<string>();
        this.Abilities = new Array<DescriptorRaw>();
        let invuls = new Array<DescriptorRaw>();
        Each<DescriptorRaw>(unit.Abilities, ability=>{
            let add = true;
            Each<string>(unit.Rules, rule=>{
                let r = rule;
                const regex = new RegExp(rule, "gi");
                if(regex.test(ability.Name)) {
                    console.log("???")
                    r += " " + /D?[0-9]\+?/i.exec(ability.Value).toString().trim();
                    add=false;
                } 
                if(!this.Rules.find(ru=>ru===r)) this.Rules.push(r);
            });
            if(/invulnerable/gi.test(ability.Name)) {
                invuls.push(ability);
            } else if (add) {
                this.Abilities.push(ability);
            }
        });

        const extracted = ExtractWeaponData(unit.Weapons);
        this.MeleeWeapons = extracted.melee;
        this.RangedWeapons = extracted.ranged;

        function sortWeapon(wpn1:WeaponData, wpn2:WeaponData):number{
            if (wpn1.Count > wpn2.Count)
                return -1;
            if (wpn1.Count < wpn2.Count)
                return 1;
            if (wpn1 instanceof ProfileWeaponData && !(wpn2 instanceof ProfileWeaponData))
                return 1;
            if (!(wpn1 instanceof ProfileWeaponData) && wpn2 instanceof ProfileWeaponData)
                return -1;
            return 0;
        }
        this.MeleeWeapons.sort(sortWeapon);
        this.RangedWeapons.sort(sortWeapon);
        
        this.Models = new Array<ModelData>();
        Each<ModelRaw>(unit.Models, (model, index)=>{
            let invul:DescriptorRaw = null;
            if(invuls.length===1 && index === unit.Models.length-1) {
                invul = invuls[0];
            } else if (invuls.length>1) {
                const foundIndex = invuls.findIndex(i=>new RegExp(model.Name.substring(0, model.Name.length-1), "gi").test(i.Name));
                if(foundIndex!==-1) {
                    invul=invuls[foundIndex];
                }
            }
            this.Models.push(new ModelData(model.Name, new StatsData(model.Characteristics, invul.Value)))
        });
    }

    private getWeight():number{
        let weight = this.data.Cost;
        let index = 1000 ** Variables.unitCategories.length;
        const cat = this.GetUnitCategory();
        Variables.unitCategories.forEach((category)=>{
            if (category == cat) {
                weight+= index;
            }
            index /= 1000;
        });
        return weight;
    }

    private flat():string{
        return this.Name() + 
            this.CustomName() + 
            this.Abilities.map(x=>x.Name).toString() + 
            this.Rules.toString() + 
            this.MeleeWeapons.map(x=>x.Name+x.Count.toString()).toString() + 
            this.RangedWeapons.map(x=>x.Name+x.Count.toString()).toString();
    }

    GetStats():Array<StatsData>{
        return this.Models.map(m=>m.Stats);
    }

    GetModelName(index:number) {
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

    HasNoModel():boolean {
        return this.Models == null || (this.Models instanceof Array && this.Models.length == 0);
    }

    Equals(other:UnitData, leaderData:LeaderDataRaw[]):boolean{
        return this.flat() == other.flat() && leaderData.findIndex(data=>data.CurrentlyLeading === this.Key() || data.CurrentlyLeading === other.Key())===-1;
    }
}

export {UnitData,
WeaponData,
ProfileWeaponData,
MultiRangeWeaponData,
ModelData,
StatsData,};