import React from "react";
import {View, Image} from 'react-native';
import Text, { Descriptor } from '../Components/Text';
import {ProfileWeaponData, WeaponData} from "./UnitData";
import Style from '../../Style/Weapon';
import IsOdd from "../Components/IsOdd";
import { KameContext } from "../../Style/KameContext";

interface Props {
    data:WeaponData,
    showQuantity:boolean,
    isOdd:IsOdd,
    forceName?:string,
    profileQtt?:number,
    Style?,
    prefix?:string
}

function getWeaponTraits(weapon:WeaponData){
    return weapon._Traits
}

class InternalWeapon extends React.Component<Props> {
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;
    render() {
        let name = this.props.forceName?this.props.forceName:this.props.data.Name;
        let weaponTraits;
        if (this.props.data.Traits().length > 0) {
            weaponTraits = <Text style={[Style.traits, {color:this.context.Main}]}>[
                {" "+this.props.data.Traits().join(', ')+" "}
            ]</Text>;
        }
        let addProfileQtt;
        if (this.props.profileQtt && this.props.profileQtt !== 0) {
            let style = Style.quantity2;
            if (this.props.profileQtt === 3) {
                style = Style.quantity3;
            }
            addProfileQtt = <Text style={[style, Style.moreThanOne, {backgroundColor:this.context.LightAccent, borderColor:this.context.Dark}]}>{this.props.data.Count+"x"}</Text>
        }
        let qtt;
        if (this.props.showQuantity){
            qtt = <Text style={Style.quantity1}>{this.props.data.Count+"x"}</Text>
        } else {
            qtt = <Text style={Style.quantity1}> </Text>
        }
        return <View style={this.props.isOdd.Get()?[Style.info, Style.odd, {backgroundColor:this.context.LightAccent}]:Style.info}>
            {qtt}
            {addProfileQtt}
            <Descriptor style={this.props.forceName?[Style.name, Style.profile]:Style.name}>{(this.props.forceName?"➤ ":"")+(this.props.prefix?"("+this.props.prefix+") ":"")+name + " "}{weaponTraits}</Descriptor>
            
            <View style={Style.stats}>
                {this.props.data.Range()=="Melee"?<View style={Style.statData}><Image style={[Style.melee, {tintColor:this.context.Dark}]} source={require("../../assets/images/melee.png")}/></View>:<Text style={Style.statData}>{this.props.data.Range()}</Text>}
                <Text style={Style.statData}>{this.props.data.A()}</Text>
                <Text style={Style.statData}>{this.props.data.BS()}</Text>
                <Text style={Style.statData}>{this.props.data.S()}</Text>
                <Text style={Style.statData}>{this.props.data.AP()}</Text>
                <Text style={Style.statData}>{this.props.data.D()}</Text>
            </View>
        </View>;
    }
}

class InternalProfileWeapon extends React.Component<Props> {
    render() {
        let key=0;
        let data:ProfileWeaponData;
        if (this.props.data instanceof ProfileWeaponData) {
            data = this.props.data;
        }
        return data.Profiles.map((profile, index) => 
            <InternalWeapon data={profile} showQuantity={false} forceName={data.Name + " - " + profile.Name} profileQtt={index==0?data.Profiles.length:0} key={key++} isOdd={this.props.isOdd} prefix={this.props.prefix}/>
        );
    }
}

class Weapon extends React.Component<Props> {
    render(){
        let weapon = this.props.data;
        if (!weapon.Traits){
            // @ts-ignore
            if (this.props.data.Profiles) {
                // @ts-ignore
                weapon = new ProfileWeaponData(this.props.data.Profiles.map(profile=>new WeaponData(profile.Data, profile.Count, profile.Name)), this.props.data.Count, this.props.data.Name);
            } else {
                weapon = new WeaponData(this.props.data.Data, this.props.data.Count, this.props.data.Name);
            }
        }
        if (weapon instanceof ProfileWeaponData) {
            return <InternalProfileWeapon data={weapon} showQuantity={this.props.showQuantity} Style={this.props.Style} isOdd={this.props.isOdd} prefix={this.props.prefix} />
        } else {
            return <InternalWeapon data={weapon} showQuantity={this.props.showQuantity} Style={this.props.Style} isOdd={this.props.isOdd} prefix={this.props.prefix} />
        }
    }
}

export default Weapon;