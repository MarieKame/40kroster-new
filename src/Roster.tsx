import React from "react";
import Unit from "./Unit";
import {UnitData,  DescriptorData, LeaderData} from "./UnitData";
import {View, ScrollView, Platform} from 'react-native';
import fastXMLParser from 'fast-xml-parser';
import Variables from "../Style/Variables";
import Button from "./Components/Button";
import {Text} from "./Components/Text";
import {KameContext} from "../Style/KameContext";
import RosterExtraction, { Reminder } from "./RosterExtraction";
import { Stratagem } from "./Stratagems";


interface Props {
    XML:string,
    navigation:{navigate},
    onLoad:CallableFunction,
    onUpdateLeaders:CallableFunction,
    forceLeaders?:Array<LeaderData>
}

class Roster extends React.Component<Props> {
    static Instance:Roster;
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;
    state = {
        Index:0,
        Name: "",
        Costs:"",
        Faction:"",
        Detachment:"",
        Units: new Array<UnitData>(),
        UnitsToSkip: new Array<number>(),
        Leaders: new Array<LeaderData>(),
        Rules: new Array<DescriptorData>(),
        Reminders:new Array<Reminder>(),
        DetachmentStratagems: new Array<Stratagem>
    }

    constructor(props:Props) {
        super(props);
        Roster.Instance = this;
        const parser = new fastXMLParser.XMLParser({ignoreAttributes:false, attributeNamePrefix :"_", textNodeName:"textValue"});
        const exploration = new RosterExtraction(parser.parse(props.XML).roster, this.props.forceLeaders, this.props.onUpdateLeaders);
        this.state.Name = exploration.data.Name;
        this.state.Costs = exploration.data.Costs;
        this.state.Faction = exploration.data.Faction;
        this.state.Detachment = exploration.data.Detachment;
        this.state.Units = exploration.data.Units;
        this.state.UnitsToSkip = exploration.data.UnitsToSkip;
        this.state.Leaders = exploration.data.Leaders;
        this.state.Rules = exploration.data.Rules;
        this.state.Reminders = exploration.data.Reminders;
        this.state.DetachmentStratagems = exploration.data.DetachmentStratagems;
        this.props.onLoad(this.state.Costs);
    }

    Previous(){
        let newIndex = (this.state.Index-1);
        newIndex= newIndex<0?this.state.Units.length-1:newIndex;
        while (this.state.UnitsToSkip.indexOf(newIndex)!==-1) {
            newIndex--;
            newIndex= newIndex<0?this.state.Units.length-1:newIndex;
        }
        this.setState({Index:newIndex});
    }

    Next(){
        let newIndex = (this.state.Index+1)%this.state.Units.length;
        while (this.state.UnitsToSkip.indexOf(newIndex)!==-1) {
            newIndex = (newIndex+1)%this.state.Units.length
        }
        this.setState({Index:newIndex});
    }

    GetUnit():UnitData{
        return this.state.Units[this.state.Index];
    }

    DisplayUnit(index:number){
        this.setState({Index:index});
    }

    UpdateLeader(leader:LeaderData, that:Roster) {
        let leaders = that.state.Leaders;
        const index = leaders.findIndex(leader2=>leader2.UniqueId==leader.UniqueId);
        leaders[index] = leader;
        that.props.onUpdateLeaders(leaders);
        that.setState({Leaders:leaders});
    }

    private GetDisplayIndex():number{
        let index = this.state.Index;
        this.state.UnitsToSkip.reverse().forEach(toSkip=>{
            if (toSkip < index) index--;
        });
        return index + 1;
    }

    render(){
        Roster.Instance = this;
        let key= 0;
        if (Platform.OS=="web"){
            return <View style={{width:Variables.width, alignSelf:"center", padding:10}}>{this.state.Units.map(unitData => (
                <Unit data={unitData} key={key++} Leaders={this.state.Leaders} onUpdateLeader={(leader)=>this.UpdateLeader(leader,this)} />
            ))}</View>;
        } else {
            return <View>
                <ScrollView>
                    <View style={{width:Variables.width, alignSelf:"center", padding:10, height:"100%"}}>
                        <Unit data={this.state.Units[this.state.Index]} Leaders={this.state.Leaders} onUpdateLeader={(leader)=>this.UpdateLeader(leader,this)} />
                    </View>
                </ScrollView>
                <View style={{position:"absolute", right:20, top:20, zIndex:100, backgroundColor:this.context.Bg, borderRadius:10}}>
                    <View style={{flexDirection:"row"}}>
                        <Button key="back" onPress={(e)=> this.Previous()} textStyle={{transform:[{rotate:'180deg'}], top:2}}>➤</Button>
                        <View style={{flexDirection:"column"}}>
                            <Button onPress={(e)=> this.props.navigation.navigate('RosterMenu')}style={{width:70}}>Menu</Button>
                        </View>
                        <Button key="for" onPress={(e)=> this.Next()}>➤</Button>
                    </View>
                    <Text style={{textAlign:"center"}}>{(this.GetDisplayIndex()) + " / " + (this.state.Units.length  - this.state.UnitsToSkip.length) + (this.state.UnitsToSkip.length>0?" ( "+this.state.Units.length+" )":"")}</Text>
                </View>
            </View>;
        }
    }
    
}

export default Roster;