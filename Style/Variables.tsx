import { Dimensions, Platform } from "react-native";

const windowDimensions = Dimensions.get('window');
const zoom = Platform.OS=="web"? 1.4:1;
const baseUnitMargin = 16;
const Variables = {
    boxBorder:"solid 1px",
    boxBorderStyle:"solid",
    boxBorderWidth:1,
    boxBorderRadius:4,
    colourDark:"rgb(0,0,0)",
    colourBg:"rgba(255,255,255,0.9)",
    colourAccent:"pink",
    colourLightAccent:"rgb(252, 233, 236)",
    colourMain:"red",
    colourGrey:"#FAFAFA",
    fonts:{
        spaceMarine:'Space-Marine',
        WHN: 'Warhammer-Normal',
        WHI: 'Warhammer-Italic',
        WHB: 'Warhammer-Bold',
        WHBI: 'Warhammer-ItalicBold'
    },
    fontSize:{
        big:Platform.OS=="web"?24:18,
        normal:Platform.OS=="web"?16:11,
        small:Platform.OS=="web"?14:9
    },
    unitMargin:baseUnitMargin*zoom,
    width:windowDimensions.width,
    unitWidth:windowDimensions.width-(baseUnitMargin*zoom + (Platform.OS=="web"?60:0)),
    zoom: zoom,
    unitCategories:['Epic Hero', 'Character', 'Battleline', 'Infantry', 'Vehicle', 'Monster'],
    factions:[
        'Adepta Sororitas', 
        'Adeptus Astartes', 
        'Adeptus Custodes', 
        'Adeptus Mechanicus', 
        'Aeldari', 
        'Astra Militarum', 
        'Chaos Daemons', 
        'Drukhari', 
        'Genestealer Cult', 
        'Necrons', 
        'Orks', 
        "T'au", 
        'Thousand Sons', 
        'Tyranids', 
        'World Eaters',
    ]
    // from https://drive.google.com/drive/folders/1rGgj9xUmgDZ2VDrAZVYGtWmk2eonrU0D
}

export default Variables;