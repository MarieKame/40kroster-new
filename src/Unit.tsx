import React from "react";
import {StatsData, UnitData, LeaderData, WeaponData} from "./UnitData";
import Weapon from './UnitDetails/Weapon';
import {View} from 'react-native';
import {Text, Descriptor, ComplexText} from './Components/Text';
import Style from '../Style/Unit';
import WeaponStyle from '../Style/Weapon';
import IsOdd from "./Components/IsOdd";
import Variables from "../Style/Variables";
import { FactionSvg, Background } from "../Style/svgs";
import {KameContext} from "../Style/KameContext";
import Checkbox from 'expo-checkbox';

interface Props {
    data:UnitData,
    Leaders:Array<LeaderData>,
    onUpdateLeader:CallableFunction
}

class Unit extends React.Component<Props> {
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;

    state = {
        refresh:1
    }

    renderStatBox(name:string, value:string, invul:boolean = false){
        return <View style={(invul)?[Style.box, Style.invul, {backgroundColor: this.context.Bg, borderColor:this.context.Dark}]:[Style.box, {backgroundColor: this.context.Bg, borderColor:this.context.Dark}]}>
            {!invul&&<View style={Style.headerView}><Text style={[Style.header, {backgroundColor: this.context.Bg}]}>{name}</Text></View>}
            <Text style={Style.value}>{value}</Text>
            {invul&&<Text style={[Style.invulText, {backgroundColor:this.context.LightAccent}]}>Invulnerable Save</Text>}
        </View>;
    }

    renderStats(stats:StatsData, index:number = -1, key:number=-1) {
        let name;
        if (index != -1) {
            name=this.props.data.getModelName(index);
        } else if (this.props.data.CustomName) {
            name=this.props.data.Name;
        }
        return <View style={Style.statsRow} key={key!==-1&&key}>
                {this.renderStatBox("M", stats.M())}
                {this.renderStatBox("T", stats.T())}
                {this.renderStatBox("SV", stats.SV())}
                {this.renderStatBox("W", stats.W())}
                {this.renderStatBox("LD", stats.LD())}
                {this.renderStatBox("OC", stats.OC())}
                <View style={Style.statsNameView}><Text style={[Style.statsName, {backgroundColor:this.context.LightAccent}]}>{name}</Text></View>
            </View> ;
    }

    renderAllStats(stats:StatsData|Array<StatsData>) {
        let key=0;
        if (stats instanceof StatsData) {
            return <View>{this.renderStats(stats)}</View>;
        } else {
            return <View>{stats.map((stats, index) => this.renderStats(stats, index, key++))}</View>;
        }
    }

