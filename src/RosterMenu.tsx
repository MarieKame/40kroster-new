import { Component, ReactNode } from "react";
import { KameContext } from "../Style/KameContext";
import { ScrollView, View } from "react-native";
import Variables from "../Style/Variables";
import { DescriptorData } from "./UnitData";
import Roster, { Reminder } from "./Roster";
import Button from "./Components/Button";
import Text, { ComplexText } from "./Components/Text";

enum RosterMenuCategories {
    UNIT_LIST, RULES, REMINDERS
}

interface Props {
    navigation:{reset, goBack}
}

class RosterMenu extends Component<Props> {
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;

    state = {
        MenuSection:RosterMenuCategories.UNIT_LIST
    }

    ShowCategory(category:string, index:number):ReactNode {
        let that = this;
        if (Roster.Instance.state.Units.filter((unit)=> unit.GetUnitCategory() == category).length == 0) return "";
        return <View style={{paddingBottom:14}} key={index}>
            <Text style={{width:"100%", textAlign:"center", fontFamily:Variables.fonts.spaceMarine, paddingBottom:4}}>— {category} —</Text>
            <View style={{flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', width:"100%"}}>
                {Roster.Instance.state.Units.map((unit, index) => 
                    unit.GetUnitCategory() == category&&<View style={{width:"50%"}}><Button onPress={(e)=>Roster.Instance.DisplayUnit(index)} weight={(index==Roster.Instance.state.Index)?"heavy":"normal"}>{unit.CustomName?unit.CustomName:unit.Name}</Button></View>
                )}
            </View>
        </View>;
    }

    ShowRemindersFor(phase:string, index:number):ReactNode{

        return <View key={index+"reminderPhase"} style={{marginBottom:10, padding:4}}>
                    {phase&&<Text style={{backgroundColor:this.context.Accent, fontFamily:Variables.fonts.spaceMarine, padding:5, marginBottom:4}}>{phase+" Phase"}</Text>}
                    {Roster.Instance.state.Reminders.map((reminder, reminderIndex)=>
                    reminder.Phase==phase&&
                        <View key={index+reminderIndex}><Text style={{backgroundColor:this.context.LightAccent, fontFamily:Variables.fonts.spaceMarine, padding:5}}>{reminder.UnitName + " - " + reminder.Data.Name}</Text>
                        <ComplexText fontSize={Variables.fontSize.normal} style={{marginLeft:10, marginRight:10}}>{reminder.Data.Description}</ComplexText></View>
                    )}
                    
                </View>;
    }

    ShowRule(rule:DescriptorData, index:number):ReactNode{
        return <View key={index} style={{marginBottom:10}}>
                    <Text style={{backgroundColor:this.context.Accent, fontFamily:Variables.fonts.spaceMarine, padding:5}}>{rule.Name}</Text>
                    <ComplexText fontSize={Variables.fontSize.normal} style={{marginLeft:10, marginRight:10}}>{rule.Description}</ComplexText>
                </View>;
    }

    render(){
        let menuContents;
        switch(this.state.MenuSection) {
            case RosterMenuCategories.UNIT_LIST:
                menuContents=
                   <ScrollView>
                        {Variables.unitCategories.map((category, index) => this.ShowCategory(category, index))}
                    </ScrollView>;
                    break;
            case RosterMenuCategories.RULES:
                menuContents=
                   <ScrollView>
                        {Roster.Instance.state.Rules.map((category, index) => this.ShowRule(category, index))}
                    </ScrollView>;
                    break;
            case RosterMenuCategories.REMINDERS:
                menuContents=
                    <ScrollView>
                         {[null, "Any", "Command", "Movement", "Shooting", "Charge", "Fight"].map((phase, index) => this.ShowRemindersFor(phase, index))}
                     </ScrollView>;
                    break;

        }
                
        return <View style={{width:Variables.width, alignSelf:"center", padding:10, height:"100%"}}>
                    <View style={{flexDirection: 'row', left:-4}}>
                        <Button key="main" style={{position:"absolute", right:44, top:-4}} onPress={(e)=>this.props.navigation.reset({index:0, routes:[{name:"Home"}]})}>Main Menu</Button>
                        <Button key="x" style={{position:"absolute", right:-4, top:-4}} onPress={(e)=>this.props.navigation.goBack()}>X</Button>
                        <Button key="list" tab={true} onPress={(e)=>this.setState({MenuSection:RosterMenuCategories.UNIT_LIST})} weight={this.state.MenuSection==RosterMenuCategories.UNIT_LIST?"heavy":"normal"}>Unit List</Button>
                        <Button key="rules" tab={true} onPress={(e)=>this.setState({MenuSection:RosterMenuCategories.RULES})} weight={this.state.MenuSection==RosterMenuCategories.RULES?"heavy":"normal"}>Rules</Button>
                        <Button key="remi" tab={true} onPress={(e)=>this.setState({MenuSection:RosterMenuCategories.REMINDERS})} weight={this.state.MenuSection==RosterMenuCategories.REMINDERS?"heavy":"normal"}>Reminders</Button>
                    </View>
                    <View style={{backgroundColor:this.context.Bg, top:-4, paddingTop:10, bottom:10, height:Variables.height - 52}}>
                        {menuContents}
                    </View>
        </View>;
    }

}

export default RosterMenu;