import fastXMLParser from 'fast-xml-parser';
import RosterSelectionData, { Constraint, SelectionData, SelectionEntry, UnitSelectionData } from './RosterSelectionData';
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
            console.log(e);
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
            function* generateLinkOperation(entry, rse:RosterSelectionExtractor){
                
                if (entry._name=="Detachment Choice"){
                    let detachment = new SelectionEntry();
                    detachment.Name = entry._name;
                    rse.data.DetachmentChoice = detachment;
                } else if (entry._name !== "Show/Hide Options") {
                    let unitData = new UnitSelectionData();
                    unitData.Name = entry._name;
                    unitData.Type = entry._type;
                    unitData.Target = entry._targetId;
                    checkForConstaints(entry, unitData);
                    rse.data.Units.push(unitData);
                }
            }
            Each(this.catalogue.entryLinks.entryLink, (entry)=> {
                this.operations.push(generateLinkOperation(entry, this));
            });

            Each(this.catalogue.categoryEntries.categoryEntry, (entry)=> {
                //TODO: maybe useless?
                //this.Progress(this);
            });

            function GetSelectionFromEntry(entry, rse:RosterSelectionExtractor, parent?:SelectionEntry):SelectionEntry{
                let selection = new SelectionEntry();
                selection.Cost = entry.costs?entry.costs.cost._value:0;
                selection.Type = entry._type;
                selection.Name = entry._name;
                selection.ID = entry._id;
                if (entry._defaultSelectionEntryId) {
                    selection.DefaultSelectionID = entry._defaultSelectionEntryId;
                }
                if (parent){
                    parent.ChildrenIDs.push(selection.ID);
                }
                if(entry.selectionEntries) {
                    Each(entry.selectionEntries.selectionEntry, (e)=>TreatSelectionEntry(e, rse, selection));
                }
                if(entry.selectionEntryGroups) {
                    Each(entry.selectionEntryGroups.selectionEntryGroup, (e)=>TreatSelectionGroupEntry(e, rse, selection));
                }
                if (entry.categoryLinks){
                    Each(entry.categoryLinks.categoryLink, cat=>{
                        selection.Categories.push(cat._name);
                    })
                }
                if (entry.entryLinks){
                    Each(entry.entryLinks.entryLink, link=>{
                        let subEntry = new SelectionEntry();
                        subEntry.ID=link._targetId;
                        subEntry.Name=link._name;
                        subEntry.Type=link._type;
                        checkForConstaints(link, subEntry);
                        selection.SubEntries.push(subEntry);
                    });
                }
                checkForConstaints(entry, selection);
                return selection;
            }
            function TreatSelectionEntry(entry, rse:RosterSelectionExtractor, parent?:SelectionEntry){
                rse.data.Selections.push(GetSelectionFromEntry(entry, rse, parent));
            }
            function* generateSharedSelectionEntriesOperations(entry, rse:RosterSelectionExtractor){
                TreatSelectionEntry(entry, rse);
            }
            Each(this.catalogue.sharedSelectionEntries.selectionEntry, entry=>{
                this.operations.push(generateSharedSelectionEntriesOperations(entry, this));
                //this.Progress(this);
            });

            Each(this.catalogue.sharedProfiles.profile, (profile)=>{
                //this.Progress(this);
            });

            Each(this.catalogue.sharedRules.rule, (rule)=>{
                //this.Progress(this);
            });

            function TreatSelectionGroupEntry(entry, rse:RosterSelectionExtractor, parent?:SelectionEntry){
                rse.data.SelectionGroups.push(GetSelectionFromEntry(entry, rse, parent));
            }
            function* generateSharedSelectionGroupEntryOperations(entry, rse:RosterSelectionExtractor){
                TreatSelectionGroupEntry(entry, rse);
            }
            Each(this.catalogue.sharedSelectionEntryGroups.selectionEntryGroup, (selectionEntryGroup)=>{
                this.operations.push(generateSharedSelectionGroupEntryOperations(selectionEntryGroup, this));
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
            console.log("Catch")
            console.log(e);
            onError(e);
        }
    }
}