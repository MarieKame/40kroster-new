import { Component } from "react";
import { Stratagem } from "../RosterView/Stratagems";
import { KameContext } from "../../Style/KameContext";
import { View, Image } from "react-native";
import Text, { ComplexText } from "../Components/Text";
import React from "react";
import Variables from "../Variables";
import { Background } from "../../Style/svgs";

interface Props {
    Stratagem:Stratagem;
    Index:number;
}

export default class ProfilesDisplay extends Component<Props>{
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;

    ShowStratagemSection(name:string, text:string) {
        return <View key={name} style={{flexDirection:"row", flexWrap:"wrap", paddingLeft:10}}>
            <Text key="name"style={{fontFamily:Variables.fonts.WHB}}></Text>
            <ComplexText key="text" fontSize={Variables.fontSize.normal} boldFirstWord={name+": "}>{text}</ComplexText>
        </View>;
    }

    render(){
        function getPhases(stratagem:Stratagem){
            return stratagem.Phases.concat([stratagem.CP]);
        }
        return <View key={this.props.Index} style={{width:"100%", paddingLeft:40, paddingRight:16, paddingBottom:20, paddingTop:6}}>
                <Text key="name" style={{width:"100%", borderBottomWidth:2, borderColor:this.context.Main, fontFamily:Variables.fonts.spaceMarine, padding:5, marginBottom:4}}>
                    {
                    this.props.Stratagem.Name}
                </Text>
                {
                this.props.Stratagem.Flavor&&<Text key="flavor" style={{minHeight:30, fontFamily:Variables.fonts.WHI, padding:5, marginBottom:4, paddingLeft:20, fontSize:Variables.fontSize.small}}>— 
                    {this.props.Stratagem.Flavor}
                </Text>}
                {this.ShowStratagemSection("When", this.props.Stratagem.When)}
                {this.props.Stratagem.Target&&this.ShowStratagemSection("Target", this.props.Stratagem.Target)}
                {this.ShowStratagemSection("Effect", this.props.Stratagem.Effect)}
                {this.props.Stratagem.Restrictions&&this.ShowStratagemSection("Restrictions", this.props.Stratagem.Restrictions)}
                <View key="bar" style={{position:"absolute", height:"100%", backgroundColor:this.context.Main, top:10, width:15, left:15}}>
                    {getPhases(this.props.Stratagem).map((phase, index)=> {
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
            </View>;
    }
}