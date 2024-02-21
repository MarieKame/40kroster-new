import { Dimensions, Platform } from "react-native";

const windowDimensions = Dimensions.get('window');
const zoom = Platform.OS=="web"? 1.3:1;
const baseUnitMargin = 16;
const Variables = {
    boxBorder:"solid 1px",
    boxBorderStyle:"solid",
    boxBorderWidth:1,
    boxBorderRadius:4,
    colourDark:"black",
    colourBg:"white",
    colourAccent:"pink",
    colourLightAccent:"rgb(252, 233, 236)",
    colourMain:"red",
    fonts:{
        spaceMarine:'Space-Marine',
        WHN: 'Warhammer-Normal',
        WHI: 'Warhammer-Italic',
        WHB: 'Warhammer-Bold',
        WHBI: 'Warhammer-ItalicBold'
    },
    fontSize:{
        big:18,
        normal:12,
        small:11
    },
    unitMargin:baseUnitMargin*zoom,
    width:windowDimensions.width,
    unitWidth:windowDimensions.width-(baseUnitMargin*zoom),
    zoom: zoom
}

export default Variables;