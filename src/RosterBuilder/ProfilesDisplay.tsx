import { Component, ReactNode } from "react";
import { View, Image } from "react-native";
import { Characteristic, ProfileData } from "./RosterSelectionData";
import Each from "../Components/Each";
import Text from "../Components/Text";
import { KameContext } from "../../Style/KameContext";
import Variables from "../Variables";

interface Props{
    Data:ProfilesDisplayData|Array<ProfilesDisplayData>
    DisplayName?:boolean
    Small?:boolean
    ForceNameSpace?:boolean
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
        const isModel = data.Characteristics.length===6;
        const name = / - /gi.test(data.Name)?/(?<= - ).*/gi.exec(data.Name):data.Name;
        const amount = data.Constraints.find(c=>c.Type==="min")?.Value;
        const fontSize = this.props.Small?Variables.fontSize.small:Variables.fontSize.normal;
        const imageSize = this.props.Small?12:16;
        const spacing = this.props.Small?6:8;
        const boxStyle={
            width:this.props.Small?25:30, 
            height:this.props.Small?20:30, 
            marginTop:4,
            marginBottom:4
        };
        const borderStyle={
            borderWidth:1, 
            borderColor:this.context.Dark, 
            borderRadius:Variables.boxBorderRadius, 
        }

        if(data.Characteristics.length===1){
            return <View key={index} style={{flexDirection:"row"}}>
                <View key="name" style={[boxStyle, {width:"auto"}]}>
                    <Text>{data.Characteristics[0].Value}</Text>
                </View>
            </View>
        }

        let profile = new Array<ReactNode>();
        let characteristics = [...data.Characteristics];
        let weaponKeywords = characteristics.splice(6).filter(c=>!c.Value||c.Value.trim() !== "-");

        profile.push(<View key="name" style={[boxStyle, {width:"auto"}]}>
            <Text style={{minWidth:(!(this.props.DisplayName||prefix)&&!this.props.ForceNameSpace)?0:(this.props.Small?110:150), textAlign:"right", fontSize:fontSize, paddingRight:spacing}} >
                {prefix&&prefix}{(this.props.DisplayName||prefix)&&name}{(amount&&Number(amount)>1)&&amount+"x"}
            </Text>
        </View>);

        Each<Characteristic>(characteristics, (characteristic, index)=>{
            let item;
            if(/^melee$/gi.test(characteristic.Value)) {
                item= <Image style={{tintColor:this.context.Dark, height:imageSize, width:imageSize, alignSelf:"center"}} source={require("../../assets/images/melee.png")}/>;
            } else {
                item = <Text style={{fontSize:fontSize}}>{characteristic.Value}</Text>;
            }
            profile.push(<View key={index} style={[boxStyle, borderStyle, {alignItems:"center", justifyContent:"center"}]}>
                    {isModel&&<Text style={{position:"absolute"}}>{characteristic.Name}</Text>}
                    {item}
                </View>);
        });

        if(weaponKeywords.length !== 0) {
            profile.push(<View key="keywords" style={[boxStyle, {width:"auto", flexShrink:1}]}><Text style={{fontSize:fontSize, paddingLeft:spacing}}>{weaponKeywords.map(c=>c.Value).join(", ")}</Text></View>);
        }

        return <View key={index} style={{flexDirection:"row"}}>
                {profile}
            </View>;
    }

    render() {
        if(this.props.Data instanceof ProfilesDisplayData){
            let profiles = new Array<ReactNode>();
            if(this.props.Data.Profiles.length===1){
                profiles.push(this.DisplayProfile(this.props.Data.Profiles[0]));
            } else {
                Each<ProfileData>(this.props.Data.Profiles, (profile, index)=>{
                    profiles.push(this.DisplayProfile(profile, index, "➤ "));
                });
            }
            return <View>
                {profiles}
            </View>;
        } else {
            let data = new Array<ReactNode>();
            Each<ProfilesDisplayData>(this.props.Data, (displayData, index)=>{
                data.push(<ProfilesDisplay Data={displayData} key={index} Small={this.props.Small} DisplayName={this.props.DisplayName} ForceNameSpace />);
            });
            return <View>{data}</View>;
        }
    }
}