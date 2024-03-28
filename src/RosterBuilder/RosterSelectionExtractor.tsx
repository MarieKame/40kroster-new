import fastXMLParser from 'fast-xml-parser';
import RosterSelectionData, { Condition, Constraint, LogicalModifier, Modifier, ModifierType, ProfileData, SelectionData, SelectionEntry, TargetSelectionData } from './RosterSelectionData';
import Each from '../Components/Each';

export default class RosterSelectionExtractor {
    private progress=0;
    private lastNumber = 0;
    private catalogue;
    private toTreat;
    private onProgress;
    private onError;
    private operations;
    private data:RosterSelectionData;

    async Continue(rse:RosterSelectionExtractor){
        try{
            rse.operations[rse.progress].next(rse);
            rse.Progress(rse);
        } catch(e){
            console.error(e);
            rse.onError(e);
        }
    }

    async Progress(rse:RosterSelectionExtractor){
        rse.progress++;
        const newNumber = Number.parseInt(rse.progress/rse.toTreat*100 + " ");
        if (rse.operations.length == rse.progress) {
            rse.onProgress("100%", rse.Continue, rse, rse.data);
        } else if(newNumber > rse.lastNumber+5){
            rse.lastNumber = newNumber;
            rse.onProgress(newNumber+"%", rse.Continue, rse);
        } else {
            rse.Continue(rse);
        }
    }

