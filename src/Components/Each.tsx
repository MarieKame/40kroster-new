function isIterable(obj) {
    if (obj == null) {
      return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
}

export default function Each(items, callback:CallableFunction) {
    if (!items) {
        return;
    }
    if (isIterable(items)){
        for(const item of items){
            callback(item);
        }
    } else {
        callback(items);
    }
}