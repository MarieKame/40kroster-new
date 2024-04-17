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
        {Name:"Scar: Crippling Damage", Value:"This unit cannot Advance and you must subtract 1\" from the Move characteristic of models in this unit."},
        {Name:"Scar: Battle-Weary", Value:"Each time this unit takes a Battle-shock, Leadership, Desperate Escape or Out of Action test, subtract 1 from that test."},
        {Name:"Scar: Fatigued", Value:"Subtract 1 from the Objective Control characteristic of models in this unit and this unit never receives a Charge bonus."},
        {Name:"Scar: Disgraced", Value:"You cannot use any Stratagems to affect this unit and this unit cannot be Marked for Greatness."},
        {Name:"Scar: Mark of Shame", Value:"This unit cannot form an Attached unit, it is unaffected by the Aura abilities of friendly units, and it cannot be Marked for Greatness."},
        {Name:"Scar: Deep Scars", Value:"Each time a Critical Hit is scored against this unit, that attack automatically wounds this unit."},
    ],
    WeaponMods:[
        {Name:"Finely Balanced", Value:"Improve this weapon’s Ballistic Skill or Weapon Skill characteristic by 1."},
        {Name:"Brutal", Value:"Add 1 to this weapon’s Strength characteristic."},
        {Name:"Armour Piercing", Value:"Improve this weapon’s Armour Penetration characteristic by 1."},
        {Name:"Master-Worked", Value:"Add 1 to this weapon’s Damage characteristic."},
        {Name:"Heirloom", Value:"Add 1 to this weapon’s Attacks characteristic."},
        {Name:"Precise", Value:"Each time a Critical Wound is scored for an attack made with this weapon, that attack has the [PRECISION] ability."}
    ],
    PariahNexusTraits:{
        Character:[
            {Name:"Lead From the Front", Value:"This unit has the Infiltrators ability."},
            {Name:"Horror-Hardened", Value:"You can target this unit with Stratagems even while it is Battle-shocked."},
            {Name:"Arch Acquisitor", Value:"Add 3 to the Objective Control characteristic of one CHARACTER model in this unit."},
            {Name:"Claim Stalker", Value:"While this unit is within range of an objective marker, it has the Stealth ability."},
            {Name:"Heroic Constitution", Value:"Add 1 to the Wounds characteristic of one CHARACTER model in this unit."},
            {Name:"Duellist", Value:"Each time a Character model in this unit makes a melee attack that targets a CHARACTER unit, you can re-roll the Hit roll."}
        ],
        Vehicule:[
            {Name:"Hardened Defences", Value:"Models in this unit have the Feel No Pain 6+ ability."},
            {Name:"Totemic Presence", Value:"Add 2 to the Objective Control characteristic of one model in this unit."},
            {Name:"Tank Hunter", Value:"Each time a model in this unit makes an attack that targets a MONSTER or VEHICLE unit, re-roll a Wound roll of 1."},
            {Name:"Stubborn Explorator", Value:"Each time this unit makes a Normal or Advance move, it can move over terrain features that are 4\" or less in height as if they were not there."},
            {Name:"Heavily Armoured", Value:"Once per battle, when an attack is allocated to a model in this unit, you can change the Damage characteristic of that attack to 0."},
            {Name:"Reaper", Value:"Each time a model in this unit makes an attack that targets an INFANTRY or MOUNTED unit, re-roll a Hit roll of 1."}
        ],
        Infantry:[
            {Name:"Battle-Scarred Resistance", Value:"Models in this unit have the Feel No Pain 6+ ability."},
            {Name:"Wraith of Ruin", Value:"Models in this unit have the Infiltrators ability."},
            {Name:"United by Adversity", Value:"You can target this unit with the Heroic Intervention Stratagem for 0CP, and can do so even if you have already targeted a different unit with that Stratagem this phase."},
            {Name:"Raiders", Value:"Each time a model in this unit makes an attack that targets a unit that is within range of an objective marker, re-roll a Hit roll of 1."},
            {Name:"Purgators", Value:"This unit gains the GRENADES keyword. If it already has that keyword, once per battle, you can target this unit with the Grenade Stratagem for 0CP."},
            {Name:"Terror Assault", Value:"At the start of the Fight phase, select one enemy unit within Engagement Range of this unit. That enemy unit musttake a Battle-shock test."}
        ],
        Mounted:[
            {Name:"Riders of Ruin", Value:"Add 2\" to the Move characteristic of models in this unit."},
            {Name:"Thundering Onslaught", Value:"Add 1 to Advance and Charge rolls made for this unit."},
            {Name:"Saddleborn Assassins", Value:"Each time a model in this unit makes a ranged attack that targets the closest eligible target, improve the Armour Penetration characteristic of that attack by 1."},
            {Name:"Linebreakers", Value:"Each time this unit ends a Charge move, until the end of the turn, melee weapons equipped by models in this unit have the [SUSTAINED HITS 1] ability."},
            {Name:"Crushing Charge", Value:"Each time this unit ends a Charge move, select one enemy within Engagement Range of it, then roll one D6 for each model in this unit that is within Engagement Range of that enemy unit: for each 4+, that enemy unit suffers 1 mortal wound."},
            {Name:"Blur of Speed", Value:"Models in this unit have the Stealth ability."}
        ]
    },
    FactionFiles:[
        /*************************** IMPERIUM ********************************/
        {
            Name:"Adepta Sororitas", 
            CatalogueID:"b39e-4401-8f3e-fdf7", 
            Category:"Imperium",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Adepta%20Sororitas.cat"
        },
        {
            Name:"Adeptus Custodes", 
            CatalogueID:"1f19-6509-d906-ca10", 
            Category:"Imperium",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Adeptus%20Custodes.cat"
        },
        {
            Name:"Adeptus Mechanicus", 
            CatalogueID:"77b9-2f66-3f9b-5cf3", 
            Category:"Imperium",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Adeptus%20Mechanicus.cat"
        },
        {
            Name:"Astra Militarum", 
            CatalogueID:"b0ae-12a5-c84-ea45", 
            Category:"Imperium",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Astra%20Militarum.cat"
        },
        {
            Name:"Imperial Knights", 
            CatalogueID:"25dd-7aa0-6bf4-f2d5", 
            Category:"Imperium",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Imperial%20Knights.cat"
        },
        /*************************** XENOS ********************************/
        {
            Name:"Aeldari Craftworlds", 
            CatalogueID:"34a5-8c7e-f468-82d1", 
            Category:"Xenos",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Aeldari%20-%20Craftworlds.cat"
        },
        {
            Name:"Aeldari Ynnari", 
            CatalogueID:"1f1-47f9-a3a4-9bfb", 
            Category:"Xenos",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Aeldari%20-%20Ynnari.cat"
        },
        {
            Name:"Drukhari", 
            CatalogueID:"38de-521f-1ce0-44a0", 
            Category:"Xenos",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Aeldari%20-%20Drukhari.cat"
        },
        {
            Name:"Genestealer Cults", 
            CatalogueID:"3bdf-a114-5035-c6ac", 
            Category:"Xenos",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Genestealer%20Cults.cat"
        },
        {
            Name:"Leagues of Votan", 
            CatalogueID:"f616-3f08-ee8e-3349", 
            Category:"Xenos",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Leagues%20of%20Votann.cat"
        },
        {
            Name:"Necrons", 
            CatalogueID:"b654-a18a-ea1-3bf2", 
            Category:"Xenos",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Necrons.cat"
        },
        {
            Name:"Orks", 
            CatalogueID:"a55f-b7b3-6c65-a05f", 
            Category:"Xenos",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Orks.cat"
        },
        {
            Name:"T'au Empire", 
            CatalogueID:"d81a-61dd-6d27-a3ce", 
            Category:"Xenos",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/T'au%20Empire.cat"
        },
        {
            Name:"Tyranids", 
            CatalogueID:"b984-7317-81cc-20f", 
            Category:"Xenos",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Tyranids.cat"
        },
        /*************************** FORCES OF CHAOS ********************************/
        {
            Name:"Chaos Daemons", 
            CatalogueID:"d265-877b-e03d-30ca", 
            Category:"Forces of Chaos",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Chaos%20-%20Chaos%20Daemons.cat"
        },
        {
            Name:"Chaos Knights", 
            CatalogueID:"46d8-abc8-ef3a-9f85", 
            Category:"Forces of Chaos",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Chaos%20-%20Chaos%20Knights.cat"
        },
        {
            Name:"Chaos Space Marines", 
            CatalogueID:"c8da-e875-58f7-f6d6", 
            Category:"Forces of Chaos",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Chaos%20-%20Chaos%20Space%20Marines.cat"
        },
        {
            Name:"Death Guard", 
            CatalogueID:"5108-f98-63c2-53cb", 
            Category:"Forces of Chaos",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Chaos%20-%20Death%20Guard.cat"
        },
        {
            Name:"Thousand Sons", 
            CatalogueID:"1069-10ff-3ba9-873b", 
            Category:"Forces of Chaos",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Chaos%20-%20Thousand%20Sons.cat"
        },
        {
            Name:"World Eaters", 
            CatalogueID:"df9a-59b2-f464-59ad", 
            Category:"Forces of Chaos",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Chaos%20-%20World%20Eaters.cat"
        },
        /*************************** SPACE MARINES ********************************/
        {
            Name:"Space Marines", 
            CatalogueID:"e0af-67df-9d63-8fb7", 
            Category:"Space Marines",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Space%20Marines.cat"
        },
        {
            Name:"Black Templars", 
            CatalogueID:"36d3-36bc-68dd-40ac", 
            Category:"Space Marines",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Black%20Templars.cat"
        },
        {
            Name:"Blood Angels", 
            CatalogueID:"4ef9-15ce-e3e6-36de", 
            Category:"Space Marines",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Blood%20Angels.cat"
        },
        {
            Name:"Dark Angels", 
            CatalogueID:"470a-6daa-9014-12df", 
            Category:"Space Marines",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Dark%20Angels.cat"
        },
        {
            Name:"Deathwatch", 
            CatalogueID:"f89b-84e0-6e3b-f1e2", 
            Category:"Space Marines",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Deathwatch.cat"
        },
        {
            Name:"Grey Knights", 
            CatalogueID:"50c4-3e83-fe54-97c4", 
            Category:"Space Marines",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Grey%20Knights.cat"
        },
        {
            Name:"Imperial Fists", 
            CatalogueID:"5d6e-fd3-330a-11dd", 
            Category:"Space Marines",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Imperial%20Fists.cat"
        },
        {
            Name:"Iron Hands", 
            CatalogueID:"f27e-18c0-b73e-748e", 
            Category:"Space Marines",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Iron%20Hands.cat"
        },
        {
            Name:"Raven Guard", 
            CatalogueID:"6e59-e1ee-47ad-6ce5", 
            Category:"Space Marines",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Raven%20Guard.cat"
        },
        {
            Name:"Salamanders", 
            CatalogueID:"2261-79a5-19d9-1668", 
            Category:"Space Marines",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Salamanders.cat"
        },
        {
            Name:"Space Wolves", 
            CatalogueID:"94bb-3284-ee14-57a1", 
            Category:"Space Marines",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Space%20Wolves.cat"
        },
        {
            Name:"Ultramarines", 
            CatalogueID:"4029-9237-e8db-af55", 
            Category:"Space Marines",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Ultramarines.cat"
        },
        {
            Name:"White Scars", 
            CatalogueID:"67c1-fc13-f9a1-cbbf", 
            Category:"Space Marines",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20White%20Scars.cat"
        },
        
        /*************************** LIBRARIES ********************************/
        {
            Name:"Astartes Heresy Legends", 
            CatalogueID:"ac3b-689c-4ad4-70cb", 
            Category:"N/A",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Library%20-%20Astartes%20Heresy%20Legends.cat"
        },
        {
            Name:"Space Marines", 
            CatalogueID:"e0af-67df-9d63-8fb7", 
            Category:"N/A",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Space%20Marines.cat"
        },
        {
            Name:"Aeldari", 
            CatalogueID:"dfcf-1214-b57-2205", 
            Category:"N/A",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Aeldari%20-%20Aeldari%20Library.cat"
        },
        {
            Name:"Chaos Daemons", 
            CatalogueID:"b45c-af22-788a-dfd6", 
            Category:"N/A",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Chaos%20-%20Chaos%20Daemons%20Library.cat"
        },
        {
            Name:"Imperial Knights", 
            CatalogueID:"1b6d-dc06-5db9-c7d1", 
            Category:"N/A",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Imperial%20Knights%20-%20Library.cat"
        },
        {
            Name:"Chaos Knights", 
            CatalogueID:"8106-aad2-918a-9ac", 
            Category:"N/A",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Chaos%20-%20Chaos%20Knights%20Library.cat"
        },
        {
            Name:"Adeptus Titanicus", 
            CatalogueID:"bdc0-c0d-72d7-87e2", 
            Category:"N/A",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Adeptus%20Titanicus.cat"
        },
        {
            Name:"Titans", 
            CatalogueID:"7481-280e-b55e-7867", 
            Category:"N/A",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Library%20-%20Titans.cat"
        },
        {
            Name:"Imperial Agents", 
            CatalogueID:"b00-cd86-4b4c-97ba", 
            Category:"N/A",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Agents%20of%20the%20Imperium.cat"
        },
        {
            Name:"Astra Militarum Library", 
            CatalogueID:"5a44-f048-114b-e3ff", 
            Category:"N/A",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Astra%20Militarum%20-%20Library.cat"
        },
        {
            Name:"Unaligned Forces", 
            CatalogueID:"581a-46b9-5b86-44b7", 
            Category:"N/A",
            URL:"https://raw.githubusercontent.com/BSData/wh40k-10e/main/Unaligned%20Forces.cat"
        },
    ]
    
}

export default Variables;