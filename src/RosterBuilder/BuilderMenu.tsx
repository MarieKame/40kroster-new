import React, { ReactNode } from "react";
import { ListRenderItemInfo, Pressable, View, Animated, Platform } from "react-native";
import Variables from "../Variables";
import { FlatList, GestureHandlerRootView, PanGestureHandler, ScrollView } from "react-native-gesture-handler";
import Text from '../Components/Text';
import Button from "../Components/Button";
import { LogicalModifier, SelectionEntry, TargetSelectionData } from "./RosterSelectionData";
import Selection from "./UnitSelection";
import Each from "../Components/Each";
import ProfilesDisplay, { ProfilesDisplayData } from "./ProfilesDisplay";
import Checkbox from "../Components/Checkbox";
import AutoExpandingTextInput from "../Components/AutoExpandingTextInput";
import { DebugRosterRaw } from "../Roster/RosterRaw";
import Info from "../Components/Info";
import * as Clipboard from "expo-clipboard";
import BuilderMenuBackend from "./BuilderMenuBackend";
import DetachmentSelection from "./SpecificSelections/DetachmentSelection";
import RadioButtonHack from "../Components/RadioButtonHack";
import { Stratagem, fetchStratagemsFor } from "../RosterView/Stratagems";
import MasonryList from '@react-native-seoul/masonry-list';
import StratagemDisplay from "../Roster/StratagemDisplay";

enum BuildPhase{
    FACTION, LOADING, LOADING_ERROR, ADD, EQUIP
}

const COLUMN_WIDTH = Variables.width * 0.50;

export default class BuilderMenu extends BuilderMenuBackend {
    DisplayValidity(selection:Selection, recursive:boolean=false):ReactNode{
        if (!(recursive?selection.ValidRecursive():selection.Valid())) return <Text style={{color:recursive?this.context.Main:this.context.LightAccent}}> INVALID </Text>
        return null;
    }

