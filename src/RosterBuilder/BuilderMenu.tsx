import { Component, ReactNode } from "react";
import { LayoutAnimation, ListRenderItemInfo, Pressable, View } from "react-native";
import Variables from "../Variables";
import { FlatList, GestureHandlerRootView, ScrollView } from "react-native-gesture-handler";
import Text from '../Components/Text';
import Button from "../Components/Button";
import { KameContext } from "../../Style/KameContext";
import * as FileSystem from 'expo-file-system';
import RosterSelectionExtractor from "./RosterSelectionExtractor";
import RosterSelectionData, { SelectionData, SelectionEntry, TargetSelectionData } from "./RosterSelectionData";
import Selection from "./UnitSelection";
import Each from "../Components/Each";
import ProfilesDisplay, { ProfilesDisplayData } from "./ProfilesDisplay";
import Checkbox from "../Components/Checkbox";
import AutoExpandingTextInput from "../Components/AutoExpandingTextInput";
import { PopupOption } from "../Components/Popup";
import RosterRaw, { DebugRosterRaw, DescriptorRaw, LeaderDataRaw, ModelRaw, NoteRaw, UnitRaw, WeaponRaw } from "../Roster/RosterRaw";
import Info from "../Components/Info";

enum BuildPhase{
    FACTION, LOADING, LOADING_ERROR, ADD, EQUIP
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
class props{
    navigation:{goBack};
    NamesTaken:Array<string>;
    Popup:(question:string, options:Array<PopupOption>,def:string)=>void;
    OnSaveRoster:(roster:RosterRaw)=>void;
}
const COLUMN_WIDTH = Variables.width * 0.50;
export default class BuilderMenu extends Component<props> {
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;
    
    state={
        phase:BuildPhase.FACTION,
        loadingText:"",
        progress:"",
        catalogueId:"",
        rosterSelectionData:new RosterSelectionData(),
        units:new Array<Selection>(),
        detachmentSelection:Selection.Init(null, null),
        addColumnWidth:COLUMN_WIDTH,
        currentUnit:-2,
        update:0,
        editWeapon:false,
        editingWeapon:new Selection(1, null, null, null, null),
        totalCost:0,
        warlord:null,
        equipedEnhancementIDs:new Array<string>(),
        rosterName:""
    }

    ErrorLoadingRosterFile(that:BuilderMenu){
        that.setState({
            phase:BuildPhase.LOADING_ERROR
        })
    }

    async cont(rse:RosterSelectionData, cont){
        await sleep(10);
        cont(rse);
    }

    LoadRosterSelectionFile(name:string, url:string, catalogueId:string){
        const that = this;
        this.setState({phase:BuildPhase.LOADING, loadingText:"Downloading Latest Roster Selection File Version...", progress:"0%", catalogueId:catalogueId});
        const DR = FileSystem.createDownloadResumable(
            url,
            FileSystem.documentDirectory + name + ".xml",
            {},
            (data)=>{
                that.setState({progress:(Math.min(Math.max(data.totalBytesWritten, 0) / (data.totalBytesExpectedToWrite + data.totalBytesWritten), 1) * 100) + "%"})
            }
          );
          DR.downloadAsync().then((file)=>{
            that.setState({loadingText:"Interpreting Roster Selection File...", progress:"0%"})
            FileSystem.readAsStringAsync(file.uri).catch(()=>{
                that.ErrorLoadingRosterFile(that);
            }).then((contents)=>{
                if (contents) {
                    new RosterSelectionExtractor(contents, (progress:string, cont, rse:RosterSelectionData, data?:RosterSelectionData)=>{
                        if (data){
                            that.setState({phase:BuildPhase.ADD, rosterSelectionData:data, progress:progress, detachmentSelection:Selection.Init(data.DetachmentChoice, data)})
                        } else {
                            that.setState({progress:progress}, ()=>this.cont(rse, cont));
                        }
                    }, ()=>{
                        that.ErrorLoadingRosterFile(that);
                    })
                } else {
                    that.ErrorLoadingRosterFile(that);
                }
            })
        })
    }

