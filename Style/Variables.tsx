import { Dimensions, Platform } from "react-native";

const windowDimensions = Dimensions.get('window');
const zoom = Platform.OS=="web"? 1.4:1;
const baseUnitMargin = 16;
const androidMenuSpace = Platform.OS=="web"?0:48;
const Variables = {
    boxBorder:"solid 1px",
    boxBorderStyle:"solid",
    boxBorderWidth:1,
    boxBorderRadius:4,
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
    width:windowDimensions.width + androidMenuSpace,
    unitWidth:windowDimensions.width+androidMenuSpace-(baseUnitMargin*zoom + (Platform.OS=="web"?60:0)),
    height:windowDimensions.height,
    zoom: zoom,
    unitCategories:['Epic Hero', 'Character', 'Battleline', 'Infantry', 'Vehicle', 'Monster'],
    displayFirst:"melee",
    displayLeaderInfo:false,
    mergeLeaderWeapons:true,
    displayTransportRule:false,
    username:"General",
    factions:[
        ['Adepta Sororitas', 'Acts of Faith'], 
        ['Adeptus Astartes', 'Oath of Moment'], 
        ['Adeptus Custodes', 'Martial Ka’tah'], 
        ['Adeptus Mechanicus', 'Doctrina Imperatives'], 
        ['Aeldari', 'Strands of Fate'], 
        ['Astra Militarum', 'Voice of Command'], 
        ['Chaos Daemons', 'The Shadow of Chaos'], 
        ['Drukhari', 'Power From Pain'], 
        ['Genestealer Cults', 'Cult Ambush'], 
        ['Necrons', 'Reanimation Protocols'], 
        ['Orks', 'Waaagh!'], 
        ["T'au", 'For the Greater Good'], 
        ['Thousand Sons', 'Cabal of Sorcerers'], 
        ['Tyranids', 'Synapse'], 
        ['World Eaters', 'Blessings of Khorne']
    ],
    battleScars:[
        {Name:"Scar: Crippling Damage", Description:"This unit cannot Advance and you must subtract 1\" from the Move characteristic of models in this unit."},
        {Name:"Scar: Battle-Weary", Description:"Each time this unit takes a Battle-shock, Leadership, Desperate Escape or Out of Action test, subtract 1 from that test."},
        {Name:"Scar: Fatigued", Description:"Subtract 1 from the Objective Control characteristic of models in this unit and this unit never receives a Charge bonus."},
        {Name:"Scar: Disgraced", Description:"You cannot use any Stratagems to affect this unit and this unit cannot be Marked for Greatness."},
        {Name:"Scar: Mark of Shame", Description:"This unit cannot form an Attached unit, it is unaffected by the Aura abilities of friendly units, and it cannot be Marked for Greatness."},
        {Name:"Scar: Deep Scars", Description:"Each time a Critical Hit is scored against this unit, that attack automatically wounds this unit."},
    ],
    WeaponMods:[
        {Name:"Finely Balanced", Description:"Improve this weapon’s Ballistic Skill or Weapon Skill characteristic by 1."},
        {Name:"Brutal", Description:"Add 1 to this weapon’s Strength characteristic."},
        {Name:"Armour Piercing", Description:"Improve this weapon’s Armour Penetration characteristic by 1."},
        {Name:"Master-Worked", Description:"Add 1 to this weapon’s Damage characteristic."},
        {Name:"Heirloom", Description:"Add 1 to this weapon’s Attacks characteristic."},
        {Name:"Precise", Description:"Each time a Critical Wound is scored for an attack made with this weapon, that attack has the [PRECISION] ability."}
    ]
    
}

export default Variables;