    DisplayUpgrade(selection:Selection, index:number, disabled:boolean, enhancement:boolean):ReactNode{
        let option;
        if(!selection) return null;
        if(selection instanceof DetachmentSelection) {
            return <View style={{width:"100%", paddingBottom:10}} key={index}>
                <View style={{flexDirection:"row", backgroundColor:this.context.LightAccent}}>
                    <RadioButtonHack value={selection.Name} onValueChange={(value)=>{this.state.detachmentSelection.SetValue(value);this.setState({update:this.state.update+1})}} checked={this.state.detachmentSelection.Value()===selection.Name} />  
                    <Text style={{justifyContent:"center", alignSelf:"center"}}>{selection.Name}</Text>
                </View>
                {selection.DetachmentProfiles.map(dp=><Text><Text style={{fontFamily:Variables.fonts.WHBI}}>{dp.Name} : </Text> {dp.Value}</Text>)}
                <Button
                    onPress={e=>{
                        fetchStratagemsFor(this.state.factionName, selection.Name).then((strats:Stratagem[])=>{
                            this.setState({previewStratagems:strats})
                        });
                    }}
                >Preview Stratagems</Button>
            </View>
        } else if((selection.Parent.ID !== selection.Ancestor.ID && !/Enhancement/gi.test(selection.Parent.Name) && selection.Parent.Type !=="model") || !selection.Changeable()) {
            if(selection.Count===0) return;
            option= <Button 
                    small={true} 
                    disabled={selection.Parent.GetSelectionCount()===selection.Parent.SelectionValue().length || disabled || !selection.Changeable()} 
                    style={{height:"auto"}} 
                    textStyle={{color:disabled?this.context.LightAccent:this.context.Dark}} 
                    onPress={e=>this.setState({editWeapon:true, editingWeapon:selection})}>
                        {selection.Name}{this.DisplayValidity(selection)}
                    </Button>;
        } else {
            if(enhancement && !selection.CorrectDetachment(this.state.detachmentSelection.Value())) return;
            const trulyDisabled = 
                disabled || 
                (selection.Name==="Warlord" && 
                    (this.state.warlord!==null && 
                    this.state.warlord.ID !== selection.Ancestor.ID)) ||
                enhancement && 
                    (selection.Count !== 1 && 
                    (selection.Parent.GetSelectionCount() !== 0 || 
                    this.state.equipedEnhancementIDs.findIndex(eeID => eeID === selection.ID) !== -1)
                    );
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
                }}/>;
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
                    result = [...result, ...extractGroups(s.SelectionValue())];
                }
                else result = [...result, s];
            });
            return result;
        }

        let value=[];
        let skip = false;
        const colour = depth==1?this.context.Accent:(depth==2?this.context.LightAccent:null);
        const sv = extractGroups(selection.SelectionValue());
        
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
                console.log(child);
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
        let unit:Selection;
        if(this.state.currentUnit<0){
            if(this.state.currentUnit===-1) {
                unit = this.state.options;
            } else {
                unit = this.state.detachmentSelection;
            }
        } else {
            unit = this.state.units[this.state.currentUnit];
        }
        const that = this;
        const unitModels = unit.GetModelsWithDifferentProfiles();
        let unitModelsDisplay = new Array<ReactNode>();

        function newUnitDisplay(name:string, data:ProfilesDisplayData|ProfilesDisplayData[], index) {
            unitModelsDisplay.push(<View key={index} style={{flexDirection:"row", marginLeft:12}}>
                {index===0&&<AutoExpandingTextInput style={{marginRight:4, alignSelf:"center", width:150, height:"auto", alignContent:"center"}} onSubmit={e=>{
                        if (e && e !== "" && e !== undefined) {
                            unit.CustomName = e;
                            that.setState({update:that.state.update+1})
                        }
                    }} hint={unit.Name}
                    value={unit.CustomName} />}
                {index!==0&&<Text key="name" style={{marginRight:4, alignSelf:"center", width:150, textAlign:"right", height:"auto", alignContent:"center"}}>{name}</Text>}
                <ProfilesDisplay Data={data} DisplayName={false} OnlyDisplayFirst={true} />
            </View>);
        }
        if(unitModels.length===1){
            newUnitDisplay(unit.Name, unitModels[0].DisplayStats(), 0)
        } else if(unitModels.length>1) {
            Each<Selection>(unitModels, (unitModel, index)=>{
                newUnitDisplay(unitModel.Name, unitModel.DisplayStats(), index);
            });
        }

        return <View key={this.state.currentUnit} style={{height:"100%", backgroundColor:this.context.Bg, marginLeft:10}}>
            <ScrollView>
                <View key="models" style={{flexDirection:"row"}}>
                    <View style={{height:48*unitModels.length+6}}>
                        {unitModelsDisplay}
                    </View>
                </View>
                {this.ViewSelectionRecursive(unit)}
                {unit.Rules&&<Text key="rules" style={{padding:10}}><Text style={{fontFamily:Variables.fonts.WHB}}>Rules : </Text>{unit.Rules.join(", ")}</Text>}
                {this.ViewUnitAbilties(unit)}
                {unit.Categories&&<Text key="cats" style={{padding:10}}><Text style={{fontFamily:Variables.fonts.WHB}}>Categories : </Text>{unit.Categories.join(", ")}</Text>}
            </ScrollView>
            {(Platform.OS !== "web" || Variables.width <= 1400)&&<Button style={{position:"absolute", top:0, right:0}} onPress={e=>{
                if(this.state.phase === BuildPhase.EQUIP) {
                    Animated.timing(that.state.addColumnWidth, {
                        toValue:1,
                        duration:500,
                        useNativeDriver:true
                    }).start();
                }
                that.setState({phase:BuildPhase.ADD});
            }} >X</Button>}
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
        return <View key={render.item.Name + render.index}>
            {newCategory(render.item.GetFrameworkCategories())&&
                <View style={{alignItems:"center", justifyContent:"center", backgroundColor:this.context.Accent}}>
                    <Text>{getCategory()}</Text>
                </View>
            }
            <Pressable onPress={e=>{
                    if(that.state.phase !== BuildPhase.EQUIP){ 
                        Animated.timing(that.state.addColumnWidth, {
                            toValue:0,
                            duration:500,
                            useNativeDriver:true
                        }).start();
                    } 
                    that.setState({phase:BuildPhase.EQUIP, currentUnit:render.index-2}); 
                }}>
                <Animated.View style={{
                    flexDirection:"row", 
                    backgroundColor:
                        (render.index==this.state.currentUnit + 2 ? 
                            this.context.LightAccent : 
                            (this.lastAddedUnitTemporary===render.item.Temporary ?
                                (this.state.newUnit.interpolate({
                                    inputRange:[0, 1],
                                    outputRange:[this.context.Bg, this.context.Main]
                                })) :
                                this.context.Bg)
                        ), 
                    borderBottomColor:this.context.LightAccent, 
                    borderWidth:1, 
                    height:40}}>
                    <View key="box" style={{alignSelf:"center", flexGrow:1, marginLeft:4}}>
                        <Text key={render.index + this.state.update}>{render.item.CustomName?render.item.CustomName:render.item.Name}{render.item.HasEnhancement(this.state.detachmentSelection.Value())&&<Text style={{color:this.context.Main}}> ★</Text>}</Text>
                        <Text>
                            {render.item.GetFrameworkCost()>0&&render.item.GetCost(this.state.detachmentSelection.Value())+" pts"}
                            {render.item.GetFrameworkCost()>0&&" — "+render.item.GetModelCount()+" model" + (render.item.GetModelCount()>1?"s":"")}
                            {this.DisplayValidity(render.item, true)}
                        </Text>
                    </View>
                    {(render.item.GetFrameworkCost()>0&&(this.state.phase!==BuildPhase.EQUIP||Platform.OS==="web")&&this.CanAddMore(render.item))&&<Button key="x2" onPress={e=>this.DuplicateUnit(render.index-2, this)} textStyle={{fontSize:10}} style={{width:40}} small weight="light">x2</Button>}
                    {(render.item.GetFrameworkCost()>0&&(this.state.phase!==BuildPhase.EQUIP||Platform.OS==="web"))&&<Button key="-" onPress={e=>this.DeleteUnit(render.index-2, this)} textStyle={{fontSize:12}} style={{width:40}} small weight="light">🗑</Button>}
                </Animated.View>
            </Pressable>
        </View>;

        /*******************************/
        /********** END ROSTER *********/
        /*******************************/
    }

    selectionCategory;
    renderUnitSelection(render:ListRenderItemInfo<TargetSelectionData>, that:BuilderMenu){
        const target = that.state.rosterSelectionData.GetTarget(render.item);
        if(!target) return;

        const modifiers = [...render.item.Modifiers, ...target.Modifiers];
        const found = this.state.options.SelectionValue().find(sv=>
            modifiers.findIndex(m=>
            (m instanceof LogicalModifier) ?
            m.Conditions.findIndex(mc=>mc.Field===sv.ExtraID)!==-1:
            sv.ExtraID===m.Field)!==-1);
        if(found && found.Count===0) return;
        if(render.item.CatalogueName!==this.state.factionName && !found && render.item.CatalogueName !== "Space Marines") return;
        
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
        return <View key={render.index}>
            {newCategory(target)&&
                <View style={{alignItems:"center", justifyContent:"center", backgroundColor:this.context.Accent, width:"100%"}}>
                    <Text>{getCategory()}</Text>
                </View>
            }
            <View style={{flexDirection:"row", backgroundColor:this.context.Bg, borderBottomColor:this.context.LightAccent, borderWidth:1, height:40}}>
                <View  style={{flexGrow:1, alignSelf:"center"}}>
                    <Text style={{marginLeft:4}}>{render.item.Name} ({target.Cost})</Text>
                    <Text style={{fontSize:Variables.fontSize.small, fontFamily:Variables.fonts.WHI, marginLeft:8, color:(render.item.CatalogueName===this.state.factionName?this.context.Dark:this.context.Accent)}}>Catalogue : {render.item.CatalogueName}</Text>
                </View>
                {this.CanAddMore(render.item)&&<Button onPress={e=>that.AddUnitToRoster(render.item, that)}>+</Button>}
            </View>
        </View>;

        /*******************************/
        /******** END SELECTION ********/
        /*******************************/
    }

    ShowMenu(){
        const that = this;
        function ValidName():boolean{
            return that.state.rosterName !== "" &&
            ( 
                that.props.NamesTaken.findIndex(name=>name===that.state.rosterName) === -1 || 
                that.state.rosterName === that.props.EditingRoster.Name
            )
        }
        switch(this.state.phase){
            case BuildPhase.FACTION:
                return <Button onPress={e=>this.props.navigation.goBack()}>Back</Button>;
            case BuildPhase.ADD:
            case BuildPhase.EQUIP:
                const totalCost =  this.state.units.map(u=>u.GetCost(this.state.detachmentSelection.Value())).reduce((cost, total)=> cost+total, 0);
                const toggle = (!ValidName()) ||
                this.state.warlord===null || 
                !this.state.units.map(u=>u.ValidRecursive()).reduce((was, is)=>was&&is, true);
                return <View style={{flexDirection:"row", height:38, marginBottom:4, gap:8, alignItems:"center"}}>
                    <AutoExpandingTextInput 
                        key="rosterName" 
                        onSubmit={e=>{this.setState({rosterName:e===undefined?"":e})}} 
                        value={this.state.rosterName}
                        hint="Enter Roster Name"
                        style={{width:200}}
                        />
                    <Info key="nameError" 
                        MessageOnPress={
                            this.state.rosterName===""?
                                "Enter a Name":
                                "This name is already in use"} 
                        Visible={!ValidName()}/>
                    <View key="info" style={{backgroundColor:this.context.Bg, height:38, alignItems:"center", paddingLeft:10, paddingRight:10, gap:5, flexDirection:"row"}}>
                        <Text key="wl">Warlord : {this.state.warlord?this.state.warlord.Name:"Not Selected"}</Text>
                        <Text key="sp">|</Text>
                        <Text key="total">Total : {totalCost} pts</Text>
                    </View>
                    <Info key="saveError" 
                        MessageOnPress={
                            (!ValidName()) ?
                                "Enter a valid roster name" :
                                ((this.state.warlord===null)?
                                    "Select a Warlord":
                                    "Validate all your units")} 
                        Visible={
                            toggle
                            }
                        Style={{position:"absolute", right:110*Variables.zoom}}/>
                    {!toggle&&<Button key="copy"
                        style={{position:"absolute", right:100*Variables.zoom}} 
                        onPress={e=>{
                            const clip = this.printRoster();
                            console.debug(clip);
                            this.setState({pastedInfoView:true});
                            Clipboard.setStringAsync(clip).then(()=>{
                                Animated.timing(this.state.pastedInfo, {
                                    toValue:1,
                                    duration:300,
                                    useNativeDriver:true
                                }).start(()=>{
                                    Animated.timing(this.state.pastedInfo, {
                                        toValue:1,
                                        duration:3000,
                                        useNativeDriver:true
                                    }).start(()=>{
                                        Animated.timing(this.state.pastedInfo, {
                                            toValue:0,
                                            duration:300,
                                            useNativeDriver:true
                                        }).start(()=>{
                                            this.setState({pastedInfoView:false})
                                        });
                                    });
                                });
                            });
                        }}
                        >📋</Button>}
                    <Button key="save" 
                        style={{position:"absolute", right:50*Variables.zoom}} 
                        disabled={this.state.rosterName==="" || this.state.warlord===null || !this.state.units.map(u=>u.ValidRecursive()).reduce((was, is)=>was&&is, true)} 
                        onPress={e=> {
                            const roster = this.SaveRoster();
                            DebugRosterRaw(roster);
                            this.props.OnSaveRoster(roster);
                            that.props.navigation.goBack();
                            that.props.OnExit();
                            }}>Save</Button>
                    <Button key="exit" 
                        style={{position:"absolute", right:0}} 
                        onPress={e=>{
                            that.props.Popup(
                                "All progress on this roster will be lost, go back to the Main Menu?", 
                                [{
                                    option:"Yes",
                                    callback:()=>{
                                        that.props.OnExit();
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

    displayRosterChoice():ReactNode{
        const that = this;
        function displaySection(section:string):ReactNode{
            return <View style={{alignItems:"center", width:"50%"}}>
                <View style={{width:"90%", backgroundColor:that.context.Bg, height:50, justifyContent:"center"}}>
                    <Text key="header" style={{fontFamily:Variables.fonts.spaceMarine, textAlign:"center"}}>{section}</Text>
                </View>
                {Variables.FactionFiles.filter(ff=>ff.Category===section).map((faction, index)=>
                    <Button key={index} style={{width:"60%", height:40}} onPress={e=>{
                            that.setState({phase:BuildPhase.LOADING, loadingText:"Downloading Latest Roster Catalogue Version...", progress:"0%", catalogueId:faction.CatalogueID, factionName:faction.Name});
                            that.LoadRosterSelectionFile(faction.Name, faction.URL);
                        }}>
                        {faction.Name}
                    </Button>
                )}
            </View>;
        }
        return <View style={{width:"100%", height:"88%"}}>
            <ScrollView>
                <View style={{flexWrap:"wrap", flexDirection:"row"}}>
                {displaySection("Imperium")}
                {displaySection("Forces of Chaos")}
                {displaySection("Space Marines")}
                {displaySection("Xenos")}
                </View>
            </ScrollView>
        </View>
    }

    render(){
        let contents;
        switch(this.state.phase) {
            case BuildPhase.FACTION:
                contents= this.displayRosterChoice();
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
                if(Platform.OS==="web" && Variables.width > 1400) {
                    contents= <View style={{flexDirection:"row"}}>
                        <View style={{
                                overflow:"hidden", 
                                marginRight:10, 
                                height:Variables.height-60}}>
                            <FlatList style={{width:Variables.width*0.3}} 
                                numColumns={1} 
                                data={this.state.rosterSelectionData.Units} 
                                renderItem={render=>this.renderUnitSelection(render, this)} />
                        </View>
                        <View style={{
                                width: Variables.width*0.3,
                                overflow:"hidden", 
                                height:Variables.height-60, 
                                flexGrow:1}}>
                            <FlatList onLayout={(event)=> this.setState({rosterScrollViewLayout:event.target})} 
                                key={"roster"} 
                                numColumns={1} 
                                data={[this.state.detachmentSelection, this.state.options, ...this.state.units]} 
                                renderItem={render=>this.renderRoster(render, this)} />
                        </View>
                        <View style={{
                                width: Variables.width*0.36,
                                overflow:"hidden", 
                                height:Variables.height-60}}>
                            {this.DisplayUnitSelections()}
                        </View>
                </View>
                } else {
                    contents= <View>
                    <Animated.View style={{
                            flexDirection:"row",
                            transform:[{
                                translateX:this.state.addColumnWidth.interpolate({
                                    inputRange:[0, 1],
                                    outputRange:[-COLUMN_WIDTH-10, 0]
                                }), 
                            }],}}>
                        <View style={{
                                overflow:"hidden", 
                                marginRight:10, 
                                height:Variables.height-60}}>
                            <FlatList style={{width:COLUMN_WIDTH}} 
                                numColumns={1} 
                                data={this.state.rosterSelectionData.Units} 
                                renderItem={render=>this.renderUnitSelection(render, this)} />
                        </View>
                        <View style={{
                                width: this.state.phase===BuildPhase.ADD?COLUMN_WIDTH-30:(COLUMN_WIDTH*0.7)-20,
                                overflow:"hidden", 
                                height:Variables.height-60, 
                                flexGrow:1}}>
                            <FlatList onLayout={(event)=> this.setState({rosterScrollViewLayout:event.target})} 
                                key={"roster"} 
                                numColumns={1} 
                                data={[this.state.detachmentSelection, this.state.options, ...this.state.units]} 
                                renderItem={render=>this.renderRoster(render, this)} />
                        </View>
                        <View style={{
                                width: COLUMN_WIDTH*1.3,
                                overflow:"hidden", 
                                height:Variables.height-60}}>
                            {this.DisplayUnitSelections()}
                        </View>
                    </Animated.View>
                </View>
                }
                
                break;
        }
        let overlay;
        if(this.state.editWeapon){
            overlay = 
            <View style={{height:Variables.height, width:Variables.width, position:"absolute", backgroundColor:"rgba(0,0,0,0.6)", justifyContent: 'center', alignItems: 'center', zIndex:1000}}>
                <View style={{backgroundColor:this.context.Bg, position:"absolute", padding:10, borderColor:this.context.Accent, borderWidth:1, borderRadius:Variables.boxBorderRadius, width:Variables.width*0.9, maxHeight:Variables.height*0.9}}>
                    <Button onPress={e=>this.setState({editWeapon:false})}>X</Button>
                    <ScrollView>
                        {this.state.editingWeapon.Parent.SelectionValue().map((option, index)=>
                            <View key={option.Name} style={{flexDirection:"row"}}>
                                <Button onPress={e=>this.ReplaceWeapon(option.ID)} style={{width:"30%", height:"auto"}}>{option.Name}</Button>
                                <ProfilesDisplay Data={option.DisplayStats()} key={index} Style={{width:"70%", height:"auto"}} />
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        } else if (this.state.previewStratagems.length>0) {
            overlay = 
            <View style={{height:Variables.height, width:Variables.width, position:"absolute", backgroundColor:"rgba(0,0,0,0.6)", justifyContent: 'center', alignItems: 'center', zIndex:1000}}>
                <View style={{backgroundColor:this.context.Bg, position:"absolute", padding:10, borderColor:this.context.Accent, borderWidth:1, borderRadius:Variables.boxBorderRadius, width:Variables.width*0.9, maxHeight:Variables.height*0.9}}>
                    <Button onPress={e=>this.setState({previewStratagems:[]})}>X</Button>
                    <MasonryList style={{margin:6, flexGrow:0}} numColumns={2} data={this.state.previewStratagems} renderItem={(stratagem)=>
                        // @ts-ignore
                        <StratagemDisplay Stratagem={stratagem.item} Index={stratagem.i}/>
                    }
                    />
                </View>
            </View>
        }
        return <GestureHandlerRootView><PanGestureHandler minPointers={2} onGestureEvent={e=>
            // @ts-ignore
         {if(this.state.phase === BuildPhase.ADD && e.nativeEvent.translationX < -100){
            Animated.timing(this.state.addColumnWidth, {
                toValue:0,
                duration:200,
                useNativeDriver:true
            }).start();
            this.setState({phase:BuildPhase.EQUIP});
            // @ts-ignore
        } else if(this.state.phase === BuildPhase.EQUIP && e.nativeEvent.translationX > 100){
            Animated.timing(this.state.addColumnWidth, {
                toValue:1,
                duration:200,
                useNativeDriver:true
            }).start();
            this.setState({phase:BuildPhase.ADD});
        }}}>
            <View>
                <View key="overlay" style={{zIndex:1000}}>{overlay}</View>
                <View style={{padding:8}}>{this.ShowMenu()}{contents}</View>
                {this.state.pastedInfoView&&<Animated.View key="info" style={{
                        position:"absolute", 
                        opacity:this.state.pastedInfo, 
                        bottom:40, 
                        width:600, 
                        backgroundColor:this.context.Bg, 
                        borderRadius:Variables.boxBorderRadius, 
                        borderWidth:1, 
                        borderColor:this.context.Main,
                        alignSelf:"center",
                        justifyContent:"center",
                        height:50}}>
                    <Text style={{textAlign:"center"}}>Roster copied to clipboard!</Text>
                </Animated.View>}
            </View></PanGestureHandler></GestureHandlerRootView>;
    }
}