import React, { ReactNode } from "react";
import {View, Image} from 'react-native';
import Text, { Descriptor } from '../Components/Text';
import {ProfileWeaponData, WeaponData} from "./UnitData";
import Style from '../../Style/Weapon';
import IsOdd from "../Components/IsOdd";
import { KameContext } from "../../Style/KameContext";
import Variables from "../Variables";

interface Props {
    data:WeaponData,
    isOdd:IsOdd,
    prefix?:string
}

class Weapon extends React.Component<Props> {
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;

    RenderProfile(name:string, data:WeaponData, isOdd:boolean=null):ReactNode {
        return <View key={name} style={((isOdd!==null&&isOdd)||(isOdd===null && this.props.isOdd.Get()))?[Style.info, Style.odd, {backgroundColor:this.context.LightAccent}]:Style.info}>
            <Descriptor style={Style.name}>
                {this.props.prefix&&"("+this.props.prefix+") "}{name + " "}
            {data.Traits().length>0&&<Text style={[Style.traits, {color:this.context.Main}]}>[
                {" "+data.Traits().join(', ')+" "}
            ]</Text>}
            </Descriptor>
            
            <View style={Style.stats}>
                {data.Range()=="Melee"?
                    <View style={Style.statData}>
                        <Image tintColor={this.context.Dark} style={[Style.melee]} source={require("../../assets/images/melee.png")}/>
                    </View> :
                    <Text style={Style.statData}>{data.Range()}</Text>
                }
                <Text style={Style.statData}>{data.A()}</Text>
                <Text style={Style.statData}>{data.BS()}</Text>
                <Text style={Style.statData}>{data.S()}</Text>
                <Text style={Style.statData}>{data.AP()}</Text>
                <Text style={Style.statData}>{data.D()}</Text>
            </View>
        </View>;
    }

    render(){
        if (this.props.data instanceof ProfileWeaponData) {
            return <View style={{flexDirection:"row"}}>
                <View style={{flexDirection:"column", width:0, justifyContent:"center"}}>
                    <View style={{
                        position:"absolute", 
                        height:"100%", 
                        width:28, 
                        marginLeft:5,
                        backgroundColor:this.context.LightAccent, 
                        justifyContent:"center", 
                        alignItems:"center", 
                        borderLeftColor:this.context.Dark, 
                        borderLeftWidth:1, 
                        borderRadius:Variables.boxBorderRadius}}>
                        <Text>{this.props.data.Count()}x</Text>
                    </View>
                </View>
                <View style={{flexDirection:"column", flex:1}}>
                    {this.props.data.Profiles.map(p=>this.RenderProfile("➤ " + this.props.data.Name() + " - " + p.Name(), p))}
                </View>
            </View>
        } else {
            const isOdd = this.props.isOdd.Get();
            return <View style={{flexDirection:"row"}}>
                <View style={{flexDirection:"column", width:0, justifyContent:"center"}}>
                    <View style={{
                        position:"absolute", 
                        height:"100%", 
                        width:28, 
                        marginLeft:5,
                        backgroundColor:isOdd?this.context.LightAccent:null, 
                        justifyContent:"center", 
                        alignItems:"center"}}> 
                        <Text>{this.props.data.Count()}x</Text>
                    </View>
                </View>
                <View style={{flexDirection:"column", flex:1}}>
                    {this.RenderProfile(this.props.data.Name(), this.props.data, isOdd)}
                </View>
            </View>
        }
    }
}

export default Weapon;