class RosterMenuEntry {
    static idNb:number=0;
    Name : string;
    XML : string;
    Cost : string;
    UniqueId:number;
    constructor(Name:string, XML:string){
        this.XML = XML;
        this.Name = Name;
        this.UniqueId = RosterMenuEntry.idNb++;
    }
}

export default RosterMenuEntry;