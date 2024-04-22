import React, { Component } from "react";
import { Animated, Platform } from "react-native";
import Variables from "../Variables";
import { KameContext } from "../../Style/KameContext";
import * as FileSystem from 'expo-file-system';
import RosterSelectionExtractor from "./RosterSelectionExtractor";
import RosterSelectionData, { SelectionData, TargetSelectionData } from "./RosterSelectionData";
import Selection from "./UnitSelection";
import Each from "../Components/Each";
import { PopupOption } from "../Components/Popup";
import RosterRaw, { DescriptorRaw, LeaderDataRaw, NoteRaw, UnitRaw } from "../Roster/RosterRaw";
import fastXMLParser from 'fast-xml-parser';
import OptionSelection from "./SpecificSelections/OptionSelection";
import axios from "axios";

enum BuildPhase{
    FACTION, LOADING, LOADING_ERROR, ADD, EQUIP
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
class props{
    navigation:{goBack}
    NamesTaken:Array<string>;
    EditingRoster?:RosterRaw;
    Popup:(question:string, options:Array<PopupOption>,def:string)=>void;
    OnSaveRoster:(roster:RosterRaw)=>void;
    OnExit:CallableFunction;
}
const COLUMN_WIDTH = Variables.width * 0.50;
export default class BuilderMenuBackend extends Component<props> {
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;
    
    state={
        phase:BuildPhase.FACTION,
        loadingText:"",
        progress:"",
        catalogueId:"",
        factionName:"",
        rosterSelectionData:new RosterSelectionData(),
        units:new Array<Selection>(),
        detachmentSelection:Selection.Init(null, null, 0),
        options: new OptionSelection(),
        addColumnWidth:new Animated.Value(1),
        currentUnit:-2,
        update:0,
        editWeapon:false,
        editingWeapon:null,
        totalCost:0,
        warlord:null,
        equipedEnhancementIDs:new Array<string>(),
        rosterName:"",
        pastedInfo:new Animated.Value(0),
        pastedInfoView:false,
        rosterScrollViewLayout:null,
        newUnit: new Animated.Value(0),
        catalogueNames: new Array<string>(),
        displayCatalogue: new Array<string>(),
        nextNewUnitIndex:0
    }

    constructor(props) {
        super(props);
        
        if(this.props.EditingRoster && this.state.phase === BuildPhase.FACTION){
            const found = Variables.FactionFiles.find(ff=>ff.CatalogueID===this.props.EditingRoster.CatalogueID);
            this.state.rosterName= this.props.EditingRoster.Name;
            if(this.props.EditingRoster.NextNewUnitIndex===undefined) {
                this.state.nextNewUnitIndex = 0;
            } else {
                this.state.nextNewUnitIndex = this.props.EditingRoster.NextNewUnitIndex;
            }
            this.state.phase= BuildPhase.LOADING;
            this.state.loadingText= "Downloading Latest Roster Selection File Version..."
            this.state.progress= "0%";
            this.state.catalogueId= found.CatalogueID;
            this.state.factionName= found.Name;
            this.LoadRosterSelectionFile(found.Name, found.URL);
        } 
    }

    ErrorLoadingRosterFile(that:BuilderMenuBackend){
        that.setState({
            phase:BuildPhase.LOADING_ERROR
        })
    }

    async cont(rse:RosterSelectionExtractor, cont){
        await sleep(10);
        cont(rse);
    }
    private async downloadFileThen(name:string, url:string, that:BuilderMenuBackend, then:(contents)=>void) {
        if(Platform.OS==="web") {
            axios.get(url).then(async(res)=>{
                then(res.data);
            })
        } else {
            //TODO: add date to file, see if it already exists, and update only if too old (more than 1 day maybe even?)
            const DR = FileSystem.createDownloadResumable(
                url,
                FileSystem.documentDirectory + name + ".xml",
                {},
                (data)=>{
                    that.setState({progress:(Math.min(Math.max(data.totalBytesWritten, 0) / (data.totalBytesExpectedToWrite + data.totalBytesWritten), 1) * 100) + "%"})
                }
            );
            DR.downloadAsync().then((file)=>{
                FileSystem.readAsStringAsync(file.uri).catch(()=>{
                    that.ErrorLoadingRosterFile(that);
                }).then((contents)=>{
                    if (contents) {
                        then(contents);
                    } else {
                        that.ErrorLoadingRosterFile(that);
                    }
                });
            });
        }
    }

