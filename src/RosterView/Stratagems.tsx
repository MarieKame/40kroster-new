
export interface Stratagem {
    Faction?: string;
    Detachment?: string;
    Name: string;
    CP: number;
    Flavor?: string;
    When: string;
    Target?: string;
    Effect: string;
    Restrictions?: string;
    Phases: Array<"Any" | "Command" | "Movement" | "Shooting" | "Charge" | "Fight" | number>;
}

//Regex to import from wahapedia :
//https://regex101.com/

//PHASE 1 NEEDS REWORK EBCAUSE IT DOESNT WORK WITH ORKS
//Phase 1 : (<div class="str10Name">)([a-z ]*)(.*)(<div class="str10CP">)(.*)(CP)([\na-z<\/> ="0-9:(%)-;–]*)(<div class="str10Legend ShowFluff">)(.*)(<\/div>)([\na-z<\/> ="0-9:(%)-;–]*)(<b>WHEN:<\/b><\/span> )((.*)( Phase.?)((.*)( Phase.?))?(( Phase.?))?)(<br>)(.*)(<b>TARGET:<\/b><\/span> )(.*)(EFFECT:<\/b><\/span> )(.*)(<br>)((<span class="str10ColorEither"><b>RESTRICTIONS:<\/b><\/span> )(.*)(<\/div>))?(\n*.*)*
//With replacement : Faction:"Adepta Sororitas",\nDetachment:"Hallowed Martyrs",\nName:"$2",\nPhases:["$14","$17","$20"],\nCP:$5,\nFlavor:"$9",\nWhen:"$13",\nTarget:"$24",\nEffect:"$26",\nRestrictions:"$2"
//Will give you : 
/*

Faction:"Adepta Sororitas",
Detachment:"Hallowed Martyrs",
Name:"DIVINE INTERVENTION",
Phases:["Any","",""],
CP:1,
Flavor:"Sometimes, a brush with death is so close the only explanation is divine intervention.",
When:"Any phase.",
Target:"One <span class="tooltip00011" data-tooltip-content="#tooltip_content00011" data-tooltip-anchor="#tooltip_content00011"><span class="kwb kwbu">ADEPTA</span> <span class="kwb kwbu">SORORITAS</span> <span class="kwb kwbu">CHARACTER</span></span> unit from your army that was just <span class="tooltip00001" data-tooltip-content="#tooltip_content00001"><span class="tt kwbu">destroyed</span></span>. You can use this Stratagem on that unit even though it was just destroyed.<br><br><span class="str10ColorEither"><b>",
Effect:"Discard 1-3 <span class="tooltip00012" data-tooltip-content="#tooltip_content00012"><span class="tt kwbu">Miracle</span> <span class="tt kwbu">dice</span></span>. At the end of the phase, set the last destroyed model from your unit back up on the battlefield, as close as possible to where it was destroyed and not within <span class="tooltip00013" data-tooltip-content="#tooltip_content00013"><span class="tt kwbu">Engagement</span> <span class="tt kwbu">Range</span></span> of any enemy models. That model is set back up with a number of wounds remaining equal to the number of Miracle dice you discarded.<br><span class="ezoic-autoinsert-video ezoic-under_second_paragraph"></span><!-- ezoic_video_placeholder-under_second_paragraph-384x216-999997-clearholder --><!-- ezoic_video_placeholder-under_second_paragraph-384x216-999997-nonexxxclearxxxblock -->",
Restrictions:"You cannot select <a class="kwbOne" href="/wh40k10ed/factions/adepta-sororitas/Saint-Celestine"><span class="kwb kwbo">SAINT</span> <span class="kwb kwbo">CELESTINE</span></a> as the target of this Stratagem. You cannot select the same <span class="kwb">CHARACTER</span> as the target of this Stratagem more than once per battle." 

*/


//Phase 2 : <[a-z ="'\/\-#0-9_+!]*>

