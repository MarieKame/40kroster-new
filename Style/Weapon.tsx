import { StyleSheet } from "react-native";
import Variables from "./Variables";

const Style = StyleSheet.create({
    info:{
        flexDirection:"row",
        marginLeft:4
    },
    moreThanOne:{
        position:"absolute",
        zIndex:10,
        backgroundColor:Variables.colourLightAccent,
        width:22 * Variables.zoom,
        textAlign:"center",
        borderLeftWidth:1,
        borderTopLeftRadius:Variables.boxBorderRadius,
        borderBottomLeftRadius:Variables.boxBorderRadius,
        borderColor:Variables.colourDark
    },
    quantity1:{
        width:22 * Variables.zoom,
        textAlign:"center"
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
    traits:{
        color:Variables.colourMain,
        fontFamily:Variables.fonts.WHB,
        fontSize:10 * Variables.zoom,
        alignSelf:"center",
        paddingLeft:4
    },
    stats:{
        position:"absolute",
        right:0,
        flexDirection:"row"
    },
    data:{
        alignContent:"center",
        textAlign:"center",
        borderLeftWidth:1,
        borderStyle:"dotted"
    },
    range:{
        width:60 * Variables.zoom
    },
    other:{
        width:36 * Variables.zoom
    },
    profile:{},
    odd:{
        backgroundColor:Variables.colourLightAccent,
        zIndex:-1
    },
});

export default Style;