    renderWeapons(weapons:Array<WeaponData>, title, leaders:Array<LeaderData>, leadersWeapons:Array<Array<WeaponData>>){
        let renderedWeapons;
        let isOdd = new IsOdd();
        if (weapons.length > 0) {
            let key= 0; 
            renderedWeapons = <View style={Style.weaponList}>  
            <View style={[Style.title, Style.weaponLine, Style.weaponSectionTitle, {backgroundColor:this.context.Accent}]}><Text style={[Style.title, {backgroundColor:this.context.Accent}]}>{title}</Text>
                <View style={Style.statsBar}>
                    <Text style={WeaponStyle.statData} key="R">R</Text>
                    <Text style={WeaponStyle.statData} key="A">A</Text>
                    <Text style={WeaponStyle.statData} key="BS">BS</Text>
                    <Text style={WeaponStyle.statData} key="S">S</Text>
                    <Text style={WeaponStyle.statData} key="AP">AP</Text>
                    <Text style={WeaponStyle.statData} key="D">D</Text>
                </View> 
                </View>
                {weapons.map((wpn)=>
                    <Weapon data={wpn} showQuantity={true} key={key++} Style={Style.weaponLine} isOdd={isOdd}/>
                )}
                {Variables.mergeLeaderWeapons&&leaders.map((leader, index)=>leadersWeapons[index].map(wpn=>
                    <Weapon data={wpn} showQuantity={true} key={key++} Style={Style.weaponLine} isOdd={isOdd} prefix={leader.BaseName}/>)
                )}
            </View>;
        }
        return renderedWeapons;
    }
    ruleKey = 0;
    render(){
        let stats = this.props.data.GetStats();
        let ivValue;
        if (stats instanceof StatsData) {
            ivValue = stats.IV();
        } else {
            stats.forEach(function(stat){
                ivValue = stat.IV()??ivValue;
            });
        }
        let IV; 
        if (ivValue) {
            IV = this.renderStatBox("", ivValue, true);
        }

        let otherEquip;
        if (this.props.data.OtherEquipment.length > 0) {
            let otherEquipKey=0;
            otherEquip= 
            <View style={Style.weaponList}> 
                <Text style={[Style.title, {backgroundColor:this.context.Accent}]}>Other Equipment</Text>
                {this.props.data.OtherEquipment.map((wpn)=>
                    <View style={[Style.specialEquipment]} key={otherEquipKey++}>
                        <Text style={[Style.subtitle, {backgroundColor:this.context.LightAccent}]}>{wpn.Name}</Text>
                        <ComplexText style={Style.more} fontSize={Variables.fontSize.small}>{wpn.Data}</ComplexText>
                    </View>
                )}
            </View>;
        }
        let faction;
        this.props.data.Factions.forEach(fa=>{
            if (Variables.factions.findIndex((f)=> f[0] == fa) !== -1){
                faction=fa;
            }
        });

        const leaders = this.props.Leaders.filter(leader=>leader.Leading.findIndex(lead=>lead.toLocaleLowerCase()==this.props.data.Name.toLocaleLowerCase()) !== -1);
        const selectedLeaders = leaders.filter((leader)=>leader.CurrentlyLeading == this.props.data.Key);
        function Name(leader:LeaderData){
            return leader.CustomName?leader.CustomName+" ("+leader.BaseName+") ":leader.BaseName;
        }
        return  <View style={[Style.unit, {backgroundColor:this.context.Bg, 
            borderColor:this.context.Dark}]}>
                    <View style={Style.nameView}><Text style={Style.name}>{((this.props.data.CustomName !== null && this.props.data.CustomName !== "")?this.props.data.CustomName:this.props.data.Name) + ((this.props.data.Count>1)?" (x" + this.props.data.Count + ")":"")}</Text></View>
                    <View style={Style.allStats}>
                        {this.renderAllStats(stats)}
                        {IV}
                    </View>
                    <View style={Style.details}>
                        <View style={Style.weapons}>
                            {Variables.displayFirst=="melee"&&this.renderWeapons(this.props.data.MeleeWeapons, "Melee Weapons", selectedLeaders, selectedLeaders.map(leader=>leader.MeleeWeapons))}
                            {this.renderWeapons(this.props.data.RangedWeapons, "Ranged Weapons", selectedLeaders, selectedLeaders.map(leader=>leader.RangedWeapons))}
                            {Variables.displayFirst=="ranged"&&this.renderWeapons(this.props.data.MeleeWeapons, "Melee Weapons", selectedLeaders, selectedLeaders.map(leader=>leader.MeleeWeapons))}
                            {otherEquip}
                        </View>
                        <View style={Style.other}>
                            <Text style={[Style.title, {backgroundColor:this.context.Accent}]}>Special Rules</Text>
                            <Descriptor style={[Style.more, Style.bold, {color:this.context.Main}]}>[
                                {this.props.data.Rules.map((rule)=>rule.Name).join(', ')}
                            ]</Descriptor>
                            <View style={{flexDirection: 'row', flexWrap: 'wrap', width:"100%"}}>
                                {this.props.data.Profiles.map((ruleDescriptor)=>
                                ((Variables.displayLeaderInfo||ruleDescriptor.Name!=="Leader")&&(ruleDescriptor.Name!=="Transport")&&ruleDescriptor.Name!=="Invulnerable Save")&&<View style={Style.rule} key={this.ruleKey++}>
                                    <Text style={[Style.ruleTitle, {backgroundColor:this.context.LightAccent}]}>{ruleDescriptor.Name}</Text>
                                    <ComplexText style={Style.more} fontSize={Variables.fontSize.small}>{ruleDescriptor.Description}</ComplexText>
                                </View>
                                )}
                            </View>
                        </View>
                    </View>
                    {leaders.length !== 0 &&
                    <View>
                        <Text style={[Style.title, {backgroundColor:this.context.Accent, marginBottom:4}]}>Leaders</Text>
                        <View style={{flexDirection:"row", flexWrap:"wrap"}}>
                            {leaders.map((leader, index)=>
                                <View key={index} style={{flexDirection:"row", justifyContent:"center", alignItems:"center", paddingRight:10, paddingBottom:4}}>
                                    <Checkbox 
                                        disabled={leader.CurrentlyLeading!==-1 && leader.CurrentlyLeading!==this.props.data.Key} 
                                        color={this.context.Main} 
                                        style={{marginRight:4}} 
                                        value={leader.CurrentlyLeading==this.props.data.Key} 
                                        onValueChange={(value)=>{
                                            leader.CurrentlyLeading=value?this.props.data.Key:-1; 
                                            this.props.onUpdateLeader(leader)}}/>
                                    <Text>{Name(leader)}</Text>
                                </View>
                            )}
                        </View>
                        <View style={{flexDirection: 'row', flexWrap: 'wrap', width:"100%"}}>
                            {leaders.map((leader, index1) =>
                                leader.Effects.map((effect, index2)=>
                                    leader.CurrentlyLeading==this.props.data.Key&&<View style={Style.rule} key={index1+index2+Name(leader)}>
                                        <Text style={[Style.ruleTitle, {backgroundColor:this.context.LightAccent}]}>{effect.Name}</Text>
                                        <ComplexText style={Style.more} fontSize={Variables.fontSize.small}>{effect.Description}</ComplexText>
                                    </View>    
                                ) 
                            )}
                        </View>
                    </View>
                    }
                    <View style={Style.keywordsView}>
                        <View style={Style.keywords}>
                            <Text style={Style.keywordsTitle}>Keywords : </Text>
                            <Descriptor style={Style.keyword}>{" "+this.props.data.Keywords.join(', ')+" "}</Descriptor>
                        </View>
                        <View style={[Style.factions, {backgroundColor:this.context.LightAccent,borderTopColor:this.context.Dark, borderBottomColor:this.context.Dark}]}>
                            <Text style={Style.keywordsTitle}>Faction Keywords : </Text>
                            <Descriptor style={Style.keyword}>{" "+this.props.data.Factions.join(', ')+" "}</Descriptor>
                        </View>
                        <View style={Style.icon}><Background style={{position:"absolute", left:-15, top:-7}} /><FactionSvg faction={faction} /></View>
                    </View>
                </View>;
    }
}

export default Unit;