import { Component, ReactNode } from "react";
import { Animated, LayoutAnimation, ListRenderItemInfo, Pressable, View } from "react-native";
import Variables from "../Variables";
import { FlatList, GestureHandlerRootView, ScrollView } from "react-native-gesture-handler";
import Text from '../Components/Text';
import Button from "../Components/Button";
import { KameContext } from "../../Style/KameContext";
import * as FileSystem from 'expo-file-system';
import RosterSelectionExtractor from "./RosterSelectionExtractor";
import RosterSelectionData, { Constraint, SelectionEntry, TargetSelectionData } from "./RosterSelectionData";
import UnitSelection, {Selection} from "./UnitSelection";
import Each from "../Components/Each";

enum BuildPhase{
    FACTION, LOADING, LOADING_ERROR, ADD, EQUIP
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
class props{
    navigation:{goBack}
}
const COLUMN_WIDTH = Variables.width * 0.55;
export default class BuilderMenu extends Component<props> {
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;
    
    state={
        phase:BuildPhase.FACTION,
        loadingText:"",
        progress:"",
        rosterSelectionData:new RosterSelectionData(),
        units:new Array<UnitSelection>(),
        detachmentSelection:new UnitSelection(null, null),
        addColumnWidth:COLUMN_WIDTH,
        currentUnit:-2,
        update:0
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

    LoadRosterSelectionFile(name:string, url:string){
        const that = this;
        this.setState({phase:BuildPhase.LOADING, loadingText:"Downloading Latest Roster Selection File Version...", progress:"0%"});
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
                            that.setState({phase:BuildPhase.ADD, rosterSelectionData:data, progress:progress, detachmentSelection:new UnitSelection(data.DetachmentChoice, data)})
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
        units.push(new UnitSelection(that.state.rosterSelectionData.GetTarget(unit), that.state.rosterSelectionData));
        that.setState({units:units.sort((unit1, unit2)=>{
            return unit1.Framework.GetVariablesCategoryIndex() - unit2.Framework.GetVariablesCategoryIndex();
        })});
    }

    DeleteUnit(index:number, that:BuilderMenu) {
        let units = that.state.units;
        units.splice(index, 1);
        that.setState({units:units});
    }

    /////////////////////////////////////////////////////////
    /*                     DISPLAY                         */
    /////////////////////////////////////////////////////////
    DisplayValidity(selection:Selection, recursive:boolean=false):ReactNode{
        if (!(recursive?selection.ValidRecursive():selection.Valid())) return <Text style={{color:recursive?this.context.Main:this.context.LightAccent}}> INVALID </Text>
        return null;
    }

    DisplayUpgrade(selection:Selection, options:Array<SelectionEntry|TargetSelectionData>, count:number, index:number):ReactNode{
        if(selection.Count===0) return null;
        return <View key={index}>
            <Button small={true} disabled={options.length==count} style={{height:20}} textStyle={{color:this.context.Dark}}>{selection.Name}{this.DisplayValidity(selection)}</Button>
            <Text>{selection.DisplayStats()}</Text>
        </View>;
    }

    DisplayGroup(selection:Selection, colour:string, textColour:string, index:number):ReactNode{
        return <Text style={{backgroundColor:colour, color:textColour}} key={selection.Name + selection.Count + index}>{selection.Name}{selection.GetSelectionCount()!==1&&selection.DisplayCount()}{this.DisplayValidity(selection)}</Text>
    }

    DisplayModel(selection:Selection, colour:string, textColour:string, index:number):ReactNode{
        return <View style={{flexDirection:"row", backgroundColor:colour, height:20, alignItems:"center"}} key={selection.Name + selection.Count + index}>
            <Text style={{flexGrow:1, color:textColour}}>{selection.Name}{selection.DisplayCount()}{this.DisplayValidity(selection)}</Text>
            {selection.Changeable()&&<Button small disabled={!selection.CanRemove()} onPress={e=>selection.Remove(this)} style={{height:20, width:40}} textStyle={{fontSize:Variables.fontSize.small}}>-</Button>}
            {selection.Changeable()&&<Button small disabled={!selection.CanAdd()} onPress={e=>selection.Add(this)} style={{height:20, width:40}} textStyle={{fontSize:Variables.fontSize.small}}>+</Button>}
        </View>;
    }

    ViewSelectionRecursive(selection:Selection, framework?:SelectionEntry|TargetSelectionData, index:number=1, depth:number=1){
        if (!framework) return null;
        if (framework instanceof TargetSelectionData) framework= this.state.rosterSelectionData.GetTarget(framework);
        let currentIndex = index;

        let children = this.state.rosterSelectionData.GetCombinedChildrenAndSubEntries(framework);
        let value=[];
        let skip = false;
        const colour = depth==1?this.context.Accent:(depth==2?this.context.LightAccent:null);
        Each(selection.SelectionValue, sel=>{
            const valid = sel.Valid();
            if(sel.Type=="model"){
                value.push(this.DisplayModel(sel, valid?colour:this.context.Main, !valid?this.context.LightAccent:this.context.Dark, currentIndex++));
                skip = sel.Count == 0;
            } else if(sel.Type=="group"){
                value.push(this.DisplayGroup(sel, valid?colour:this.context.Main, !valid?this.context.LightAccent:this.context.Dark, currentIndex++));
            } else if(sel.Type=="upgrade"){
                value.push(this.DisplayUpgrade(sel, children, selection.GetSelectionCount(), currentIndex++));
            } else {
                console.error("ERROR, missing selection display for type : ");
                console.error(sel.Type);
            }
            if(!skip) value.push(this.ViewSelectionRecursive(sel, this.state.rosterSelectionData.GetSelectionFromId(sel.ID), currentIndex++, depth+1));
        });

        return <View key={this.state.currentUnit + selection.Name + currentIndex + this.state.update} style={{flexGrow:1, width:"100%", paddingLeft:6}}>
            {value}
        </View>;
    }
    
    DisplayUnitSelections(){
        if (this.state.currentUnit===-2) return null;
        const unit = this.state.units[this.state.currentUnit];
        const that = this;
        return <View style={{height:"100%", backgroundColor:this.context.Bg, marginLeft:10}}>
            <ScrollView>
                <View key="title" style={{height:38}}>
                    <Text key="name" style={{alignSelf:"center"}}>{unit.Data.Name}</Text>
                    <Text key="pts" style={{alignSelf:"center"}}>{unit.Data.GetCost() + " pts"}</Text>
                </View>
                {this.ViewSelectionRecursive(unit.Data, unit.Framework)}
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
    renderRoster(render:ListRenderItemInfo<UnitSelection>, that:BuilderMenu){
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
        return <View key={render.item.Data.Name+this.state.update}>
            {newCategory(render.item.Framework)&&
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
                <View style={{flexDirection:"row", backgroundColor:render.index==this.state.currentUnit+1?this.context.LightAccent:this.context.Bg, borderBottomColor:this.context.LightAccent, borderWidth:1}}>
                    <Text style={{alignSelf:"center", flexGrow:1, marginLeft:4}}>{render.item.Data.Name}{render.item.Framework.Cost>0&&" ("+render.item.Data.GetCost()+")"}{this.DisplayValidity(render.item.Data, true)}</Text>
                    {render.item.Framework.Cost>0&&<Button onPress={e=>this.DeleteUnit(render.index-1, this)} textStyle={{fontSize:14}} style={{width:44}} weight="light">🗑</Button>}
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
        return <View>
            {newCategory(target)&&
                <View style={{alignItems:"center", justifyContent:"center", backgroundColor:this.context.Accent, width:"100%"}}>
                    <Text>{getCategory()}</Text>
                </View>
            }
            <View style={{flexDirection:"row", backgroundColor:this.context.Bg, borderBottomColor:this.context.LightAccent, borderWidth:1}}>
                <Text style={{alignSelf:"center", flexGrow:1, marginLeft:4}}>{render.item.Name} ({target.Cost})</Text>
                <Button onPress={e=>that.AddUnitToRoster(render.item, that)}>+</Button>
            </View>
        </View>;

        /*******************************/
        /******** END SELECTION ********/
        /*******************************/
    }

    ShowMenu(){
        switch(this.state.phase){
            case BuildPhase.FACTION:
                return <Button onPress={e=>this.props.navigation.goBack()}>Back</Button>;
            case BuildPhase.ADD:
            case BuildPhase.EQUIP:
                return <Button onPress={e=>this.setState({phase:BuildPhase.FACTION})}>Back to Faction list</Button>;
        }
        return null;
    }

    render(){
        let contents;
        switch(this.state.phase) {
            case BuildPhase.FACTION:
                contents= <FlatList numColumns={2} data={Variables.FactionFiles} renderItem={render=>{
                    return <Button onPress={e=>this.LoadRosterSelectionFile(render.item.Name, render.item.URL)}>{render.item.Name}</Button>;
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
                        <View style={{width: this.state.addColumnWidth, overflow:"hidden", marginRight:10}}>
                            <FlatList style={{minWidth:COLUMN_WIDTH}} numColumns={1} data={this.state.rosterSelectionData.Units} renderItem={render=>this.renderUnitSelection(render, this)} />
                        </View>
                        <FlatList key={this.state.update} numColumns={1} data={[this.state.detachmentSelection, ...this.state.units]} renderItem={render=>this.renderRoster(render, this)} />
                        <View style={{width: (COLUMN_WIDTH-this.state.addColumnWidth), overflow:"hidden"}}>
                            {this.DisplayUnitSelections()}
                        </View>
                    </View>
                </View>
                break;
        }
        return <GestureHandlerRootView>
                <View style={{padding:10, marginBottom:110}}>{this.ShowMenu()}{contents}</View>
            </GestureHandlerRootView>;
    }
}