    private async nextRoster(index:number, count:number, catalogue, catalogues, that:BuilderMenuBackend, data:RosterSelectionData){
        await sleep(10);
        this.readRoster(index, count, catalogue, catalogues, that, data);
    }
    private async readRoster(index:number, count:number, catalogue, catalogues, that:BuilderMenuBackend, data:RosterSelectionData) {
        await sleep(10);
        that.setState({loadingText:"Interpreting Roster Selection File ( "+index + "/" + count + " )...", progress:"0%"})
        if(!that.state.catalogueNames.find(cn=>cn===catalogue.Name)) {
            if(that.state.displayCatalogue.length===0) {
                that.setState({catalogueNames:[...that.state.catalogueNames, catalogue.Name], displayCatalogue:[catalogue.Name]});
            } else {
                that.setState({catalogueNames:[...that.state.catalogueNames, catalogue.Name]});
            }
        }
        new RosterSelectionExtractor(catalogue.toRead, data, catalogue.Name, (progress:string, cont, rse:RosterSelectionExtractor, data?:RosterSelectionData, options?:Array<TargetSelectionData>)=>{
            if (data){
                if(catalogues.length===0) {
                    console.log(data.Selections)
                    data.Units = data.Units.sort((unit1, unit2)=>{
                        const catdiff = data.GetTarget(unit1).GetVariablesCategoryIndex() - data.GetTarget(unit2).GetVariablesCategoryIndex();
                        return catdiff!==0?catdiff:unit1.Name.localeCompare(unit2.Name);
                    })
                    if(this.props.EditingRoster) {
                        let units = new Array<Selection>(); 
                        let index = this.state.nextNewUnitIndex;
                        Each<UnitRaw>(this.props.EditingRoster.Units, unit=>{
                            const sel = Selection.FromTree(unit.Tree, data, index);
                            index++;
                            if(unit.CustomName) sel.CustomName = unit.CustomName;
                            let eeIDs = this.state.equipedEnhancementIDs;
                            Each<Selection>(sel.GetAbilitiesContainers(), ability=>{
                                if(ability.Parent && /enhancement/gi.test(ability.Parent.Name) && ability.Count===1) {
                                    eeIDs.push(ability.ID);
                                }
                            });
                            if(sel.IsWarlord()) this.setState({warlord:sel, equipedEnhancementIDs:eeIDs});
                            else this.setState({equipedEnhancementIDs:eeIDs});
                            units.push(sel);
                        });
                        //TODO: select detachment from editingroster data
                        that.setState({phase:BuildPhase.ADD, rosterSelectionData:data, progress:progress, detachmentSelection:data.DetachmentChoice, units:units, nextNewUnitIndex:index})
                    } else {
                        that.setState({phase:BuildPhase.ADD, rosterSelectionData:data, progress:progress, detachmentSelection:data.DetachmentChoice})
                    }
                } else {
                    const pop = catalogues.pop();
                    that.nextRoster(index+1, count, pop, catalogues, that, data);
                }
                console.log("data")
                console.log(options);
                that.state.options.Set(options);
            } else {
                that.setState({progress:progress}, ()=>this.cont(rse, cont));
            }
        }, ()=>{
            that.ErrorLoadingRosterFile(that);
        })
    }

    LoadRosterSelectionFile(name:string, url:string){
        const that = this;
        let catalogues = new Array<{toRead:any, Name:string}>();
        let data = new RosterSelectionData();
        this.downloadFileThen(name, url, that, (contents)=>{
            const initialCatalogue = new fastXMLParser.XMLParser({ignoreAttributes:false, attributeNamePrefix :"_", textNodeName:"textValue"}).parse(contents).catalogue;
            catalogues.push({toRead:initialCatalogue, Name:name});
            if(initialCatalogue.catalogueLinks) {
                that.setState({loadingText:"Downloading additional catalogues...", progress:"0%"});
                let toDownload = new Array();
                Each(initialCatalogue.catalogueLinks.catalogueLink, link=>{
                    const found = Variables.FactionFiles.find(ff=>ff.CatalogueID === link._targetId);
                    if(!found) console.error(link._targetId + " not found in FactionFiles");
                    toDownload.push(found);
                });
                function cont(that:BuilderMenuBackend) {
                    if(toDownload.length===0) {
                        catalogues.reverse();
                        const pop = catalogues.pop();
                        that.readRoster(1, catalogues.length+1, pop, catalogues, that, data);
                    } else {
                        const binding = toDownload.pop();
                        that.downloadFileThen(binding.Name, binding.URL, that, (content)=>{
                            catalogues.push({
                                toRead:new fastXMLParser.XMLParser({ignoreAttributes:false, attributeNamePrefix :"_", textNodeName:"textValue"}).parse(content).catalogue,
                                Name:binding.Name});
                            cont(that);
                        });
                    }
                }
                cont(that);
            }
        });
    }

