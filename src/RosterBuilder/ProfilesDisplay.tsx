import { Component, ReactNode } from "react";
import { StyleProp, View, ViewStyle, Image } from "react-native"
import { Characteristic, ProfileData } from "./RosterSelectionData";
import Each from "../Components/Each";
import Text from "../Components/Text";
import { KameContext } from "../../Style/KameContext";
import Variables from "../Variables";
import React from "react";

interface Props{
    Data:ProfilesDisplayData|Array<ProfilesDisplayData>
    DisplayName?:boolean
    Small?:boolean
    ForceNameSpace?:boolean
    Disabled?:boolean
    OnlyDisplayFirst?:boolean
    Style?:StyleProp<ViewStyle>
}

export class ProfilesDisplayData {
    Profiles:Array<ProfileData>;

    constructor(profiles:Array<ProfileData>) {
        this.Profiles = profiles;
    }
}

export default class ProfilesDisplay extends Component<Props>{
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;

    DisplayProfile(data:ProfileData, index:number=0, prefix?:string):ReactNode {
        const name = / - /gi.test(data.Name)?/(?<= - ).*/gi.exec(data.Name):data.Name;
        const amount = data.Constraints.find(c=>c.Type==="min")?.Value;
        const fontSize = this.props.Small?Variables.fontSize.small:Variables.fontSize.normal;
        const imageSize = (this.props.Small?12:16) * Variables.zoom;
        const spacing = (this.props.Small?6:8) * Variables.zoom;
        const boxStyle={
            width:(this.props.Small?26:30) * Variables.zoom, 
            height:(this.props.Small?20:30) * Variables.zoom, 
            marginTop:4,
            marginBottom:4,
            backgroundColor:this.props.Small?null:this.context.LightAccent
        };
        const borderStyle={
            borderWidth:1, 
            borderColor:this.context.Dark, 
            borderRadius:Variables.boxBorderRadius, 
        }

        if(data.Characteristics.length===1){
            return <View key={index} style={{opacity:this.props.Disabled?0.5:1, height:"auto"}}>
                <View key="name" style={[boxStyle, {width:"auto", height:"auto"}]}>
                    <Text>{data.Characteristics[0].Value}</Text>
                </View>
            </View>
        }

        let profile = new Array<ReactNode>();
        let characteristics = [...data.Characteristics];
        let weaponKeywords = characteristics.splice(6).filter(c=>!c.Value||c.Value.trim() !== "-");

        profile.push(<View key="name" style={[boxStyle, {width:"auto", justifyContent:"center", height:"auto"}]}>
            <Text style={{width:this.props.OnlyDisplayFirst?0:((this.props.Small||!this.props.DisplayName)?30:150)*Variables.zoom, textAlign:"right", fontSize:fontSize, paddingRight:spacing}} >
                {prefix&&prefix}{(this.props.DisplayName&&!this.props.Small)&&" "+name}{(amount&&Number(amount)>1)&&amount+"x"}
            </Text>
        </View>);

        Each<Characteristic>(characteristics, (characteristic, index)=>{
            let item;
            if(/^melee$/gi.test(characteristic.Value)) {
                item= <Image style={{tintColor:this.context.Dark, height:imageSize, width:imageSize, alignSelf:"center"}} source={require("../../assets/images/melee.png")}/>;
            } else {
                item = <Text style={{fontSize:fontSize}}>{characteristic.Value}</Text>;
            }
            profile.push(<View key={index} style={[boxStyle,{height:"auto"}]}>
                <View style={[boxStyle, borderStyle, {alignItems:"center", justifyContent:"center"}]}>
                    {(!this.props.Small&&!/range/gi.test(characteristic.Name))&&
                        <Text style={{
                            position:"absolute", 
                            top:-10, 
                            backgroundColor:this.context.LightAccent, 
                            width:20*Variables.zoom, 
                            borderRadius:Variables.boxBorderRadius,
                            textAlign:"center"}}>
                                {characteristic.Name}
                        </Text>
                    }
                    {item}
                </View>
            </View>);
        });

        if(weaponKeywords.length !== 0) {
            profile.push(<View key="keywords" style={[boxStyle, {height:"auto", flex:0, flexGrow:1}]}><Text style={{fontSize:fontSize, paddingLeft:spacing}}>{weaponKeywords.map(c=>c.Value).join(", ")}</Text></View>);
        }
        profile.push(<View key="spacing" style={[boxStyle, {width:spacing, height:"auto"}]}></View>)

        return <View key={index} style={{flexDirection:"row", opacity:this.props.Disabled?0.5:1, height:"auto"}}>
                {profile}
            </View>;
    }

    render() {
        let data = new Array<ReactNode>();
        if(this.props.Data instanceof ProfilesDisplayData){
            if(this.props.Data.Profiles.length===1){
                data.push(this.DisplayProfile(this.props.Data.Profiles[0]));
            } else if (this.props.OnlyDisplayFirst){
                data.push(this.DisplayProfile(this.props.Data.Profiles.find(p=>p.Characteristics.length>1)));
            } else {
                Each<ProfileData>(this.props.Data.Profiles, (profile, index)=>{
                    data.push(this.DisplayProfile(profile, index, "➤"));
                });
            }
        } else {
            Each<ProfilesDisplayData>(this.props.Data, (displayData, index)=>{
                data.push(<ProfilesDisplay Data={displayData} key={index} Small={this.props.Small} DisplayName={this.props.DisplayName} ForceNameSpace />);
            });
        }
        return <View style={[this.props.Style, {height:"auto", paddingBottom:this.props.Small?0:4, paddingTop:this.props.Small?0:4}]}>
            {data}
        </View>;
    }
}