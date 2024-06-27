import React, { Component, ReactNode } from "react";
import { KameContext } from "../../Style/KameContext";
import { ScrollView, View, Image } from "react-native";
import Variables from "../Variables";
import Roster from "./Roster";
import Button from "../Components/Button";
import Text, { ComplexText } from "../Components/Text";
import { Background } from "../../Style/svgs";
import { CORE_STRATAGEMS, Stratagem } from "./Stratagems";
import MasonryList from '@react-native-seoul/masonry-list';
import { GestureHandlerRootView, PanGestureHandler } from "react-native-gesture-handler";
import { DescriptorRaw, RuleDataRaw } from "../Roster/RosterRaw";

enum RosterMenuCategories {
    UNIT_LIST, RULES, REMINDERS, STRATAGEMS, CORE
}

interface Props {
    navigation:{reset, goBack}
}

class RosterMenu extends Component<Props> {
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;

    state = {
        MenuSection:RosterMenuCategories.UNIT_LIST,
        gesture:false
    }

    ShowStratagemSection(name:string, text:string) {
        return <View key={name} style={{flexDirection:"row", flexWrap:"wrap", paddingLeft:10}}>
            <Text key="name"style={{fontFamily:Variables.fonts.WHB}}></Text>
            <ComplexText key="text" fontSize={Variables.fontSize.normal} boldFirstWord={name+": "}>{text}</ComplexText>
        </View>;
    }

    ShowStratagems(stratagems:Array<Stratagem>) {
        function getPhases(stratagem:Stratagem){
            return stratagem.Phases.concat([stratagem.CP]);
        }
        return <MasonryList style={{margin:6, flexGrow:0}} numColumns={2} data={stratagems} renderItem={(stratagem)=>
            <View key={stratagem.i} style={{width:"100%", paddingLeft:40, paddingRight:16, paddingBottom:20, paddingTop:6}}>
                <Text key="name" style={{width:"100%", borderBottomWidth:2, borderColor:this.context.Main, fontFamily:Variables.fonts.spaceMarine, padding:5, marginBottom:4}}>
                    {// @ts-ignore
                    stratagem.item.Name}
                </Text>
                {// @ts-ignore
                stratagem.item.Flavor&&<Text key="flavor" style={{minHeight:30, fontFamily:Variables.fonts.WHI, padding:5, marginBottom:4, paddingLeft:20, fontSize:Variables.fontSize.small}}>— 
                    {// @ts-ignore
                    stratagem.item.Flavor}
                </Text>}
                {// @ts-ignore
                        this.ShowStratagemSection("When", stratagem.item.When)}
                {// @ts-ignore
                        stratagem.item.Target&&this.ShowStratagemSection("Target", stratagem.item.Target)}
                {// @ts-ignore
                        this.ShowStratagemSection("Effect", stratagem.item.Effect)}
                {// @ts-ignore
                        stratagem.item.Restrictions&&this.ShowStratagemSection("Restrictions", stratagem.item.Restrictions)}
                <View key="bar" style={{position:"absolute", height:"100%", backgroundColor:this.context.Main, top:10, width:15, left:15}}>
                    {// @ts-ignore
                        getPhases(stratagem.item).map((phase, index)=> {
                            let content;
                            const imageStyle={width:24, height:24, top:2+(30*index), left:-5};
                            switch(phase) {
                                case "Any":
                                    content = <Image style={imageStyle} tintColor={this.context.Dark} source={require("../../assets/images/stratAny.png")}/>;
                                    break;
                                case "Command":
                                    content = <Image style={imageStyle} tintColor={this.context.Dark} source={require("../../assets/images/stratCommand.png")}/>;
                                    break;
                                case "Movement":
                                    content = <Image style={imageStyle} tintColor={this.context.Dark} source={require("../../assets/images/stratMovement.png")}/>;
                                    break;
                                case "Shooting":
                                    content = <Image style={imageStyle} tintColor={this.context.Dark} source={require("../../assets/images/stratShooting.png")}/>;
                                    break;
                                case "Charge":
                                    content = <Image style={imageStyle} tintColor={this.context.Dark} source={require("../../assets/images/stratCharge.png")}/>;
                                    break;
                                case "Fight":
                                    content = <Image style={imageStyle} tintColor={this.context.Dark} source={require("../../assets/images/stratFight.png")} />;
                                    break;
                                default:
                                    content=<Text key="value" style={{position:"absolute", width:40, left:-13, top:(8+ (30*index)), textAlign:"center"}}>{phase} CP</Text>
                                    break;
                            }
                            return <View key={index}><Background key="bg" style={{position:"absolute", left:-18, top:(-10 + (30*index)), width:10}} scale={0.9} />{content}</View>;
                            }

                        )
                    }
                </View>
            </View>}
        />
    }