    AddUnitToRoster(unit:TargetSelectionData, that:BuilderMenu){
        let units = [...that.state.units];
        const found = that.state.rosterSelectionData.Categories.find(c=>c.Name===unit.Name);
        let sel = Selection.Init(that.state.rosterSelectionData.GetTarget(unit), that.state.rosterSelectionData, found?found.ID:null)
        if(sel.IsWarlord()) {
            if(that.state.warlord) that.state.warlord.SelectionValue.find(sv=>sv.Name==="Warlord").Count=0;
            that.setState({warlord:sel});
        }
        units.push(sel);
        that.setState({units:units.sort((unit1, unit2)=>{
            return unit1.GetVariablesCategoryIndex() - unit2.GetVariablesCategoryIndex();
        })});
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

    DuplicateUnit(index:number, that:BuilderMenu) {
        let units = that.state.units;
        units.push(Selection.DeepDuplicate(units[index]))
        that.setState({units:units});
    }

    DeleteUnit(index:number, that:BuilderMenu) {
        let units = that.state.units;
        units.splice(index, 1);
        that.setState({units:units});
    }

    ReplaceWeapon(id:string){
        this.state.editingWeapon.ReplaceWith(id);
        this.setState({editWeapon:false, editingWeapon:null, editingFramework:null});
    }

    SaveRoster():RosterRaw {
        let rr = new RosterRaw;
        rr.Units = this.state.units.map((u, i)=>u.GetUnitRaw(i));
        rr.CatalogueID = this.state.catalogueId;
        rr.Notes = new Array<NoteRaw>();
        rr.Name= this.state.rosterName;
        rr.Cost = this.state.units.map(u=>u.GetCost()).reduce((current, sum)=>current+sum, 0);
        rr.LeaderData = new Array<LeaderDataRaw>();
        let id= 1;
        Each<UnitRaw>(rr.Units, unit=>{
            let leaderData:LeaderDataRaw;
            Each<DescriptorRaw>(unit.Abilities, ability=>{
                if(/Leader/gi.test(ability.Name)) {
                    leaderData= new LeaderDataRaw();
                    leaderData.BaseName = unit.BaseName;
                    leaderData.CustomName = unit.CustomName;
                    leaderData.CurrentlyLeading="";
                    leaderData.UniqueId = id++;
                    leaderData.Leading = ability.Value.match(/(?<=[-■]).*/ig).map(item=>item.trim());
                    leaderData.Weapons = [...unit.Weapons];
                }
            });

            if (!leaderData) return;

            leaderData.Effects = new Array<DescriptorRaw>();
            Each<DescriptorRaw>(unit.Abilities, ability=>{
                if (ability.Value.match(/(leading)|(bearer[’'`]s unit)|(this model[’'`]s unit)/ig)) {
                    leaderData.Effects.push(ability);
                }
            });
            rr.LeaderData.push(leaderData);
        });
        return rr;
    }

    /////////////////////////////////////////////////////////
    /*                     DISPLAY                         */
    /////////////////////////////////////////////////////////
    DisplayValidity(selection:Selection, recursive:boolean=false):ReactNode{
        if (!(recursive?selection.ValidRecursive():selection.Valid())) return <Text style={{color:recursive?this.context.Main:this.context.LightAccent}}> INVALID </Text>
        return null;
    }

    DisplayUpgrade(selection:Selection, index:number, disabled:boolean, enhancement:boolean):ReactNode{
        let option;
        if((selection.Parent.ID !== selection.Ancestor.ID && !/Enhancement/gi.test(selection.Parent.Name)) || !selection.Changeable()) {
            if(selection.Count===0) return;
            option= <Button 
                    small={true} 
                    disabled={selection.Parent.GetSelectionCount()===selection.Parent.SelectionValue.length || disabled || !selection.Changeable()} 
                    style={{height:"auto"}} 
                    textStyle={{color:disabled?this.context.LightAccent:this.context.Dark}} 
                    onPress={e=>this.setState({editWeapon:true, editingWeapon:selection})}>
                        {selection.Name}{this.DisplayValidity(selection)}
                    </Button>;
        } else {
            const trulyDisabled = 
                disabled || 
                (selection.Name==="Warlord" && 
                    (this.state.warlord!==null && 
                    this.state.warlord.ID !== selection.Ancestor.ID)) ||
                enhancement && 
                    (selection.Parent.GetSelectionCount()===1 || 
                    this.state.equipedEnhancementIDs.findIndex(eeID => eeID === selection.ID) !== -1);
            option= <Checkbox 
                Text={selection.Name} 
                Style={{opacity:trulyDisabled?0.5:1}} 
                Disabled={trulyDisabled} 
                Checked={!disabled&&selection.Count===1} 
                OnCheckedChanged={e=>{
                    selection.Count=(e?1:0);
                    this.setState({update:this.state.update++})
                    if(selection.Name==="Warlord") {
                        this.setState({warlord:(e?selection.Ancestor:null)});
                    }
                    if(enhancement) {
                        let eeIDs = this.state.equipedEnhancementIDs;
                        if (e) eeIDs.push(selection.ID);
                        else eeIDs.splice(eeIDs.findIndex(eeID=> eeID === selection.ID), 1);
                        this.setState({equipedEnhancementIDs:eeIDs});
                    }
                }}/>
        }
        if(!option) return null;
        return <View key={index} style={{flexDirection:"row", backgroundColor:this.context.Bg, marginBottom:6, marginTop:6}}>
            <View style={{width:"25%", justifyContent:"center"}}>{option}</View>
            <ProfilesDisplay Data={selection.DisplayStats()} key={index} Small Disabled={disabled} Style={{width:"75%", marginLeft:4, marginRight:4}} />
        </View>
    }

    DisplayGroup(selection:Selection, colour:string, textColour:string, index:number, marginTop:number, disabled:boolean):ReactNode{
        return <Text style={{backgroundColor:colour, color:textColour, marginTop:marginTop, opacity:disabled?0.5:1}} key={selection.Name + selection.Count + index}>{selection.Name}{selection.GetSelectionCount()!==1&&selection.DisplayCount()}{this.DisplayValidity(selection)}</Text>
    }

    DisplayModel(selection:Selection, colour:string, textColour:string, index:number, marginTop:number, disabled:boolean):ReactNode{
        return <View style={{flexDirection:"row", backgroundColor:colour, height:28, alignItems:"center", marginTop:marginTop, opacity:disabled?0.5:1, paddingRight:6}} key={selection.Name + selection.Count + index}>
            <Text style={{flexGrow:1, color:textColour}}>{selection.Name}{selection.DisplayCount()}{this.DisplayValidity(selection)}</Text>
            {selection.Changeable()&&<Button small disabled={!selection.CanRemove()} onPress={e=>selection.Remove(this)} style={{height:28, width:40}} textStyle={{fontSize:Variables.fontSize.small}}>-</Button>}
            {selection.Changeable()&&<Button small disabled={!selection.CanAdd()} onPress={e=>selection.Add(this)} style={{height:28, width:40}} textStyle={{fontSize:Variables.fontSize.small}}>+</Button>}
        </View>;
    }

    ViewSelectionRecursive(selection:Selection, index:number=1, depth:number=1, disabled:boolean=false, isEnhancement:boolean=false){
        if (!selection) return null;
        let currentIndex = index;

        function extractGroups(sv:Array<Selection>):Array<Selection>{
            if (depth === 1) return sv;
            let result = new Array<Selection>();
            
            Each<Selection>(sv, s=>{
                if(s.Type==="group"){
                    result = [...result, ...extractGroups(s.SelectionValue)];
                }
                else result = [...result, s];
            });
            return result;
        }

        let value=[];
        let skip = false;
        const colour = depth==1?this.context.Accent:(depth==2?this.context.LightAccent:null);
        const sv = extractGroups(selection.SelectionValue);
        
        Each<Selection>(sv, (child, index)=>{
            const valid = child.Valid();
            if(child.Type=="model"){
                value.push(this.DisplayModel(
                    child, 
                    valid?colour:this.context.Main, 
                    !valid?this.context.LightAccent:this.context.Dark, 
                    currentIndex++, 
                    index===0?0:10, 
                    child.IsHidden()||disabled));
                skip = child.Count == 0;
            } else if(child.Type=="group"){
                value.push(this.DisplayGroup(
                    child, 
                    valid?colour:this.context.Main, 
                    !valid?this.context.LightAccent:this.context.Dark, 
                    currentIndex++, 
                    index===0?0:(child.GetModelCount()!==0?10:0),
                    child.IsHidden()||disabled));
            } else if(child.Type=="upgrade"){
                value.push(this.DisplayUpgrade(
                    child, 
                    currentIndex++,
                    child.IsHidden()||disabled,
                    isEnhancement));
            } else {
                console.error("ERROR, missing selection display for type : ");
                console.error(child.Type);
            }
            if(!skip) value.push(this.ViewSelectionRecursive(child, currentIndex++, depth+1, child.IsHidden(), /Enhancement/gi.test(child.Name)));
        });

        return <View key={this.state.currentUnit + selection.Name + currentIndex + this.state.update} style={{flexGrow:1, width:"100%", paddingLeft:6}}>
            {value}
        </View>;
    }

    ViewUnitAbilties(unit:Selection):ReactNode {
        return <View style={{padding:10, gap:6}}>
            {unit.GetAbilities().map((ability, index)=>
                <View key={index} style={{width:"100%"}}>
                    <Text style={{backgroundColor:this.context.LightAccent, width:"100%"}}>{ability.Name}</Text>
                    <Text>{ability.Characteristics[0].Value}</Text>
                </View>
            )}
        </View>;
    }
    
    DisplayUnitSelections(){
        if (this.state.currentUnit===-2) return null;
        const unit = this.state.units[this.state.currentUnit];
        const that = this;
        const unitModels = unit.GetModelsWithDifferentProfiles();
        let unitModelsDisplay = new Array<ReactNode>();

        function newUnitDisplay(name:string, data:ProfilesDisplayData|ProfilesDisplayData[], key) {
            unitModelsDisplay.push(<View key={key} style={{flexDirection:"row"}}>
                <Text key="name" style={{marginRight:4, alignSelf:"center", width:120, textAlign:"right", height:"auto", alignContent:"center"}}>{name}</Text>
                <ProfilesDisplay Data={data} DisplayName={false} OnlyDisplayFirst={true} />
            </View>);
        }
        if(unitModels.length===1){
            newUnitDisplay(unit.Name, unitModels[0].DisplayStats(), "title")
        } else {
            Each<Selection>(unitModels, (unitModel, index)=>{
                newUnitDisplay(unitModel.Name, unitModel.DisplayStats(), index);
            });
        }

        return <View style={{height:"100%", backgroundColor:this.context.Bg, marginLeft:10}}>
            <ScrollView>
                <View style={{height:48*unitModels.length+6}}>
                    {unitModelsDisplay}
                </View>
                {this.ViewSelectionRecursive(unit)}
                <Text key="rules" style={{padding:10}}><Text style={{fontFamily:Variables.fonts.WHB}}>Categories : </Text>{unit.Rules.join(", ")}</Text>
                {this.ViewUnitAbilties(unit)}
                <Text key="cats" style={{padding:10}}><Text style={{fontFamily:Variables.fonts.WHB}}>Categories : </Text>{unit.Categories.join(", ")}</Text>
            </ScrollView>
            <Button style={{position:"absolute", top:0, right:0}} onPress={e=>{
                if(this.state.phase === BuildPhase.EQUIP) {
                    LayoutAnimation.configureNext({duration:500});
                    LayoutAnimation.easeInEaseOut();
                    that.setState({addColumnWidth: COLUMN_WIDTH});
                }
                that.setState({phase:BuildPhase.ADD, currentUnit:-2});
            }} >X</Button>
        </View>;
        
        /*******************************/
        /********** END EQUIP **********/
        /*******************************/
    }

    rosterCategory;
    renderRoster(render:ListRenderItemInfo<Selection>, that:BuilderMenu){
        function newCategory(entry:SelectionEntry):boolean{
            if (entry) {
                const cat = entry.GetVariablesCategory();
                if (cat !== this.rosterCategory){
                    this.rosterCategory = cat;
                    return true;
                }
            }
            return false;
        }
    
        function getCategory(){
            return this.rosterCategory;
        }
        if(this.state.units.length == 0) return null;
        return <View key={render.item.Name+this.state.update}>
            {newCategory(render.item.GetFrameworkCategories())&&
                <View style={{alignItems:"center", justifyContent:"center", backgroundColor:this.context.Accent, width:"100%"}}>
                    <Text>{getCategory()}</Text>
                </View>
            }
            <Pressable onPress={e=>{
                    if(that.state.phase !== BuildPhase.EQUIP){ 
                        LayoutAnimation.configureNext({duration:500});
                        LayoutAnimation.easeInEaseOut();
                        that.setState({addColumnWidth: 0});
                    } 
                    that.setState({phase:BuildPhase.EQUIP, currentUnit:render.index-1}); 
                    }}>
                <View style={{flexDirection:"row", backgroundColor:render.index==this.state.currentUnit+1?this.context.LightAccent:this.context.Bg, borderBottomColor:this.context.LightAccent, borderWidth:1, height:40}}>
                    <View key="box" style={{alignSelf:"center", flexGrow:1, marginLeft:4}}>
                        <Text>{render.item.Name}{render.item.HasEnhancement()&&<Text style={{color:this.context.Main}}> ★</Text>}</Text>
                        <Text>
                            {render.item.GetFrameworkCost()>0&&render.item.GetCost()+" pts"}
                            {render.item.GetFrameworkCost()>0&&" — "+render.item.GetModelCount()+" model" + (render.item.GetModelCount()>1?"s":"")}
                            {this.DisplayValidity(render.item, true)}
                        </Text>
                    </View>
                    {(render.item.GetFrameworkCost()>0&&this.state.phase!==BuildPhase.EQUIP&&this.CanAddMore(render.item))&&<Button key="x2" onPress={e=>this.DuplicateUnit(render.index-1, this)} textStyle={{fontSize:10}} style={{width:40}} small weight="light">x2</Button>}
                    {(render.item.GetFrameworkCost()>0&&this.state.phase!==BuildPhase.EQUIP)&&<Button key="-" onPress={e=>this.DeleteUnit(render.index-1, this)} textStyle={{fontSize:12}} style={{width:40}} small weight="light">🗑</Button>}
                </View>
            </Pressable>
        </View>;

        /*******************************/
        /********** END ROSTER *********/
        /*******************************/
    }

    selectionCategory;
    renderUnitSelection(render:ListRenderItemInfo<TargetSelectionData>, that:BuilderMenu){
        function newCategory(entry:SelectionEntry):boolean{
            if (entry) {
                const cat = entry.GetVariablesCategory();
                if (cat !== this.selectionCategory){
                    this.selectionCategory = cat;
                    return true;
                }
            }
            return false;
        }
    
        function getCategory(){
            return this.selectionCategory;
        }
        const target = that.state.rosterSelectionData.GetTarget(render.item);
        if(!target) return null;
        return <View>
            {newCategory(target)&&
                <View style={{alignItems:"center", justifyContent:"center", backgroundColor:this.context.Accent, width:"100%"}}>
                    <Text>{getCategory()}</Text>
                </View>
            }
            <View style={{flexDirection:"row", backgroundColor:this.context.Bg, borderBottomColor:this.context.LightAccent, borderWidth:1, height:40}}>
                <Text style={{alignSelf:"center", flexGrow:1, marginLeft:4}}>{render.item.Name} ({target.Cost})</Text>
                {this.CanAddMore(render.item)&&<Button onPress={e=>that.AddUnitToRoster(render.item, that)}>+</Button>}
            </View>
        </View>;

        /*******************************/
        /******** END SELECTION ********/
        /*******************************/
    }

    ShowMenu(){
        const that = this;
        switch(this.state.phase){
            case BuildPhase.FACTION:
                return <Button onPress={e=>this.props.navigation.goBack()}>Back</Button>;
            case BuildPhase.ADD:
            case BuildPhase.EQUIP:
                const totalCost =  this.state.units.map(u=>u.GetCost()).reduce((cost, total)=> cost+total, 0)
                return <View style={{flexDirection:"row", height:38, marginBottom:4, gap:8, alignItems:"center"}}>
                    <AutoExpandingTextInput key="rosterName" onSubmit={e=>{this.setState({rosterName:e===undefined?"":e})}} defaultValue="New Roster Name" style={{width:200}}/>
                    <Info key="nameError" 
                        MessageOnPress={
                            this.state.rosterName===""?
                                "Enter a Name":
                                "This name is already in use"} 
                        Visible={
                            this.state.rosterName===""||
                            this.props.NamesTaken.findIndex(name=>name===this.state.rosterName)!==-1}/>
                    <View key="info" style={{backgroundColor:this.context.Bg, height:38, alignItems:"center", paddingLeft:10, paddingRight:10, gap:5, flexDirection:"row"}}>
                        <Text key="wl">Warlord : {this.state.warlord?this.state.warlord.Name:"Not Selected"}</Text>
                        <Text key="sp">|</Text>
                        <Text key="total">Total : {totalCost} pts</Text>
                    </View>
                    <Info key="saveError" 
                        MessageOnPress={
                            (this.state.rosterName==="" || 
                            this.props.NamesTaken.findIndex(name=>name===this.state.rosterName)!==-1) ?
                                "Enter a valid roster name" :
                                ((this.state.warlord===null)?
                                    "Select a Warlord":
                                    "Validate all your units")} 
                        Visible={
                            this.state.rosterName==="" || 
                            this.props.NamesTaken.findIndex(name=>name===this.state.rosterName)!==-1 ||
                            this.state.warlord===null || 
                            !this.state.units.map(u=>u.ValidRecursive()).reduce((was, is)=>was&&is, true)}
                        Style={{position:"absolute", right:110}}/>
                    <Button key="save" 
                        style={{position:"absolute", right:50}} 
                        disabled={this.state.rosterName==="" || this.state.warlord===null || !this.state.units.map(u=>u.ValidRecursive()).reduce((was, is)=>was&&is, true)} 
                        onPress={e=> {
                            const roster = this.SaveRoster();
                            DebugRosterRaw(roster);
                            this.props.navigation.goBack();
                            this.props.OnSaveRoster(roster)
                            }}>Save</Button>
                    <Button key="exit" 
                        style={{position:"absolute", right:0}} 
                        onPress={e=>{
                            that.props.Popup(
                                "All progress on this roster will be lost, go back to the Main Menu?", 
                                [{
                                    option:"Yes",
                                    callback:()=>{
                                        that.props.navigation.goBack();
                                    }
                                }], 
                                "Cancel");
                        }} 
                        weight="light">Exit</Button>
                </View>;
        }
        return null;
    }

    render(){
        let contents;
        switch(this.state.phase) {
            case BuildPhase.FACTION:
                contents= <FlatList numColumns={2} data={Variables.FactionFiles} renderItem={render=>{
                    return <Button onPress={e=>this.LoadRosterSelectionFile(render.item.Name, render.item.URL, render.item.CatalogueID)}>{render.item.Name}</Button>;
                }} />
                break;
            case BuildPhase.LOADING:
                contents= <View style={{height:Variables.height, width:Variables.width, position:"absolute", backgroundColor:"rgba(0,0,0,0.6)", justifyContent: 'center', alignItems: 'center'}}>
                    <View style={{backgroundColor:this.context.Bg, position:"absolute", padding:10, borderColor:this.context.Accent, borderWidth:1, borderRadius:Variables.boxBorderRadius}}>
                        <Text>{this.state.loadingText}</Text>
                        <Text style={{alignSelf:"center"}} key={this.state.progress}>{this.state.progress}</Text>
                    </View>
                </View>;
                break;
            case BuildPhase.LOADING_ERROR:
                contents= <View style={{height:Variables.height, width:Variables.width, position:"absolute", backgroundColor:"rgba(0,0,0,0.6)", justifyContent: 'center', alignItems: 'center'}}>
                    <View style={{backgroundColor:this.context.Bg, position:"absolute", padding:10, borderColor:this.context.Accent, borderWidth:1, borderRadius:Variables.boxBorderRadius}}>
                        <Text>Error While Loading</Text>
                        <Button onPress={e=>this.setState({phase:BuildPhase.FACTION})}>Back</Button>
                    </View>
                </View>;
                break;
            case BuildPhase.ADD:
            case BuildPhase.EQUIP:
                contents= <View>
                    <View style={{flexDirection:"row"}}>
                        <View style={{width: this.state.addColumnWidth, overflow:"hidden", marginRight:10, height:Variables.height-60}}>
                            <FlatList style={{minWidth:COLUMN_WIDTH}} numColumns={1} data={this.state.rosterSelectionData.Units} renderItem={render=>this.renderUnitSelection(render, this)} />
                        </View>
                        <View style={{overflow:"hidden", height:Variables.height-60, flexGrow:1}}>
                            <FlatList key={this.state.update} numColumns={1} data={[this.state.detachmentSelection, ...this.state.units]} renderItem={render=>this.renderRoster(render, this)} />
                        </View>
                        <View style={{width: (COLUMN_WIDTH-this.state.addColumnWidth)*1.3, overflow:"hidden", height:Variables.height-60}}>
                            {this.DisplayUnitSelections()}
                        </View>
                    </View>
                </View>
                break;
        }
        let overlay;
        if(this.state.editWeapon){
            overlay = 
            <View style={{height:Variables.height, width:Variables.width, position:"absolute", backgroundColor:"rgba(0,0,0,0.6)", justifyContent: 'center', alignItems: 'center', zIndex:1000}}>
                <View style={{backgroundColor:this.context.Bg, position:"absolute", padding:10, borderColor:this.context.Accent, borderWidth:1, borderRadius:Variables.boxBorderRadius, width:Variables.width*0.9, maxHeight:Variables.height*0.9}}>
                    <Button onPress={e=>this.setState({editWeapon:false})}>X</Button>
                    <ScrollView>
                        {this.state.editingWeapon.Parent.SelectionValue.map((option, index)=>
                            <View key={option.Name} style={{flexDirection:"row"}}>
                                <Button onPress={e=>this.ReplaceWeapon(option.ID)} style={{width:"30%", height:"auto"}}>{option.Name}</Button>
                                <ProfilesDisplay Data={option.DisplayStats()} key={index} Style={{width:"70%", height:"auto"}} />
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        }
        return <GestureHandlerRootView>
                <View key="overlay">{overlay}</View>
                <View style={{padding:8}}>{this.ShowMenu()}{contents}</View>
            </GestureHandlerRootView>;
    }
}