import React from "react";
import {StatsData, UnitData, WeaponData, ModelData, ExtractWeaponData} from "./UnitData";
import Weapon from './Weapon';
import {View} from 'react-native';
import {Text, Descriptor, ComplexText} from '../Components/Text';
import Style from '../../Style/Unit';
import WeaponStyle from '../../Style/Weapon';
import IsOdd from "../Components/IsOdd";
import Variables from "../Variables";
import { FactionSvg, Background } from "../../Style/svgs";
import {KameContext} from "../../Style/KameContext";
import Checkbox from 'expo-checkbox';
import Button from "../Components/Button";
import { LeaderDataRaw, NoteRaw } from "../Roster/RosterRaw";

interface Props {
    data:UnitData,
    Leaders:Array<LeaderDataRaw>,
    Notes:Array<NoteRaw>,
    onUpdateLeader:CallableFunction,
    onAddNotePressed:CallableFunction,
    onNoteRemoved:CallableFunction
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

    renderStats(stats:StatsData, index:number = -1) {
        let name;
        if (index != -1 && this.props.data.Models.length>1) {
            name=this.props.data.GetModelName(index);
        } else if (this.props.data.CustomName) {
            name=this.props.data.Name;
        }
        return <View style={Style.statsRow} key={index}>
                {this.renderStatBox("M", stats.M())}
                {this.renderStatBox("T", stats.T())}
                {this.renderStatBox("SV", stats.SV())}
                {this.renderStatBox("W", stats.W())}
                {this.renderStatBox("LD", stats.LD())}
                {this.renderStatBox("OC", stats.OC())}
                <View style={Style.statsNameView}><Text style={[Style.statsName, {backgroundColor:this.context.LightAccent}]}>{name}</Text></View>
            </View> ;
    }

    renderAllStats(models:Array<ModelData>) {
        return <View>{models.map((model, index) => <View key={index}>{this.renderStats(model.Stats, index)}{model.Stats.IV()&&this.renderStatBox("", model.Stats.IV(), true)}</View>)}</View>;
    }

