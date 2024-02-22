import React from "react";
import {StatsData, UnitData} from "./UnitData";
import Weapon from './UnitDetails/Weapon';
import {View, Image} from 'react-native';
import {Text, Descriptor, ComplexText} from './Components/Text';
import Style from '../Style/Unit';
import WeaponStyle from '../Style/Weapon';
import IsOdd from "./Components/IsOdd";
import Variables from "../Style/Variables";
import { FactionSvg, Background } from "../Style/svgs";

interface Props {
    data:UnitData
}

class Unit extends React.Component<Props> {

    renderStatBox(name:string, value:string, invul:boolean = false){
        return <View style={(invul)?[Style.box, Style.invul]:Style.box}>
            {!invul&&<View style={Style.headerView}><Text style={Style.header}>{name}</Text></View>}
            <Text style={Style.value}>{value}</Text>
            {invul&&<Text style={Style.invulText}>Invulnerable Save</Text>}
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
                <View style={Style.statsNameView}><Text style={Style.statsName}>{name}</Text></View>
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

    renderWeapons(weapons, title){
        let renderedWeapons;
        let isOdd = new IsOdd();
        if (weapons.length > 0) {
            let key= 0; 
            renderedWeapons = <View style={Style.weaponList}>  
            <View style={[Style.title, Style.weaponLine, Style.weaponSectionTitle]}><Text style={Style.title}>{title}</Text>
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
                <Text style={[Style.title]}>Other Equipment</Text>
                {this.props.data.OtherEquipment.map((wpn)=>
                    <View style={[Style.specialEquipment]} key={otherEquipKey++}>
                        <Text style={Style.subtitle}>{wpn.Name}</Text>
                        <ComplexText style={Style.more} fontSize={Variables.fontSize.small}>{wpn.Data}</ComplexText>
                    </View>
                )}
            </View>;
        }
        let faction;
        this.props.data.Factions.forEach(fa=>{
            if (Variables.factions.findIndex((f)=> f == fa) !== -1){
                faction=fa;
                console.log(faction)
            }
        });
        
        return  <View style={[Style.unit, {backgroundColor:Variables.colourBg}]}>
                    <View style={Style.nameView}><Text style={Style.name}>{this.props.data.CustomName !== null?this.props.data.CustomName:this.props.data.Name}</Text></View>
                    <View style={Style.allStats}>
                        {this.renderAllStats(stats)}
                        {IV}
                    </View>
                    <View style={Style.details}>
                        <View style={Style.weapons}>
                            {this.renderWeapons(this.props.data.MeleeWeapons, "Melee Weapons")}
                            {this.renderWeapons(this.props.data.RangedWeapons, "Ranged Weapons")}
                            {otherEquip}
                        </View>
                        <View style={Style.other}>
                            <Text style={Style.title}>Special Rules</Text>
                            <Descriptor style={[Style.more, Style.bold]}>[
                                {this.props.data.Rules.map((rule)=>rule.Name).join(', ')}
                            ]</Descriptor>
                            <View style={{flexDirection: 'row', flexWrap: 'wrap', width:"100%"}}>
                                {this.props.data.Profiles.map((ruleDescriptor)=>
                                <View style={Style.rule} key={this.ruleKey++}>
                                    <Text style={Style.ruleTitle}>{ruleDescriptor.Name}</Text>
                                    <ComplexText style={Style.more} fontSize={Variables.fontSize.small}>{ruleDescriptor.Description}</ComplexText>
                                </View>
                                )}
                            </View>
                        </View>
                    </View>
                    <View style={Style.keywordsView}>
                        <View style={Style.keywords}>
                            <Text style={Style.keywordsTitle}>Keywords : </Text>
                            <Descriptor style={Style.keyword}>{" "+this.props.data.Keywords.join(', ')+" "}</Descriptor>
                        </View>
                        <View style={Style.factions}>
                            <Text style={Style.keywordsTitle}>Faction Keywords : </Text>
                            <Descriptor style={Style.keyword}>{" "+this.props.data.Factions.join(', ')+" "}</Descriptor>
                        </View>
                        <View style={Style.icon}><Background style={{position:"absolute", left:-15, top:-7}} /><FactionSvg faction={faction} /></View>
                    </View>
                </View>;
    }
}
//<View style={Style.icon}>{factionIcon}</View>
export default Unit;