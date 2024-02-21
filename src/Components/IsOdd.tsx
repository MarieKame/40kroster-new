class IsOdd{
    private odd:boolean;
    constructor(){
        this.odd=true;
    }
    public Get():boolean{
        this.odd=!this.odd;
        return this.odd;
    }
}

export default IsOdd;