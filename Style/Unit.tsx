
import { StyleSheet } from "react-native";
import React from "react";
import Variables from "./Variables";
import {ColoursContext} from "./ColoursContext";

const Style = StyleSheet.create({
    unit: {
        borderWidth: Variables.boxBorderWidth,
        borderRadius: Variables.boxBorderRadius,
        padding:10 * Variables.zoom,
        width:Variables.unitWidth,
        zIndex:10 * Variables.zoom,
        alignSelf:"center",
        marginBottom:20,
    },
    nameView:{
        flexDirection:"row"
    },
    name:{
        fontSize:Variables.fontSize.big
    },

    statsNameView:{
        top:2 * Variables.zoom,
        height:36 * Variables.zoom,
        alignContent:"center",
        justifyContent:"center"
    },
    statsName:{
        position:"absolute",
        left:-310 * Variables.zoom,
        paddingLeft:304 * Variables.zoom,
        paddingRight:20 * Variables.zoom
    },
    allStats:{
        minHeight:60 * Variables.zoom
    },
    statsRow:{
        flexDirection:"row",
        height:36 * Variables.zoom
    },
    box:{
        margin:6 * Variables.zoom,
        marginRight: 10 * Variables.zoom,
        textAlign: "center",
        position: "relative",
        width: 34 * Variables.zoom,
        height: 30 * Variables.zoom,
        alignItems:"center",
        justifyContent:"center",
        zIndex:1,
        borderWidth: Variables.boxBorderWidth,
        borderRadius: Variables.boxBorderRadius
    },
    invul:{
        position: "relative",
        left:100 * Variables.zoom,
        width:34 * Variables.zoom,
        height: 30 * Variables.zoom,
    },
    invulText:{
        position:"absolute",
        width:150 * Variables.zoom,
        left:33 * Variables.zoom,
        paddingLeft:6 * Variables.zoom
        
    },
    headerView:{
        position:"absolute",
        top:-8 * Variables.zoom,
        zIndex:10 * Variables.zoom,
        width:40 * Variables.zoom,
        alignItems:"center"
    },
    header:{
        paddingLeft:4 * Variables.zoom,
        paddingRight:4 * Variables.zoom,
        textAlign: "center",
        borderRadius: Variables.boxBorderRadius,
    },
    value:{
        flexDirection:"row",
        textAlign: "center",
        width: "100%"
    },
    weaponSectionTitle:{
        flexDirection:"row",
        height:16 * Variables.zoom,
        alignItems:"center"
    },
    weaponList:{
        marginTop:4 * Variables.zoom
    },
    weaponLine:{
        alignSelf: 'stretch',
        flexDirection:"row",
    },
    statsBar:{
        flexDirection:"row",
        position:"absolute",
        right:0
    },
    specialEquipment:{},
    title:{
        lineHeight:16,
        paddingLeft:4*Variables.zoom,
        alignSelf: 'stretch',
        fontFamily:Variables.fonts.spaceMarine
    },
    subtitle:{
        marginTop:4 * Variables.zoom,
        margin:2*Variables.zoom
    },
    description:{
        fontSize:Variables.fontSize.small
    },
    
    weapons:{},
    details:{},
    other:{
        marginTop:4*Variables.zoom
    },
    rule:{
        flexBasis:"50%",
        padding:4 * Variables.zoom
    },
    ruleTitle:{
        paddingLeft:4*Variables.zoom
    },
    more:{
        marginLeft:8*Variables.zoom
    },
    keywordsView:{
        flexDirection:"row",
        height:40*Variables.zoom,
        marginTop:8*Variables.zoom
    },
    keywords:{
        flexBasis:"60%",
        paddingRight:24*Variables.zoom,
        flexWrap:"wrap"
    },
    factions:{
        position:"absolute",
        right:-10,
        paddingLeft:28,
        paddingRight:10,
        width:"43%",
        height:40*Variables.zoom,
        borderTopWidth:1,
        borderBottomWidth:1,
    },
    keywordsTitle:{
        fontFamily:Variables.fonts.WHB,
        fontSize:Variables.fontSize.small
    },
    keyword:{
        fontSize:Variables.fontSize.small
    },
    bold:{
        fontFamily:Variables.fonts.WHN,
        fontSize:Variables.fontSize.small
    },
    icon:{
        position:"absolute",
        right:"35%",
        marginLeft:-50,
        height:50,
        width:50,
    }
});

export default Style;