    lastAddedUnitTemporary=0;
    AddUnitToRoster(unit:TargetSelectionData, that:BuilderMenuBackend){
        let units = [...that.state.units];
        const found = that.state.rosterSelectionData.Categories.find(c=>c.Name===unit.Name);
        let sel = Selection.Init(that.state.rosterSelectionData.GetTarget(unit), that.state.rosterSelectionData, that.state.nextNewUnitIndex, found?found.ID:null)
        if(sel.IsWarlord()) {
            if(that.state.warlord) that.state.warlord.SelectionValue().find(sv=>sv.Name==="Warlord").Count=0;
            that.setState({warlord:sel});
        }
        that.lastAddedUnitTemporary++;
        sel.Temporary = that.lastAddedUnitTemporary;
        units.push(sel);
        that.setState({nextNewUnitIndex: that.state.nextNewUnitIndex+1, units:units.sort((unit1, unit2)=>{
            const catdiff = unit1.GetVariablesCategoryIndex() - unit2.GetVariablesCategoryIndex();
            return catdiff!==0?catdiff:unit1.Name.localeCompare(unit2.Name);
        })}, ()=>{
            if (that.state.rosterScrollViewLayout) {
                const index = that.state.units.findIndex(u=>u.Temporary === that.lastAddedUnitTemporary);
                that.state.rosterScrollViewLayout.scrollTo({x:0, y:index*40})
            }
            this.state.newUnit.setValue(1);
            Animated.timing(this.state.newUnit, {
                toValue:0,
                duration:1000,
                useNativeDriver:true
            }).start();
        });
    }

    CanAddMore(unit:Selection|SelectionData|TargetSelectionData):boolean{
        if(unit instanceof TargetSelectionData) unit=this.state.rosterSelectionData.GetTarget(unit);
        const count = this.state.units.filter(u=>u.ID===unit.ID).length;
        let max= 3;
        if(unit.Categories.find(c=>c==="Epic Hero"))
            max= 1;
        else if(unit.Categories.find(c=>c==="Battleline"))
            max= 6;
        return count < max;
    }

    DuplicateUnit(index:number, that:BuilderMenuBackend) {
        let units = that.state.units;
        units.push(Selection.DeepDuplicate(units[index], that.state.nextNewUnitIndex))
        that.setState({units:units, nextNewUnitIndex:that.state.nextNewUnitIndex+1});
    }

    DeleteUnit(index:number, that:BuilderMenuBackend) {
        let units = that.state.units;
        units.splice(index, 1);
        that.setState({units:units});
    }

    ReplaceWeapon(id:string){
        this.state.editingWeapon.ReplaceWith(id);
        this.setState({editWeapon:false, editingWeapon:null, editingFramework:null});
    }

    SaveRoster():RosterRaw {
        let rr = new RosterRaw();
        
        rr.CatalogueID = this.state.catalogueId;
        rr.Faction = this.state.factionName;
        rr.Name= this.state.rosterName;
        rr.Units = this.state.units.map((u, i)=>u.GetUnitRaw(i));
        rr.Cost = this.state.units.map(u=>u.GetCost()).reduce((current, sum)=>current+sum, 0);
        if(this.props.EditingRoster && this.props.EditingRoster.NextNewUnitIndex !== undefined) {
            rr.LeaderData = this.props.EditingRoster.LeaderData.filter(ld=>rr.Units.findIndex(u=>u.UniqueID===ld.UniqueId)!==-1);
            Each<LeaderDataRaw>(rr.LeaderData, leader=>{
                if(rr.Units.findIndex(u=>u.UniqueID===leader.CurrentlyLeading)===-1){
                    leader.CurrentlyLeading=null;
                }
            })
            rr.Notes = this.props.EditingRoster.Notes.filter(n=>rr.Units.findIndex(u=>u.UniqueID===n.AssociatedID)!==-1)
        } else {
            rr.LeaderData = new Array<LeaderDataRaw>();
            rr.Notes = new Array<NoteRaw>();
        }
        rr.Rules = [...this.state.rosterSelectionData.Rules];
        rr.NextNewUnitIndex = this.state.nextNewUnitIndex;
        Each<UnitRaw>(rr.Units, unit=>{
            if(rr.LeaderData.findIndex(ld=>ld.UniqueId === unit.UniqueID)!==-1) return;
            let leaderData:LeaderDataRaw;
            Each<DescriptorRaw>(unit.Abilities, ability=>{
                if(/Leader/gi.test(ability.Name)) {
                    leaderData= new LeaderDataRaw();
                    leaderData.BaseName = unit.BaseName;
                    leaderData.CustomName = unit.CustomName;
                    leaderData.CurrentlyLeading="";
                    leaderData.UniqueId = unit.UniqueID;
                    leaderData.Leading = ability.Value.match(/(?<=[-■]).*/ig).map(item=>item.trim());
                    leaderData.Weapons = [...unit.Weapons];
                }
            });

            if (!leaderData) return;

            leaderData.Effects = [...unit.Abilities];
            rr.LeaderData.push(leaderData);
        });
        return rr;
    }

    protected printRoster():string {
        let cost = 0;
        let units = new Array<{val:string, count:number, sel:Selection}>();
        Each<Selection>(this.state.units, unit=> {
            cost += unit.GetCost();
            const print = unit.Print({category:""}) + "\n";
            const foundIndex = units.findIndex(u=>u.val===print);
            if(foundIndex!==-1) {
                units[foundIndex].count++;
            } else {
                units.push({val:print, sel:unit, count:1})
            }
        });
        let current = {category:""};
        return this.state.rosterName + " - " + cost + "pts \n" + 
            units.map(u=>u.sel.Print(current, u.count)).join("\n") + 
            "Made with Sammie's App";    
    }
}