//Will give you : 
/* 

Faction:"Adepta Sororitas",
Detachment:"Hallowed Martyrs",
Name:"DIVINE INTERVENTION",
Phases:["Any","",""],
CP:1,
Flavor:"Sometimes, a brush with death is so close the only explanation is divine intervention.",
When:"Any phase.",
Target:"One ADEPTA SORORITAS CHARACTER unit from your army that was just destroyed. You can use this Stratagem on that unit even though it was just destroyed.",
Effect:"Discard 1-3 Miracle dice. At the end of the phase, set the last destroyed model from your unit back up on the battlefield, as close as possible to where it was destroyed and not within Engagement Range of any enemy models. That model is set back up with a number of wounds remaining equal to the number of Miracle dice you discarded.",
Restrictions:"You cannot select SAINT CELESTINE as the target of this Stratagem. You cannot select the same CHARACTER as the target of this Stratagem more than once per battle." 

*/

//then just remove the extra bits you don't need!
export const STRATAGEMS: Array<Stratagem> = [
    {
        Faction: "Adepta Sorotitas",
        Detachment: "Hallowed Martyrs",
        Name: "Divine Intervention",
        Phases: ["Any"],
        CP: 1,
        Flavor: "Sometimes, a brush with death is so close the only explanation is divine intervention.",
        When: "Any phase.",
        Target: "One ADEPTA SORORITAS CHARACTER unit from your army that was just destroyed. You can use this Stratagem on that unit even though it was just destroyed.",
        Effect: "Discard 1-3 Miracle dice. At the end of the phase, set the last destroyed model from your unit back up on the battlefield, as close as possible to where it was destroyed and not within Engagement Range of any enemy models. That model is set back up with a number of wounds remaining equal to the number of Miracle dice you discarded.",
        Restrictions: "You cannot select SAINT CELESTINE as the target of this Stratagem. You cannot select the same CHARACTER as the target of this Stratagem more than once per battle."
    },
    {
        Faction: "Adepta Sorotitas",
        Detachment: "Hallowed Martyrs",
        Name: "Holy Rage",
        Phases: ["Fight"],
        CP: 1,
        Flavor: "With psalms on their lips, the faithful hurl themselves forward, striking the foe down with the inner strength born of faith in the Emperor.",
        When: "Fight Phase",
        Target: "One ADEPTA SORORITAS unit from your army that has not been selected to fight this phase.",
        Effect: "Until the end of the phase, each time a model in your unit makes a melee attack, add 1 to the Wound roll."
    },
    {
        Faction: "Adepta Sorotitas",
        Detachment: "Hallowed Martyrs",
        Name: "Suffering & Sacrifice",
        Phases: ["Fight"],
        CP: 1,
        Flavor: "Suffering is a staple prayer for the Adepta Sororitas, and a martyr’s fate only brings greater glory to the God-Emperor.",
        When: "Start of the Fight Phase",
        Target: "One ADEPTA SORORITAS INFANTRY or ADEPTA SORORITAS WALKER unit from your army.",
        Effect: "Until the end of the phase, each time an enemy model within Engagement range of your unit selects targets, it must select your unit as the target of its attacks."
    },
    {
        Faction: "Adepta Sorotitas",
        Detachment: "Hallowed Martyrs",
        Name: "Light of the Emperor",
        Phases: ["Command"],
        CP: 1,
        Flavor: "The Emperor’s radiance shines upon his warriors, emboldening them amidst the thick of battle in their darkest hour.",
        When: "Command phase.",
        Target: "One ADEPTA SORORITAS unit from your army that is below its Starting Strength. For the purposes of this Stratagem, if a unit has a Starting Strength of 1, it is considered to be below its Starting Strength while it has lost one or more wounds.",
        Effect: " Until the end of the turn, your unit can ignore any or all modifiers to its characteristics and/or to any roll or test made for it (excluding modifiers to saving throws)."
    },
    {
        Faction: "Adepta Sorotitas",
        Detachment: "Hallowed Martyrs",
        Name: "Rejoice the Fallen",
        Phases: ["Shooting"],
        CP: 1,
        Flavor: "The death of a Battle Sister only stirs the survivors to fight harder to exact swift vengeance.",
        When: "Your opponent’s Shooting phase, just after an enemy unit has resolved its attacks.",
        Target: "One ADEPTA SORORITAS unit from your army that had one or more of its models destroyed as a result of the attacking unit’s attacks.",
        Effect: "Your unit can shoot as if it were your Shooting phase, but it must target only that enemy unit when doing so, and can only do so if that enemy unit is an eligible target."
    },
    {
        Faction: "Adepta Sorotitas",
        Detachment: "Hallowed Martyrs",
        Name: "Spirit of the Martyr",
        Phases: ["Fight"],
        CP: 2,
        Flavor: "Even with their dying act, the Sororitas mete out the Emperor’s judgement.",
        When: "Fight phase, just after an enemy unit has selected its targets.",
        Target: "One ADEPTA SORORITAS unit from your army that was selected as the target of one or more of the attacking unit’s attacks.",
        Effect: "Until the end of the phase, each time a model in your unit is destroyed, if that model has not fought this phase, do not remove it from play. The destroyed model can fight after the attacking model’s unit has finished making attacks, and is then removed from play."
    }
]