    constructor(xml:string, onProgress:CallableFunction, onError:CallableFunction){
        this.data = new RosterSelectionData();
        this.catalogue = new fastXMLParser.XMLParser({ignoreAttributes:false, attributeNamePrefix :"_", textNodeName:"textValue"}).parse(xml).catalogue;
        this.onProgress = onProgress;
        this.onError = onError;
        this.operations = new Array();
        
        this.toTreat = this.catalogue.entryLinks.entryLink.length
             + this.catalogue.categoryEntries.categoryEntry.length
             + this.catalogue.sharedSelectionEntries.selectionEntry.length
             + this.catalogue.sharedProfiles.profile.length
             + this.catalogue.sharedRules.rule.length
             + this.catalogue.sharedSelectionEntryGroups.selectionEntryGroup.length
             + 1;
        
        function checkForConstaints(item, data:SelectionData){
            if(item.constraints){
                Each(item.constraints.constraint, (constraint)=>{
                    data.Constraints.push(new Constraint(
                        "c",
                        constraint._id,
                        constraint._type,
                        constraint._scope,
                        constraint._value,
                        constraint._shared
                    ));
                });
            }
        }
        
        try{

            function TreatEntry(entry):TargetSelectionData{
                let unitData = new TargetSelectionData();
                unitData.Name = entry._name;
                unitData.Type = entry._type;
                unitData.Target = entry._targetId;
                unitData.ID = entry._id;
                unitData.Hidden = entry.hidden?entry.hidden==="true":false;
                checkForConstaints(entry, unitData);
                const maxConstraint = unitData.Constraints.find(c=>c.Type==="max");
                if(entry.modifiers){
                    Each(entry.modifiers.modifier, modifier=>{
                        if(modifier.conditions) {
                            Each(modifier.conditions.condition, condition=>{
                                if(modifier._value == 0){
                                    unitData.CheckMerge.push([unitData.Target, condition._childId]);
                                }
                                if(maxConstraint && modifier._field === maxConstraint.ID) {
                                    unitData.Modifiers.push({Type: ModifierType.MAX, Comparator:condition._type, Comparison:condition._value, Value:modifier._value, Field:""})
                                }
                            });
                        } else {
                            if(maxConstraint && modifier._field === maxConstraint.ID) {
                                unitData.Modifiers.push({Type: ModifierType.MAX, Comparator:null, Comparison:null, Value:modifier._value, Field:""})
                            }
                        }
                    });
                }
                return unitData;
            }
            function* generateLinkOperation(entry, rse:RosterSelectionExtractor){
                
                if (entry._name=="Detachment Choice"){
                    let detachment = new SelectionEntry();
                    detachment.Name = entry._name;
                    rse.data.DetachmentChoice = detachment;
                } else if (entry._name !== "Show/Hide Options") {
                    rse.data.Units.push(TreatEntry(entry));
                }
            }
            Each(this.catalogue.entryLinks.entryLink, (entry)=> {
                this.operations.push(generateLinkOperation(entry, this));
            });

            function* generateCategoryEntryOperations(entry, rse:RosterSelectionExtractor) {
                rse.data.Categories.push({Name: entry._name, ID: entry._id})
            }
            Each(this.catalogue.categoryEntries.categoryEntry, (entry)=> {
                this.operations.push(generateCategoryEntryOperations(entry, this));
            });
            
            function TreatSelectionEntry(entry, rse:RosterSelectionExtractor, group:boolean, parent?:SelectionEntry){
                let selection = new SelectionEntry();
                let costId;
                if(entry.costs){
                    selection.Cost = entry.costs.cost._value;
                    costId = entry.costs.cost._typeId;
                } else {
                    selection.Cost=0;
                }
                selection.Type = group?"group":entry._type;
                selection.Name = entry._name;
                selection.ID = entry._id;
                selection.Hidden = entry.hidden?entry.hidden==="true":false;
                if (entry._defaultSelectionEntryId) {
                    selection.DefaultSelectionID = entry._defaultSelectionEntryId;
                }
                if (parent){
                    parent.ChildrenIDs.push(selection.ID);
                }
                if(entry.selectionEntries) {
                    Each(entry.selectionEntries.selectionEntry, (e)=>TreatSelectionEntry(e, rse, false, selection));
                }
                if(entry.sharedSelectionEntries) {
                    Each(entry.sharedSelectionEntries.selectionEntry, (e)=>TreatSelectionEntry(e, rse, false, selection));
                }
                if(entry.selectionEntryGroups) {
                    Each(entry.selectionEntryGroups.selectionEntryGroup, (e)=>TreatSelectionEntry(e, rse, true, selection));
                }
                if(entry.sharedSelectionEntryGroups) {
                    Each(entry.sharedSelectionEntryGroups.selectionEntryGroup, (e)=>TreatSelectionEntry(e, rse, true, selection));
                }
                if (entry.categoryLinks){
                    Each(entry.categoryLinks.categoryLink, cat=>{
                        selection.Categories.push(cat._name);
                    })
                }
                if (entry.entryLinks){
                    Each(entry.entryLinks.entryLink, link=>{
                        selection.SubEntries.push(TreatEntry(link));
                    });
                }
                if (entry.profiles){
                    Each(entry.profiles.profile, profile=>{
                        selection.Profiles.push(TreatProfileEntry(profile));
                    });
                }
                if(entry.infoGroups){
                    Each(entry.infoGroups.infoGroup, infoGroup=>{
                        Each(infoGroup.profiles.profile, profile=>{
                            selection.Profiles.push(TreatProfileEntry(profile));
                        });
                    });
                }
                if(entry.infoLinks){
                    Each(entry.infoLinks.infoLink, infoLink=>{
                        if (infoLink._type==="profile") {
                            let modifiers = new Array<Modifier>();
                            if(infoLink.modifiers){
                                Each(infoLink.modifiers.modifier, modifier=>{
                                    if(modifier.conditions){
                                        modifiers.push({Type:ModifierType.CHARACTERISTIC, Value:modifier._value, Field:modifier._field,  Comparator:modifier.conditions.condition._type, Comparison:modifier.conditions.condition._childId});
                                    } else {
                                        modifiers.push({Type:ModifierType.CHARACTERISTIC, Value:modifier._value, Field:modifier._field,  Comparator:null, Comparison:null});
                                    }
                                });
                            }
                            selection.ProfileInfoLinks.push({Target:infoLink._targetId, Modifiers:modifiers});
                        } else if (infoLink._type === "rule") {
                            if(infoLink.modifiers) {
                                selection.Rules.push(infoLink._name + " " + infoLink.modifiers.modifier._value);
                            } else {
                                selection.Rules.push(infoLink._name);
                            }
                        }
                    });
                }
                checkForConstaints(entry, selection);
                const maxConstraint = selection.Constraints.find(c=>c.Type==="max");
                if(entry.modifiers){
                    Each(entry.modifiers.modifier, modifier=>{
                        if(modifier.conditions) {
                            Each(modifier.conditions.condition, condition=>{
                                if(modifier._field === costId) {
                                    selection.Modifiers.push({Type: ModifierType.COST, Comparator:condition._type, Comparison:condition._value, Value:modifier._value, Field:""});
                                }
                                if(maxConstraint && modifier._field === maxConstraint.ID) {
                                    selection.Modifiers.push({Type: ModifierType.MAX, Comparator:condition._type, Comparison:condition._value, Value:modifier._value, Field:""})
                                }
                                if(modifier._field=="hidden") {
                                    selection.Modifiers.push({Type: ModifierType.HIDE, Comparator:condition._type, Comparison:condition._value, Value:modifier._value, Field:condition._childId});
                                }
                            });
                        } else if (modifier.conditionGroups) {
                            let conditions = new Array<Condition>();
                            Each(modifier.conditionGroups.conditionGroup.conditions.condition, condition=>{
                                conditions.push({Comparator:condition._type, Comparison:condition._value, Value:modifier._value, Field:condition._childId})
                            });
                            if(modifier._field=="hidden") {
                                selection.Modifiers.push(new LogicalModifier(ModifierType.HIDE, modifier.conditionGroups.conditionGroup._type, conditions));
                            }
                        } else {
                            console.error("modifier without condition?");
                        }
                    });
                }
                rse.data.Selections.push(selection);
            }
            function* generateSharedSelectionEntriesOperations(entry, rse:RosterSelectionExtractor){
                TreatSelectionEntry(entry, rse, false);
            }
            Each(this.catalogue.sharedSelectionEntries.selectionEntry, entry=>{
                this.operations.push(generateSharedSelectionEntriesOperations(entry, this));
            });

            function* generateSharedSelectionGroupEntriesOperations(entry, rse:RosterSelectionExtractor){
                TreatSelectionEntry(entry, rse, true);
            }
            Each(this.catalogue.sharedSelectionEntryGroups.selectionEntryGroup, (selectionEntryGroup)=>{
                this.operations.push(generateSharedSelectionGroupEntriesOperations(selectionEntryGroup, this));
            });

            function TreatProfileEntry(profile):ProfileData{
                let profileData = new ProfileData();
                profileData.Name = profile._name;
                profileData.ID = profile._id;
                profileData.Type = profile._typeName;
                Each(profile.characteristics.characteristic, c=>{
                    profileData.Characteristics.push({Name:c._name, ID:c._typeId, Value:c.textValue});
                });
                checkForConstaints(profile, profileData);
                return profileData;
            }
            function* generateSharedProfiles(profile, rse:RosterSelectionExtractor){
                rse.data.Profiles.push(TreatProfileEntry(profile));
            }
            Each(this.catalogue.sharedProfiles.profile, (profile)=>{
                this.operations.push(generateSharedProfiles(profile, this));
            });

            Each(this.catalogue.sharedRules.rule, (rule)=>{
                //this.Progress(this);
            });

            function* sort(rse:RosterSelectionExtractor){
                rse.data.Units = rse.data.Units.sort((unit1, unit2)=>{
                    const target1 = rse.data.GetTarget(unit1);
                    if (!target1) return -1;
                    const target2 = rse.data.GetTarget(unit2);
                    if (!target2) return -1;
                    return target1.GetVariablesCategoryIndex() - target2.GetVariablesCategoryIndex();
                });
            }
            this.operations.push(sort(this));

            this.Continue(this);
        } catch(e){
            console.error("Catch")
            console.error(e);
            onError(e);
        }
    }
}