    ShowCategory(category:string, index:string):ReactNode {

        if (Roster.Instance.state.Units.filter((unit)=> unit.GetUnitCategory() == category).length == 0) return "";
        return <View style={{paddingBottom:14}} key={index}>
            <Text style={{width:"100%", textAlign:"center", fontFamily:Variables.fonts.spaceMarine, paddingBottom:4}}>— {category} —</Text>
            <View style={{flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', width:"100%"}}>
                {Roster.Instance.state.Units.map((unit, index) => 
                    (unit.GetUnitCategory() == category && Roster.Instance.state.UnitsToSkip.indexOf(index)==-1)&&
                        <View key={unit.Name()+index+Roster.Instance.props.Data.Name} style={{width:"50%"}}>
                            <Button 
                                onPress={(e)=>{
                                    Roster.Instance.DisplayUnit(index);
                                    this.props.navigation.goBack();
                                }} weight={(index==Roster.Instance.state.CurrentUnit)?"heavy":"normal"}>
                                    {unit.CustomName()?unit.CustomName():unit.Name()}{unit.Count>1?" (x"+unit.Count+")":""}
                            </Button>
                        </View>
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
                        <ComplexText fontSize={Variables.fontSize.normal} style={{marginLeft:10, marginRight:10}}>{reminder.Data.Value}</ComplexText></View>
                    )}
                    
                </View>;
    }

    ShowRule(rule:RuleDataRaw, index:number):ReactNode{
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
                        {Variables.unitCategories.map((category, index) => this.ShowCategory(category, index+category))}
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
            case RosterMenuCategories.STRATAGEMS:
                menuContents= this.ShowStratagems(Roster.Instance.state.DetachmentStratagems);
                    break;
            case RosterMenuCategories.CORE:
                menuContents= this.ShowStratagems(CORE_STRATAGEMS);
                    break;

        }
                
        return <GestureHandlerRootView><PanGestureHandler minPointers={2} onEnded={e=>
            // @ts-ignore
        {if(e.nativeEvent.translationY > 100){this.props.navigation.goBack()}}}><View style={{width:Variables.width, alignSelf:"center", padding:10, height:"100%"}}>
            
                    <View style={{flexDirection: 'row', left:-4}}>
                        <Button key="main" style={{position:"absolute", right:44, top:-4}} onPress={(e)=>this.props.navigation.reset({index:0, routes:[{name:"Home"}]})}>Main Menu</Button>
                        <Button key="x" style={{position:"absolute", right:-4, top:-4}} onPress={(e)=>this.props.navigation.goBack()}>X</Button>
                        <Button key="list" tab={true} onPress={(e)=>this.setState({MenuSection:RosterMenuCategories.UNIT_LIST})} weight={this.state.MenuSection==RosterMenuCategories.UNIT_LIST?"heavy":"normal"}>Unit List</Button>
                        <Button key="rules" tab={true} onPress={(e)=>this.setState({MenuSection:RosterMenuCategories.RULES})} weight={this.state.MenuSection==RosterMenuCategories.RULES?"heavy":"normal"}>Rules</Button>
                        <Button key="remi" tab={true} onPress={(e)=>this.setState({MenuSection:RosterMenuCategories.REMINDERS})} weight={this.state.MenuSection==RosterMenuCategories.REMINDERS?"heavy":"normal"}>Reminders</Button>
                        {Roster.Instance&&Roster.Instance.state.DetachmentStratagems.length>0&&<Button key="strat" tab={true} onPress={(e)=>this.setState({MenuSection:RosterMenuCategories.STRATAGEMS})} weight={this.state.MenuSection==RosterMenuCategories.STRATAGEMS?"heavy":"normal"}>Stratagems</Button>}
                        <Button key="core" tab={true} onPress={(e)=>this.setState({MenuSection:RosterMenuCategories.CORE})} weight={this.state.MenuSection==RosterMenuCategories.CORE?"heavy":"normal"}>Core</Button>
                    </View>
                    <View key={
                        this.state.MenuSection + 
                        Roster.Instance.props.Data.Name + 
                        Roster.Instance.props.Data.Units.length + 
                        Roster.Instance.state.CurrentUnit
                        } style={{backgroundColor:this.context.Bg, top:-4, paddingTop:10, bottom:10, height:Variables.height - 52}}>
                            {menuContents}
                    </View>
        </View></PanGestureHandler></GestureHandlerRootView>;
    }

}

export default RosterMenu;