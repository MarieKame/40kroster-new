
export interface Stratagem{
    Faction:string;
    Detachment:string;
    Name:string;
    CP:number;
    Flavor:string;
    When:string;
    Target:string;
    Effect:string;
    Restrictions?:string;
    Phases:Array<"Any"|"Command"|"Movement"|"Shooting"|"Charge"|"Fight"|number>;
}

export const STRATAGEMS:Array<Stratagem> = [
    {
        Faction:"Adepta Sorotitas",
        Detachment:"Hallowed Martyrs",
        Name:"Divine Intervention",
        Phases:["Any"],
        CP:1,
        Flavor:"Sometimes, a brush with death is so close the only explanation is divine intervention.",
        When:"Any phase.",
        Target:"One ADEPTA SORORITAS CHARACTER unit from your army that was just destroyed. You can use this Stratagem on that unit even though it was just destroyed.",
        Effect:"Discard 1-3 Miracle dice. At the end of the phase, set the last destroyed model from your unit back up on the battlefield, as close as possible to where it was destroyed and not within Engagement Range of any enemy models. That model is set back up with a number of wounds remaining equal to the number of Miracle dice you discarded.",
        Restrictions:"You cannot select SAINT CELESTINE as the target of this Stratagem. You cannot select the same CHARACTER as the target of this Stratagem more than once per battle."
    },
    {
        Faction:"Adepta Sorotitas",
        Detachment:"Hallowed Martyrs",
        Name:"Holy Rage",
        Phases:["Fight"],
        CP:1,
        Flavor:"With psalms on their lips, the faithful hurl themselves forward, striking the foe down with the inner strength born of faith in the Emperor.",
        When:"Fight Phase",
        Target:"One ADEPTA SORORITAS unit from your army that has not been selected to fight this phase.",
        Effect:"Until the end of the phase, each time a model in your unit makes a melee attack, add 1 to the Wound roll."
    },
    {
        Faction:"Adepta Sorotitas",
        Detachment:"Hallowed Martyrs",
        Name:"Suffering & Sacrifice",
        Phases:["Fight"],
        CP:1,
        Flavor:"Suffering is a staple prayer for the Adepta Sororitas, and a martyr’s fate only brings greater glory to the God-Emperor.",
        When:"Start of the Fight Phase",
        Target:"One ADEPTA SORORITAS INFANTRY or ADEPTA SORORITAS WALKER unit from your army.",
        Effect:"Until the end of the phase, each time an enemy model within Engagement range of your unit selects targets, it must select your unit as the target of its attacks."
    },
    {
        Faction:"Adepta Sorotitas",
        Detachment:"Hallowed Martyrs",
        Name:"Light of the Emperor",
        Phases:["Command"],
        CP:1,
        Flavor:"The Emperor’s radiance shines upon his warriors, emboldening them amidst the thick of battle in their darkest hour.",
        When:"Command phase.",
        Target:"One ADEPTA SORORITAS unit from your army that is below its Starting Strength. For the purposes of this Stratagem, if a unit has a Starting Strength of 1, it is considered to be below its Starting Strength while it has lost one or more wounds.",
        Effect:" Until the end of the turn, your unit can ignore any or all modifiers to its characteristics and/or to any roll or test made for it (excluding modifiers to saving throws)."
    },
    {
        Faction:"Adepta Sorotitas",
        Detachment:"Hallowed Martyrs",
        Name:"Rejoice the Fallen",
        Phases:["Shooting"],
        CP:1,
        Flavor:"The death of a Battle Sister only stirs the survivors to fight harder to exact swift vengeance.",
        When:"Your opponent’s Shooting phase, just after an enemy unit has resolved its attacks.",
        Target:"One ADEPTA SORORITAS unit from your army that had one or more of its models destroyed as a result of the attacking unit’s attacks.",
        Effect:"Your unit can shoot as if it were your Shooting phase, but it must target only that enemy unit when doing so, and can only do so if that enemy unit is an eligible target."
    },
    {
        Faction:"Adepta Sorotitas",
        Detachment:"Hallowed Martyrs",
        Name:"Spirit of the Martyr",
        Phases:["Fight"],
        CP:2,
        Flavor:"Even with their dying act, the Sororitas mete out the Emperor’s judgement.",
        When:"Fight phase, just after an enemy unit has selected its targets.",
        Target:"One ADEPTA SORORITAS unit from your army that was selected as the target of one or more of the attacking unit’s attacks.",
        Effect:"Until the end of the phase, each time a model in your unit is destroyed, if that model has not fought this phase, do not remove it from play. The destroyed model can fight after the attacking model’s unit has finished making attacks, and is then removed from play."
    }
]