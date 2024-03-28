import { StyleSheet } from "react-native";
import Variables from "../src/Variables";

const Style = StyleSheet.create({
    info:{
        flexDirection:"row",
        marginLeft:28,
        paddingLeft:4
    },
    moreThanOne:{
        position:"absolute",
        zIndex:10,
        width:28 * Variables.zoom,
        textAlign:"center",
        borderLeftWidth:1,
        borderTopLeftRadius:Variables.boxBorderRadius,
        borderBottomLeftRadius:Variables.boxBorderRadius
    },
    quantity2:{
        height:31 * Variables.zoom,
        paddingTop:6 * Variables.zoom
    },
    quantity3:{
        height:32 * Variables.zoom,
        paddingTop:6 * Variables.zoom
    },
    name:{
        marginLeft:4 * Variables.zoom,
        maxWidth:Variables.unitWidth-286,
    },
    melee:{
        height:10*Variables.zoom,
        width:10*Variables.zoom,
        alignSelf:"center",
        marginTop:2*Variables.zoom
    },
    traits:{
        fontFamily:Variables.fonts.WHI,
        fontSize:Variables.fontSize.small,
        alignSelf:"center",
        paddingLeft:4,
    },
    stats:{
        position:"absolute",
        right:0,
        flexDirection:"row"
    },
    statData:{
        alignContent:"center",
        textAlign:"center",
        borderLeftWidth:1,
        borderStyle:"dotted",
        width:32 * Variables.zoom
    },
    odd:{
        zIndex:-1
    },
});

export default Style;