// From PDF : ^(.*)(CORE)(.*)(WHEN: )(.*((?<= )([a-z]*)(?= Phase))(.*)(?=(TARGET)))((TARGET: )(.*(?=EFFECT)))?(EFFECT: )((.|\n)*(?=RESTRICTIONS))((RESTRICTIONS: )(.*))?
export const CORE_STRATAGEMS: Array<Stratagem> = [
    {
        Name: "COMMAND RE-ROLL",
        Phases: ["Any"],
        CP: 1,
        When: "In any phase, just after you have made a Hit roll, a Wound roll, a Damage roll, a saving throw, an Advance roll, a Charge roll, a Desperate Escape test, a Hazardous test, or just after you have rolled the dice to determine the number of attacks made with a weapon, for an attack, model or unit from your army.",
        Target: "",
        Effect: "You re-roll that roll, test or saving throw.",
        Restrictions: ""
    },
    {
        Name: "COUNTER-OFFENSIVE",
        Phases: ["Fight"],
        CP: 2,
        When: "Fight phase, just after an enemy unit has fought. TARGET: One unit from your army that is within Engagement Range of one or more enemy units and that has not already been selected to fight this phase.",
        Target: "",
        Effect: "Your unit fights next.",
        Restrictions: ""
    },
    {
        Name: "EPIC CHALLENGE",
        Phases: ["Fight"],
        CP: 1,
        When: "Fight phase, when a Character unit from your army that is within Engagement Range of one or more Attached units is selected to fight.",
        Target: "One Character model in your unit.",
        Effect: "Until the end of the phase, all melee attacks made by that model have the [PRECISION] ability (pg 26)",
        Restrictions: ""
    },
    {
        Name: "INSANE BRAVERY",
        Phases: ["Command"],
        CP: 1,
        When: "Battle-shock step of your Command phase, just after you have failed a Battle-shock test taken for a unit from your army (pg 11).",
        Target: "The unit from your army that Battle-shock test was just taken for (even though your Battle-shocked units cannot normally be affected by your Stratagems).",
        Effect: "Your unit is treated as having passed that test instead, and is not Battle-shocked as a result.",
        Restrictions: ""
    },
    {
        Name: "GRENADE",
        Phases: ["Shooting"],
        CP: 1,
        When: "Your Shooting phase.",
        Target: "One Grenades unit from your army that is not within Engagement Range of any enemy units and has not been selected to shoot this phase.",
        Effect: "Select one enemy unit that is not within Engagement Range of any units from your army and is within 8\" of and visible to your Grenades unit. Roll six D6: for each 4 +, that enemy unit suffers 1 mortal wound.",
        Restrictions: ""
    },
    {
        Name: "TANK SHOCK",
        Phases: ["Charge"],
        CP: 1,
        When: "Your Charge phase.",
        Target: "One Vehicle unit from your army.",
        Effect: "Until the end of the phase, after your unit ends a Charge move, select one enemy unit within Engagement Range of it, then select one melee weapon your unit is equipped with.Roll a number of D6 equal to that weapon’s Strength characteristic.If that Strength characteristic is greater than that enemy unit’s Toughness characteristic, roll two additional D6. For each 5 +, that enemy unit suffers 1 mortal wound(to a maximum of 6 mortal wounds).",
        Restrictions: ""
    },
    {
        Name: "FIRE OVERWATCH",
        Phases: ["Charge"],
        CP: 1,
        When: "Your opponent’s Movement or Charge phase, just after an enemy unit is set up or when an enemy unit starts or ends a Normal, Advance, Fall Back or Charge move.",
        Target: "One unit from your army that is within 24\" of that enemy unit and that would be eligible to shoot if it were your Shooting phase.",
        Effect: "Your unit can shoot that enemy unit as if it were your Shooting phase.",
        Restrictions: "Until the end of the phase, each time a model in your unit makes a ranged attack, an unmodified Hit roll of 6 is required to score a hit, irrespective of the attacking weapon’s Ballistic Skill or any modifiers.You can only use this Stratagem once per turn."
    },
    {
        Name: "RAPID INGRESS",
        Phases: ["Movement"],
        CP: 1,
        When: "End of your opponent’s Movement phase.",
        Target: "One unit from your army that is in Reserves.",
        Effect: "Your unit can arrive on the battlefield as if it were the Reinforcements step of your Movement phase.",
        Restrictions: "You cannot use this Stratagem to enable a unit to arrive on the battlefield during a battle round it would not normally be able to do so in."
    },

    {
        Name: "SMOKESCREEN",
        Phases: ["Shooting"],
        CP: 1,
        When: "Your opponent’s Shooting phase, just after an enemy unit has selected its targets.",
        Target: "One Smoke unit from your army that was selected as the target of one or more of the attacking unit’s attacks.",
        Effect: "Until the end of the phase, all models in your unit have the Benefit of Cover(pg 44) and the Stealth ability (pg 20).",
        Restrictions: ""
    },
    {
        Name: "GO TO GROUND",
        Phases: ["Shooting"],
        CP: 1,
        When: "Your opponent’s Shooting phase, just after an enemy unit has selected its targets.",
        Target: "One Infantry unit from your army that was selected as the target of one or more of the attacking unit’s attacks.",
        Effect: "Until the end of the phase, all models in your unit have a 6 + invulnerable save and have the Benefit of Cover(pg 44).",
        Restrictions: ""
    },
    {
        Name: "HEROIC INTERVENTION",
        Phases: ["Charge"],
        CP: 2,
        When: "Your opponent’s Charge phase, just after an enemy unit ends a Charge move.",
        Target: "One unit from your army that is within 6\" of that enemy unit and would be eligible to declare a charge against that enemy unit if it were your Charge phase.",
        Effect: "Your unit now declares a charge that targets only that enemy unit, and you resolve that charge as if it were your Charge phase.",
        Restrictions: "You can only select a Vehicle unit from your army if it is a Walker.Note that even if this charge is successful, your unit does not receive any Charge bonus this turn (pg 29)"
    },
]

