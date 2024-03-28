function isIterable(obj) {
    if (obj == null) {
      return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
}

export default function Each<T=any>(items, callback:(item:T, index:number)=>void) {
    if (!items) {
        return;
    }
    if (isIterable(items)){
        let index=0;
        for(const item of items){
            callback(item, index++);
        }
    } else {
        callback(items, 0);
    }
}