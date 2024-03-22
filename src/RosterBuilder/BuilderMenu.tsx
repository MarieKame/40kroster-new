import { Component, ReactNode } from "react";
import { LayoutAnimation, ListRenderItemInfo, Pressable, View } from "react-native";
import Variables from "../Variables";
import { FlatList, GestureHandlerRootView, ScrollView } from "react-native-gesture-handler";
import Text from '../Components/Text';
import Button from "../Components/Button";
import { KameContext } from "../../Style/KameContext";
import * as FileSystem from 'expo-file-system';
import RosterSelectionExtractor from "./RosterSelectionExtractor";
import RosterSelectionData, { Constraint, SelectionData, SelectionEntry, TargetSelectionData } from "./RosterSelectionData";
import Selection from "./UnitSelection";
import Each from "../Components/Each";
import ProfilesDisplay from "./ProfilesDisplay";

enum BuildPhase{
    FACTION, LOADING, LOADING_ERROR, ADD, EQUIP
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
class props{
    navigation:{goBack}
}
const COLUMN_WIDTH = Variables.width * 0.50;
export default class BuilderMenu extends Component<props> {
    static contextType = KameContext; 
    declare context: React.ContextType<typeof KameContext>;
    
    state={
        phase:BuildPhase.FACTION,
        loadingText:"",
        progress:"",
        rosterSelectionData:new RosterSelectionData(),
        units:new Array<Selection>(),
        detachmentSelection:Selection.Init(null, null),
        addColumnWidth:COLUMN_WIDTH,
        currentUnit:-2,
        update:0,
        editWeapon:false,
        editingWeapon:new Selection(1, null, null, null, null)
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
        let sel = Selection.Init(that.state.rosterSelectionData.GetTarget(unit), that.state.rosterSelectionData)
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

    /////////////////////////////////////////////////////////
    /*                     DISPLAY                         */
    /////////////////////////////////////////////////////////
    DisplayValidity(selection:Selection, recursive:boolean=false):ReactNode{
        if (!(recursive?selection.ValidRecursive():selection.Valid())) return <Text style={{color:recursive?this.context.Main:this.context.LightAccent}}> INVALID </Text>
        return null;
    }

    DisplayUpgrade(selection:Selection, index:number):ReactNode{
        if(selection.Count===0) return null;
        console.log(selection.Name);
        console.log(selection.Parent.SelectionValue.length);
        console.log(selection.Parent.GetSelectionCount());
        return <View key={index}>
            <Button 
                small={true} 
                disabled={selection.Parent.GetSelectionCount()===selection.Parent.SelectionValue.length} 
                style={{height:20}} 
                textStyle={{color:this.context.Dark}} 
                onPress={e=>this.setState({editWeapon:true, editingWeapon:selection})}>
                    {selection.Name}{this.DisplayValidity(selection)}
                </Button>
            <ProfilesDisplay Data={selection.DisplayStats()} key={index} Small />
        </View>;
    }

    DisplayGroup(selection:Selection, colour:string, textColour:string, index:number, marginTop:number):ReactNode{
        return <Text style={{backgroundColor:colour, color:textColour, marginTop:marginTop}} key={selection.Name + selection.Count + index}>{selection.Name}{selection.GetSelectionCount()!==1&&selection.DisplayCount()}{this.DisplayValidity(selection)}</Text>
    }

    DisplayModel(selection:Selection, colour:string, textColour:string, index:number, marginTop:number):ReactNode{
        return <View style={{flexDirection:"row", backgroundColor:colour, height:20, alignItems:"center", marginTop:marginTop}} key={selection.Name + selection.Count + index}>
            <Text style={{flexGrow:1, color:textColour}}>{selection.Name}{selection.DisplayCount()}{this.DisplayValidity(selection)}</Text>
            {selection.Changeable()&&<Button small disabled={!selection.CanRemove()} onPress={e=>selection.Remove(this)} style={{height:20, width:40}} textStyle={{fontSize:Variables.fontSize.small}}>-</Button>}
            {selection.Changeable()&&<Button small disabled={!selection.CanAdd()} onPress={e=>selection.Add(this)} style={{height:20, width:40}} textStyle={{fontSize:Variables.fontSize.small}}>+</Button>}
        </View>;
    }

    ViewSelectionRecursive(selection:Selection, index:number=1, depth:number=1){
        if (!selection) return null;
        let currentIndex = index;

        let value=[];
        let skip = false;
        const colour = depth==1?this.context.Accent:(depth==2?this.context.LightAccent:null);
        Each<Selection>(selection.SelectionValue, (child, index)=>{
            const valid = child.Valid();
            if(child.Type=="model"){
                value.push(this.DisplayModel(child, valid?colour:this.context.Main, !valid?this.context.LightAccent:this.context.Dark, currentIndex++, index===0?0:30));
                skip = child.Count == 0;
            } else if(child.Type=="group"){
                value.push(this.DisplayGroup(child, valid?colour:this.context.Main, !valid?this.context.LightAccent:this.context.Dark, currentIndex++, index===0?0:(child.GetModelCount()!==0?30:0)));
            } else if(child.Type=="upgrade"){
                value.push(this.DisplayUpgrade(child, currentIndex++));
            } else {
                console.error("ERROR, missing selection display for type : ");
                console.error(child.Type);
            }
            if(!skip) value.push(this.ViewSelectionRecursive(child, currentIndex++, depth+1));
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
                    <Text key="name" style={{alignSelf:"center"}}>{unit.Name}</Text>
                    <Text key="pts" style={{alignSelf:"center"}}>{unit.GetCost() + " pts"}</Text>
                </View>
                {this.ViewSelectionRecursive(unit)}
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
                        <Text>{render.item.Name}</Text>
                        <Text>
                            {render.item.GetFrameworkCost()>0&&render.item.GetCost()+" pts"}
                            {render.item.GetFrameworkCost()>0&&" — "+render.item.GetModelCount()+" models"}
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
                        <View style={{width: (COLUMN_WIDTH-this.state.addColumnWidth)*1.3, overflow:"hidden"}}>
                            {this.DisplayUnitSelections()}
                        </View>
                    </View>
                </View>
                break;
        }
        let overlay;
        if(this.state.editWeapon){
            console.log(this.state.editingWeapon.Parent.SelectionValue.map(s=>s.ID));
            overlay = <View style={{height:Variables.height, width:Variables.width, position:"absolute", backgroundColor:"rgba(0,0,0,0.6)", justifyContent: 'center', alignItems: 'center', zIndex:1000}}>
            <View style={{backgroundColor:this.context.Bg, position:"absolute", padding:10, borderColor:this.context.Accent, borderWidth:1, borderRadius:Variables.boxBorderRadius}}>
                {this.state.editingWeapon.Parent.SelectionValue.map((option, index)=>
                    <View key={option.Name} style={{flexDirection:"row"}}>
                        <Button onPress={e=>this.ReplaceWeapon(option.ID)}>{option.Name}</Button>
                        <ProfilesDisplay Data={option.DisplayStats()} key={index} />
                    </View>
                )}
            </View>
        </View>
        }
        return <GestureHandlerRootView>
                <View key="overlay">{overlay}</View>
                <View style={{padding:10, marginBottom:110}}>{this.ShowMenu()}{contents}</View>
            </GestureHandlerRootView>;
    }
}