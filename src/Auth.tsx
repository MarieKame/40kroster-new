import React from "react";
import { KameContext } from "../Style/KameContext";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, UserCredential, updateProfile } from "firebase/auth";
import Variables from "./Variables";
import { TextInput, View } from "react-native";
import Text from "./Components/Text";
import Button from "./Components/Button";
import {auth} from "../firebase.config";

interface props{
    Close:(loggedIn:boolean)=>void;
}

export default class Auth extends React.Component<props> {
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;

    state = {
        email:"sammy.bessette@gmail.com",
        password:"AutrucheKanna1",
        displayName:Variables.username
    }

    Login() {
        signInWithEmailAndPassword(auth, this.state.email, this.state.password).then((userCredential:UserCredential) => {
            Variables.LoggedUser = userCredential.user;
            Variables.username = userCredential.user.displayName;
            this.props.Close(true);
          })
    }

    CreateUser() {
        createUserWithEmailAndPassword(auth, this.state.email, this.state.password).then((userCredential:UserCredential) => {
            updateProfile(auth.currentUser, {displayName:this.state.displayName});
            Variables.LoggedUser = userCredential.user;
            Variables.LoggedUser.displayName = this.state.displayName;
            this.props.Close(true);
          })
    }

    render(){
        return <View style={{height:Variables.height, width:Variables.width, position:"absolute", backgroundColor:"rgba(0,0,0,0.6)", justifyContent: 'center', alignItems: 'center'}}>
            <View style={{backgroundColor:this.context.Bg, position:"absolute", padding:10, borderColor:this.context.Accent, borderWidth:1, borderRadius:Variables.boxBorderRadius, width:"60%"}}>
                <View style={{padding:20}}>
                    <Button key="x" style={{position:"absolute", top:0, right:0}} onPress={()=>this.props.Close(false)}>X</Button>
                    <View key="fields" style={{padding:40}}>
                        <View key="name" style={{flexDirection:"row"}}>
                            <Text key="textField" style={{fontSize:Variables.fontSize.normal, margin:10, width:"30%", textAlign:"right"}}>Name : </Text>
                            <TextInput key="input" value={this.state.displayName} 
                                onChangeText={(text)=>{this.setState({displayName:text})}} 
                                style={{backgroundColor:"white", height:24, alignSelf:"center", width:"70%"}}/>
                        </View>
                        <View key="email" style={{flexDirection:"row"}}>
                            <Text key="textField" style={{fontSize:Variables.fontSize.normal, margin:10, width:"30%", textAlign:"right"}}>Email : </Text>
                            <TextInput key="input" value={this.state.email} 
                                onChangeText={(text)=>{this.setState({email:text})}} 
                                style={{backgroundColor:"white", height:24, alignSelf:"center", width:"70%"}}/>
                        </View>
                        <View key="password" style={{flexDirection:"row"}}>
                            <Text key="textField" style={{fontSize:Variables.fontSize.normal, margin:10, width:"30%", textAlign:"right"}}>Password : </Text>
                            <TextInput key="input" value={this.state.password} secureTextEntry
                                onChangeText={(text)=>{this.setState({password:text})}} 
                                style={{backgroundColor:"white", height:24, alignSelf:"center", width:"70%"}}/>
                        </View>
                    </View>
                    <View key="buttons" style={{flexDirection:"row", alignSelf:"center"}}>
                        <Button disabled={this.state.email==="" || this.state.password===""} onPress={()=>this.Login()}>Login</Button>
                        <Button disabled={this.state.displayName==="" || this.state.email==="" || this.state.password===""} onPress={()=>this.CreateUser()}>Create Account</Button>
                    </View>
                </View>
            </View>
        </View>;
    }
}