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
        ['Legiones Daemonica', 'The Shadow of Chaos'], 
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
    ],
    PariahNexusTraits:{
        Character:[
            {Name:"Lead From the Front", Description:"This unit has the Infiltrators ability."},
            {Name:"Horror-Hardened", Description:"You can target this unit with Stratagems even while it is Battle-shocked."},
            {Name:"Arch Acquisitor", Description:"Add 3 to the Objective Control characteristic of one CHARACTER model in this unit."},
            {Name:"Claim Stalker", Description:"While this unit is within range of an objective marker, it has the Stealth ability."},
            {Name:"Heroic Constitution", Description:"Add 1 to the Wounds characteristic of one CHARACTER model in this unit."},
            {Name:"Duellist", Description:"Each time a Character model in this unit makes a melee attack that targets a CHARACTER unit, you can re-roll the Hit roll."}
        ],
        Vehicule:[
            {Name:"Hardened Defences", Description:"Models in this unit have the Feel No Pain 6+ ability."},
            {Name:"Totemic Presence", Description:"Add 2 to the Objective Control characteristic of one model in this unit."},
            {Name:"Tank Hunter", Description:"Each time a model in this unit makes an attack that targets a MONSTER or VEHICLE unit, re-roll a Wound roll of 1."},
            {Name:"Stubborn Explorator", Description:"Each time this unit makes a Normal or Advance move, it can move over terrain features that are 4\" or less in height as if they were not there."},
            {Name:"Heavily Armoured", Description:"Once per battle, when an attack is allocated to a model in this unit, you can change the Damage characteristic of that attack to 0."},
            {Name:"Reaper", Description:"Each time a model in this unit makes an attack that targets an INFANTRY or MOUNTED unit, re-roll a Hit roll of 1."}
        ],
        Infantry:[
            {Name:"Battle-Scarred Resistance", Description:"Models in this unit have the Feel No Pain 6+ ability."},
            {Name:"Wraith of Ruin", Description:"Models in this unit have the Infiltrators ability."},
            {Name:"United by Adversity", Description:"You can target this unit with the Heroic Intervention Stratagem for 0CP, and can do so even if you have already targeted a different unit with that Stratagem this phase."},
            {Name:"Raiders", Description:"Each time a model in this unit makes an attack that targets a unit that is within range of an objective marker, re-roll a Hit roll of 1."},
            {Name:"Purgators", Description:"This unit gains the GRENADES keyword. If it already has that keyword, once per battle, you can target this unit with the Grenade Stratagem for 0CP."},
            {Name:"Terror Assault", Description:"At the start of the Fight phase, select one enemy unit within Engagement Range of this unit. That enemy unit musttake a Battle-shock test."}
        ],
        Mounted:[
            {Name:"Riders of Ruin", Description:"Add 2\" to the Move characteristic of models in this unit."},
            {Name:"Thundering Onslaught", Description:"Add 1 to Advance and Charge rolls made for this unit."},
            {Name:"Saddleborn Assassins", Description:"Each time a model in this unit makes a ranged attack that targets the closest eligible target, improve the Armour Penetration characteristic of that attack by 1."},
            {Name:"Linebreakers", Description:"Each time this unit ends a Charge move, until the end of the turn, melee weapons equipped by models in this unit have the [SUSTAINED HITS 1] ability."},
            {Name:"Crushing Charge", Description:"Each time this unit ends a Charge move, select one enemy within Engagement Range of it, then roll one D6 for each model in this unit that is within Engagement Range of that enemy unit: for each 4+, that enemy unit suffers 1 mortal wound."},
            {Name:"Blur of Speed", Description:"Models in this unit have the Stealth ability."}
        ]
    }
    
}

export default Variables;