/*Faction:"Adepta Sororitas",
Detachment:"Hallowed Martyrs",
Name:"DIVINE INTERVENTION",
Phases:["Any","",""],
CP:1,
Flavor:"Sometimes, a brush with death is so close the only explanation is divine intervention.",
When:"Any phase.",
Target:"One <span class="tooltip00011" data-tooltip-content="#tooltip_content00011" data-tooltip-anchor="#tooltip_content00011"><span class="kwb kwbu">ADEPTA</span> <span class="kwb kwbu">SORORITAS</span> <span class="kwb kwbu">CHARACTER</span></span> unit from your army that was just <span class="tooltip00001" data-tooltip-content="#tooltip_content00001"><span class="tt kwbu">destroyed</span></span>. You can use this Stratagem on that unit even though it was just destroyed.<br><br><span class="str10ColorEither"><b>",
Effect:"Discard 1-3 <span class="tooltip00012" data-tooltip-content="#tooltip_content00012"><span class="tt kwbu">Miracle</span> <span class="tt kwbu">dice</span></span>. At the end of the phase, set the last destroyed model from your unit back up on the battlefield, as close as possible to where it was destroyed and not within <span class="tooltip00013" data-tooltip-content="#tooltip_content00013"><span class="tt kwbu">Engagement</span> <span class="tt kwbu">Range</span></span> of any enemy models. That model is set back up with a number of wounds remaining equal to the number of Miracle dice you discarded.<br><span class="ezoic-autoinsert-video ezoic-under_second_paragraph"></span><!-- ezoic_video_placeholder-under_second_paragraph-384x216-999997-clearholder --><!-- ezoic_video_placeholder-under_second_paragraph-384x216-999997-nonexxxclearxxxblock -->",
Restrictions:"You cannot select <a class="kwbOne" href="/wh40k10ed/factions/adepta-sororitas/Saint-Celestine"><span class="kwb kwbo">SAINT</span> <span class="kwb kwbo">CELESTINE</span></a> as the target of this Stratagem. You cannot select the same <span class="kwb">CHARACTER</span> as the target of this Stratagem more than once per battle." 

*/