    renderWeapons(weapons:Array<WeaponData>, title, leaders:Array<LeaderDataRaw>, leadersWeapons:Array<Array<WeaponData>>){
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
                    <Weapon data={wpn} key={key++} isOdd={isOdd}/>
                )}
                {Variables.mergeLeaderWeapons&&leaders.map((leader, index)=>leadersWeapons[index].map(wpn=>
                    <Weapon data={wpn} key={key++} isOdd={isOdd} prefix={leader.BaseName}/>)
                )}
            </View>;
        }
        return renderedWeapons;
    }
    ruleKey = 0;
    render(){
        let faction;
        this.props.data.Factions.forEach(fa=>{
            if (Variables.factions.findIndex((f)=> f[0] == fa) !== -1){
                faction=fa;
            }
        });

        const leaders = this.props.Leaders.filter(leader=>leader.Leading.findIndex(lead=>lead.toLocaleLowerCase()==this.props.data.Name().toLocaleLowerCase()) !== -1);
        const selectedLeaders = leaders.filter((leader)=>leader.CurrentlyLeading == this.props.data.Key());
        function Name(leader:LeaderDataRaw){
            return leader.CustomName?leader.CustomName+" ("+leader.BaseName+") ":leader.BaseName;
        }
        const selectedLeadersWeapons = selectedLeaders.map(sl=>ExtractWeaponData(sl.Weapons));
        const notes=this.props.Notes;
        return  <View style={[Style.unit, {backgroundColor:this.context.Bg, borderColor:this.context.Dark}]} key={this.props.data.Name()+this.props.data.Count}>
                    <View key="name" style={Style.nameView}>
                        <Text style={Style.name}>{((this.props.data.CustomName() !== null && this.props.data.CustomName() !== "")?this.props.data.CustomName():this.props.data.Name()) + ((this.props.data.Count>1)?" (x" + this.props.data.Count + ")":"")}</Text>
                    </View>
                    <View key="stats" style={Style.allStats}>
                        {this.renderAllStats(this.props.data.Models)}
                    </View>
                    <View key="details" style={Style.details}>
                        <View key="weapons" style={Style.weapons}>
                            {Variables.displayFirst=="melee"&&this.renderWeapons(
                                this.props.data.MeleeWeapons, 
                                "Melee Weapons", 
                                selectedLeaders, 
                                selectedLeadersWeapons.map(slw=>slw.melee)
                            )}
                            {this.renderWeapons(
                                this.props.data.RangedWeapons, 
                                "Ranged Weapons", 
                                selectedLeaders, 
                                selectedLeadersWeapons.map(slw=>slw.ranged)
                            )}
                            {Variables.displayFirst=="ranged"&&this.renderWeapons(
                                this.props.data.MeleeWeapons, 
                                "Melee Weapons", 
                                selectedLeaders, 
                                selectedLeadersWeapons.map(slw=>slw.melee)
                            )}
                        </View>
                        <View key="other" style={Style.other}>
                            <Text key="title" style={[Style.title, {backgroundColor:this.context.Accent}]}>Special Rules</Text>
                            <Descriptor key="rules" style={[Style.more, Style.bold, {color:this.context.Main}]}>[
                                {this.props.data.Rules.map((rule)=>rule).join(', ')}
                            ]</Descriptor>
                            <View key="profiles" style={{flexDirection: 'row', flexWrap: 'wrap', width:"100%"}}>
                                {this.props.data.Abilities.map((ruleDescriptor)=>
                                ((Variables.displayLeaderInfo||ruleDescriptor.Name!=="Leader")&&(ruleDescriptor.Name!=="Transport")&&!/^((Models in this units? have)|(This model has)) a((n)|( [2-6]\+)) invulnerable save( of [2-6]\+)?\.?$/gi.test(ruleDescriptor.Value))&&<View style={Style.rule} key={this.ruleKey++}>
                                    <Text key="name" style={[Style.ruleTitle, {backgroundColor:this.context.LightAccent}]}>{ruleDescriptor.Name}</Text>
                                    <ComplexText key="description" style={Style.more} fontSize={Variables.fontSize.small}>{ruleDescriptor.Value}</ComplexText>
                                </View>
                                )}
                            </View>
                        </View>
                    </View>
                    {leaders.length !== 0 &&
                    <View key="leaders">
                        <Text key="title" style={[Style.title, {backgroundColor:this.context.Accent, marginBottom:4}]}>Leaders</Text>
                        <View key="list" style={{flexDirection:"row", flexWrap:"wrap"}}>
                            {leaders.map((leader, index)=>
                                <View key={index} style={{flexDirection:"row", justifyContent:"center", alignItems:"center", paddingRight:10, paddingBottom:4}}>
                                    <Checkbox 
                                        key="cxbx"
                                        disabled={leader.CurrentlyLeading!==""&&leader.CurrentlyLeading!==null && leader.CurrentlyLeading!==this.props.data.Key()} 
                                        color={this.context.Main} 
                                        style={{marginRight:4}} 
                                        value={leader.CurrentlyLeading==this.props.data.Key()} 
                                        onValueChange={(value)=>{
                                            leader.CurrentlyLeading=value?this.props.data.Key():null; 
                                            this.props.onUpdateLeader(leader)}}/>
                                    <Text key="name">{Name(leader)}</Text>
                                </View>
                            )}
                        </View>
                        <View key="data" style={{flexDirection: 'row', flexWrap: 'wrap', width:"100%"}}>
                            {leaders.map((leader, index1) =>
                                leader.Effects.map((effect, index2)=>
                                    leader.CurrentlyLeading==this.props.data.Key()&&<View style={Style.rule} key={index1+index2+Name(leader)}>
                                        <Text key="name" style={[Style.ruleTitle, {backgroundColor:this.context.LightAccent}]}>{effect.Name + " (" + leader.BaseName + ")"}</Text>
                                        <ComplexText key="desc" style={Style.more} fontSize={Variables.fontSize.small}>{effect.Value}</ComplexText>
                                    </View>    
                                ) 
                            )}
                        </View>
                    </View>
                    }
                    <View key="notes">
                        <View key="header" style={{flexDirection:"row"}}>
                            <Text key="title" style={[Style.title, {backgroundColor:this.context.Accent, marginBottom:4, flexGrow:1, height:16, alignSelf:"center"}]}>Notes</Text>
                            <Button small key="add" onPress={e=>this.props.onAddNotePressed()} textStyle={{height:16}} style={{height:16}}>Add Note</Button>
                        </View>

                        {notes.length>0&&
                            <View key="notes" style={{flexDirection:"row", flexWrap:"wrap"}}>
                            {notes.map((note, index)=>
                                <View key={note.Descriptor.Name + index} style={{width:"50%"}}>
                                    <View key="header" style={{flexDirection:"row"}}>
                                        <Text key="name" style={[Style.ruleTitle, {backgroundColor:this.context.LightAccent, height:16, flexGrow:1, alignSelf:"center"}]}>{note.Descriptor.Name}</Text>
                                        <Button small key="delete" onPress={(e) => this.props.onNoteRemoved(index)} textStyle={{fontSize:12, height:18}} style={{width:30, height:18}} weight="light">🗑</Button>
                                    </View>
                                    <ComplexText key="desc" style={Style.more} fontSize={Variables.fontSize.small}>{note.Descriptor.Value}</ComplexText>
                                </View>
                            )}
                            </View>
                        }
                    </View>
                    <View key="keywords" style={Style.keywordsView}>
                        <View key="actual" style={Style.keywords}>
                            <Text key="name" style={Style.keywordsTitle}>Keywords : </Text>
                            <Descriptor key="desc" style={Style.keyword}>{" "+this.props.data.Keywords.join(', ')+" "}</Descriptor>
                        </View>
                        <View key="faction" style={[Style.factions, {backgroundColor:this.context.LightAccent,borderTopColor:this.context.Dark, borderBottomColor:this.context.Dark}]}>
                            <Text key="name" style={Style.keywordsTitle}>Faction Keywords : </Text>
                            <Descriptor key="desc" style={Style.keyword}>{" "+this.props.data.Factions.join(', ')+" "}</Descriptor>
                        </View>
                        <View key="logo" style={Style.icon}><Background key="1" style={{position:"absolute", left:-15, top:-7}} /><FactionSvg key="2" faction={faction} /></View>
                    </View>
                </View>;
    }
}

export default Unit;